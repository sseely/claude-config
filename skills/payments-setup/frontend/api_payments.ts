// Payment and coupon API client methods — merge into your project's api.ts.
// ADAPT: update the request() helper import to match your project's API client.
// ADAPT: update AdminCoupon and CouponRedemption imports from your shared types.

// ADAPT: update import path to match where you placed AdminCoupon in Step 6
// (may be ../types, ../types/shared, ../../shared/types, etc.)
import { AdminCoupon } from '../types/shared';

// ADAPT: replace with your project's fetch wrapper
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    try {
      const body = await res.json<{ error?: string }>();
      if (body.error) errorMessage = body.error;
    } catch {
      // Response body not JSON — use status code message
    }
    throw new Error(errorMessage);
  }
  return res.json<T>();
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const paymentApi = {
  /** Initiate a Stripe Checkout session. Returns { url } to redirect to. */
  buyPack: (pack: 'single' | 'triple' | 'ten') =>
    request<{ url: string }>('/api/buy', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pack }),
    }),

  // ---------------------------------------------------------------------------
  // Coupons — user-facing
  // ---------------------------------------------------------------------------

  /** Redeem a coupon code. Returns pack size and sessions added. */
  redeemCoupon: (code: string) =>
    request<{ redeemed: boolean; pack_size: number; sessions_added: number }>(
      '/api/coupons/redeem',
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      }
    ),

  // ---------------------------------------------------------------------------
  // Coupons — admin-facing
  // ---------------------------------------------------------------------------

  /** Issue a new coupon code (admin only). */
  issueCoupons: (params: {
    pack_size: 1 | 3 | 10;
    max_uses:  number;
    expires_at: string;
    email?:    string;
  }) =>
    request<{ code: string; pack_size: number; max_uses: number; email: string | null; expires_at: string }>(
      '/api/coupons/issue',
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      }
    ),

  /** List all coupon codes with redemption counts (admin only). */
  listAdminCoupons: () =>
    request<AdminCoupon[]>('/api/admin/coupons'),

  /** Get a single coupon with full redemption history (admin only). */
  getAdminCoupon: (id: string) =>
    request<AdminCoupon>(`/api/admin/coupons/${id}`),
};
