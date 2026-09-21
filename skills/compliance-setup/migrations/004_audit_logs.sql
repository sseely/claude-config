-- Audit log for compliance-relevant actions (export, delete, restore,
-- SBOM request, consent, feedback). Append-only; never updated.
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        REFERENCES users(id) ON DELETE SET NULL, -- nullable: ON DELETE SET NULL requires it (Step 3f's hard-delete cleanup would otherwise violate NOT NULL on every account that has any audit history)
  action      VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id   UUID        NOT NULL,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs (actor_id, created_at DESC);
