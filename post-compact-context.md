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

Do NOT skip this sequence. Compaction erases nuance. The brief on
disk is canonical.

---


## Interaction Rules (restored)

- Be direct. No filler phrases.
- After completing a task, briefly summarize what was done and the
  reasoning behind any non-obvious decisions.
- One commit per completed task; Conventional Commits format.

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

Agents live in `~/.claude/agents/`. Delegate when the task clearly falls within
a specialist's domain. Default to handling directly for tasks under ~30 min.
Model routing: Opus for planning/architecture, Sonnet for implementation,
Haiku for scoring/dedup/validation.

---

## Security: Error Responses (restored)

Return generic error messages to clients ("Bad Request", "Internal Server Error").
Never expose stack traces, SQL errors, file paths, or internal IDs in responses.
Log full details server-side at ERROR level.

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
No empty catch blocks.

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
