# /analytics-setup

Figure out what to instrument in PostHog for a Cloudflare Workers + Neon +
React/Vite project, then wire up the infrastructure and implement the events.

The hard part is the event plan — reading the product and deciding *what matters*
before writing any code. This skill produces a recommended event plan, presents
it for review, then implements it.

---

## Step 1 — Gather inputs

Ask these before doing any work:

1. **Has `compliance-setup` been run?** — determines whether PostHog must be
   gated behind Termly cookie consent. Yes/No.
2. **Has `auth-setup` been run?** — determines whether `identify()` can use
   the session-backed user object. Yes/No.
3. **Has `payments-setup` been run?** — confirms whether payment events should
   be included. Yes/No.
4. **What is the core user action?** — in one sentence, what does a user do
   that makes this product valuable? (Examples: "run a live poll", "submit a
   form", "generate a report"). This anchors the funnel.
5. **What questions do you most want to answer about user behaviour?** — free
   text. Examples: "Why do users drop off before starting their first poll?",
   "Which plan size do power users buy first?", "How often do users return?"
6. **Are there multiple channels users come from?** (add-in, web, email link,
   referral) — used to recommend `utm_source` / `$referrer` properties.

---

## Step 2 — Read the project

Read the following to build a map of user actions before producing the event
plan. Do not skip this step — the event plan must be grounded in the actual
routes and pages, not guesses.

**Backend — read all route files** (`src/routes/*.ts`):
- For each HTTP handler: note the method, path, what it does, and whether a
  logged-in user is required.
- Mark handlers that represent meaningful user intent (creating, starting,
  closing, sharing, purchasing) vs. infrastructure (health checks, webhooks,
  token exchange).

**Frontend — read all page components** (`ui/src/pages/*.tsx`):
- Note what UI actions (button clicks, form submits, navigation) trigger API
  calls or represent user intent.
- Note where the user is in the product journey (onboarding, core loop,
  monetization, sharing).

**Existing instrumentation** — check if `captureEvent` or `posthog.capture`
already exists anywhere. If so, list what's already covered so the plan only
adds what's missing.

**Shared constants** — check if `AnalyticsEvent` already exists. If so, read
it to understand the current vocabulary.

---

## Step 3 — Produce the event plan

Using the product understanding from step 2 and the answers from step 1,
produce a structured event plan. Present this for review **before writing any
code**.

### Event plan format

```
## Analytics Event Plan

### Funnel
<Describe the core user journey in 3-5 steps, e.g.:
  1. Sign up → 2. Create item → 3. Start item → 4. Share result>

### Identify call
When: <on login / on session restore>
Properties to set on the user profile:
  - <trait>: <why it's useful for segmentation>
  - ...

### Events

| Event name (constant)    | Trigger                        | Properties                          | Why it matters                        |
|--------------------------|--------------------------------|-------------------------------------|---------------------------------------|
| user_signed_up           | OAuth callback, new user only  | { oauth_provider }                  | Acquisition channel mix               |
| <core_action>_created    | POST /<route>                  | { <shape>, rehearsal_mode? }        | Funnel entry                          |
| <core_action>_started    | PUT /<route>/start             | { <relevant_counts> }               | Activation                            |
| <core_action>_completed  | PUT /<route>/close             | { participant_count, ... }          | Core value delivered                  |
| report_generated         | After completion               | { item_id }                         | Value confirmation                    |
| payment_completed        | Stripe webhook                 | { pack_size, amount_cents }         | Revenue                               |
| $pageview                | Route change                   | { $current_url }                    | Navigation funnel                     |
| api_error                | HTTP ≥400 response             | { status, path, method }            | Error visibility                      |

### Events NOT recommended
<List actions that could be tracked but aren't worth the noise — e.g.
button hovers, intermediate form steps, admin-only actions.>

### Properties to add to existing events
<If the project already has events, note where properties are thin
and what should be added. E.g. "EVENT_CLOSED currently sends no
properties — add { poll_count, total_participants }.">

### Questions this plan answers
- <Q from step 1 Q5> → answered by <event(s)>
- ...

### Questions this plan cannot answer yet
- <What would require additional instrumentation or a separate tool>
```

Wait for explicit approval of the event plan before proceeding.

---

## Step 4 — Read the template files

After the plan is approved, read all templates:

- `backend/services_analytics.ts`
- `frontend/AnalyticsContext.tsx`
- `frontend/PageViewTracker.tsx`
- `shared/constants_analytics.ts`

---

## Step 5 — Install PostHog

```bash
# Frontend only — backend uses fetch directly, no SDK needed
npm install posthog-js
```

Check `ui/package.json` first; skip if already installed.

---

## Step 6 — Backend analytics service

If `src/services/analytics.ts` (or equivalent) doesn't exist, write it from
`backend/services_analytics.ts`. No adaptation needed — the function is
generic.

Update the `Env` interface (`src/types.ts`) with:

```typescript
POSTHOG_API_KEY?: string;
POSTHOG_HOST?:   string;
```

---

## Step 7 — AnalyticsEvent constants

If `AnalyticsEvent` doesn't exist, create it in the shared constants file
(e.g. `shared/constants.ts` or `shared/constants_analytics.ts`) from
`shared/constants_analytics.ts`, replacing the placeholder events with the
exact events from the approved plan.

If `AnalyticsEvent` already exists, add missing events from the plan to it.

**Rule:** Every event name used in any `captureEvent()` or `posthog.capture()`
call must be a key in `AnalyticsEvent`. No raw string literals at call sites.

---

## Step 8 — Frontend analytics context

Write `ui/src/contexts/AnalyticsContext.tsx` from `frontend/AnalyticsContext.tsx`,
adapting:

- If `compliance-setup` was **not** run (step 1 Q1 = No): replace the
  Termly consent block with a direct `init()` call in `useEffect`.
- If `compliance-setup` **was** run: keep the Termly consent gate as-is.

---

## Step 9 — PageViewTracker

Write `ui/src/components/PageViewTracker.tsx` from `frontend/PageViewTracker.tsx`.
No adaptation needed.

---

## Step 10 — Wire into the app root

Find the app root (`ui/src/main.tsx` or `ui/src/App.tsx`) and:

1. Wrap the router with `<AnalyticsProvider>`.
2. Place `<PageViewTracker />` inside the router (so it has access to
   `useLocation`), outside any route-specific components.
3. If `auth-setup` is in place, add an `identify()` call when the user loads:

```tsx
const { user } = useAuth();
const { identify, reset } = useAnalytics();

useEffect(() => {
  if (user) {
    identify(user.id, {
      // ADAPT: add traits that are useful for segmentation
      // created_at: user.created_at,
      // is_admin: user.is_admin,
    });
  }
}, [user]);
```

Also call `reset()` on sign-out so the PostHog identity is cleared.

---

## Step 11 — Implement backend events

For each backend event in the approved plan, find the appropriate route handler
and add a `captureEvent()` call. Follow this pattern:

```typescript
import { captureEvent } from '../services/analytics';
import { AnalyticsEvent } from '../../shared/constants';

// Inside the handler, after the primary DB write succeeds:
captureEvent(
  env,
  user.id,              // distinct_id
  AnalyticsEvent.ITEM_STARTED,
  { rehearsal_mode: body.rehearsal_mode, item_count: items.length },
  ctx                   // pass ctx when available
);
```

Rules:
- Call `captureEvent` **after** the primary operation succeeds, never before.
- Always pass `ctx` when the handler receives it — this prevents premature
  Worker shutdown cutting off the fetch.
- Never `await` the call — fire and forget.
- If the event is on a webhook (e.g. Stripe), `ctx` may not be available;
  the `.catch(() => {})` in the service handles this safely.

---

## Step 12 — Implement frontend events

For each frontend event in the approved plan, find the relevant component or
API client location and add a `capture()` call via `useAnalytics()`.

**API error tracking** — add to the fetch wrapper (if one exists):

```typescript
const { capture } = useAnalytics();

// In the error branch of the fetch wrapper:
if (!res.ok) {
  capture(AnalyticsEvent.API_ERROR, {
    status: res.status,
    path:   url,
    method: init?.method ?? 'GET',
  });
}
```

---

## Step 13 — Environment variables

**Backend — `wrangler.toml`:**

```toml
[vars]
POSTHOG_API_KEY = ""          # leave blank locally; set in production
POSTHOG_HOST = "https://us.i.posthog.com"
```

**Frontend — `ui/.env.example`** (create if missing):

```env
# PostHog analytics (optional — omit to disable)
VITE_POSTHOG_API_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

**Set production values:**

```bash
npx wrangler secret put POSTHOG_API_KEY
# POSTHOG_HOST usually stays in [vars] unless using a self-hosted instance
```

For the frontend, set `VITE_POSTHOG_API_KEY` in your hosting provider's
environment variables (Cloudflare Pages, Vercel, etc.) — it is baked in at
build time, not a secret.

---

## Step 14 — Verify

1. Open the app locally and perform the core action (create → start → complete
   an item). Check PostHog Live Events — confirm events arrive with the
   expected properties.
2. Sign in → confirm `identify()` call appears in PostHog with the user ID.
3. Navigate between routes → confirm `$pageview` fires on each change.
4. Trigger an API error (e.g. call a protected route without a session) →
   confirm `api_error` appears.
5. If compliance-setup is in place, confirm that events do NOT fire before
   analytics consent is given in the Termly banner.

---

## Summary output

```
## analytics-setup complete

### Event plan implemented
| Event                   | Trigger location                 | Properties                        |
|-------------------------|----------------------------------|-----------------------------------|
| <event>                 | <file:handler>                   | { <props> }                       |
| ...

identify(): called on login/session restore, traits: { <list> }
$pageview:  PageViewTracker, fires on every route change
api_error:  api.ts fetch wrapper, status ≥ 400

Infrastructure:
  src/services/analytics.ts      — backend captureEvent (fire-and-forget)
  ui/src/contexts/AnalyticsContext.tsx — React context, consent-gated: <yes/no>
  ui/src/components/PageViewTracker.tsx

Next steps:
  - Set POSTHOG_API_KEY via: npx wrangler secret put POSTHOG_API_KEY
  - Set VITE_POSTHOG_API_KEY in your frontend hosting env vars
  - In PostHog: create a funnel from <event_1> → <event_2> → <event_3>
  - In PostHog: create a retention chart on <core_action>_completed
```
