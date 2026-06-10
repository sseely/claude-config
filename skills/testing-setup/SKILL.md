---
name: testing-setup
description: Scaffold Vitest with the Cloudflare Workers pool, Istanbul coverage, ESLint, Prettier, husky pre-commit hooks, shared test helpers, Docker Compose for local services, and a GitHub Actions CI workflow into a Cloudflare Workers + Neon + React/Vite project.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# /testing-setup

Model routing: Sonnet for implementation; Haiku for verification/scoring; Opus only for explicit architectural decisions.

Scaffold testing infrastructure into a Cloudflare Workers + Neon PostgreSQL +
React/Vite project. Installs Vitest with the Workers pool, 80/80/80 coverage
thresholds, Istanbul coverage (v8 is incompatible with Workerd), ESLint with
TypeScript and React Hooks rules, Prettier, husky pre-commit hooks, shared
test helpers with fixture builders, Docker Compose for local services, and a
GitHub Actions CI workflow.

---

## Step 0 — Resume check

Before doing anything else, check whether `.testing-setup-progress.md` exists
in the working directory.

**If it exists:**
1. Read it.
2. If `collected_inputs: true` is present, extract the stored inputs — do not
   re-ask any question whose answer is already recorded.
3. Find the first step checkbox that is still `[ ]` (unchecked).
4. Print: `Resuming from [step name].`
5. Skip Steps 1–2 entirely and jump directly to the first unchecked step.

**If it does not exist:** continue to Step 1 as normal.

---

## Step 1 — Gather inputs

Ask all of the following before doing any work:

1. **Does the project use PostgreSQL?** (Neon or otherwise) — determines
   whether `globalSetup.ts` and Docker Compose are needed. Yes/No.
2. **Does the project use Stripe?** (from `payments-setup`) — determines
   whether `stripe-mock` goes in Docker Compose and CI, and whether
   `STRIPE_BASE_URL` and Stripe bindings go in `vitest.config.ts`. Yes/No.
3. **Does the project use KV?** (from `auth-setup`) — determines what goes
   in `miniflare.kvNamespaces`. If yes, list the binding names.
4. **Does the project use Durable Objects?** — determines `isolatedStorage`
   in the Vitest config. If yes, do the DOs write state that must be isolated
   per test? Yes/No.
5. **Is there a Python service?** — determines whether the CI workflow needs
   a `python-tests` job. If yes, what is the path to the service and its
   `requirements.txt`?
6. **Has `i18n-setup` been run?** — determines whether the `i18n-audit`
   CI job is included. Yes/No.
7. **What env vars need test values?** List any project-specific bindings
   beyond the standard ones (DB, Stripe, KV). Provide placeholder values if
   secrets — they can be filled in later.
8. **What tables exist in the schema?** — used to write the `TRUNCATE`
   statement in `truncateAll()`. Provide the table names in dependency order
   (children before parents), or say "read it from the schema file".
9. **DB credentials for local dev** — used in Docker Compose, `globalSetup.ts`,
   and the `DATABASE_URL` default. (default: user=dev, password=devpass,
   db=myapp — confirm or change)

After all questions are answered, write `.testing-setup-progress.md` in the
working directory before doing any further work:

```
# Testing-Setup Progress
collected_inputs: true

## Inputs
<record each collected input as a key: value line>

## Steps
- [ ] install-dependencies
- [ ] vitest-config
- [ ] global-test-setup
- [ ] test-helpers
- [ ] docker-compose
- [ ] eslint
- [ ] prettier-and-husky
- [ ] package-json-scripts
- [ ] github-actions-ci
- [ ] bootstrap-test-file
```

---

## Step 2 — Read the template files

Read all templates before writing any code:

- `config/vitest.config.ts`
- `config/eslint.config.mjs`
- `test/globalSetup.ts`
- `test/helpers/db.ts`
- `docker/docker-compose.yml`
- `github/ci.yml`

Also read the project's existing `package.json` and `wrangler.toml` to
understand what's already installed and what env var names to use.

---

## Step 3 — Install dependencies

```bash
# Test runner and Workers pool
npm install --save-dev vitest @cloudflare/vitest-pool-workers @vitest/coverage-istanbul

# ESLint
npm install --save-dev eslint typescript-eslint eslint-plugin-react-hooks

# Formatter and pre-commit hooks
npm install --save-dev prettier husky lint-staged

# PostgreSQL client for test helpers (if using PostgreSQL)
npm install --save-dev pg @types/pg
```

After installing, check if `@cloudflare/vitest-pool-workers` is already
present — skip that package if so. Same for ESLint if an `eslint.config.*`
already exists.

On success, mark `- [x] install-dependencies` in `.testing-setup-progress.md`.

---

## Step 4 — Vitest config

Write `vitest.config.ts` at the project root from `config/vitest.config.ts`,
adapting:

- Update `miniflare.bindings` to include only the env vars confirmed in step 1.
  Use the same binding names as `wrangler.toml` — miniflare overrides those
  values during tests.
- Update `miniflare.kvNamespaces` with the binding names from step 1 Q3.
  Remove the array if there are no KV namespaces.
- Set `isolatedStorage: true` if step 1 Q4 said DOs write state.
  Leave `false` if DOs are stateless — this avoids unresolvable storage frames.
- Remove the `STRIPE_BASE_URL` and Stripe bindings if step 1 Q2 was No.
- Update the `DATABASE_URL` default to match the credentials from step 1 Q9.

On success, mark `- [x] vitest-config` in `.testing-setup-progress.md`.

---

## Step 5 — Global test setup

Write `test/globalSetup.ts` from `test/globalSetup.ts`, adapting:

- Update the `DATABASE_URL` default string to match step 1 Q9 credentials.
- Remove `stripe-mock` from the `docker compose up` command if step 1 Q2 was No.
- Update the sentinel table name in the schema-check query if the project
  doesn't have a `users` table.
- Update the schema file path if it's not at `src/db/schema.sql`.
- Update the migrations directory path if it's not `src/db/migrations`.

On success, mark `- [x] global-test-setup` in `.testing-setup-progress.md`.

---

## Step 6 — Test helpers

Write `test/helpers/db.ts` from `test/helpers/db.ts`, adapting:

- Update `DATABASE_URL` default to match step 1 Q9 credentials.
- Update the `TRUNCATE` table list (and order) using the tables from step 1 Q8.
  If the user said "read it from the schema file", read the schema now and
  extract all table names, ordering children before parents.
- Update `createUser` columns to match the actual users table:
  - Remove `linkedin_id` if not using LinkedIn auth (`auth-setup` not run
    or LinkedIn not chosen).
  - Add any project-specific user columns that tests will need.
- Remove `createSessionPack` if `payments-setup` has not been run.
- Remove `createUserWithSession` and the `storeSession` import if `auth-setup`
  has not been run.
- Add any additional fixture builders needed for the project's domain entities.

On success, mark `- [x] test-helpers` in `.testing-setup-progress.md`.

---

## Step 7 — Docker Compose

If step 1 Q1 was Yes (PostgreSQL), write `docker-compose.yml` at the project
root from `docker/docker-compose.yml`, adapting:

- Update `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` to match step 1 Q9.
- Update the healthcheck command to use those same credentials.
- Remove the `stripe-mock` service if step 1 Q2 was No.

If a `docker-compose.yml` already exists, merge the new services into it
rather than replacing the file.

On success, mark `- [x] docker-compose` in `.testing-setup-progress.md`.

---

## Step 8 — ESLint

Write `eslint.config.mjs` at the project root from `config/eslint.config.mjs`,
adapting:

- Remove the `react-hooks` block if the project has no React frontend (no
  `ui/` directory or no `.tsx` files).
- Update the `files` glob in the react-hooks block to match the actual
  frontend source directory.
- Add any additional `ignores` for generated directories.

If an `eslint.config.*` file already exists, merge the rules rather than
replacing the file.

On success, mark `- [x] eslint` in `.testing-setup-progress.md`.

---

## Step 9 — Prettier and pre-commit hooks

**`.prettierrc`** (create if missing):

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

ADAPT: if the project already has a Prettier config, leave it unchanged.

**Initialize husky:**

```bash
npx husky init
```

Write `.husky/pre-commit`:

```sh
npx lint-staged
```

**Add `lint-staged` config to `package.json`:**

```json
"lint-staged": {
  "*.{ts,tsx,js,json,md}": "prettier --write"
}
```

On success, mark `- [x] prettier-and-husky` in `.testing-setup-progress.md`.

---

## Step 10 — package.json scripts

Merge these scripts into `package.json` (do not replace existing scripts):

```json
"scripts": {
  "lint":           "eslint src/ test/",
  "test":           "npm run lint && vitest run",
  "test:coverage":  "vitest run --coverage",
  "test:watch":     "vitest",
  "format":         "prettier --write .",
  "format:check":   "prettier --check ."
}
```

ADAPT:
- Add `ui/src/` to the `lint` script if there is a React frontend.
- Update `src/` to match the actual Worker source directory.
- If the project already has a `test` script, check whether it should be
  replaced or extended.

On success, mark `- [x] package-json-scripts` in `.testing-setup-progress.md`.

---

## Step 11 — GitHub Actions CI workflow

Write `.github/workflows/ci.yml` from `github/ci.yml`, adapting:

- Update all `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` values
  (appear in multiple places) to match step 1 Q9.
- Update the `DATABASE_URL` strings in the workflow to match.
- Remove the `stripe-mock` service block if step 1 Q2 was No.
- Remove the `STRIPE_BASE_URL` env var from the test step if step 1 Q2 was No.
- Remove the `i18n-audit` job if step 1 Q6 was No.
- Remove the `python-tests` job if step 1 Q5 was No. If Yes, update:
  - `working-directory` to the Python service path.
  - The pytest command if the test file names differ.

On success, mark `- [x] github-actions-ci` in `.testing-setup-progress.md`.

---

## Step 12 — First test file (bootstrap)

To avoid the CI workflow failing immediately with "no test files found",
write a minimal first integration test at `test/health.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SELF } from 'cloudflare:test';
import { truncateAll } from './helpers/db';
import { BASE_URL } from './helpers/db';

describe('GET /health', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('returns 200', async () => {
    const res = await SELF.fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
  });
});
```

ADAPT: update the route if `/health` is named differently. If the project
has no health endpoint, write a simple test that verifies the Worker starts
(e.g. `GET /` returns any response).

On success, mark `- [x] bootstrap-test-file` in `.testing-setup-progress.md`.

---

## Step 13 — Verify

**Failure policy: if any verify check fails, stop immediately and report the
full error output. Do not continue to the next check or attempt a commit.
The user must resolve the issue and re-run (Step 0 will resume from the last
completed step).**

0. Run `npx tsc --noEmit` — fix any type errors before proceeding.
1. `npm run lint` — confirm no ESLint errors.
2. `npm run format:check` — confirm no Prettier violations.
3. `npm run test` — confirm vitest finds the test file, runs it, and passes.
4. `npm run test:coverage` — confirm coverage report generates; if below
   80/80/80, note which files need tests (don't fail the setup).
5. Offer to commit the changes. Push only with explicit user approval — confirm
   the CI workflow triggers and passes after push.

---

## Summary output

```
## testing-setup complete

Test runner:   Vitest + @cloudflare/vitest-pool-workers
Coverage:      Istanbul, 80/80/80 thresholds (lines / functions / branches)
Linter:        ESLint with typescript-eslint + react-hooks
Formatter:     Prettier, enforced via husky pre-commit
CI jobs:       test (coverage) <, i18n-audit> <, python-tests>
Local services: docker-compose.yml (postgres <, stripe-mock>)

Test helpers:
  test/helpers/db.ts — BASE_URL, truncateAll(), createUser(), <createUserWithSession()>, <createSessionPack()>
  test/globalSetup.ts — Docker probe, schema apply, migrations

Next steps:
  - Run: docker compose up -d --wait postgres <stripe-mock>
  - Run: npm test
  - Write integration tests alongside each route file (TDD: red → green → refactor)
```
