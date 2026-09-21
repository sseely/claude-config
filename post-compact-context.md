# Post-Compaction Context

This file is injected automatically after every context compaction.
It restores critical behavioral rules that must not be paraphrased.
---
## Autonomous Execution Recovery
Mission brief active (`plans/` dir referenced at session start)? Before
continuing, re-read from disk — never the compacted summary, which is not
the source of truth: (1) the brief's `README.md`, (2) `decision-journal.md`
for pre-compaction entries, (3) `[x]`/`[ ]` task state, (4) the current
batch's `overview.md`. Then (5) resume at the first incomplete task.
---
## Model Routing (restored)
Fable→long-horizon autonomous execution (mission briefs, multi-hour runs)
Opus→planning/architecture and high-value implementation, Sonnet→routine
implementation, Haiku→scoring/dedup.
---
## Commit Format (restored)
<!-- Kept 2026-09-20 (T15): /context unavailable in this session to verify
whether rules/ content survives compaction as reliably as CLAUDE.md;
defaulting to keep this section (safer, reversible) until confirmed. -->
One commit per completed task; subject references the task ID —
`feat(T3): add confirm endpoint`. Conventional Commits, `<type>(<scope>):
<description>`, lowercase, no period, ≤72 chars. Full spec: `rules/commits.md`.
No attribution: never add `Co-Authored-By: Claude`, `🤖 Generated with Claude
Code`, or any generated-by line to a commit message or PR body. A "Built with
Claude Code" line in a project README is fine.
---
## Autonomous Restraint (restored)
STOP brake: if the same location/approach fails the same check 3x
consecutively, stop and log to the decision journal — do not keep iterating.
This is a separate counter from Batch Close-Out's gate-fix-attempt cap
below — one counts repeated edits to a location/approach, the other counts
repeated fixes to one failing gate check; see
`docs/reference/autonomous-execution.md` for the full distinction.
Opus restraint: implement the simplest interpretation; no speculative
abstractions; if scope is ambiguous, do the minimal reading and note it.
---
## Batch Close-Out (restored)
Run the mission brief's quality gates between every batch. After 2 failed fix
attempts on the same gate, stop *editing* — but keep investigating until you can
state the mechanism, then STOP and log the full diagnosis artifact:
mechanism, origin `file:line`, causal chain, what you ruled out.
---
## Write-Set Discipline (restored)
Each file has exactly one writer per batch. A task that must write outside its
declared write-set stops and logs to the decision journal; it does not proceed.
