// Audit logging service — records significant user and system actions.
// ADAPT: update the Env import path to match your project layout.
// ADAPT: add additional AuditAction entries for your domain-specific events.

import { createDbClient } from '../db/client';
import { Env } from '../types';

export const AuditAction = {
  USER_DATA_EXPORTED: 'user_data_exported',
  USER_DELETED:       'user_deleted',
  ACCOUNT_RESTORED:   'account_restored',
  SBOM_REQUESTED:     'sbom_requested',
  SBOM_RATE_LIMITED:  'sbom_rate_limited',
  CONSENT_GIVEN:      'consent_given',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  // ADAPT: add project-specific audit actions below
} as const;

export type AuditActionName = (typeof AuditAction)[keyof typeof AuditAction];

interface AuditEventParams {
  actorId:     string;
  action:      AuditActionName;
  targetType:  string;
  targetId:    string;
  metadata?:   Record<string, unknown>;
  ipAddress?:  string;
}

/**
 * Log an audit event to the audit_logs table.
 *
 * Call via `ctx.waitUntil(logAuditEvent(...))` so the log write
 * completes even after the response is returned. Never await
 * directly in the request path — audit logging must not slow
 * down user-facing responses.
 */
export async function logAuditEvent(
  env: Env,
  ctx: ExecutionContext,
  params: AuditEventParams
): Promise<void> {
  const db = await createDbClient(env);
  try {
    await db.query(
      `INSERT INTO audit_logs
         (actor_id, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6::inet)`,
      [
        params.actorId,
        params.action,
        params.targetType,
        params.targetId,
        params.metadata ? JSON.stringify(params.metadata) : null,
        params.ipAddress ?? null,
      ]
    );
  } catch (err) {
    // Log but never throw — audit logging must not break the request
    console.error(
      '[audit]', params.action,
      err instanceof Error ? err.message : String(err)
    );
  } finally {
    await db.end();
  }
}
