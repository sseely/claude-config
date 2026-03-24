// Coupon creation, listing, and redemption routes.
// ADAPT: update import paths to match your project layout.
// ADAPT: is_admin check — the project uses a DB column; update if your admin
//        check works differently (e.g. checking email domain in middleware).

import { createDbClient } from '../db/client';
import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import { VALID_PACK_SIZES, MAX_COUPON_COUNT } from '../constants';
import { generateCouponCode } from '../utils/code-generation';

const COUPON_EXPIRY_DAYS = 14; // ADAPT: change default coupon lifetime
const COUPON_CODE_RETRY_ATTEMPTS = 5;
const DEFAULT_PAGE_LIMIT = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function isValidPackSize(value: unknown): value is 1 | 3 | 10 {
  return typeof value === 'number' && (VALID_PACK_SIZES as readonly number[]).includes(value);
}

function validateCouponInput(
  pack_size: unknown,
  max_uses: unknown,
  email: string | undefined
): string | null {
  if (!isValidPackSize(pack_size)) {
    return `pack_size must be ${VALID_PACK_SIZES.join(', ')}`;
  }
  if (typeof max_uses !== 'number' || max_uses < 1 || max_uses > MAX_COUPON_COUNT) {
    return `max_uses must be between 1 and ${MAX_COUPON_COUNT}`;
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return 'Invalid email format';
  }
  return null;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Generate a unique coupon code, retrying up to COUPON_CODE_RETRY_ATTEMPTS
 * times on collision. Throws if all attempts collide.
 */
async function generateUniqueCouponCode(
  db: { query: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }> }
): Promise<string> {
  for (let attempt = 0; attempt < COUPON_CODE_RETRY_ATTEMPTS; attempt++) {
    const code = generateCouponCode();
    const { rows } = await db.query(
      'SELECT id FROM coupon_codes WHERE code = $1',
      [code]
    );
    if (rows.length === 0) return code;
  }
  throw new Error(
    `Failed to generate unique coupon code after ${COUPON_CODE_RETRY_ATTEMPTS} attempts`
  );
}

// ---------------------------------------------------------------------------
// POST /admin/coupons — server-to-server coupon creation (X-Admin-Secret)
// Body: { pack_size: 1|3|10, email?: string, max_uses?: number }
// ---------------------------------------------------------------------------

export async function handleCreateCoupons(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('X-Admin-Secret');
  if (!env.ADMIN_SECRET || !secret || !timingSafeEqual(secret, env.ADMIN_SECRET)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { pack_size, max_uses = 1 } = body as { pack_size?: number; max_uses?: number };
  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : undefined;

  const validationError = validateCouponInput(pack_size, max_uses, email);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const db = await createDbClient(env);
  try {
    const code = await generateUniqueCouponCode(db);
    const { rows: inserted } = await db.query(
      `INSERT INTO coupon_codes (code, pack_size, max_uses, email)
       VALUES ($1, $2, $3, $4)
       RETURNING code, pack_size, max_uses, email, expires_at`,
      [code, pack_size, max_uses, email ?? null]
    );

    console.info(
      '[coupons] created',
      JSON.stringify({ code, pack_size, max_uses, email: email ?? null })
    );

    return Response.json(inserted[0], { status: 201 });
  } finally {
    await db.end();
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/coupons — list coupons with redemption counts (paginated)
// Requires: authenticated admin user
// Query params: ?limit=50&offset=0
// ---------------------------------------------------------------------------

export async function handleListCoupons(request: Request, env: Env): Promise<Response> {
  const user = await requireAuth(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.is_admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get('limit') ?? '', 10) || DEFAULT_PAGE_LIMIT, 1),
    200
  );
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '', 10) || 0, 0);

  const db = await createDbClient(env);
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.code, c.pack_size, c.max_uses, c.email, c.expires_at, c.created_at,
              COUNT(r.id)::int AS use_count
       FROM coupon_codes c
       LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return Response.json(rows);
  } finally {
    await db.end();
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/coupons/:id — single coupon with full redemption list
// Requires: authenticated admin user
// ---------------------------------------------------------------------------

export async function handleGetCoupon(request: Request, env: Env, id: string): Promise<Response> {
  const user = await requireAuth(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.is_admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const db = await createDbClient(env);
  try {
    const { rows: couponRows } = await db.query(
      `SELECT id, code, pack_size, max_uses, email, expires_at, created_at
       FROM coupon_codes WHERE id = $1`,
      [id]
    );
    if (couponRows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });

    const { rows: redemptions } = await db.query(
      `SELECT u.name, u.email, r.redeemed_at
       FROM coupon_redemptions r
       JOIN users u ON u.id = r.user_id
       WHERE r.coupon_id = $1
       ORDER BY r.redeemed_at ASC`,
      [id]
    );
    return Response.json({ ...couponRows[0], use_count: redemptions.length, redemptions });
  } finally {
    await db.end();
  }
}

// ---------------------------------------------------------------------------
// POST /api/coupons/issue — UI admin panel coupon creation
// Body: { pack_size: 1|3|10, max_uses?: number, expires_at?: string, email?: string }
// Requires: authenticated admin user
// ---------------------------------------------------------------------------

export async function handleIssueCoupons(request: Request, env: Env): Promise<Response> {
  const user = await requireAuth(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.is_admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { pack_size, max_uses = 1 } = body as { pack_size?: number; max_uses?: number };
  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : undefined;

  const validationError = validateCouponInput(pack_size, max_uses, email);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  let expiresAt: Date | null = null;
  if (body.expires_at) {
    expiresAt = new Date(body.expires_at as string);
    if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return Response.json({ error: 'expires_at must be a future date' }, { status: 400 });
    }
  }

  const db = await createDbClient(env);
  try {
    const code = await generateUniqueCouponCode(db);
    const defaultExpiry =
      expiresAt ?? new Date(Date.now() + COUPON_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const { rows: inserted } = await db.query(
      `INSERT INTO coupon_codes (code, pack_size, max_uses, email, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING code, pack_size, max_uses, email, expires_at`,
      [code, pack_size, max_uses, email ?? null, defaultExpiry]
    );

    console.info(
      '[coupons] issued',
      JSON.stringify({ code, pack_size, max_uses, email: email ?? null, issuedBy: user.id })
    );

    return Response.json(inserted[0], { status: 201 });
  } finally {
    await db.end();
  }
}

// ---------------------------------------------------------------------------
// POST /api/coupons/redeem — user redeems a coupon code
// Body: { code: string }
// Requires: authenticated user
// Uses SELECT FOR UPDATE to prevent race conditions on concurrent redemptions.
// ---------------------------------------------------------------------------

export async function handleRedeemCoupon(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  const user = await requireAuth(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const code = (typeof body.code === 'string' ? body.code : '').trim().toUpperCase();
  if (!code) return Response.json({ error: 'code is required' }, { status: 400 });

  const db = await createDbClient(env);
  try {
    await db.query('BEGIN');

    try {
      const { rows } = await db.query(
        `SELECT c.id, c.pack_size, c.email, c.max_uses, c.expires_at,
                COUNT(r.id)::int AS use_count
         FROM coupon_codes c
         LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
         WHERE c.code = $1
         GROUP BY c.id
         FOR UPDATE OF c`,
        [code]
      );

      if (rows.length === 0) {
        await db.query('ROLLBACK');
        return Response.json({ error: 'Invalid coupon code' }, { status: 404 });
      }

      const coupon = rows[0] as {
        id: string; pack_size: number; email: string | null;
        max_uses: number; expires_at: string; use_count: number;
      };

      if (new Date(coupon.expires_at) < new Date()) {
        await db.query('ROLLBACK');
        return Response.json({ error: 'This coupon has expired' }, { status: 410 });
      }
      if (coupon.use_count >= coupon.max_uses) {
        await db.query('ROLLBACK');
        return Response.json({ error: 'Coupon fully redeemed' }, { status: 409 });
      }
      if (coupon.email && coupon.email.toLowerCase() !== user.email.toLowerCase()) {
        await db.query('ROLLBACK');
        return Response.json({ error: 'This coupon is for a different email address' }, { status: 403 });
      }

      const { rows: existing } = await db.query(
        `SELECT id FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2`,
        [coupon.id, user.id]
      );
      if (existing.length > 0) {
        await db.query('ROLLBACK');
        return Response.json({ error: 'You have already redeemed this coupon' }, { status: 409 });
      }

      await db.query(
        `INSERT INTO session_packs (user_id, pack_size, amount_cents, sessions_remaining)
         VALUES ($1, $2, 0, $2)`,
        [user.id, coupon.pack_size]
      );
      await db.query(
        `INSERT INTO coupon_redemptions (coupon_id, user_id) VALUES ($1, $2)`,
        [coupon.id, user.id]
      );

      await db.query('COMMIT');

      console.info(
        '[coupons] redeemed',
        JSON.stringify({ code, userId: user.id, packSize: coupon.pack_size })
      );

      return Response.json({
        redeemed:        true,
        pack_size:       coupon.pack_size,
        sessions_added:  coupon.pack_size,
      });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } finally {
    await db.end();
  }
}
