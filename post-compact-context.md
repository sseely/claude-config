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
