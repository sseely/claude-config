# Self-improve Phase 2 — Agent E2: project-scaffolding skills (2026-10-08)

Scope: project-bootstrap, auth-setup, payments-setup, analytics-setup, compliance-setup,
i18n-setup, testing-setup, powerpoint-addin-setup, brand-knowvah (SKILL.md + linked references +
sampled templates). Read-only audit. Dedup'd against ~/.claude/code-review-tasks.md (F047 skipped;
F029/F049/F095/F103 etc. are marked fixed and re-checked only for regressions).

Version check (npm view, 2026-10-08): stripe latest 23.0.0 (skill pins 22.6.2); posthog-js 1.438.3
(pins 1.434.2); react-i18next 17.0.16 (pins 17.0.14); @anthropic-ai/sdk 0.132.1 (pins 0.127.0);
i18next 26.4.2 and tsx 4.23.15 current; @cloudflare/vitest-plugin 1.4.0 peer vitest "^4.1.0 || ^5.0.0".

Dimension notes common to all nine (details in cross-skill section): none spawn subagents (dim 5 N/A);
none cite any `rules/` file from SKILL.md (dim 9 restatement risk is instead *absence of linkage*);
all are sequential (dim 6); all have a resume/progress file (dim 7, strong) and Operational Readiness
(dim 8, strong for 7 of 9).

---

## project-bootstrap (205 lines)

**Strengths**: single input-gathering turn, explicit dependency table, stale-progress guard
(`repo_root`), fail-stop per sub-skill, cleanup of checkpoint file.

**Gaps**
- [Warning, 85] SKILL.md:130-138 — progress-file template lists `testing-setup` FIRST, then i18n,
  auth, ...; the same SKILL says (line 106-108) testing runs LAST and the template claims
  "(in execution order)". Step 0 resumes from "first unchecked", so a resumed run would execute in
  the wrong order. Quote: `- [ ] testing-setup` (l.135 region) vs "6. `testing-setup` (runs last".
- [Warning, 80] SKILL.md:87,108 vs auth-setup:429, payments-setup:420, compliance-setup:370,
  i18n-setup:236 — F029 fix moved testing-setup last, but every earlier sub-skill's "write tests"
  step imports `../helpers/db` (`truncateAll`, `createUserWithSession`) which only exists after
  testing-setup runs. Auth Step 15.0 / payments 16.0 / compliance 7.1 run `npx tsc --noEmit`, which
  fails on the missing module; fail-stop rule then halts the bootstrap at the first test-writing
  skill. Dependency table says testing-setup "requires nothing" — false for the other direction.
  Fix: split testing-setup into 3a (helpers + vitest config, run first with "unknown" answers) and
  3b (final bindings/CI, run last), or have bootstrap defer every `write-tests` step to a final
  pass after testing-setup. Needs a design decision.
- [Suggestion, 80] l.69 — "Vitest + Workers pool" is stale; testing-setup now uses
  `@cloudflare/vitest-plugin` (pool package is the "predecessor").
- [Suggestion, 70] l.5 — `allowed-tools` lacks WebFetch/WebSearch though every delegated sub-skill
  has a mandatory WebFetch "verify against current docs" step (auth 1b, payments 2b, analytics 4b,
  i18n 1b, testing 1b). Tool allowlist is per-skill invocation, so the inline sub-skill steps run
  under bootstrap's narrower list.
- [Note, 60] Step 5 does not say whether each sub-skill also writes its own `.X-progress.md`
  (their Step 1 mandates it) or only the bootstrap file is used; two checkpoint systems can
  disagree after a crash. State: sub-skills skip their own Step 0/1 progress file when invoked from
  bootstrap.
- [Note, 55] Loads ~2,500 lines of sub-skill text into one context (about 35k tokens) with no
  suggestion to compact between sub-skills or to delegate each to a fresh agent per sub-skill.

**Priority**: High (ordering/test-helper contradiction breaks the headline use case).
**Recommendation**: fix progress template order; resolve helper/ordering contradiction (see above);
add a per-sub-skill "run in a fresh subagent with the inputs block" option.
**Verdict leaning**: KEEP (trim 1-2 lines of menu text). Cheap (205 lines) orchestrator; value is
the ordering table.

---

## auth-setup (497 lines + 12 templates)

**Strengths**: Step 1b doc verification with URLs; Workers response-reuse gotcha documented twice
(l.~214 and l.~246 — duplicate, see below); timeouts present on OAuth fetches (`utils_oauth.ts:78,102`,
F049 fixed); constant-time state compare; tests shipped; structured `logger.ts`; rollback classified.

**Gaps**
- [Warning, 75] backend/utils_oauth.ts:25-45 + routes_auth.ts:199-205 — OAuth `state` is
  `<timestamp>.<HMAC(timestamp)>` with no binding to the browser (no state cookie, nonce, or PKCE).
  Any attacker can mint a valid state from `/auth/<provider>` and have a victim complete a callback
  carrying the attacker's code (login CSRF / session fixation to attacker account) within the 10-min
  window; states are also replayable. security.md "Authentication & Authorization". Fix: set a
  short-lived HttpOnly `oauth_state` cookie containing a random nonce, include the nonce in the
  signed state, compare on callback; add PKCE.
- [Warning, 90] SKILL.md:460,465 — Operational Readiness lists "Token refresh failure rate" and
  "all JWTs rejected ... token signing key", but the skill implements opaque KV sessions + an
  HMAC-signed state; there is no refresh flow and no JWT. Copy-paste drift from another template;
  an on-call engineer would chase non-existent metrics. Replace with `state_verify_failures`,
  KV `get` error rate, session-index growth.
- [Suggestion, 70] SKILL.md Step 9 and Step 10 both carry the identical ~6-line explanation of the
  module-scope `Response` pitfall — keep one.
- [Suggestion, 60] No per-step model routing (global Sonnet line only); fine here.
- [Note, 55] "Step 14b" is not in the progress checklist as a separate id (`write-tests` is) and the
  checklist ends at `verify` while the step is numbered 15 — step numbers vs checklist ids diverge
  (cosmetic).
- [Note, 50] api-design.md (not cited): templates return `new Response('Unauthorized')` and
  `{error}` without `message`.

**Priority**: Medium (state binding), Low (readiness drift).
**Recommendation**: add nonce-cookie binding to template + one step; rewrite the two readiness
bullets.
**Verdict leaning**: KEEP. Largest value-per-token of the set; trim duplicate gotcha paragraph.

---

## payments-setup (493 lines + references/i18n-keys.md + 15 templates)

**Strengths**: Stripe API verification step (2b); webhook idempotency via UNIQUE + ON CONFLICT;
environment gate on `STRIPE_BASE_URL` (F014 fixed); `try/catch` around session create (F050 fixed);
tests shipped for webhook/idempotency/signature; reference file correctly linked from Step 14.

**Gaps**
- [Warning, 65] backend/routes_payments.ts:140-160 — `checkout.session.completed` grants the pack
  without checking `session.payment_status === 'paid'`. With dynamic payment methods enabled on the
  Stripe account, delayed-notification methods emit `completed` with `payment_status: 'unpaid'`
  before funds clear; the credit is issued early and `async_payment_failed` is never handled. Add
  the `paid` check and handle `checkout.session.async_payment_succeeded`.
- [Warning, 60] routes_payments.ts:29 — Stripe client has no `timeout`/`maxNetworkRetries`; SDK
  default is 80 s, contradicting error-handling.md "External calls" (5 s sync default). Add
  `timeout: 10_000` (or env-configurable) and `maxNetworkRetries: 2`.
- [Suggestion, 65] SKILL.md:114 — `stripe@22.6.2` pinned while latest is 23.0.0 (major). The pin
  will rot; Step 2b already verifies docs. Either say `npm install stripe` and then read the pinned
  `apiVersion` (Step 2 already instructs to do that) or refresh the pin.
- [Suggestion, 55] `handleBuyPack` passes no Stripe `idempotencyKey`; double-click creates two
  sessions (retry-idempotency.md "Idempotency keys"). Cheap fix: `{ idempotencyKey: \`${user.id}:${pack}:${minuteBucket}\` }`.
- [Note, 50] `constants_payments.ts:6-9` references "the @ts-expect-error in routes_payments.ts
  must come back" — no such directive exists in the file now.
- [Note, 45] Defaults ($14/$37/$109, "live polling") are one product's pricing baked into a
  generic template (`routes_payments.ts` description string). Step 8 does say to adapt name only.

**Priority**: Medium. **Recommendation**: add `payment_status` guard + Stripe timeout (2 template
edits + 2 test cases).
**Verdict leaning**: KEEP. Trim: i18n-keys reference is fine (35 lines, loaded only when i18n ran).

---

## analytics-setup (466 lines + 4 templates)

**Strengths**: the only skill with an explicit research-then-approve gate (Step 3 event plan);
consent parameter on `captureEvent` is required (F041 fixed); events constant rule; no-consent test.
Best use of a planning step — this is the one place a stronger model (Opus, effort high) pays off.

**Gaps**
- [Warning, 85] SKILL.md:343-350 — Step 12 shows `const { capture } = useAnalytics();` inside the
  fetch-wrapper snippet. `useAnalytics` is a React hook (`AnalyticsContext.tsx:103`); `api.ts` is a
  plain module so this violates the Rules of Hooks and throws "Invalid hook call" at runtime. Needs
  a module-level `setAnalyticsCapture()` registration or `window.dispatchEvent` bridge, or
  instruct to wire `capture` from a component.
- [Warning, 80] SKILL.md:363 + :378,453 — Step 13 puts `POSTHOG_API_KEY = ""` in `wrangler.toml
  [vars]`, then tells the user to `wrangler secret put POSTHOG_API_KEY`. Wrangler rejects/overrides
  a secret that shares a name with a var (deploy error "binding name already in use" in current
  Wrangler). Also violates environment.md/security.md: key names suffixed `_KEY` are secrets, not
  vars. Remove it from `[vars]` (keep `POSTHOG_HOST`); declare in `.dev.vars.example`.
- [Warning, 75] backend/services_analytics.ts:50 — external `fetch` has no timeout
  (error-handling.md "External calls"); F049 fixed auth/SendGrid only. Fire-and-forget inside
  `waitUntil` still holds the isolate; add `signal: AbortSignal.timeout(1000)`.
- [Warning, 70] services_analytics.ts:62,67 — free-form `console.warn('[posthog]', ...)` (logging.md:
  structured JSON). Every other backend skill ships `logger.ts`; this one does not (F095 residual).
- [Warning, 60] frontend/AnalyticsContext.tsx:46-75 — consent subscription only ever calls `init()`
  on `analytics === true`; a later withdrawal never calls `posthog.opt_out_capturing()`/`reset()`.
  GDPR withdrawal of consent must stop capture. (This is the compliance-setup counterpart the
  skill claims to gate on.)
- [Suggestion, 80] SKILL.md:218 — `posthog-js@1.434.2` vs latest 1.438.3 (patch-level drift).
- [Note, 80] AnalyticsContext.tsx:21 — "see the skill's README/commit note" — there is no README in
  the skill; dangling reference.
- [Note, 55] Step 3 event plan template uses "rehearsal_mode"/"poll" vocabulary from the source
  project in what is meant to be a generic example (minor).

**Priority**: High (hook-in-module bug and var/secret collision are copy-paste-runtime failures).
**Recommendation**: fix the three Warning items in SKILL.md; add logger + timeout to the service.
**Verdict leaning**: KEEP; add a Step 3 routing note: "Opus/high for the event plan, Sonnet for
the rest" (the only step in this family where model choice changes output quality).

---

## compliance-setup (428 lines + 24 files)

**Strengths**: Step 1b verification of four external services; honest placeholders that THROW
(`generateR2PresignedUrl`, F039 fixed); transient vs terminal SendGrid classification (F190 fixed);
`on-call:` comment in `sbom_cron.ts:121`; IRREVERSIBLE marker; migrations idempotent; tests for me/sbom.

**Gaps**
- [Warning, 85] SKILL.md:6 — `allowed-tools: Read, Write, Edit, Bash, Glob, Grep` but Step 1b
  (l.~77-104) requires WebFetch of four URLs. Every sibling that has an "X docs" step lists
  WebFetch/WebSearch. Step cannot run as designed (or silently gets skipped).
- [Warning, 80] SKILL.md:300-312 — Step 4f tells the user to add `R2_ACCESS_KEY_ID = ""`,
  `SENDGRID_API_KEY = ""` to wrangler.toml `[vars]`. These are secrets (security.md "Secrets",
  environment.md `_KEY` suffix); a `vars` entry plus a later `wrangler secret put` collides, and the
  `R2_SECRET_ACCESS_KEY` the cron requires (`sbom_cron.ts:5-6,96`) is not mentioned anywhere in the
  SKILL.md steps at all. Move all four to `wrangler secret put` + a Remaining-manual-steps list.
- [Warning, 85] i18n footer-key collision across three skills — compliance `i18n/en_auth_consent.json`
  `login.footer = {privacy:"Privacy Policy", terms:"Terms", cookies:"Cookie Policy"}`;
  auth-setup Step 13 `{privacy:"Privacy Policy", terms:"Terms of Service", cookies:"Cookie Policy"}`;
  brand-knowvah Step 15 `{privacy:"Privacy", terms:"Terms", cookies:"Cookies"}`. Same keys, three
  different English values, and Step 5's "do not overwrite existing keys" rule makes the winner
  depend on run order. Pick one owner (compliance-setup) and have auth/brand reference it.
- [Warning, 55] Test coverage gap vs testing.md 90/90/90: shipped tests cover `routes_me` and
  `routes_sbom` only. `routes_feedback.ts`, `sbom_cron.ts` (the most branch-heavy file), and
  `services_audit.ts` have none; testing-setup's 90% threshold applies to `src/**/*.ts`, so a
  freshly bootstrapped project's `test:coverage` fails CI. Step 7.3 even runs `test/feedback.test.ts`
  (l.393) which no step creates.
- [Suggestion, 60] SKILL.md:~212 — the IRREVERSIBLE note is a bare `//` comment in prose, not in a
  code block; it renders as stray text. Put it in a blockquote.
- [Suggestion, 55] Step 0 says "Skip Steps 1–2" while the checklist names `verify-external-docs`
  (Step 1b) — resume can skip the docs check.
- F047 (routes_sbom.ts race) already tracked — not re-reported.

**Priority**: High (allowed-tools + vars-secrets). **Recommendation**: 3 one-line SKILL.md edits
plus a shared footer-key owner.
**Verdict leaning**: KEEP, trim the 4a-4f frontend wiring prose by pointing at templates' ADAPT
comments (~30 lines).

---

## i18n-setup (374 lines + 12 files)

**Strengths**: single-source `SUPPORTED_LANGUAGES` isomorphic module; `check-namespaces.ts` guard for
the three-file drift risk; route test shipped; translate script has inline `withRetry` honoring
Retry-After; graceful skip when `ANTHROPIC_API_KEY` is missing; resumable (generate step left `[ ]`).

**Gaps**
- [Warning, 70] scripts/translate.ts:175 — default model `claude-opus-4-8` for bulk UI-string
  translation: Opus for routine, high-volume work is the model-routing.md "Opus for trivial edits"
  anti-pattern (5-10x cost); 17 locales x N namespaces. Default to `claude-sonnet-5-5`; allow
  override via `ANTHROPIC_MODEL` (already supported). Also the pinned default is not the current
  `opus` alias target (`claude-opus-5-5`).
- [Suggestion, 65] translate.ts:31-47 — hand-rolled `withRetry` wraps `client.messages.create`, but
  the Anthropic SDK retries 429/5xx twice by default (up to 3 x 3 = 9 attempts total) and its error
  objects carry a `Headers` instance, so `headers?.['retry-after']` (record lookup) never matches.
  Prefer `new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 })` and drop the copy (also removes
  a restated copy of docs/reference/retry-idempotency.md that can drift). `timeout` is also unset
  (error-handling.md).
- [Suggestion, 80] SKILL.md:103-104 — `react-i18next@17.0.14`, `@anthropic-ai/sdk@0.127.0` behind
  current (17.0.16, 0.132.1); i18next and tsx current.
- [Suggestion, 55] Step 12 "Summarise" appears after Step 11 "Verify" but Operational Readiness is
  wedged between them (l.~290-320); readers following numbers miss it. Cosmetic.
- [Note, 45] Locale count is hard-coded as "18"/"17" in four places in SKILL.md and bootstrap; will
  drift if `SUPPORTED_LANGUAGES` changes.

**Priority**: Medium. **Recommendation**: switch translate default to Sonnet; use SDK retry.
**Verdict leaning**: KEEP (trim ~20 lines of duplicated per-step "mark ... in progress" boilerplate).

---

## testing-setup (437 lines + 6 templates)

**Strengths**: thresholds now 90/90/90/90 in `config/vitest.config.ts:104-109` (F103 fixed);
Istanbul explanation; per-project port variables; shared-state option; docs-verification step with
the predecessor-API warning; helpers directory matches testing.md (`test/helpers/db.ts`).

**Gaps**
- [Warning, 90] SKILL.md:140-145 and config/vitest.config.ts:1-12 — claim "vitest 5 is not yet
  supported by either" and pin `vitest@^4.1.0`. `npm view @cloudflare/vitest-plugin peerDependencies`
  (v1.4.0, published today) = `vitest "^4.1.0 || ^5.0.0"`; vitest 5.0.3 is `latest`. Stale
  claim, repeated in two files; also contradicts the new-install default by capping at the
  previous major. Remove the cap or re-verify `@vitest/coverage-istanbul` peer ranges first.
- [Warning, 80] SKILL.md Step 12 vs config/vitest.config.ts:104-109 — Step 12 adds a single
  bootstrap test "to avoid the CI workflow failing immediately", but the 90% thresholds make
  `npm run test:coverage` exit non-zero on that lone test, and ci.yml:72 runs exactly that command.
  Step 13.4 says "if below 90/90/90 ... don't fail the setup" yet CI is red on first push. Either
  gate thresholds behind `COVERAGE_ENFORCE` / ratchet, or state that CI will be red until tests land
  (the i18n skill does state its equivalent).
- [Warning, 80] test/globalSetup.ts (migration loop, ~l.57-62) — `spawnSync('psql', [... '-f',
  migration], { stdio: 'pipe' })` ignores `status`; a failed migration is silently swallowed and the
  suite then fails with misleading "relation does not exist" errors (error-handling.md: no silent
  swallow). Check `status !== 0` and surface stderr. Also re-applies every migration on each run, so
  non-idempotent migrations break the second run (F-note: compliance templates are idempotent,
  others untested).
- [Suggestion, 65] vitest.config.ts coverage `include: ['src/**/*.ts']` — frontend `ui/src` is
  excluded from the "90/90/90" the summary advertises (and ESLint/Prettier cover it). State the
  scope in the SKILL.md summary or add a `ui` vitest project.
- [Suggestion, 50] ci.yml: `STRIPE_*`/`SESSION_STORE` bindings in vitest.config are unconditional
  in the template; Step 4 handles via ADAPT, but Step 1 Q2 "remove if No" is the only guard.
- [Note, 45] husky `lint-staged` runs only `prettier --write` — ESLint is not in pre-commit
  despite the "ESLint + husky" description (CI/`npm test` covers lint).

**Priority**: High (stale vitest cap, CI-red-on-first-push).
**Recommendation**: update the cap; make globalSetup fail loudly; resolve threshold/CI contradiction.
**Verdict leaning**: KEEP. Foundational — other skills' tests depend on its helpers.

---

## powerpoint-addin-setup (431 lines + 7 templates)

**Strengths**: the "everyone forgets the HTTPS cert" step with troubleshooting; manifest docs check
(1b) and unified-vs-XML manifest awareness; Office.onReady ordering called out; clear `wef` sync.

**Gaps**
- [Suggestion, 65] SKILL.md:137,153 — instructs the agent to run `npx office-addin-dev-certs install`,
  which installs a root cert into the OS trust store (password prompt, security-setting change).
  Under the repo's safety posture an agent must not do that unprompted; Step 3 should be framed as a
  user-run command ("run this in your own terminal") with `verify` as the agent-run part.
- [Suggestion, 60] wef sync is macOS-only (`uname -s` = Darwin); Windows (`%LOCALAPPDATA%` sideload
  folder / network share) and web sideload are not covered though the cert section mentions Windows.
- [Suggestion, 55] templates/onebox_addin_snippet.sh and Step 10 fallback script: with `set -euo
  pipefail`, `cleanup` references `$VITE_PID` which is unset until Vite starts; an early INT/EXIT
  trips `unbound variable`. Initialise `VITE_PID=""` before the trap.
- [Suggestion, 50] Manifest: only XML (`OfficeApp`) is templated; Step 1b only says "confirm". Record
  which manifest type was chosen and why (unified manifest GA for PowerPoint) so the skill does not
  quietly become legacy.
- [Note, 50] No tests step (UI scaffold) — acceptable per testing.md exceptions ("UI markup").

**Priority**: Low. **Recommendation**: reword Step 3, init `VITE_PID`.
**Verdict leaning**: KEEP but trim (~431 lines for a niche; compress Steps 4/6/7 file-tree and
placeholder blocks, ~60 lines). If never used for a second add-in, MERGE-candidate into a reference
folder, but low token cost since disable-model-invocation=true.

---

## brand-knowvah (498 lines + references/vitepress-docs-site.md 184 lines + 11 assets)

**Strengths**: two paths separated cleanly (App steps 2-16 / docs-site D0-D6 in a reference);
D6 has executable assertions instead of eyeballing; registry-split rationale recorded with date;
checklists match (`d1-registry ... d6-verify` identical in SKILL.md and reference — no drift found);
Operational Readiness includes the docs failure modes.

**Gaps**
- [Warning, 85] SKILL.md:376 — `npm run i18n:translate`; i18n-setup defines the script as
  `translate` (`i18n-setup/SKILL.md:204`). The "(if the translate script exists)" hedge hides it —
  the check will always say "no". Use `npm run translate`.
- [Warning, 75] SKILL.md Step 9 — only the Canny link is removed when compliance-setup was not run;
  `Layout.tsx:51-53` still renders links to `ROUTES.PRIVACY_POLICY/TERMS/COOKIE_POLICY` that exist
  only if compliance-setup ran (Step 6 also keeps those routes "only if compliance-setup was run").
  Result: broken `<Link>` + undefined constants and a tsc failure. Add: remove the three policy links.
- [Warning, 85] i18n footer value collision with auth-setup/compliance-setup (see compliance).
- [Warning, 65] SKILL.md:327-331 — Step 14 "Configure Tailwind ... `tailwind.config.ts` includes
  `ui/src/**` glob" is Tailwind v3 guidance; the skill's own intro says v4 and `ui/index.css:1` uses
  `@import "tailwindcss"` (v4 auto-detects sources, no config file). Replace with a v4 check
  (`@tailwindcss/vite` plugin present; add `@source` only for outside-root paths).
- [Suggestion, 70] allowed-tools lacks WebFetch although the shared "WebFetch verification" routing
  line is present and D1 uses `npm view ... --registry=...` (Bash is fine). Not blocking.
- [Suggestion, 60] Sidebar.tsx real CCN is ~13 (T28 note: lizard mis-parse masked it) — template
  violates the repo's own 10-CCN hook; extract nav/credits/admin sub-components. Template is a
  product-specific component (credits badge, admin) scaffolded into every app.
- [Suggestion, 55] Directory hygiene: `brand-knowvah/.mcp.json` (absolute path to a personal serena
  checkout and the skill dir) and `.serena/`, `.agent-notes/` are present on disk (F102 noted;
  `.mcp.json` is not git-tracked but is not in the skill's .gitignore either — verify it cannot be
  committed).
- [Suggestion, 50] `npm install posthog-js` unpinned here vs pinned 1.434.2 in analytics-setup —
  inconsistent versions in a bootstrapped project.
- [Note, 50] D-path is pnpm-specific and calls out one source repo ("dot-atlassian"); good
  provenance, but D1 grep checks assume pnpm lockfile format.

**Priority**: Medium. **Recommendation**: fix the three concrete mismatches (translate script
name, policy links, Tailwind v4).
**Verdict leaning**: KEEP, but SPLIT: move the React-app path into `references/react-app.md` like the
docs path, leaving a ~60-line router SKILL.md (it is two independent skills in one file; F104
already flagged size, now 498 lines only because the docs path was extracted).

---

## Cross-skill patterns

1. **Boilerplate duplication (performance per token)**: Step 0 resume block (~20 lines), cleanup
   block (~5 lines), stale-progress text, and ~60 "On success, mark `- [x] X` in `.Y-progress.md`"
   lines are copy-pasted across all nine (about 330 lines, roughly 4-5k tokens per bootstrap run
   and every maintenance edit must be made 9 times — they have already diverged: payments says
   "Skip Steps 1 entirely", others "Steps 1-2", brand says "Steps 1-2" though only Step 1 exists
   before the checklist). Extract to `skills/_shared/progress-protocol.md` (read once by
   bootstrap) and replace the per-step "mark" lines with one sentence. Estimated saving: ~250
   lines. All nine are `disable-model-invocation: true`, so zero resident-context cost; savings are
   per-invocation only.
2. **Rules linkage is absent in SKILL.md**: none cites `rules/*.md`. Behaviors that mirror rules
   (timeouts, retry, structured logs, 90/90/90) are implemented in templates, so they drift
   silently (e.g. vitest-5 cap, analytics fetch without timeout, free-form logs). Add one line per
   skill: "Templates follow rules/error-handling.md, logging.md, security.md; do not weaken."
3. **Shared uniform routing line** ("Model routing: Sonnet for implementation steps; WebFetch
   verification steps need no routing.") is identical in all nine, and appears even where the skill
   has no WebFetch (compliance, brand, bootstrap). Only analytics Step 3 (event plan) and
   project-bootstrap Step 4 (input synthesis) have a real routing decision; everything else is
   mechanical templating where Sonnet (or Haiku for the pure-copy steps) is right. Replace the line
   with per-step overrides only where they exist.
4. **Version pins in SKILL.md rot**: stripe, posthog-js, react-i18next, @anthropic-ai/sdk, vitest
   all behind or capped incorrectly within weeks, while a docs-verification step already exists.
   Prefer "install latest, then record version" over literal pins, or add a pin-check line to the
   self-improve routine.
5. **Template defaults vs rules**:
   - testing.md 90/90/90: thresholds correct (90 lines/functions/branches/statements), but shipped
     scaffolding includes untested files (compliance feedback/sbom_cron/audit, payments
     utils_code_generation, auth utils_oauth, all frontend) -> CI red on first run; no TDD ordering
     (templates ship implementation first, tests as a final step) contrary to testing.md TDD.
   - security.md: secrets in `[vars]` (analytics, compliance); OAuth state not browser-bound;
     generic error bodies mostly OK (no stack leaks found; `err.message` only logged).
   - logging.md: structured JSON logger exists in auth/payments/compliance (identical file, three
     copies differing only by SERVICE_NAME, none with `trace_id` which is required for request
     contexts); analytics and tests use free-form console.warn. Consolidate into one shared
     `logger.ts` with request-scoped child (`trace_id`, `method`, `path`).
   - error-handling.md: timeouts present on OAuth + SendGrid; missing on PostHog capture, Stripe
     client, Anthropic client, and browser fetches (AuthContext, api_payments, persistLanguage).
   - retry-idempotency.md: SendGrid 4xx/5xx classification correct; Stripe webhook idempotent;
     Stripe checkout create has no idempotency key; translate.ts duplicates the reference
     implementation and stacks on SDK retries.
   - api-design.md (not cited, noted): error shapes vary (`{error}`, plain text) vs `{error,message}`.
6. **Cross-skill ownership conflicts**: i18n footer keys (auth/compliance/brand); `APP_URL`;
   `src/logger.ts` (three templates, "merge" instructions only); `ROUTES` constants (compliance 4e
   vs brand Step 6); wrangler.toml var/secret naming (analytics, compliance). Declare one owner per
   artifact in a table in project-bootstrap.
7. **Parallelism (dim 6)**: every skill says "Read all template files" then writes serially. One
   multi-Read call (same message) and, where write-sets are disjoint (backend vs frontend vs
   i18n JSON), a two-agent split would cut wall-time; but token cost multiplier (parallelism.md
   ~15x) is not justified for ~15 small files. Recommend only: batch the template Reads in one
   response; do not add subagents.
8. **Tool allowlists**: compliance-setup (WebFetch needed), project-bootstrap (delegates WebFetch
   steps), brand-knowvah (no docs step) — align allowed-tools to the steps actually present.
9. **Verification step (dim 4)** is strong: every skill ends with `tsc --noEmit` + functional
   checks and a fail-stop policy. Weak spots: compliance `verify` only runs tests that may not
   exist; brand-knowvah verify has no automated check (manual visual only) outside the D-path.
10. **Operational Readiness (dim 8)**: present in 8/9; project-bootstrap has none (it only
    orchestrates; fine). Drift risk concentrated in auth-setup (JWT/refresh text).

## Verdict summary (performance per token)

| Skill | Lines | Verdict leaning | One-line reason |
|---|---|---|---|
| project-bootstrap | 205 | KEEP | Cheap orchestrator; fix order template + helper-dependency contradiction |
| auth-setup | 497 | KEEP (trim) | High value; fix state binding, readiness drift, duplicate gotcha text |
| payments-setup | 493 | KEEP | Strong idempotency; add payment_status guard + Stripe timeout |
| analytics-setup | 466 | KEEP | Only real planning step; fix hook-in-module, var/secret clash |
| compliance-setup | 428 | KEEP (trim) | Valuable GDPR/CRA scope; fix tools, secrets-in-vars, tests |
| i18n-setup | 374 | KEEP | Good guards; switch translate model/retry |
| testing-setup | 437 | KEEP | Foundation; fix stale vitest cap and first-CI-red |
| powerpoint-addin-setup | 431 | TRIM | Niche; compress scaffolding prose; reframe cert install as user-run |
| brand-knowvah | 498+184 | SPLIT | Two independent skills in one file; move React path to a reference |
| (shared boilerplate) | ~330 lines | MERGE | Extract Step 0 / cleanup / mark-lines into one shared protocol file |
