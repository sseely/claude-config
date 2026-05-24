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
