// Payment-related type additions — merge into your project's src/types.ts.
// ADAPT: STRIPE_BASE_URL is only needed for local testing with stripe-mock.
//        Remove it if you don't plan to use stripe-mock in tests.

// Additions to your Env interface:
export interface EnvPaymentFields {
  STRIPE_SECRET_KEY?:    string;
  STRIPE_WEBHOOK_SECRET?: string;
  ADMIN_SECRET?:         string;   // X-Admin-Secret header for server-to-server coupon creation
  // Override Stripe API base URL — used for stripe-mock in integration tests
  STRIPE_BASE_URL?:      string;
}

// Shared API response shapes — used by both backend and frontend.
// Place in a shared/ directory imported by both sides.

export interface CouponRedemption {
  name:         string;
  email:        string;
  redeemed_at:  string;
}

export interface AdminCoupon {
  id:         string;
  code:       string;
  pack_size:  1 | 3 | 10;          // ADAPT: must match VALID_PACK_SIZES
  max_uses:   number;
  use_count:  number;
  email:      string | null;
  expires_at: string;
  created_at: string;
  /** Only present on GET /api/admin/coupons/:id */
  redemptions?: CouponRedemption[];
}
