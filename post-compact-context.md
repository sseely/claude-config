# Post-Compaction Context

This file is injected automatically after every context compaction.
It restores critical behavioral rules that must not be paraphrased.

---

## Autonomous Execution Recovery

If a mission brief is active (a `plans/` directory was referenced at
session start), you MUST do the following before continuing:

1. Re-read `README.md` from the brief directory — do not trust the
   compacted summary; the file on disk is the source of truth
2. Re-read `decision-journal.md` for entries written before compaction
3. Check which tasks are marked `[x]` vs `[ ]`
4. Read the current batch's `overview.md`
5. Resume from the first incomplete task

---


## Coverage Rule (restored)

Target 90% line coverage, 90% branch coverage, 90% function coverage as a floor.
Never approve or merge code that drops below these thresholds.

---

## Parallelism Rule (restored)

Before multi-agent work: list subtasks, mark dependencies, assign file ownership
(one writer per file), batch independent work in parallel.

**Autonomous mode exception:** When a mission brief is active, skip the user
review step — log the execution plan to decision-journal.md instead.

---

## Agent Delegation (restored)

Default to handling directly for tasks under ~30 min; delegate when clearly in a specialist's domain.
Model routing: Opus→planning, Sonnet→implementation, Haiku→scoring.

---

## TDD / Assertion Quality (restored)
Red-Green-Refactor. Assert specific values — never just non-null or no-exception.
Assert on state changes by reading back state directly (query the DB, read the KV value).

---

## Input Validation (restored)
Validate at system boundaries with a schema (Zod, io-ts, JSON Schema). Parameterize
SQL. Never interpolate user input into shell commands, HTML, or server-side URLs.

---

## Error Handling (restored)
Throw for unexpected/unrecoverable states; return typed errors for expected failures
(validation, not-found, permission denied). Wrap low-level errors at module boundaries.
No empty catch blocks. Return generic messages to clients — never expose stack traces,
SQL errors, or internal IDs. Log full detail server-side at ERROR level.

---

## On-Call Readiness (restored)
Before merging any new failure mode: document 2-3 failure scenarios with detection
metric or log pattern and immediate mitigation for each.

---

## ADR Triggers / Blast Radius (restored)
Assess impact system-first: data model → API contracts → service dependencies → files.
Write an ADR for cross-service changes, new dependencies, or decisions expensive to reverse.

---

## API Envelope Consistency (restored)
Lists: `{ "data": [...], "total": N, "page": N, "pageSize": N }`.
Single resources: return directly (no wrapper). Errors: `{ "error": "code", "message": "..." }`.
Never mix envelope styles within a service.

---

## Memory Recall (restored)
Before every task: (1) search Mem0 for relevant prior findings, (2) read `.agent-notes/` in the
working directory, (3) state what was found and how it affects scope. Do not re-investigate
what is already known.

---

## Retry / Idempotency (restored)
Max 3 attempts. Exponential backoff: 100ms base, 2× multiplier, 5s cap, ±20% jitter.
Do NOT retry 4xx except 429 (use Retry-After). Generate idempotency keys (UUID) for
non-idempotent operations; pass as `Idempotency-Key` header; 24h TTL.

---

## Logging (restored)
All logs must be structured JSON. Required fields: `level`, `msg`, `ts`, `service`.
Add `trace_id`, `method`, `path` in request-handling contexts.
Never log passwords, tokens, API keys, raw env var values, or PII.

---

## Naming Conventions (restored)
Folders: `src/api/`, `src/services/`, `src/repository/`, `src/models/`, `src/lib/`.
Files: PascalCase for classes (`UserRepository.ts`), camelCase for modules (`parseJwt.ts`).
DB: snake_case plural tables (`user_accounts`), snake_case columns (`created_at`).

---

## Environment Variables (restored)
Name as `ALL_CAPS_SNAKE_CASE`. Validate all required env vars at startup before accepting
traffic. Never log secret values — log presence only (`AUTH_JWT_SECRET: set`).

---

## PR Workflow (restored)
Branches: `feature/`, `fix/`, `chore/`, `docs/` — kebab-case, under 40 chars.
Preferred max PR size: 400 lines changed (excluding generated files).
Feature/fix branches: squash merge. Mission-brief branches: merge commit (preserves task IDs).

---

## Observability (restored)
Define SLI + SLO before implementation. Instrument every external call with RED metrics
(rate, error rate, duration p95/p99). Propagate W3C `traceparent` across all service calls.
Do NOT merge a feature that introduces a new critical path without updating the dashboard.

---

## Prompting Quality (restored)
Every non-trivial agent prompt needs at least one constraint keyword (only/must/never/avoid).
Keep each section to ≤6 hard prescriptive constraints (MOSAIC research — compliance degrades
above 6). Use Tier 1 verbs (`audit`, `verify`, `enumerate`) when thoroughness is required.

---

## Testability (restored)
Extract logic into pure functions (data in, data out). Functional core computes what should
happen; thin imperative shell does it. If a test needs >2–3 mocks, restructure before testing.
Inject clocks, random, and UUIDs — never call them directly.

---

## Research Sources (restored)
5-tier hierarchy: (1) NVD/CISA/official docs, (2) peer-reviewed papers, (3) Google SRE/
Netflix/Cloudflare blogs, (4) arxiv AI/ML only — flag as preprint, (5) general web —
background only. Never use tier 5 as sole source for a design decision.
