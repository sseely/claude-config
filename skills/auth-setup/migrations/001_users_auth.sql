-- Core users table for OAuth authentication.
-- ADAPT: remove any provider ID column + index for providers you are NOT using.
-- ADAPT: remove linkedin_access_token if you don't need LinkedIn API posting.
-- ADAPT: add any project-specific columns after the base auth columns.

CREATE TABLE IF NOT EXISTS users (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- OAuth provider IDs — remove columns for providers you are not using
  linkedin_id            VARCHAR(255) UNIQUE,
  google_id              VARCHAR(255)  UNIQUE,
  microsoft_id           VARCHAR(255)  UNIQUE,

  email                  VARCHAR(255) NOT NULL,
  name                   VARCHAR(255) NOT NULL,
  profile_url            TEXT,

  -- Only needed if storing LinkedIn token for API posting (e.g. one-click share)
  linkedin_access_token  TEXT,

  created_at             TIMESTAMPTZ  DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  DEFAULT NOW(),
  is_admin               BOOLEAN      NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS users_lower_email_key ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_email     ON users (lower(email));

-- Remove indexes for providers you are not using
CREATE INDEX IF NOT EXISTS idx_users_linkedin  ON users (linkedin_id);
CREATE INDEX IF NOT EXISTS idx_users_google    ON users (google_id);
CREATE INDEX IF NOT EXISTS idx_users_microsoft ON users (microsoft_id);
