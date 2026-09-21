import { createDbClient } from '../db/client';
import { Env, User } from '../types';
import { getSessionUserId } from '../utils/oauth';
import { COOKIE } from '../constants';
import { log } from '../logger';

export function parseCookies(cookieHeader: string): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const trimmed = c.trim();
      const eq = trimmed.indexOf('=');
      return eq === -1 ? [trimmed, ''] : [trimmed.slice(0, eq), trimmed.slice(eq + 1)];
    })
  );
}

// ADAPT: update the SELECT column list to match your users table.
// Add any project-specific columns (e.g. credits_available, subscription_tier).
// ADAPT: deleted_at / has_recovery_backup and the WHERE filter below require
// compliance-setup's migration 001_consent_fields.sql. If compliance-setup
// has not been run, drop both columns and the "AND deleted_at IS NULL" clause.
export async function requireAuth(request: Request, env: Env): Promise<User | null> {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const token = cookies[COOKIE.SESSION];
  if (!token) return null;

  // Fail-closed: any error here (KV blip, DB blip) must deny access, not
  // throw uncaught out of every protected route.
  try {
    const userId = await getSessionUserId(env, token);
    if (!userId) return null;

    const db = await createDbClient(env);
    try {
      const { rows } = await db.query<User>(
        `SELECT id, linkedin_id, google_id, microsoft_id,
                email, name, profile_url, linkedin_access_token,
                created_at, updated_at, is_admin,
                deleted_at, has_recovery_backup
         FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [userId]
      );
      return rows[0] ?? null;
    } finally {
      await db.end();
    }
  } catch (err) {
    log('error', 'requireAuth failed', {
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
