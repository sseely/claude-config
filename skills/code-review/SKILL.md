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

Collect the full content of every touched file (not just the diff) before
beginning the review — many issues only become visible in context.

## Parallel review

Run ALL of the following checks in parallel as independent agents. Each
agent receives: the diff (if scoped), the full content of touched files,
and its specific checklist below.

---

### Agent 1 — Correctness & Code Quality

- Logic errors and off-by-one errors
- Magic numbers and magic strings: any raw literal that encodes business
  meaning should be extracted to a named constant
- String constants with common roots should be composed from a shared base
  constant rather than repeated independently
  (e.g. `BASE_URL + '/users'` instead of two separate hardcoded strings)
- Functions doing more than one thing (single responsibility)
- DRY violations — duplicated logic that should be shared
- Duplication: flag any block of 5+ lines that appears more than once
  in the same file or across touched files; recommend extraction
- Cyclomatic complexity: suggest simplification for anything > 7; flag
  anything > 10 as a Warning; require decomposition for anything > 15
- Dead code: unreachable branches, commented-out blocks, unused
  variables/exports/imports

---

### Agent 2 — Security

Use WebSearch and WebFetch to:
- Look up CVEs for any libraries, frameworks, or components identified in
  the code. Search NVD (nvd.nist.gov) or OSV (osv.dev) for known
  vulnerabilities in the exact versions declared
- Check the library's GitHub/GitLab security advisories tab and open issues
  for disclosed vulnerabilities not yet in NVD
- If a CVE exists, fetch the advisory to confirm whether the code's usage
  pattern actually triggers the vulnerable code path

- Authentication: every endpoint/operation that should require auth does
- Authorization: callers can only access resources they own
- Input validation at system boundaries (user input, external APIs)
- SQL injection, XSS, command injection vectors
- Hardcoded secrets, credentials, or API keys in source
- Sensitive data not logged or exposed in error messages
- Insecure deserialization: `pickle`, `YAML.load` (without SafeLoader),
  XML with entity expansion (XXE), `eval`/`exec` on external input
- **Web APIs and sites only — OWASP Top 10:**
  - Broken access control
  - Cryptographic failures
  - Injection
  - Insecure design
  - Security misconfiguration
  - Vulnerable/outdated components
  - Identification and authentication failures
  - Software and data integrity failures
  - Logging and monitoring failures
  - SSRF
- **Web APIs and sites only — CSP (Content Security Policy):**
  - Is a CSP header set?
  - Does it avoid `unsafe-inline` and `unsafe-eval`?
  - Are allowed origins as restrictive as possible?
- **Web APIs and sites only — External JavaScript:**
  - Is third-party JS loaded from CDNs using Subresource Integrity (SRI)?
  - Are external script sources explicitly allowlisted in CSP?

---

### Agent 3 — Formatting & Linting

- Detect the project's package manager and available scripts
  (`package.json`, `pyproject.toml`, `.eslintrc`, etc.)
- Run any available linter (eslint, pylint, rubocop, etc.) on the
  touched files and report findings verbatim
- Run prettier (or equivalent formatter) in check mode if available;
  report any formatting violations
- If the project is TypeScript or JavaScript and prettier is NOT
  configured as a pre-commit / commit-msg hook (check `.husky/`,
  `.git/hooks/`, `lint-staged` config, `.pre-commit-config.yaml`),
  note it as a Suggestion (not all projects require it)
- Check for consistent indentation, trailing whitespace, missing
  newlines at EOF

---

### Agent 4 — Error Handling & Resilience

- Errors caught but silently swallowed (empty catch blocks)
- Error messages leaking internal details to clients (stack traces,
  DB schema, file paths, internal IDs)
- Missing error handling on async operations (unhandled promise
  rejections, missing try/catch around awaits)
- Fallback/default values that could mask real failures
- HTTP error status codes used correctly (4xx vs 5xx)
- Retry logic on non-idempotent operations (payments, writes) without
  a deduplication/idempotency key — retrying these blindly causes
  double-writes
- External calls (HTTP, DB, queue) with no timeout configured — a
  hung dependency will hang the caller indefinitely

---

### Agent 5 — Dependencies

Use WebSearch and WebFetch to:
- Look up the current stable version of each dependency and flag anything
  more than one major version behind
- Check NVD (nvd.nist.gov) or OSV (osv.dev) for CVEs in the exact
  versions declared
- Verify EOL/maintenance status of libraries (e.g. unmaintained packages
  with no recent releases)
- Check the library's GitHub/GitLab repo (releases, changelog, README)
  to verify the declared version is being initialized and called correctly:
  look for deprecated APIs, renamed methods, or constructor changes between
  the declared version and current that the code may be using incorrectly
- If the library has a migration guide or breaking-change notes between the
  declared version and current, flag any patterns in the code that would
  break on upgrade

- Unused imports and dependencies (imported but never referenced)
- Run `npm audit` / `pip audit` / equivalent if available; report
  any vulnerabilities found
- Missing or uncommitted lockfile — Critical; this is the real
  reproducibility risk
- `*` version ranges in production dependencies — Warning
- `^` / `~` ranges are acceptable when a lockfile is present; ignore
  them unless there is no lockfile
- Packages that are duplicated or could be replaced by a stdlib
  equivalent

---

### Agent 6 — Test Coverage

- New code paths introduced by the change: are they covered by tests?
- Are edge cases tested (nulls, empty collections, boundary values,
  invalid input)?
- Are failure/error paths tested, not just the happy path?
- Tests asserting behavior, not implementation details (avoid testing
  internal state directly)
- Tests that only exercise mocks — if the test would pass even if the
  real implementation were deleted, it proves nothing
- If a local integration harness exists (`onebox.sh` or equivalent),
  prefer integration tests over mocked unit tests for new behavior —
  a passing mock proves nothing the harness would catch
- Missing tests for security-sensitive code paths
- Test files in unexpected locations or not matching the project's
  naming convention — misplaced tests are silently excluded from runs

---

### Agent 7 — Logging & Observability

- Significant operations (requests, auth events, failures, state
  changes) are logged
- Log levels used appropriately (DEBUG/INFO/WARN/ERROR)
- Logs are structured (key-value or JSON), not free-form strings
- No sensitive data (passwords, tokens, PII) in log output
- Errors logged with enough context to diagnose without reproduction
- Log lines in services handling concurrent requests include a
  correlation/trace ID — without it, interleaved logs are
  undiagnosable in production
- Services that call other services: check for distributed tracing
  instrumentation (OpenTelemetry or equivalent)

---

### Agent 8 — Type Safety (TypeScript / statically typed languages)

- `any` usage that should be replaced with a proper type
- External data (API responses, JSON parse results) typed as `any`
  or cast directly — should be received as `unknown` and narrowed
  through validation (zod, io-ts, manual guards)
- Non-null assertions (`!`) that could panic at runtime — should have
  a guard or be explained with a comment
- Type casts (`as X`) that bypass safety checks
- Missing return type annotations on public functions/methods

---

### Agent 9 — Performance

- N+1 query patterns (queries inside loops)
- Missing pagination on endpoints that return lists
- Synchronous/blocking operations that should be async
- Unbounded loops or recursion over large collections
- Missing indexes implied by query patterns (flag for DB review)
- Large payloads serialized/deserialized unnecessarily
- Missing cache headers on responses that are static or change
  infrequently (wasteful round-trips for callers)
- Unnecessary recomputation in render loops: missing `useMemo`,
  `useCallback`, or equivalent memoization where inputs are stable

---

### Agent 10 — API Contract & Backwards Compatibility

- Removed or renamed fields in request/response shapes
- Changed field types or nullability
- Removed or renamed endpoints
- Changed HTTP methods or status codes on existing endpoints
- Breaking changes to function/method signatures in shared libraries
- Missing API versioning strategy when breaking changes are unavoidable
- Callers in the same repo that are now broken by the change

---

## Consolidate and report

After all agents complete, merge their findings into a single report
organized by severity:

**Critical** — must fix before merge
**Warning** — should fix
**Suggestion** — consider improving
**Positive** — good practices worth noting

For each finding include: `file:line`, what the issue is, and a
concrete fix or recommendation.

End with a one-line verdict: **APPROVE**, **APPROVE WITH NITS**, or
**REQUEST CHANGES**.
