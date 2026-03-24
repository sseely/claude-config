---
name: code-review
description: >
  Run a comprehensive parallel code review covering correctness, security,
  formatting, error handling, dependencies, test coverage, logging, type
  safety, performance, dead code, and cyclomatic complexity. Defaults to
  staged changes; accepts an optional argument to scope the review differently
  (e.g. "full project", a file path, or a glob).
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob
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
- Cyclomatic complexity (tiered):
  - \>7: **Suggestion** — suggest simplification
  - \>10: **Warning** — flag for simplification
  - \>15: **Critical** — require decomposition before merge
- Dead code: unreachable branches, commented-out blocks, unused
  variables/exports/imports

---

### Agent 2 — Security

- Authentication: every endpoint/operation that should require auth does
- Authorization: callers can only access resources they own
- Input validation at system boundaries (user input, external APIs)
- SQL injection, XSS, command injection vectors
- Hardcoded secrets, credentials, or API keys in source
- Sensitive data not logged or exposed in error messages
- **Web APIs and sites — OWASP Top 10:**
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
- **CSP (Content Security Policy):**
  - Is a CSP header set?
  - Does it avoid `unsafe-inline` and `unsafe-eval`?
  - Are allowed origins as restrictive as possible?
- **External JavaScript:**
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
  recommend adding it with setup instructions
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

---

### Agent 5 — Dependencies

- Unused imports and dependencies (imported but never referenced)
- Run `npm audit` / `pip audit` / equivalent if available; report
  any vulnerabilities found
- Unpinned dependency versions (`^`, `~`, `*`) in production
  dependencies — flag and recommend pinning
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
- Missing tests for security-sensitive code paths

---

### Agent 7 — Logging & Observability

- Significant operations (requests, auth events, failures, state
  changes) are logged
- Log levels used appropriately (DEBUG/INFO/WARN/ERROR)
- Logs are structured (key-value or JSON), not free-form strings
- No sensitive data (passwords, tokens, PII) in log output
- Errors logged with enough context to diagnose without reproduction

---

### Agent 8 — Type Safety (TypeScript / statically typed languages)

- `any` usage that should be replaced with a proper type
- Non-null assertions (`!`) that could panic at runtime — should have
  a guard or be explained with a comment
- Type casts (`as X`) that bypass safety checks
- Missing return type annotations on public functions/methods
- Implicit `any` from untyped external data (API responses, JSON
  parse results) that should go through a validation/parse step

---

### Agent 9 — Performance

- N+1 query patterns (queries inside loops)
- Missing pagination on endpoints that return lists
- Synchronous/blocking operations that should be async
- Unbounded loops or recursion over large collections
- Missing indexes implied by query patterns (flag for DB review)
- Large payloads serialized/deserialized unnecessarily

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
