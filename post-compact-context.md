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
## Model Routing (restored)
Opus→planning/architecture decisions + long-horizon autonomous execution
(mission briefs, multi-hour runs), Sonnet→implementation, Haiku→scoring/dedup.
---
## Commit Format (restored)
`type(scope): description` ≤72 chars, lowercase, no period.
Body (separated by blank line) explains why, not what. Required for >3-file changes.
Types: feat, fix, chore, refactor, test, docs, style, perf, ci.
---
## Autonomous Restraint (restored)
STOP brake: if the same location/approach fails the same check 3x
consecutively, stop and log to the decision journal — do not keep iterating.
Opus restraint: implement the simplest interpretation; no speculative
abstractions; if scope is ambiguous, do the minimal reading and note it.
