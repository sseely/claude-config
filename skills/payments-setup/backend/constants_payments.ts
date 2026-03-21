// Payment-related constants — merge into your project's src/constants.ts.
// ADAPT: update PACKS prices and session counts to match your pricing.
// ADAPT: update STRIPE_API_VERSION to the latest Stripe API version.

/** Stripe API version — update when upgrading the stripe npm package */
export const STRIPE_API_VERSION = '2026-02-25.clover' as const;

/** Valid session pack sizes — must match DB CHECK constraint */
export const VALID_PACK_SIZES = [1, 3, 10] as const;
export type PackSize = (typeof VALID_PACK_SIZES)[number];

/** Maximum times a single coupon code may be redeemed */
export const MAX_COUPON_COUNT = 100;

/** Character length of a coupon code string, e.g. "XXXX-XXXX" = 9 */
export const COUPON_CODE_LENGTH = 9;

/** Unambiguous character set for generated codes (avoids 0/O, 1/I/L confusion) */
export const COUPON_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
