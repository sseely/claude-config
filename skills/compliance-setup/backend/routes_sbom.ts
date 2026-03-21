import { createDbClient } from '../db/client';
import { Env, User } from '../types';
import { logAuditEvent, AuditAction } from '../services/audit';

// POST /api/sbom/request — rate-limited to 1 per user per 30 days
export async function handleRequestSbom(
  request: Request,
  env: Env,
  user: User,
  ctx: ExecutionContext
): Promise<Response> {
  const db = await createDbClient(env);
  try {
    const { rows: recent } = await db.query(
      `SELECT id, requested_at FROM sbom_requests
       WHERE user_id = $1 AND requested_at > NOW() - INTERVAL '30 days'
       ORDER BY requested_at DESC LIMIT 1`,
      [user.id]
    );

    if (recent.length > 0) {
      const nextAvailable = new Date(recent[0].requested_at);
      nextAvailable.setDate(nextAvailable.getDate() + 30);
      return Response.json(
        { error: 'Rate limited', next_available_at: nextAvailable.toISOString() },
        { status: 429 }
      );
    }

    const ipAddress = request.headers.get('CF-Connecting-IP') ?? undefined;

    const { rows } = await db.query(
      `INSERT INTO sbom_requests (user_id, ip_address)
       VALUES ($1, $2::inet)
       RETURNING id, status, requested_at`,
      [user.id, ipAddress ?? null]
    );

    logAuditEvent(env, ctx, {
      actorId: user.id,
      action: AuditAction.SBOM_REQUESTED,
      targetType: 'sbom_request',
      targetId: rows[0].id,
      ipAddress,
    });

    return Response.json(rows[0], { status: 201 });
  } finally {
    await db.end();
  }
}

// GET /api/sbom/status — returns the most recent request for this user
export async function handleGetSbomStatus(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  const db = await createDbClient(env);
  try {
    const { rows } = await db.query(
      `SELECT id, status, requested_at, delivered_at, download_urls, download_expires_at
       FROM sbom_requests
       WHERE user_id = $1
       ORDER BY requested_at DESC
       LIMIT 1`,
      [user.id]
    );
    if (rows.length === 0) return Response.json({ status: 'none' });
    return Response.json(rows[0]);
  } finally {
    await db.end();
  }
}