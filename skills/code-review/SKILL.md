---
name: code-review
description: >
  Run a comprehensive parallel code review covering correctness, security,
  formatting, error handling, dependencies, test coverage, logging, type
  safety, performance, API contracts, dead code, and cyclomatic complexity.
  Defaults to staged changes; accepts an optional argument to scope the
  review differently (e.g. "full project", a file path, or a glob).
disable-model-invocation: false
---

# Code Review

## Determine scope

- If $ARGUMENTS is empty or not provided: review staged changes only.
  Run `git diff --cached` to get the diff and identify touched files.
- If $ARGUMENTS is "full project": review all source files in the repo
  (exclude `node_modules`, `dist`, `build`, `.git`, generated files).
- Otherwise treat $ARGUMENTS as a file path, glob, or description and
  review the files it identifies.

## Step 1 — File inventory (run this yourself before launching any agents)

Run the command below and record the output. This is the ground-truth
file list you will pass to every agent. Do NOT hand-construct it from
memory — incomplete lists are the primary source of missed findings.

```bash
find . \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/.wrangler/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/.venv/*' \
  -not -path '*/coverage/*' \
  -type f \
  \( -name '*.ts'   -o -name '*.tsx'  -o -name '*.js'  -o -name '*.jsx' \
     -o -name '*.py' -o -name '*.rb'  -o -name '*.go'  -o -name '*.rs' \
     -o -name '*.java' -o -name '*.kt' -o -name '*.swift' \
     -o -name '*.html' -o -name '*.toml' -o -name '*.yaml' -o -name '*.yml' \
     -o -name 'Dockerfile' -o -name '*.dockerfile' \
     -o -name 'requirements*.txt' -o -name 'Gemfile' \
     -o -name 'tsconfig*.json' -o -name 'package.json' -o -name 'pyproject.toml' \) \
  | sort
```

The inventory must cover every file category below. If any category is
absent from the output, investigate why before proceeding:

- Primary language sources (`src/`, `lib/`, `app/`)
- Test files (`test/`, `spec/`, `__tests__/`)
- **Config files at the project root** (`tsconfig.json`, `wrangler.toml`,
  `vite.config.*`, `eslint.config.*`, `vitest.config.*`)
- **Secondary-language service directories** (e.g. a Python `report-service/`,
  a Go sidecar) — frequently omitted when the primary language is TypeScript
- **HTML entry points** (`index.html`, add-in manifests) — CSP, SRI, and
  external script tags live here, not in `.ts` files
- **Lock files and dependency manifests** (`package-lock.json`,
  `requirements.txt`, `Gemfile.lock`) — absence is itself a finding

## Step 2 — Ten parallel agents (launch all simultaneously)

Each agent receives the full file inventory from Step 1. Agents use
Read, Grep, Glob, Bash, WebSearch, and WebFetch. They must work through
the full inventory systematically — not hand-pick files. If a file leads
to another via import, read that file too.

Agents are: general-purpose, code-reviewer, security-auditor,
qa-expert, dependency-manager, or performance-engineer as appropriate.

---

## Checklists

### Agent 1 — Correctness & Code Quality

- Logic errors and off-by-one errors
- Magic numbers and magic strings: any raw literal with business meaning
  should be a named constant
- String constants with common roots composed from a shared base
- Functions doing more than one thing (single responsibility)
- DRY violations — duplicated logic, especially across similar handlers
  (e.g. three provider-specific OAuth callbacks with identical structure)
- Duplication: flag any block of 5+ lines appearing more than once;
  recommend extraction
- Cyclomatic complexity: suggest simplification >7; flag >10 as Warning;
  require decomposition >15
- Dead code: unreachable branches, commented-out blocks, unused
  variables/exports/imports
- **Long-lived objects (Durable Objects, singletons, connection pools):**
  flag any resource (DB client, HTTP client, socket) that is allocated
  per-request or per-message inside a long-lived object — it should be
  allocated once and reused

---

### Agent 2 — Security

Use WebSearch and WebFetch to look up CVEs on NVD / OSV for the
exact versions declared.

- **Authentication coverage:** read the router / entry-point file in
  full. For every endpoint that writes state or returns private data,
  verify auth is applied — either at the dispatch layer or, if applied
  inside the handler, verify it is applied in the handler for EVERY
  code path (including early-return paths). Do not trust that auth
  exists because some endpoints have it — check each one independently.
- **Authorization (IDOR):** for every data-returning endpoint without
  router-level auth, read the handler and verify it queries with
  a user-scoped WHERE clause (`AND user_id = $N`). Absence of this
  check on any path in the handler is a Critical finding.
- **Admin guards:** for endpoints intended only for admins, verify the
  `is_admin` (or equivalent) flag is checked inside the handler. Passing
  a `user` object to a handler does not guarantee `is_admin` was checked
  — read the handler body.
- **Deleted/soft-deleted user bypass:** if the system supports soft
  deletion, verify that every auth path (session token, JWT, OAuth)
  rejects users where `deleted_at IS NOT NULL`.
- Input validation at system boundaries (user input, external APIs).
  Check that `request.json()` failures (malformed body) are caught and
  return 400, not 500.
- SQL injection, XSS, command injection vectors
- Hardcoded secrets, credentials, or API keys in source
- Sensitive data in error responses (stack traces, raw upstream errors,
  internal IDs, live OAuth tokens returned to browsers)
- Insecure deserialization: `eval`/`exec` on external input,
  JSON.parse result used without type narrowing
- CORS: check the fallback value when the environment variable is
  missing — wildcard (`*`) is a Critical finding
- Unsigned presigned URLs: any URL returned to clients for accessing
  stored objects must be cryptographically signed
- Timing-safe comparisons: check any HMAC/token comparison. A length
  check that returns before the constant-time loop is a timing leak.
- OWASP Top 10 (broken access control, injection, security
  misconfiguration, vulnerable components, SSRF, etc.)
- CSP headers: set? avoids `unsafe-inline`/`unsafe-eval`?
- SRI on third-party scripts loaded from CDNs
- Environment-gated overrides: check any flag that redirects traffic
  to a non-production endpoint (e.g. `STRIPE_BASE_URL`) — it must be
  rejected in production environments

---

### Agent 3 — Formatting & Linting

- Detect package manager and available lint/format scripts
- Run any available linter (eslint, pylint, rubocop, etc.) and report
  findings verbatim
- Run prettier / equivalent in check mode; report violations
- Check pre-commit hook configuration (`.husky/`, `lint-staged`,
  `.pre-commit-config.yaml`)
- Consistent indentation, trailing whitespace, missing newlines at EOF
- Debug log statements left in production code (e.g.
  `console.log('message', rawData)` in a hot path)

---

### Agent 4 — Error Handling & Resilience

- Empty catch blocks that swallow errors silently
- Error messages leaking internal details to clients
- Missing error handling on async operations
- HTTP error status codes used correctly (4xx vs 5xx)
- Retry logic on non-idempotent operations without an idempotency key
- External calls (HTTP, DB, queue) with no timeout — a hung dependency
  hangs the caller indefinitely. Check every external fetch call.
- Bare `request.json()` without try/catch — malformed body from any
  client causes an unhandled 500
- Race conditions: multi-step check-then-act sequences (read count →
  insert) that should be a single atomic DB operation

---

### Agent 5 — Dependencies

Use WebSearch and WebFetch to check current stable versions and CVEs.

- Flag anything more than one major version behind
- Check for EOL / unmaintained packages
- Check deprecated APIs used against the declared version
- Unused imports and packages (imported but never referenced)
- Run `npm audit` / `pip audit` / equivalent; report vulnerabilities
- **Missing lock file** — Critical (every language ecosystem)
- `*` version ranges in production deps — Critical
- `^`/`~` acceptable when lockfile is present
- Packages that belong in devDependencies but are in dependencies
- Secondary-language services: check their dependency files and lock
  files independently (e.g. `report-service/requirements.txt`)

---

### Agent 6 — Test Coverage

- New code paths without tests
- Edge cases not tested: nulls, empty collections, boundary values,
  invalid input, malformed request bodies
- Error and failure paths not tested (only happy path)
- Security-sensitive paths not tested:
  - Unauthenticated requests to protected endpoints (expect 401)
  - Requests by a user who does not own the resource (expect 403/404)
  - Soft-deleted user attempting to authenticate
  - XSS injection in user-visible fields (verify HTML escaping)
  - Webhook signature missing or tampered
- **Handlers with zero tests** — flag by name, not just coverage %
- Tests that would pass even if the real implementation were deleted
- Test files in wrong locations (silently excluded from runs)
- **Integration vs mock:** if a local harness exists (`onebox.sh` or
  equivalent), prefer integration tests; a passing mock proves nothing

---

### Agent 7 — Logging & Observability

- Significant operations (auth events, state changes, failures) logged
- Log levels appropriate (DEBUG/INFO/WARN/ERROR)
- Structured logs (JSON/key-value), not free-form strings
- No sensitive data (tokens, PII, raw upstream errors) in logs
- Errors logged with enough context to diagnose without reproduction
- Concurrent-request handlers: correlation/trace ID in every log line
- Fire-and-forget background tasks: errors surfaced, not silently lost

---

### Agent 8 — Type Safety (TypeScript / statically typed languages)

- `any` that should be a proper type
- External data (API responses, JSON.parse) typed as `any` or cast
  directly — should be `unknown` and narrowed through validation
- Non-null assertions (`!`) without a guard or explaining comment
- Type casts (`as X`) that bypass safety checks, especially on
  unvalidated external input
- Missing return type annotations on exported functions
- `@ts-ignore` without explanation (prefer `@ts-expect-error`)
- Cross-file mismatches: field returned by server that client types
  expect under a different name or shape

---

### Agent 9 — Performance

- N+1 query patterns (queries inside loops)
- Missing pagination on list endpoints
- Synchronous/blocking operations that should be async
- Unbounded loops or recursion over large collections
- **Resource allocation inside long-lived objects:** any DB client,
  HTTP client, or connection created per request/message inside a
  Durable Object, singleton, or worker with long lifetime — allocate
  once, reuse, or pass in from the caller
- Missing DB indexes implied by query patterns
- Large payloads serialized unnecessarily
- Missing cache headers on static/infrequent responses
- React: missing `useMemo`/`useCallback` where inputs are stable
- Reconnect loops without jitter (lockstep reconnects amplify load)

---

### Agent 10 — API Contract & Backwards Compatibility

- Removed or renamed fields in request/response shapes
- Changed field types or nullability
- **Cross-file field name mismatches:** server returns `{ fieldA }`,
  client types expect `{ fieldB }` — this is always a runtime `undefined`
- Removed or renamed endpoints
- Changed HTTP methods or status codes
- Breaking changes to shared library signatures
- Callers in the same repo broken by the change
- Inconsistent response envelopes (some endpoints wrap in `{ data }`,
  others return bare objects — flag as Suggestion)
- Two endpoints doing the same thing under different paths with
  different auth models — flag as Warning

---

## Step 3 — Deduplication pass (run after all 10 agents complete)

Run a single dedup agent. Give it all findings from all 10 agents.

The dedup agent must:

1. **Group** findings that describe the same root issue (same file:line
   or same conceptual problem).

2. **Keep the most specific instance** of each duplicate group: the
   one with the precise file:line reference and concrete fix.

3. **Resolve genuine contradictions** by reading the relevant source
   file directly. Do not use any prior summary as the arbiter — read
   the code.

4. **Do not suppress findings.** Only drop a finding if:
   - It is a true duplicate of another finding already in the list, OR
   - Reading the source reveals the condition described cannot occur
     (explain why in a note).

5. **Return** the deduplicated list, preserving severity.

---

## Step 4 — Confidence scoring (run after dedup, before final report)

For each finding from Step 3, launch a parallel Haiku agent. Give each
agent the finding, the relevant source file(s), and any CLAUDE.md files
that apply. The agent must score the finding 0–100 and return the score
with a one-sentence justification.

Give agents this scoring rubric verbatim:

- **0** — False positive that doesn't stand up to light scrutiny, or
  describes a pre-existing issue not introduced by the current change.
- **25** — Might be real, but unverified. Could be a false positive.
  If stylistic, not explicitly called out in CLAUDE.md.
- **50** — Verified as real, but a nitpick or low-frequency issue.
  Relatively unimportant compared to the rest of the change.
- **75** — Double-checked and very likely real. Will be hit in practice.
  Directly impacts functionality, or explicitly mentioned in CLAUDE.md.
- **100** — Confirmed real, happens frequently, evidence is direct.

Filtering rules after scoring:

- **Drop** any finding scored below **50** — false positive or too minor
  to act on.
- **Downgrade severity** for any finding scored 50–64: cap at Suggestion
  regardless of what the reviewing agent assigned.
- **Keep as-is** findings scored 65 and above.
- **Never drop** a finding scored 75+ regardless of severity — always
  include it.
- **Positives** skip scoring — include all of them in the final report.

False positives to instruct scoring agents to watch for:

- Pre-existing issues not introduced by the current change
- Something that looks like a bug but is not actually a bug
- Pedantic nitpicks a senior engineer wouldn't raise
- Issues a linter, typechecker, or compiler will catch automatically —
  assume CI runs these separately; do not flag them
- General quality issues (lack of tests, poor docs) unless CLAUDE.md
  explicitly requires them
- Issues silenced in code via lint-ignore comments
- Changes in functionality that are likely intentional given the broader
  change context
- Real issues on lines not touched by the current change

---

## Final report

Merge the scored, filtered output into a single report organized by
severity:

**Critical** — must fix before merge  
**Warning** — should fix  
**Suggestion** — consider improving  
**Positive** — good practices worth noting  

For each finding include: `file:line`, confidence score, what the issue
is, and a concrete fix or recommendation.

End with a one-line verdict: **APPROVE**, **APPROVE WITH NITS**, or
**REQUEST CHANGES**.
