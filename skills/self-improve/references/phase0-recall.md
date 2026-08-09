# Phase 0 — Recall prior findings

Full depth of Phase 0, split out of `SKILL.md` to keep it under Anthropic's
500-line skill ceiling. The **resume stub** — the check against
`~/.claude/.self-improve-progress.md` and which `phase-N: done` markers are
set — lives inline in `SKILL.md`, not here: a resumed run must be able to
learn it should skip completed phases without first reading this file. A run
that fails to resume silently redoes Phase 1's nine agents, so the gate must
never sit behind a hop. What follows is the full Phase 0 text, reproduced
here for fidelity; SKILL.md keeps its own copy of the resume stub inline.

---

**Resume check**: Before doing anything, check `~/.claude/.self-improve-progress.md`.

If it exists:
- If `phase-1: done` is set, skip Phase 1 agents — load their outputs from
  `.agent-notes/self-improve-phase1-A.md`, `-phase1-B.md`, `-phase1-C.md`, `-phase1-X.md`.
- If `phase-2: done` is set, skip Phase 2 agents — load their outputs from
  `.agent-notes/self-improve-phase2-D.md` through `-phase2-H.md`.
- If `phase-3: done` is set, skip Phase 3 — load deduplicated findings from
  `.agent-notes/self-improve-phase3.md`.
- Resume from the first incomplete phase.

Continue with Phase 0 steps 1–5 regardless — they are fast and idempotent.

Before doing any new work, check what's already known:

1. Read `.agent-notes/` in the current working directory for
   any session observations from prior runs of this skill.
2. State what was found and how it affects scope. If a prior
   self-improve run produced findings that are already in
   `code-review-tasks.md`, skip re-deriving them.
3. Ensure the clone workspace exists:
   ```bash
   mkdir -p ~/temp/self-improve
   ```
   Any git repos cloned during research go here so local tools
   (grep, find, Glob) can run against them without network
   round-trips.
4. **Read the URL registry**: Load
   `~/.claude/skills/self-improve/research-urls.md`. This file is the
   single source of truth for which URLs Agents A, B, and C fetch. Check
   for any entries with `status: unreachable` or `status: deprecated` —
   flag these at the top of Phase 4 output as existing known gaps, not
   new findings.
5. **Prior-change regression gate**: If `code-review-tasks.md` exists with
   checked-off (`[x]`) items from a prior run, verify those changes landed
   cleanly:
   ```bash
   git log --oneline --since="180 days ago" -- ~/.claude/ | head -30
   ```
   For each commit that appears to implement a self-improve finding, read its
   diff (`git show <sha> --stat`) and confirm: (a) the change is still present
   in the config, (b) the area it touched has no new contradictions apparent
   from a quick grep. State the result explicitly — "Prior run implemented N
   changes; spot-checked M: [result]." If the prior run produced findings but
   zero commits followed, name that gap — it is itself a signal worth surfacing
   in Phase 4.
6. **Reconcile the task file against git, then rewrite it.** Checkbox state
   drifts: the 2026-07-24 task file was fully implemented across ~25 commits
   yet left every box unticked, which forced the next run to reconstruct
   state from history and risk re-deriving findings already fixed.

   For each unticked `[ ]` item in `code-review-tasks.md`, look for evidence
   it landed — a commit touching the named file, or the current file
   contents themselves. Tick the ones that are done and **write the file
   back** before any new analysis. Reconciling in your head does not help
   the next run; the file on disk is the handoff.

   **A missing commit is not proof of non-implementation.** When the target
   is gitignored — `.mcp.json`, `.claude/`, the Anthropic-proprietary
   `skills/doc-*` — a task can be genuinely complete with no commit to find.
   Check the file on disk before concluding anything, and record how each
   item was verified.
