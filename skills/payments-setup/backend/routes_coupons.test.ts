// Route-level tests for the scaffolded coupon routes.
// ADAPT: update the import paths below once merged into your project's
// test/ directory — this file assumes it lives at the same depth as
// testing-setup's test/helpers/db.ts (e.g. test/routes/coupons.test.ts).
// requireAuth is mocked rather than exercised through auth-setup's real
// session/KV mechanism — these tests only depend on its
// Promise<User | null> contract, not on how a session is established.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { truncateAll, createUser, query } from '../helpers/db';

const mockRequireAuth = vi.fn();
vi.mock('../../src/middleware/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

const { handleRedeemCoupon, handleListCoupons } = await import('../../src/routes/coupons');

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

interface CouponFields {
  code: string; pack_size: number; max_uses: number;
  expires_at: string; email: string | null;
}

function defaultCouponFields(): CouponFields {
  return {
    code:       `TEST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    pack_size:  1,
    max_uses:   1,
    email:      null,
    expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  };
}

async function insertCoupon(
  overrides: Partial<CouponFields> = {}
): Promise<{ id: string; code: string }> {
  const fields = { ...defaultCouponFields(), ...overrides };
  const { rows } = await query<{ id: string }>(
    `INSERT INTO coupon_codes (code, pack_size, max_uses, email, expires_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [fields.code, fields.pack_size, fields.max_uses, fields.email, fields.expires_at]
  );
  return { id: rows[0].id, code: fields.code };
}

describe('POST /api/coupons/redeem', () => {
  beforeEach(async () => {
    await truncateAll();
    mockRequireAuth.mockReset();
  });

  it('redeems a valid, unexpired, under-capacity coupon', async () => {
    const user = await createUser();
    mockRequireAuth.mockResolvedValue({ ...user, name: 'Test User', is_admin: false });
    const { code } = await insertCoupon({ pack_size: 3, max_uses: 1 });

    const res = await handleRedeemCoupon(
      jsonRequest('http://localhost/api/coupons/redeem', { code }), env
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { redeemed: boolean; pack_size: number };
    expect(body.redeemed).toBe(true);
    expect(body.pack_size).toBe(3);
  });

  it('returns 410 for an expired coupon', async () => {
    const user = await createUser();
    mockRequireAuth.mockResolvedValue({ ...user, name: 'Test User', is_admin: false });
    const { code } = await insertCoupon({
      expires_at: new Date(Date.now() - 86_400_000).toISOString(),
    });

    const res = await handleRedeemCoupon(
      jsonRequest('http://localhost/api/coupons/redeem', { code }), env
    );

    expect(res.status).toBe(410);
  });

  it('returns 409 when the same user redeems the same coupon twice', async () => {
    const user = await createUser();
    mockRequireAuth.mockResolvedValue({ ...user, name: 'Test User', is_admin: false });
    const { code } = await insertCoupon({ max_uses: 5 });

    const first = await handleRedeemCoupon(
      jsonRequest('http://localhost/api/coupons/redeem', { code }), env
    );
    const second = await handleRedeemCoupon(
      jsonRequest('http://localhost/api/coupons/redeem', { code }), env
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
  });
});

describe('GET /api/admin/coupons', () => {
  beforeEach(async () => {
    await truncateAll();
    mockRequireAuth.mockReset();
  });

  it('returns 403 for an authenticated non-admin user', async () => {
    const user = await createUser();
    mockRequireAuth.mockResolvedValue({ ...user, name: 'Test User', is_admin: false });

    const res = await handleListCoupons(new Request('http://localhost/api/admin/coupons'), env);

    expect(res.status).toBe(403);
  });
});
