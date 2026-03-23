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

// ---------------------------------------------------------------------------
// POST /admin/coupons — server-to-server coupon creation (X-Admin-Secret)
// Body: { pack_size: 1|3|10, email?: string, max_uses?: number }
// ---------------------------------------------------------------------------

export async function handleCreateCoupons(request: Request, env: Env): Promise<Response> {
  const secret = request.headers.get('X-Admin-Secret');
  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json<{ pack_size?: number; email?: string; max_uses?: number }>();
  const { pack_size, max_uses = 1 } = body;
  const email = body.email ? body.email.toLowerCase().trim() : undefined;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (!pack_size || !(VALID_PACK_SIZES as readonly number[]).includes(pack_size)) {
    return Response.json(
      { error: `pack_size must be ${VALID_PACK_SIZES.join(', ')}` },
      { status: 400 }
    );
  }
  if (max_uses < 1 || max_uses > MAX_COUPON_COUNT) {
    return Response.json(
      { error: `max_uses must be between 1 and ${MAX_COUPON_COUNT}` },
      { status: 400 }
    );
  }

  const db = await createDbClient(env);
  try {
    let code = generateCouponCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { rows } = await db.query('SELECT id FROM coupon_codes WHERE code = $1', [code]);
      if (rows.length === 0) break;
      code = generateCouponCode();
    }
    const { rows: inserted } = await db.query(
      `INSERT INTO coupon_codes (code, pack_size, max_uses, email)
       VALUES ($1, $2, $3, $4)
       RETURNING code, pack_size, max_uses, email, expires_at`,
      [code, pack_size, max_uses, email ?? null]
    );
    return Response.json(inserted[0], { status: 201 });
  } finally {
    await db.end();
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/coupons — list all coupons with redemption counts
// Requires: authenticated admin user
// ---------------------------------------------------------------------------

export async function handleListCoupons(request: Request, env: Env): Promise<Response> {
  const user = await requireAuth(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.is_admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const db = await createDbClient(env);
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.code, c.pack_size, c.max_uses, c.email, c.expires_at, c.created_at,
              COUNT(r.id)::int AS use_count
       FROM coupon_codes c
       LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
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

  const body = await request.json<{
    pack_size?: number;
    max_uses?: number;
    expires_at?: string;
    email?: string;
  }>();
  const { pack_size, max_uses = 1 } = body;
  const email = body.email ? body.email.toLowerCase().trim() : undefined;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (!pack_size || !(VALID_PACK_SIZES as readonly number[]).includes(pack_size)) {
    return Response.json(
      { error: `pack_size must be ${VALID_PACK_SIZES.join(', ')}` },
      { status: 400 }
    );
  }
  if (max_uses < 1 || max_uses > MAX_COUPON_COUNT) {
    return Response.json(
      { error: `max_uses must be between 1 and ${MAX_COUPON_COUNT}` },
      { status: 400 }
    );
  }

  let expiresAt: Date | null = null;
  if (body.expires_at) {
    expiresAt = new Date(body.expires_at);
    if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return Response.json({ error: 'expires_at must be a future date' }, { status: 400 });
    }
  }

  const db = await createDbClient(env);
  try {
    let code = generateCouponCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { rows } = await db.query('SELECT id FROM coupon_codes WHERE code = $1', [code]);
      if (rows.length === 0) break;
      code = generateCouponCode();
    }
    const defaultExpiry =
      expiresAt ?? new Date(Date.now() + COUPON_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const { rows: inserted } = await db.query(
      `INSERT INTO coupon_codes (code, pack_size, max_uses, email, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING code, pack_size, max_uses, email, expires_at`,
      [code, pack_size, max_uses, email ?? null, defaultExpiry]
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
// ---------------------------------------------------------------------------

export async function handleRedeemCoupon(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  const user = await requireAuth(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json<{ code?: string }>();
  const code = (body.code ?? '').trim().toUpperCase();
  if (!code) return Response.json({ error: 'code is required' }, { status: 400 });

  const db = await createDbClient(env);
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.pack_size, c.email, c.max_uses, c.expires_at,
              COUNT(r.id)::int AS use_count
       FROM coupon_codes c
       LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
       WHERE c.code = $1
       GROUP BY c.id`,
      [code]
    );

    if (rows.length === 0) return Response.json({ error: 'Invalid coupon code' }, { status: 404 });

    const coupon = rows[0] as {
      id: string; pack_size: number; email: string | null;
      max_uses: number; expires_at: string; use_count: number;
    };

    if (new Date(coupon.expires_at) < new Date()) {
      return Response.json({ error: 'This coupon has expired' }, { status: 410 });
    }
    if (coupon.use_count >= coupon.max_uses) {
      return Response.json({ error: 'Coupon fully redeemed' }, { status: 409 });
    }
    if (coupon.email && coupon.email.toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({ error: 'This coupon is for a different email address' }, { status: 403 });
    }

    const { rows: existing } = await db.query(
      `SELECT id FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2`,
      [coupon.id, user.id]
    );
    if (existing.length > 0) {
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

    return Response.json({
      redeemed:        true,
      pack_size:       coupon.pack_size,
      sessions_added:  coupon.pack_size,
    });
  } finally {
    await db.end();
  }
}
