// Stripe Checkout session creation and webhook handler.
// ADAPT: update PACKS to match your pricing and session counts.
// ADAPT: update product name in line_items (currently "My App — N Session(s)").
// ADAPT: update success_url and cancel_url to your post-checkout paths.
// ADAPT: remove the stripe-mock simulation block if not using stripe-mock in tests.

import Stripe from 'stripe';
import { createDbClient } from '../db/client';
import { Env, User } from '../types';
import { STRIPE_API_VERSION } from '../constants';

// ADAPT: update prices and session counts
const PACKS = {
  single: { sessions: 1,  amount_cents: 1400 },
  triple: { sessions: 3,  amount_cents: 3700 },
  ten:    { sessions: 10, amount_cents: 10900 },
} as const;

export type PackKey = keyof typeof PACKS;

function createStripeClient(env: Env): Stripe {
  // @ts-ignore — stripe-mock runs an older API; suppress version mismatch in tests
  const config: Stripe.StripeConfig = { apiVersion: STRIPE_API_VERSION };
  if (env.STRIPE_BASE_URL) {
    const url = new URL(env.STRIPE_BASE_URL);
    config.host     = url.hostname;
    config.port     = url.port || (url.protocol === 'http:' ? '80' : '443');
    config.protocol = url.protocol.replace(':', '') as 'http' | 'https';
  }
  return new Stripe(env.STRIPE_SECRET_KEY!, config);
}

// ---------------------------------------------------------------------------
// POST /api/buy — create a Stripe Checkout session
// ---------------------------------------------------------------------------

export async function handleBuyPack(request: Request, env: Env, user: User): Promise<Response> {
  const body = await request.json<{ pack?: string }>();
  const pack = body.pack as PackKey;

  if (!PACKS[pack]) {
    return Response.json(
      { error: `Invalid pack. Choose: ${Object.keys(PACKS).join(', ')}.` },
      { status: 400 }
    );
  }
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const stripe = createStripeClient(env);
  const packInfo = PACKS[pack];
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: packInfo.amount_cents,
          product_data: {
            // ADAPT: replace "My App" with your product name
            name: `My App — ${packInfo.sessions} Session${packInfo.sessions > 1 ? 's' : ''}`,
            description: `Valid for ${packInfo.sessions} live polling session${packInfo.sessions > 1 ? 's' : ''}. Credits never expire.`,
          },
        },
        quantity: 1,
      },
    ],
    metadata:      { user_id: user.id, pack },
    // ADAPT: update paths if your post-checkout routes differ
    success_url:   `${env.APP_URL}/dashboard?purchase=success`,
    cancel_url:    `${env.APP_URL}/dashboard?purchase=cancelled`,
    customer_email: user.email,
  });

  // stripe-mock has no hosted checkout UI — simulate purchase directly in tests.
  // ADAPT: remove this block if not using stripe-mock
  if (env.STRIPE_BASE_URL) {
    const db = await createDbClient(env);
    try {
      await db.query(
        `INSERT INTO session_packs
           (user_id, stripe_checkout_session_id, pack_size, amount_cents, sessions_remaining)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (stripe_checkout_session_id) DO NOTHING`,
        [user.id, session.id, packInfo.sessions, packInfo.amount_cents, packInfo.sessions]
      );
    } finally {
      await db.end();
    }
    return Response.json({ url: `${env.APP_URL}/dashboard?purchase=success` });
  }

  return Response.json({ url: session.url });
}

// ---------------------------------------------------------------------------
// POST /stripe/webhook — handle checkout.session.completed
// ---------------------------------------------------------------------------

export async function handleStripeWebhook(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const stripe = createStripeClient(env);
  const signature = request.headers.get('stripe-signature') ?? '';
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session;
    const packKey  = session.metadata?.pack as PackKey;
    const userId   = session.metadata?.user_id;

    if (!PACKS[packKey] || !userId) {
      return new Response('Missing metadata', { status: 400 });
    }

    const packInfo = PACKS[packKey];
    const db = await createDbClient(env);
    try {
      await db.query(
        `INSERT INTO session_packs
           (user_id, stripe_checkout_session_id, pack_size, amount_cents, sessions_remaining)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (stripe_checkout_session_id) DO NOTHING`,
        [userId, session.id, packInfo.sessions, packInfo.amount_cents, packInfo.sessions]
      );
    } finally {
      await db.end();
    }
  }

  return Response.json({ received: true });
}
