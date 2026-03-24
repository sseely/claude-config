// Backend analytics service — fire-and-forget PostHog capture.
// No initialization needed; sends directly to PostHog's /capture/ endpoint.
// Safe to call from any route handler: exits immediately if POSTHOG_API_KEY is unset.
// ADAPT: update the Env import path to match your project layout.

import { Env } from '../types';

/**
 * Capture an analytics event in PostHog.
 *
 * @param env         Worker environment — must have POSTHOG_API_KEY set
 * @param distinctId  PostHog distinct_id, typically user.id
 * @param event       Event name — use a constant from AnalyticsEvent
 * @param properties  Optional key/value metadata for segmentation
 * @param ctx         ExecutionContext — pass when available so the fetch
 *                    completes even after the response is returned
 */
export function captureEvent(
  env: Env,
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
  ctx?: ExecutionContext
): void {
  if (!env.POSTHOG_API_KEY) return;

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
  }).catch((err) => {
    // Log but never throw — analytics must not affect request reliability
    console.warn('[posthog]', event, err instanceof Error ? err.message : String(err));
  });

  // waitUntil keeps the fetch alive after the response is sent.
  // Without this, Cloudflare may cancel the fetch when the Worker returns.
  if (ctx) ctx.waitUntil(req as Promise<unknown>);
}
