// Route-level tests for the scaffolded payment routes.
// ADAPT: update the import paths below once merged into your project's
// test/ directory — this file assumes it lives at the same depth as
// testing-setup's test/helpers/db.ts (e.g. test/routes/payments.test.ts).
import { describe, it, expect, beforeEach } from 'vitest';
import Stripe from 'stripe';
import { env } from 'cloudflare:test';
import { truncateAll, createUser, query } from '../helpers/db';
import { handleStripeWebhook } from '../../src/routes/payments';
import { requireAuth } from '../../src/middleware/auth';

function webhookRequest(payload: string, signature: string): Request {
  return new Request('http://localhost/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': signature },
    body: payload,
  });
}

function checkoutCompletedPayload(sessionId: string, userId: string, pack = 'single'): string {
  return JSON.stringify({
    id:     'evt_test',
    object: 'event',
    type:   'checkout.session.completed',
    data:   { object: { id: sessionId, metadata: { user_id: userId, pack } } },
  });
}

describe('POST /stripe/webhook', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('creates a session_packs row for a valid checkout.session.completed event', async () => {
    const user = await createUser();
    const payload = checkoutCompletedPayload('cs_test_happy', user.id);
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload, secret: env.STRIPE_WEBHOOK_SECRET,
    });

    const res = await handleStripeWebhook(webhookRequest(payload, signature), env);

    expect(res.status).toBe(200);
    const { rows } = await query('SELECT * FROM session_packs WHERE user_id = $1', [user.id]);
    expect(rows).toHaveLength(1);
  });

  it('does not duplicate the row when the same event is delivered twice', async () => {
    const user = await createUser();
    const payload = checkoutCompletedPayload('cs_test_idempotent', user.id);
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload, secret: env.STRIPE_WEBHOOK_SECRET,
    });

    await handleStripeWebhook(webhookRequest(payload, signature), env);
    await handleStripeWebhook(webhookRequest(payload, signature), env);

    const { rows } = await query('SELECT * FROM session_packs WHERE user_id = $1', [user.id]);
    expect(rows).toHaveLength(1);
  });

  it('returns 400 when the stripe-signature header is missing', async () => {
    const payload = checkoutCompletedPayload('cs_test_missing_sig', 'irrelevant-user-id');

    const res = await handleStripeWebhook(webhookRequest(payload, ''), env);

    expect(res.status).toBe(400);
  });

  it('returns 400 when the stripe-signature header is tampered with', async () => {
    const user = await createUser();
    const payload = checkoutCompletedPayload('cs_test_tampered', user.id);
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload, secret: env.STRIPE_WEBHOOK_SECRET,
    });

    const res = await handleStripeWebhook(webhookRequest(payload, `${signature}-tampered`), env);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/buy — auth gate', () => {
  // handleBuyPack takes an already-resolved `user`; per SKILL.md Step 10 the
  // router calls requireAuth first and returns 401 when it resolves to null.
  // Verify that gate's contract directly (F023): requireAuth must resolve to
  // `null`, not an object, for an unauthenticated request.
  it('resolves to null for a request with no session, matching the router 401 gate', async () => {
    const request = new Request('http://localhost/api/buy', { method: 'POST' });

    const user = await requireAuth(request, env);

    expect(user).toBeNull();
  });
});
