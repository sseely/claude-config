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

const SBOM_EXPIRY_HOURS = 48;

export async function processPendingSbomRequests(env: Env): Promise<void> {
  const db = await createDbClient(env);
  try {
    const { rows: pending } = await db.query<{ id: string; user_id: string; email: string }>(
      `SELECT sr.id, sr.user_id, u.email
       FROM sbom_requests sr
       JOIN users u ON u.id = sr.user_id
       WHERE sr.status = 'pending'`
    );

    for (const req of pending) {
      try {
        const expiresAt = new Date(Date.now() + SBOM_EXPIRY_HOURS * 60 * 60 * 1000);
        let spdxUrl = '';
        let cdxUrl = '';

        if (env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) {
          // ADAPT: replace PROJECT_NAME with your SBOM filename prefix
          // ADAPT: replace R2_SBOM_PREFIX with the R2 path prefix (e.g. 'sbom/latest')
          spdxUrl = await generateR2PresignedUrl(
            env,
            'R2_SBOM_PREFIX/sbom.PROJECT_NAME.spdx.json',
            SBOM_EXPIRY_HOURS * 3600
          );
          cdxUrl = await generateR2PresignedUrl(
            env,
            'R2_SBOM_PREFIX/sbom.PROJECT_NAME.cdx.json',
            SBOM_EXPIRY_HOURS * 3600
          );
        }

        if (env.SENDGRID_API_KEY && spdxUrl && cdxUrl) {
          await sendSbomEmail(env, req.email, spdxUrl, cdxUrl);
        }

        await db.query(
          `UPDATE sbom_requests
           SET status = 'delivered',
               delivered_at = NOW(),
               download_urls = $2,
               download_expires_at = $3
           WHERE id = $1`,
          [req.id, JSON.stringify({ spdx: spdxUrl, cyclonedx: cdxUrl }), expiresAt]
        );
      } catch (err) {
        console.error(`SBOM delivery failed for request ${req.id}:`, err);
        await db.query(`UPDATE sbom_requests SET status = 'failed' WHERE id = $1`, [req.id]);
      }
    }
  } finally {
    await db.end();
  }
}

// WARNING: This is a simplified placeholder. Production deployments MUST use
// proper AWS SigV4 signing (e.g. @aws-sdk/s3-request-presigner) or
// Cloudflare R2's built-in createSignedUrl() API. The current implementation
// produces unsigned URLs that can be forged.
async function generateR2PresignedUrl(
  env: Env,
  key: string,
  expiresInSeconds: number
): Promise<string> {
  const endpoint = env.R2_ENDPOINT ?? '';
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  return `${endpoint}/${key}?X-Expires=${expiresAt.toISOString()}`;
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
  });
  if (!res.ok) {
    throw new Error(`SendGrid email failed: ${res.status} ${res.statusText}`);
  }
}