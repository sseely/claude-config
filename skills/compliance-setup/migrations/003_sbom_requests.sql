-- CRA SBOM download request tracking (rate-limited: 1 per user per 30 days).
CREATE TABLE IF NOT EXISTS sbom_requests (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'delivered', 'failed')),
  ip_address          INET,
  requested_at        TIMESTAMPTZ DEFAULT NOW(),
  delivered_at        TIMESTAMPTZ,
  download_urls       JSONB,          -- { "spdx": "https://...", "cyclonedx": "https://..." }
  download_expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sbom_requests_user
  ON sbom_requests (user_id, requested_at DESC);