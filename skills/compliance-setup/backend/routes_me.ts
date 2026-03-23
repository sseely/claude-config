import { createDbClient } from '../db/client';
import { Env, User } from '../types';
import { logAuditEvent, AuditAction } from '../services/audit';
import { COOKIE, COOKIE_MAX_AGE } from '../constants';

const ACCOUNT_RECOVERY_WINDOW_DAYS = 30;

// ---------------------------------------------------------------------------
// POST /api/me/consent
// ---------------------------------------------------------------------------

export async function handlePostConsent(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  const body = await request.json<{
    terms_version?: string;
    privacy_policy_version?: string;
  }>();

  const termsVersion = body.terms_version ?? env.TERMS_VERSION ?? '2026-01';
  const privacyVersion = body.privacy_policy_version ?? env.PRIVACY_VERSION ?? '2026-01';

  const db = await createDbClient(env);
  try {
    const { rows } = await db.query(
      `UPDATE users
       SET terms_accepted_at = NOW(), terms_version = $2,
           privacy_policy_accepted_at = NOW(), privacy_policy_version = $3
       WHERE id = $1
       RETURNING id, terms_accepted_at, terms_version,
                 privacy_policy_accepted_at, privacy_policy_version`,
      [user.id, termsVersion, privacyVersion]
    );
    return Response.json(rows[0]);
  } finally {
    await db.end();
  }
}

// ---------------------------------------------------------------------------
// GET /api/me/export
// ---------------------------------------------------------------------------

// ADAPT: Update this function to include your project's primary data tables.
// The profile and consent sections are generic. Replace the sessionPacks query
// with queries that reflect your actual data model.
export async function buildExportPayload(
  userId: string,
  env: Env
): Promise<Record<string, unknown>> {
  const db = await createDbClient(env);
  try {
    const { rows: userRows } = await db.query(
      `SELECT id, name, email, created_at,
              terms_accepted_at, terms_version,
              privacy_policy_accepted_at, privacy_policy_version
       FROM users WHERE id = $1`,
      [userId]
    );
    if (userRows.length === 0) return {};
    const u = userRows[0];

    // ADAPT: replace with your project's billing / session data query
    const { rows: packs } = await db.query(
      `SELECT pack_size, purchased_at, sessions_remaining
       FROM session_packs WHERE user_id = $1 ORDER BY purchased_at ASC`,
      [userId]
    );

    return {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      profile: { id: u.id, name: u.name, email: u.email, created_at: u.created_at },
      consent: {
        termsAcceptedAt: u.terms_accepted_at,
        termsVersion: u.terms_version,
        privacyPolicyAcceptedAt: u.privacy_policy_accepted_at,
        privacyPolicyVersion: u.privacy_policy_version,
      },
      sessionPacks: packs, // ADAPT: rename key + update query above
    };
  } finally {
    await db.end();
  }
}

export async function handleExportData(
  request: Request,
  env: Env,
  user: User,
  ctx: ExecutionContext
): Promise<Response> {
  const payload = await buildExportPayload(user.id, env);

  ctx.waitUntil(logAuditEvent(env, ctx, {
    actorId: user.id,
    action: AuditAction.USER_DATA_EXPORTED,
    targetType: 'user',
    targetId: user.id,
    ipAddress: request.headers.get('CF-Connecting-IP') ?? undefined,
  }));

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/me  — soft-delete with 30-day recovery window
// ---------------------------------------------------------------------------

export async function handleDeleteAccount(
  request: Request,
  env: Env,
  user: User,
  ctx: ExecutionContext
): Promise<Response> {
  const body = await request.json<{ confirmation?: string }>();
  if (body.confirmation !== 'DELETE') {
    return Response.json(
      { error: 'Send { "confirmation": "DELETE" } to confirm account deletion' },
      { status: 400 }
    );
  }

  const payload = await buildExportPayload(user.id, env);

  if (env.R2_USER_BACKUPS) {
    await env.R2_USER_BACKUPS.put(`user-backups/${user.id}.json`, JSON.stringify(payload), {
      httpMetadata: { contentType: 'application/json' },
    });
  }

  const recoveryExpiry = new Date(Date.now() + ACCOUNT_RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const db = await createDbClient(env);
  try {
    await db.query(
      // ADAPT: null out whichever OAuth ID columns your project uses.
      // Common options: linkedin_id, google_id, microsoft_id, github_id
      `UPDATE users
       SET linkedin_id = NULL, google_id = NULL, microsoft_id = NULL,
           linkedin_access_token = NULL,
           deleted_at = NOW(),
           has_recovery_backup = true,
           recovery_backup_expires_at = $2
       WHERE id = $1`,
      [user.id, recoveryExpiry]
    );
  } finally {
    await db.end();
  }

  ctx.waitUntil(logAuditEvent(env, ctx, {
    actorId: user.id,
    action: AuditAction.USER_DELETED,
    targetType: 'user',
    targetId: user.id,
    ipAddress: request.headers.get('CF-Connecting-IP') ?? undefined,
  }));

  return new Response(JSON.stringify({ recovery_expires_at: recoveryExpiry.toISOString() }), {
    headers: {
      'Content-Type': 'application/json',
      // ADAPT: update cookie name constant if different in your project
      'Set-Cookie': `${COOKIE.SESSION}=; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE.CLEAR}; Path=/`,
    },
  });
}

// ---------------------------------------------------------------------------
// POST /api/me/restore
// ---------------------------------------------------------------------------

export async function handleRestoreAccount(
  request: Request,
  env: Env,
  user: User,
  ctx: ExecutionContext
): Promise<Response> {
  if (!user.deleted_at) {
    return Response.json({ error: 'Account is not deleted' }, { status: 409 });
  }
  if (!user.has_recovery_backup) {
    return Response.json({ error: 'No recovery backup available' }, { status: 409 });
  }

  if (env.R2_USER_BACKUPS) {
    await env.R2_USER_BACKUPS.delete(`user-backups/${user.id}.json`);
  }

  const db = await createDbClient(env);
  try {
    await db.query(
      `UPDATE users
       SET deleted_at = NULL,
           has_recovery_backup = false,
           recovery_backup_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );
  } finally {
    await db.end();
  }

  ctx.waitUntil(logAuditEvent(env, ctx, {
    actorId: user.id,
    action: AuditAction.ACCOUNT_RESTORED,
    targetType: 'user',
    targetId: user.id,
    ipAddress: request.headers.get('CF-Connecting-IP') ?? undefined,
  }));

  return Response.json({ restored: true });
}