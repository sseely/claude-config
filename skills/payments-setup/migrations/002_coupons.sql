-- Coupon codes and redemptions tables.
-- ADAPT: pack_size CHECK must match VALID_PACK_SIZES in your constants.
-- ADAPT: adjust default expires_at interval (currently 14 days).

CREATE TABLE IF NOT EXISTS coupon_codes (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20)  UNIQUE NOT NULL,
  -- ADAPT: update CHECK to match your pack sizes
  pack_size   INTEGER      NOT NULL CHECK (pack_size IN (1, 3, 10)),
  max_uses    INTEGER      NOT NULL DEFAULT 1,
  -- Optional: restrict redemption to a specific email address
  email       VARCHAR(255),
  -- ADAPT: change interval if desired
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '14 days',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code    ON coupon_codes (code);
CREATE INDEX IF NOT EXISTS idx_coupons_email   ON coupon_codes (email);
CREATE INDEX IF NOT EXISTS idx_coupons_expires ON coupon_codes (expires_at);

-- One row per successful redemption; unique constraint prevents re-use
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID        NOT NULL REFERENCES coupon_codes(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user   ON coupon_redemptions (user_id);
