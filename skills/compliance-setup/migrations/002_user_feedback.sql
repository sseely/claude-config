-- Post-session star rating (1–5) with optional comment, one per user per session.
-- ADAPT: replace the poll_id FK with the FK that matches your session/item table.
CREATE TABLE IF NOT EXISTS user_feedback (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID    REFERENCES users(id) ON DELETE CASCADE,
  poll_id      UUID    REFERENCES polls(id) ON DELETE SET NULL, -- ADAPT
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate ratings for the same session item (null poll_id = general feedback).
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_user_poll
  ON user_feedback (user_id, poll_id)
  WHERE poll_id IS NOT NULL;