// SBOM delivery — add this block inside your scheduled handler in src/index.ts.
// It processes pending sbom_requests by generating presigned R2 URLs and
// emailing them via SendGrid.
//
// Required env vars: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//                    R2_BUCKET, SENDGRID_API_KEY
//
// ADAPT markers below — search for "ADAPT" to find the three substitution points.

import { createDbClient } from '../db/client';
import { Env } from '../types';
import { log } from '../logger';

type DbClient = Awaited<ReturnType<typeof createDbClient>>;

const SBOM_EXPIRY_HOURS = 48;
const SECONDS_PER_HOUR = 3600;
const SBOM_BATCH_LIMIT = 100;
const SENDGRID_TIMEOUT_MS = 5000;

interface PendingSbomRequest {
  id: string;
  user_id: string;
  email: string;
}

interface DeliveredSbomRequest {
  id: string;
  urls: string;
  expiresAt: Date;
}

/** Thrown by generateR2PresignedUrl until it is replaced with a real
 * implementation. Never retryable — a forged-URL placeholder must never
 * reach production silently, so this is always a terminal delivery failure. */
class PresignedUrlUnavailableError extends Error {}

/**
 * Thrown by sendSbomEmail. Per rules/retry-idempotency.md: a 4xx response is
 * non-retryable (terminal); a 5xx should be retried by the next cron tick.
 */
class SendGridDeliveryError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function processPendingSbomRequests(env: Env): Promise<void> {
  const db = await createDbClient(env);
  try {
    const { rows: pending } = await db.query<PendingSbomRequest>(
      `SELECT sr.id, sr.user_id, u.email
       FROM sbom_requests sr
       JOIN users u ON u.id = sr.user_id
       WHERE sr.status = 'pending'
       LIMIT $1`,
      [SBOM_BATCH_LIMIT]
    );

    if (pending.length === 0) return;

    const delivered: DeliveredSbomRequest[] = [];
    const failed: string[] = [];

    for (const req of pending) {
      try {
        delivered.push(await deliverSbomRequest(env, req));
      } catch (err) {
        recordSbomFailure(req.id, err, failed);
      }
    }

    await markSbomDelivered(db, delivered);
    await markSbomFailed(db, failed);

    log('info', 'sbom cron tick complete', {
      total: pending.length,
      delivered: delivered.length,
      failed: failed.length,
    });
  } finally {
    await db.end();
  }
}

/** Generate both SBOM URLs and (optionally) email them. Throws on any
 * failure so the caller can classify retryable vs. terminal errors. */
async function deliverSbomRequest(
  env: Env,
  req: PendingSbomRequest
): Promise<DeliveredSbomRequest> {
  const expiresAt = new Date(Date.now() + SBOM_EXPIRY_HOURS * SECONDS_PER_HOUR * 1000);
  let spdxUrl = '';
  let cdxUrl = '';

  if (env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) {
    // ADAPT: replace PROJECT_NAME with your SBOM filename prefix
    // ADAPT: replace R2_SBOM_PREFIX with the R2 path prefix (e.g. 'sbom/latest')
    const ttl = SBOM_EXPIRY_HOURS * SECONDS_PER_HOUR;
    spdxUrl = await generateR2PresignedUrl(env, 'R2_SBOM_PREFIX/sbom.PROJECT_NAME.spdx.json', ttl);
    cdxUrl = await generateR2PresignedUrl(env, 'R2_SBOM_PREFIX/sbom.PROJECT_NAME.cdx.json', ttl);
  }

  if (env.SENDGRID_API_KEY && spdxUrl && cdxUrl) {
    await sendSbomEmail(env, req.email, spdxUrl, cdxUrl);
  }

  return { id: req.id, urls: JSON.stringify({ spdx: spdxUrl, cyclonedx: cdxUrl }), expiresAt };
}

/** Classify a delivery failure and either queue it as terminal (`failed`)
 * or leave it untouched so the next cron tick retries it (`pending`). */
function recordSbomFailure(requestId: string, err: unknown, failed: string[]): void {
  const error = err instanceof Error ? err.message : String(err);
  const terminal =
    err instanceof PresignedUrlUnavailableError ||
    (err instanceof SendGridDeliveryError && err.status < 500);

  if (terminal) {
    log('error', 'sbom delivery failed permanently', { requestId, error });
    failed.push(requestId);
    return;
  }

  // on-call: if SBOM deliveries pile up in `pending` with repeated log
  // entries, check SendGrid status; this path retries indefinitely on
  // 5xx/network errors. Runbook: see this skill's Operational Readiness
  // section in SKILL.md.
  log('warn', 'sbom delivery failed transiently, retrying next tick', { requestId, error });
}

async function markSbomDelivered(db: DbClient, delivered: DeliveredSbomRequest[]): Promise<void> {
  if (delivered.length === 0) return;
  const ids = delivered.map((d) => d.id);
  const urls = delivered.map((d) => d.urls);
  const expires = delivered.map((d) => d.expiresAt);
  await db.query(
    `UPDATE sbom_requests
     SET status = 'delivered',
         delivered_at = NOW(),
         download_urls = data.urls::jsonb,
         download_expires_at = data.expires_at
     FROM (SELECT unnest($1::uuid[]) AS id,
                  unnest($2::text[])  AS urls,
                  unnest($3::timestamptz[]) AS expires_at) data
     WHERE sbom_requests.id = data.id`,
    [ids, urls, expires]
  );
}

async function markSbomFailed(db: DbClient, failed: string[]): Promise<void> {
  if (failed.length === 0) return;
  await db.query(`UPDATE sbom_requests SET status = 'failed' WHERE id = ANY($1::uuid[])`, [failed]);
}

/**
 * SECURITY WARNING: This is a placeholder that returns unsigned URLs.
 * Production deployments MUST replace this with proper AWS SigV4 signing
 * (e.g. @aws-sdk/s3-request-presigner) or Cloudflare R2's createSignedUrl() API.
 * The current implementation produces URLs that can be forged.
 *
 * See: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
 */
async function generateR2PresignedUrl(
  env: Env,
  key: string,
  expiresInSeconds: number
): Promise<string> {
  // ADAPT: replace with real presigned URL generation before production use —
  // see @aws-sdk/s3-request-presigner example above. This throws so a
  // forged-URL placeholder can never reach production silently.
  throw new PresignedUrlUnavailableError(
    'generateR2PresignedUrl is a placeholder — implement real R2 presigned URLs before enabling SBOM delivery.'
  );
}

async function sendSbomEmail(
  env: Env,
  toEmail: string,
  spdxUrl: string,
  cdxUrl: string
): Promise<void> {
  // ADAPT: replace NOREPLY_EMAIL and APP_DISPLAY_NAME
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: 'NOREPLY_EMAIL', name: 'APP_DISPLAY_NAME' },
      subject: 'Your APP_DISPLAY_NAME Software Bill of Materials (SBOM)',
      content: [
        {
          type: 'text/plain',
          value: `Your SBOM download links (valid for ${SBOM_EXPIRY_HOURS} hours):\n\nSPDX 2.3: ${spdxUrl}\nCycloneDX 1.6: ${cdxUrl}\n\nThese links expire in ${SBOM_EXPIRY_HOURS} hours.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(SENDGRID_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new SendGridDeliveryError(`SendGrid email failed: ${res.status} ${res.statusText}`, res.status);
  }
}
