// AnalyticsEvent constants — imported by both backend (src/) and frontend (ui/src/).
// Place in a shared/ directory and import from both sides.
// ADAPT: this is a starter set — the skill will add events specific to your product.
// Rule: every event name that appears in captureEvent() or posthog.capture() must
// have an entry here. No raw strings in call sites.

export const AnalyticsEvent = {
  // --- Acquisition ---
  USER_SIGNED_UP: 'user_signed_up',       // First OAuth login — properties: { oauth_provider }

  // --- Core funnel (ADAPT: replace with your product's key actions) ---
  // ITEM_CREATED:   'item_created',
  // ITEM_STARTED:   'item_started',
  // ITEM_COMPLETED: 'item_completed',

  // --- Monetization ---
  PAYMENT_COMPLETED: 'payment_completed', // properties: { pack_size, amount_cents }
  COUPON_REDEEMED:   'coupon_redeemed',   // properties: { pack_size }

  // --- Navigation ---
  PAGE_VIEW: '$pageview',                 // properties: { $current_url }

  // --- Errors (frontend) ---
  API_ERROR: 'api_error',                 // properties: { status, path, method }
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
