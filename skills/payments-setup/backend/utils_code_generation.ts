// Cryptographically secure code generator — Cloudflare Workers compatible.
// Uses Web Crypto API (crypto.getRandomValues), no Node.js dependencies.
// ADAPT: add additional generateXxx helpers for other code types in your project.

import { COUPON_CODE_CHARS } from '../constants';

/**
 * Generate a random string of `length` characters drawn from `chars`.
 * Uses crypto.getRandomValues for cryptographic security.
 */
export function generateCode(chars: string, length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let code = '';
  for (const byte of bytes) {
    code += chars[byte % chars.length];
  }
  return code;
}

/**
 * XXXX-XXXX format coupon code.
 * Uses COUPON_CODE_CHARS (unambiguous charset) to avoid misreads when
 * codes are typed or read aloud.
 */
export function generateCouponCode(): string {
  const half = () => generateCode(COUPON_CODE_CHARS, 4);
  return `${half()}-${half()}`;
}
