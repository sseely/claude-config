-- GDPR consent tracking + soft-delete fields for the users table.
-- Idempotent: uses ADD COLUMN IF NOT EXISTS.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version              VARCHAR(20),
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS deleted_at                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS has_recovery_backup        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recovery_backup_expires_at TIMESTAMPTZ;