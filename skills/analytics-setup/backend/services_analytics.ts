// Backend analytics service — fire-and-forget PostHog capture.
// No initialization needed; sends directly to PostHog's /capture/ endpoint.
// Safe to call from any route handler: exits immediately if POSTHOG_API_KEY is
// unset, or if the caller has not confirmed analytics consent.
// ADAPT: update the Env import path to match your project layout.

import { Env } from '../types';

export interface CaptureEventOptions {
  /** Optional key/value metadata for segmentation. */
  properties?: Record<string, unknown>;
  /** ExecutionContext — pass when available so the fetch completes even
   *  after the response is returned. */
  ctx?: ExecutionContext;
}

/**
 * Capture an analytics event in PostHog.
 *
 * The frontend's Termly consent gate (AnalyticsContext.tsx) only protects
 * calls made from the browser — a server-to-server call site bypasses it
 * entirely, so every caller must resolve consent for itself and pass the
 * result here. No-ops (does not fetch) when consent is false.
 *
 * @param env            Worker environment — must have POSTHOG_API_KEY set
 * @param distinctId     PostHog distinct_id, typically user.id
 * @param event          Event name — use a constant from AnalyticsEvent
 * @param consentGranted Whether this request has confirmed analytics
 *                       consent (e.g. read from a compliance-setup consent
 *                       cookie/header, or the user's stored consent record)
 * @param options        Optional properties and ExecutionContext
 */
export function captureEvent(
  env: Env,
  distinctId: string,
  event: string,
  consentGranted: boolean,
  options: CaptureEventOptions = {}
): void {
  if (!consentGranted) return;
  if (!env.POSTHOG_API_KEY) return;

  const { properties = {}, ctx } = options;
  const host = env.POSTHOG_HOST ?? 'https://us.i.posthog.com';
  const req = fetch(`${host}/capture/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key:     env.POSTHOG_API_KEY,
      event,
      distinct_id: distinctId,
      properties,
    }),
  })
    .then((res) => {
      if (!res.ok) {
        console.warn('[posthog]', event, `HTTP ${res.status}`);
      }
    })
    .catch((err) => {
      // Log but never throw — analytics must not affect request reliability
      console.warn('[posthog]', event, err instanceof Error ? err.message : String(err));
    });

  // waitUntil keeps the fetch alive after the response is sent.
  // Without this, Cloudflare may cancel the fetch when the Worker returns.
  if (ctx) ctx.waitUntil(req as Promise<unknown>);
}
