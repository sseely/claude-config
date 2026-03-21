// Shared test helpers — imported by all test files.
// ADAPT: update the TRUNCATE list to match your actual tables, in dependency order
//        (tables that reference others must come first).
// ADAPT: update createUser to match your users table columns.
// ADAPT: add additional fixture builders for your domain entities.
// ADAPT: update DATABASE_URL default to match docker-compose.yml credentials.
// ADAPT: remove createSessionPack if not using payments-setup.
// ADAPT: remove createUserWithSession / storeSession import if not using auth-setup.

import { Pool } from 'pg';
// ADAPT: update import path if oauth utils live elsewhere
import { storeSession } from '../../src/utils/oauth';

/** Base URL for all test fetch() calls — must match miniflare binding in vitest.config.ts */
export const BASE_URL = 'http://localhost:8787';

// Connects directly to Docker Compose PostgreSQL for test setup/teardown.
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgresql://dev:devpass@localhost:5432/myapp', // ADAPT
});

/**
 * Truncate all tables in dependency order and restart sequences.
 * Call this in beforeEach to give every test a clean slate.
 * ADAPT: update the table list and order to match your schema.
 */
export async function truncateAll(): Promise<void> {
  await pool.query(`
    TRUNCATE
      audit_logs,
      user_feedback,
      votes,
      session_packs,
      coupon_codes,
      users
    RESTART IDENTITY CASCADE
  `);
}

/** Direct SQL query helper — for assertions and setup not covered by fixtures. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<{ rows: T[] }> {
  return pool.query(sql, params);
}

// ---------------------------------------------------------------------------
// Fixture builders
// ADAPT: add/remove fields to match your users table columns.
// ---------------------------------------------------------------------------

/**
 * Insert a test user. Returns id and email.
 * Each call produces a unique user via a random suffix.
 */
export async function createUser(
  overrides: Partial<{
    linkedin_id: string; // ADAPT: remove if not using LinkedIn auth
    email:       string;
    name:        string;
  }> = {}
): Promise<{ id: string; email: string }> {
  const unique = crypto.randomUUID().slice(0, 8);
  const { rows } = await pool.query(
    `INSERT INTO users (linkedin_id, email, name)  -- ADAPT: update columns
     VALUES ($1, $2, $3)
     RETURNING id, email`,
    [
      overrides.linkedin_id ?? `li-${unique}`,
      overrides.email       ?? `test-${unique}@example.com`,
      overrides.name        ?? 'Test User',
    ]
  );
  return rows[0];
}

/**
 * Insert a session pack for a user.
 * ADAPT: remove if not using payments-setup.
 */
export async function createSessionPack(
  userId: string,
  sessionsRemaining = 3
): Promise<{ id: string }> {
  const { rows } = await pool.query(
    `INSERT INTO session_packs
       (user_id, pack_size, amount_cents, sessions_remaining)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userId, 3, 3700, sessionsRemaining]
  );
  return rows[0];
}

/**
 * Create a user AND store a session in KV, returning the session cookie string.
 * Use this to make authenticated requests in tests.
 * ADAPT: remove if not using auth-setup.
 *
 * @param kvEnv  The env object from the test — contains the KV binding.
 */
export async function createUserWithSession(
  kvEnv: unknown,
  overrides?: Parameters<typeof createUser>[0]
): Promise<{ id: string; email: string; cookie: string }> {
  const user  = await createUser(overrides);
  const token = crypto.randomUUID();
  await storeSession(kvEnv as Parameters<typeof storeSession>[0], token, user.id);
  return { ...user, cookie: `session=${token}` };
}
