# /project-bootstrap

Meta-skill that layers production concerns onto an existing
Cloudflare Workers + Neon PostgreSQL + React/Vite project. Asks which skills
to run, then executes them in the correct dependency order.

Philosophy: **idea → prototype → productify**. Run this after you have a
working prototype and want to add production infrastructure in one swoop.

---

## Step 1 — Orient to the project

Before asking any questions, read:
1. `CLAUDE.md` (if present) — understand the product and any existing setup
2. `package.json` (root and `ui/` if separate) — identify installed deps
3. `wrangler.toml` — identify existing env vars and bindings
4. The DB schema file (e.g. `src/db/schema.sql`) if present — check for
   existing tables

Use this to pre-answer which skills are already applied (e.g. a `users` table
with `linkedin_id` means auth-setup is already done).

---

## Step 2 — Skill selection

Present this menu and ask the user to select which skills to layer in.
Mark any that appear already applied based on step 1.

```
Which production skills do you want to add?

  [ ] testing-setup     — Vitest + Workers pool, 80/80/80 coverage, ESLint, Prettier, husky, CI workflow
  [ ] i18n-setup        — i18next, 18 locales, Claude-powered translate script
  [ ] auth-setup        — OAuth (LinkedIn / Google / Microsoft), KV sessions
  [ ] payments-setup    — Stripe Checkout, session packs, coupon system
  [ ] compliance-setup  — GDPR consent, data export, SBOM, Termly policy pages
  [ ] analytics-setup   — PostHog event plan + instrumentation (backend + frontend)
```

Accept any combination. The user may type numbers, names, or "all".

---

## Step 3 — Dependency check and ordering

Apply these dependency rules regardless of what the user selected:

| Skill              | Requires                                              |
|--------------------|-------------------------------------------------------|
| `testing-setup`    | nothing (but knows about auth/payments if selected)    |
| `auth-setup`       | nothing                                                |
| `i18n-setup`       | nothing                                                |
| `payments-setup`   | `auth-setup` (needs User + sessions)                   |
| `compliance-setup` | `auth-setup` (needs User row), optionally `i18n-setup` |
| `analytics-setup`  | optionally `auth-setup` (for identify), `compliance-setup` (for consent gate), `payments-setup` (for payment events) |

If the user selected `payments-setup` without `auth-setup`, and auth is not
already set up in the project, warn:

> `payments-setup` requires `auth-setup` because it needs the User model and
> session middleware. I'll add `auth-setup` to the list.

Do not silently add it — tell the user and let them confirm.

Execution order when multiple skills are selected:
1. `testing-setup` (no dependencies — run first so every subsequent skill lands in a tested codebase)
2. `i18n-setup` (no dependencies, sets up namespace infra first)
3. `auth-setup` (users table and session middleware)
4. `payments-setup` (depends on User)
5. `compliance-setup` (depends on User, benefits from i18n namespaces)
6. `analytics-setup` (runs last — needs to know which other skills are in place to plan events and consent gating correctly)

---

## Step 4 — Gather all inputs upfront

Before executing any skill, collect all inputs for all selected skills in a
single conversation turn. List the questions grouped by skill so the user can
answer everything at once.

Reference each skill's "Step 1 — Gather inputs" section for the exact
questions. Do not repeat questions that have the same answer across skills
(e.g. `APP_URL` is asked once, used by multiple skills).

---

## Step 5 — Execute skills in order

Run each selected skill in sequence, completing one fully before starting the
next. For each skill:

1. Announce: `## Running /skill-name`
2. Execute all steps of that skill's SKILL.md using the inputs collected
   in step 4.
3. Output that skill's summary block before moving to the next.

Do not interleave steps from different skills.

---

## Step 6 — Final summary

After all skills complete, output a consolidated summary:

```
## project-bootstrap complete

Skills applied:
  ✓ i18n-setup        — 18 locales, translate script, audit script
  ✓ auth-setup        — LinkedIn OAuth, KV sessions
  ✓ payments-setup    — Stripe Checkout, 3 pack sizes, coupon system
  ✓ compliance-setup  — GDPR consent, data export, SBOM, Termly pages

Remaining manual steps (all secrets):
  npx wrangler secret put APP_SECRET          # auth-setup
  npx wrangler secret put LINKEDIN_CLIENT_ID  # auth-setup
  npx wrangler secret put LINKEDIN_CLIENT_SECRET
  npx wrangler secret put STRIPE_SECRET_KEY   # payments-setup
  npx wrangler secret put STRIPE_WEBHOOK_SECRET
  npx wrangler secret put ADMIN_SECRET        # payments-setup (if enabled)
  npx wrangler secret put SENDGRID_API_KEY    # compliance-setup
  npx wrangler kv namespace create SESSION_STORE   # auth-setup

Register in external dashboards:
  - OAuth redirect URIs (LinkedIn / Google / Microsoft developer console)
  - Stripe webhook: POST /stripe/webhook → checkout.session.completed
  - Termly: create policy pages, copy IDs into compliance page components
  - Canny: create board, add board token to CannyFeedback component
```

Tailor the summary to only include items for the skills that were run.
