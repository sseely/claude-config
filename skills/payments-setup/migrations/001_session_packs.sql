-- Session packs table — one row per purchased (or coupon-redeemed) credit bundle.
-- ADAPT: pack_size CHECK must match VALID_PACK_SIZES in your constants.
-- Credits never expire; drop expires_at if it exists from an older schema.

CREATE TABLE IF NOT EXISTS session_packs (
  id                           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- NULL for coupon-redeemed packs (no Stripe session involved)
  stripe_checkout_session_id   VARCHAR(255) UNIQUE,
  -- ADAPT: update CHECK to match your pack sizes
  pack_size                    INTEGER      NOT NULL CHECK (pack_size IN (1, 3, 10)),
  amount_cents                 INTEGER      NOT NULL CHECK (amount_cents >= 0),
  sessions_remaining           INTEGER      NOT NULL CHECK (sessions_remaining >= 0),
  purchased_at                 TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packs_user   ON session_packs (user_id);
CREATE INDEX IF NOT EXISTS idx_packs_stripe ON session_packs (stripe_checkout_session_id);
-- Partial index for fast "find available packs" queries
CREATE INDEX IF NOT EXISTS idx_packs_available
  ON session_packs (user_id, purchased_at)
  WHERE sessions_remaining > 0;
