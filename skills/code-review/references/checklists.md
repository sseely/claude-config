# Code Review — Per-Dimension Checklists

Reference for **Step 2 — Eleven parallel agents** in
`skills/code-review/SKILL.md`. Relocated here under S2 (progressive
disclosure) — content unchanged, only moved out of the top-level skill
file. Each dispatched agent is given its corresponding checklist below
verbatim, along with the full file inventory from Step 1.

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

#### Auth coverage

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
- OWASP Top 10 (broken access control, injection, security
  misconfiguration, vulnerable components, SSRF, etc.)
- Timing-safe comparisons: check any HMAC/token comparison. A length
  check that returns before the constant-time loop is a timing leak.

#### Injection & input

- Input validation at system boundaries (user input, external APIs).
  Check that `request.json()` failures (malformed body) are caught and
  return 400, not 500.
- SQL injection, XSS, command injection vectors
- Insecure deserialization: `eval`/`exec` on external input,
  JSON.parse result used without type narrowing
- Unsigned presigned URLs: any URL returned to clients for accessing
  stored objects must be cryptographically signed

#### Secrets & data exposure

- Hardcoded secrets, credentials, or API keys in source
- Sensitive data in error responses (stack traces, raw upstream errors,
  internal IDs, live OAuth tokens returned to browsers)
- Environment-gated overrides: check any flag that redirects traffic
  to a non-production endpoint (e.g. `STRIPE_BASE_URL`) — it must be
  rejected in production environments

#### Transport & headers

- CORS: check the fallback value when the environment variable is
  missing — wildcard (`*`) is a Critical finding
- CSP headers: set? avoids `unsafe-inline`/`unsafe-eval`?
- SRI on third-party scripts loaded from CDNs

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

### Agent 11 — Operability & Production Readiness

- **Observability coverage:** are new external calls, state changes,
  and background jobs instrumented with metrics (rate, error rate,
  duration) and traces? Are new error paths surfaced to alerting, or
  do they fail silently?
- **Silent failures:** fire-and-forget operations that catch errors
  but do not log, metric, or alert — they will be invisible in
  production
- **On-call debuggability:** can an engineer diagnose a production
  failure without pushing code? Check for: trace IDs in log lines,
  structured error context, meaningful HTTP error bodies (not raw
  stack traces), and queryable metrics
- **Blast radius documentation:** for changes to shared interfaces,
  data models, or API contracts, is the impact on consumers noted
  in a comment or migration doc? A change that silently breaks
  a consumer is worse than one that breaks loudly
- **Rollback path:** for irreversible changes (schema migrations,
  external API contract changes, data format changes), is the
  irreversibility documented and explicitly tested? Is there a
  compensating migration if rollback is required?
- **Feature flag coverage:** for significant behavior changes, is
  the new behavior gated behind a flag for gradual rollout and
  instant kill-switch?
- **Runbook coverage:** for new failure modes (new external dep,
  new background job, new queue consumer), is there a runbook
  reference or an `// on-call:` inline comment describing the
  mitigation?
- **Health check coverage:** if a new service dependency or
  component is introduced, is it included in health checks and
  readiness probes?

