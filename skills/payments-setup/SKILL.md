# /payments-setup

Scaffold Stripe Checkout + coupon system into a Cloudflare Workers + Neon
PostgreSQL + React/Vite project. Implements: session packs (pre-paid credits),
idempotent Stripe webhook, multi-use coupon codes with expiry and email
restriction, and admin coupon management UI.

The billing unit is the **pack**, not the individual session. Packs are
purchased upfront and never expire.

---

## Step 1 — Gather inputs

Ask all of the following before doing any work:

1. **Pack pricing** — defaults are 1 session/$14, 3 sessions/$37, 10
   sessions/$109. Confirm or provide custom values.
2. **Product name** — used in the Stripe Checkout line item description
   (e.g. "Acme — 3 Sessions"). What is your product name?
3. **Post-checkout redirect paths** — defaults are `/dashboard?purchase=success`
   and `/dashboard?purchase=cancelled`. Confirm or update.
4. **Admin detection** — how does your app determine `user.is_admin`? (Default
   pattern: DB boolean column `is_admin` on the users table, set by a DB
   trigger for a specific email domain.) Confirm or describe your pattern.
5. **Server-to-server coupon endpoint?** — Do you need `POST /admin/coupons`
   protected by `X-Admin-Secret` (for programmatic coupon creation from
   scripts or other services)? Yes/No. If No, we only add the UI endpoint
   `POST /api/coupons/issue`.
6. **stripe-mock in integration tests?** — Do you use stripe-mock for local
   integration testing? Yes/No. If No, the test-mode simulation block in
   `handleBuyPack` can be omitted.
7. **`APP_URL` env var** — already set by `/auth-setup` if that skill was run.
   Confirm it exists or note it needs to be added.

---

## Step 2 — Install the Stripe SDK

```bash
npm install stripe
```

Verify the installed version and update `STRIPE_API_VERSION` in constants
to match (check `node_modules/stripe/package.json` → `"apiVersion"`).

---

## Step 3 — Read the template files

Read all templates in this skill directory before writing any code:

- `migrations/001_session_packs.sql`
- `migrations/002_coupons.sql`
- `backend/constants_payments.ts`
- `backend/types_payments.ts`
- `backend/utils_code_generation.ts`
- `backend/routes_payments.ts`
- `backend/routes_coupons.ts`
- `frontend/api_payments.ts`
- `frontend/BuyPacksSection.tsx`
- `frontend/RedeemCouponSection.tsx`
- `frontend/AdminCouponsPage.tsx`
- `frontend/CouponDetailPage.tsx`

---

## Step 4 — Database migrations

Apply both migration files against Neon:

```bash
psql "$DATABASE_URL" -f migrations/001_session_packs.sql
psql "$DATABASE_URL" -f migrations/002_coupons.sql
```

Adapt before applying:
- Update `pack_size IN (1, 3, 10)` CHECK constraints to match the pack
  sizes confirmed in step 1.
- If applying to an existing schema, convert `CREATE TABLE IF NOT EXISTS`
  blocks to `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for any missing
  columns. The unique constraint on `stripe_checkout_session_id` is the
  idempotency key — it must exist.

---

## Step 5 — Constants

Merge `backend/constants_payments.ts` into `src/constants.ts` (or create it):

- Update `STRIPE_API_VERSION` to the version in the installed stripe package.
- Update pack counts in comments to match confirmed pricing.
- `VALID_PACK_SIZES`, `MAX_COUPON_COUNT`, `COUPON_CODE_LENGTH`, and
  `COUPON_CODE_CHARS` must be consistent with the DB CHECK constraint and
  any frontend imports.

If the project has a shared constants module used by both backend and frontend
(e.g. `shared/constants.ts`), put `VALID_PACK_SIZES`, `MAX_COUPON_COUNT`, and
`COUPON_CODE_LENGTH` there so both sides import from one place.

---

## Step 6 — Types

Merge `backend/types_payments.ts` into the appropriate type files:

- Add `EnvPaymentFields` to the project's `Env` interface.
- Add `AdminCoupon` and `CouponRedemption` to the shared types file
  (e.g. `shared/types.ts`) so both backend and frontend can import them.
- If not using stripe-mock, remove `STRIPE_BASE_URL?` from `EnvPaymentFields`.

---

## Step 7 — Code generation utility

If the project already has a `generateCode` / `generateCouponCode` utility,
verify it uses the same charset and format (`XXXX-XXXX`). If not, write
`src/utils/code-generation.ts` from `backend/utils_code_generation.ts`.

Update the import in `routes_coupons.ts` to match the actual utility path.

---

## Step 8 — Payment routes

Write `src/routes/payments.ts` from `backend/routes_payments.ts`, adapting:

- Update `PACKS` object with the confirmed pricing from step 1.
- Update the Stripe line item `name` with the confirmed product name.
- Update `success_url` and `cancel_url` with the confirmed paths.
- Remove the stripe-mock simulation block (`if (env.STRIPE_BASE_URL) { ... }`)
  if the answer to step 1 Q6 was No.

---

## Step 9 — Coupon routes

Write `src/routes/coupons.ts` from `backend/routes_coupons.ts`, adapting:

- Remove `handleCreateCoupons` (the `X-Admin-Secret` endpoint) if the answer
  to step 1 Q5 was No.
- Update the `requireAuth` import path to match the project layout.
- Update `COUPON_EXPIRY_DAYS` if a different default was requested.

---

## Step 10 — Register routes in the Worker

Find the main request handler (`src/index.ts` or equivalent) and add:

```typescript
import { handleBuyPack, handleStripeWebhook } from './routes/payments';
import {
  handleCreateCoupons,  // ADAPT: remove if not using X-Admin-Secret endpoint
  handleListCoupons,
  handleGetCoupon,
  handleIssueCoupons,
  handleRedeemCoupon,
} from './routes/coupons';

// Payments
if (path === '/api/buy' && method === 'POST') {
  const auth = await requireAuth(request, env);
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return handleBuyPack(request, env, auth.user);
}
if (path === '/stripe/webhook' && method === 'POST')
  return handleStripeWebhook(request, env, ctx);

// Coupons — admin server-to-server (ADAPT: remove if not using)
if (path === '/admin/coupons' && method === 'POST')
  return handleCreateCoupons(request, env);

// Coupons — admin UI
if (path === '/api/admin/coupons' && method === 'GET')
  return handleListCoupons(request, env);
if (path.startsWith('/api/admin/coupons/') && method === 'GET')
  return handleGetCoupon(request, env, path.split('/').pop()!);
if (path === '/api/coupons/issue'  && method === 'POST')
  return handleIssueCoupons(request, env);
if (path === '/api/coupons/redeem' && method === 'POST')
  return handleRedeemCoupon(request, env, ctx);
```

---

## Step 11 — API client

Merge `frontend/api_payments.ts` into the project's `ui/src/api.ts`:

- Update the `request<T>()` helper call to use the project's existing fetch
  wrapper (same pattern already used for other endpoints).
- Update the `AdminCoupon` import to the shared types path.
- If the project uses a single `api` object, add all methods to it rather than
  creating a separate `paymentApi` object.

---

## Step 12 — Frontend: buy + redeem sections

The buy and redeem UI can be integrated into an existing page (e.g. Dashboard)
or added as standalone sections.

**Option A — inline into an existing page** (preferred if there's already a
dashboard-style page):

Add the relevant `handleBuy` and `handleRedeemCoupon` logic directly to the
existing page, following the patterns in `BuyPacksSection.tsx` and
`RedeemCouponSection.tsx`. Also add a success/cancelled banner using the
`?purchase=success` / `?purchase=cancelled` query params Stripe returns.

**Option B — import as standalone components**:

Write `BuyPacksSection.tsx` and `RedeemCouponSection.tsx` from the templates
and import them into the target page.

In either case, adapt:
- `PACK_PRICES` to match the confirmed pricing.
- `COUPON_MAX_LENGTH` constant to match `COUPON_CODE_LENGTH`.
- `t()` keys or replace with hardcoded strings if i18n is not set up.

---

## Step 13 — Frontend: admin coupon pages

Write from the templates:
- `ui/src/pages/AdminCouponsPage.tsx`
- `ui/src/pages/CouponDetailPage.tsx`

Adapt:
- Update the `navigate` path for coupon detail (default: `/admin/coupons/:id`).
- Update `AdminCoupon` import path.
- Pass the `api` prop from the router or use a module-level import.
- Update `VALID_PACK_SIZES` and `MAX_COUPON_USES` imports to the shared
  constants location.
- Replace `t()` with hardcoded strings if i18n is not set up.

Add routes to the React Router config:

```tsx
{ path: '/admin/coupons',     element: <AdminCouponsPage api={api} /> },
{ path: '/admin/coupons/:couponId', element: <CouponDetailPage api={api} /> },
```

Protect these routes: only render them when `user.is_admin` is true.

---

## Step 14 — i18n keys

If `/i18n-setup` has been run, add these keys to `locales/en/dashboard.json`:

```json
{
  "buySessions": {
    "heading":       "Buy Sessions",
    "subtitle":      "Credits never expire.",
    "session":       "{{count}} session",
    "session_other": "{{count}} sessions",
    "redirecting":   "Redirecting…",
    "checkoutError": "Checkout failed. Please try again."
  },
  "coupon": {
    "heading":     "Redeem a Coupon",
    "placeholder": "XXXX-XXXX",
    "redeem":      "Redeem",
    "redeeming":   "Redeeming…",
    "success":     "{{count}} session added!",
    "success_other": "{{count}} sessions added!",
    "error":       "Failed to redeem coupon."
  },
  "adminCoupons": {
    "pageTitle":      "Coupon Management",
    "createHeading":  "Issue a Coupon",
    "listHeading":    "All Coupons",
    "noResults":      "No coupons yet.",
    "session":        "{{count}} session",
    "session_other":  "{{count}} sessions",
    "unrestricted":   "Any",
    "expired":        "Expired",
    "usageCount":     "{{used}} / {{max}}",
    "colCode":        "Code",
    "colPack":        "Pack",
    "colEmail":       "Email",
    "colStatus":      "Status",
    "colExpires":     "Expires",
    "colCreated":     "Created",
    "detailBack":     "← All Coupons",
    "detailPack":     "Pack",
    "detailMaxUses":  "Max Uses",
    "detailStatus":   "Status",
    "detailExpires":  "Expires",
    "detailCreated":  "Created",
    "detailRestrictedTo": "Restricted To",
    "detailRedemptions":  "Redemptions",
    "detailNoRedemptions": "No redemptions yet.",
    "detailColName":       "Name",
    "detailColEmail":      "Email",
    "detailColRedeemedAt": "Redeemed At"
  },
  "issueCoupon": {
    "packLabel":        "Pack Size",
    "maxUsesLabel":     "Max Redemptions",
    "expiresLabel":     "Expires",
    "emailLabel":       "Restrict to Email (optional)",
    "emailPlaceholder": "user@example.com",
    "issue":            "Issue Coupon",
    "issuing":          "Issuing…",
    "result":           "Generated code:",
    "error":            "Failed to issue coupon."
  }
}
```

---

## Step 15 — Environment variables and wrangler.toml

Add to `wrangler.toml`:

```toml
[vars]
# APP_URL already set by auth-setup — confirm it points to your domain

# No plaintext vars needed for Stripe — all secrets
```

Set secrets:

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put ADMIN_SECRET   # ADAPT: skip if not using /admin/coupons
```

### Stripe webhook registration

In the Stripe Dashboard → Developers → Webhooks, add an endpoint:
- URL: `https://yourdomain.com/stripe/webhook`
- Events to listen for: `checkout.session.completed`

Copy the webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET`.

For local development with stripe-mock:
```bash
# stripe-mock runs on port 12111 by default
STRIPE_BASE_URL=http://localhost:12111 npx wrangler dev
```

---

## Step 16 — Verify

1. **Buy flow**: Navigate to the buy section → click a pack → confirm redirect
   to Stripe Checkout → complete payment → confirm redirect to success URL →
   verify `session_packs` row created in DB.
2. **Webhook idempotency**: Send the same `checkout.session.completed` event
   twice → verify only one `session_packs` row exists (ON CONFLICT DO NOTHING).
3. **Coupon redemption**: Issue a coupon via admin UI → copy the code → redeem
   as a regular user → verify `session_packs` row with `amount_cents = 0`.
4. **Expired coupon**: Set `expires_at` to the past → attempt redemption →
   confirm 410 response.
5. **Email restriction**: Issue a coupon restricted to `other@example.com` →
   attempt redemption as a different user → confirm 403 response.
6. **Admin page**: Navigate to `/admin/coupons` as an admin user → confirm
   coupon list renders → click a coupon → confirm detail page shows redemptions.
7. **Non-admin guard**: Navigate to `/admin/coupons` as a regular user →
   confirm redirect or 403.

---

## Summary output

After completing all steps, output:

```
## payments-setup complete

Pack pricing: <list packs with sessions and prices>
Stripe webhook: POST /stripe/webhook (checkout.session.completed)
Routes added:
  POST   /api/buy
  POST   /stripe/webhook
  POST   /admin/coupons          (server-to-server, X-Admin-Secret)  [if enabled]
  GET    /api/admin/coupons
  GET    /api/admin/coupons/:id
  POST   /api/coupons/issue
  POST   /api/coupons/redeem
Frontend pages: BuyPacksSection, RedeemCouponSection, AdminCouponsPage, CouponDetailPage

Next steps:
- Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET via wrangler secret put
- Register webhook endpoint in Stripe Dashboard for checkout.session.completed
- Set ADMIN_SECRET if using the server-to-server coupon endpoint
```
