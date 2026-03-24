# Autonomous Execution Protocol

These rules govern how Claude Code operates during autonomous
sessions — long-running work where the human is not in the loop.

## Detecting Autonomous Mode

A session is autonomous when a **mission brief** is active. The
brief is a directory (e.g., `plans/my-feature/`) referenced in
the initial prompt. If no brief is referenced, these rules do
not apply.

## Brief structure

The brief is a directory, not a single file:

```
plans/[feature]/
  README.md            ← index + status (read this first)
  decisions.md         ← architecture decisions
  batch-N/overview.md  ← batch description + task table
  batch-N/TN-name.md   ← individual task spec (usable as
                         agent prompt directly)
  diagrams/*.md        ← mermaid diagrams
  decision-journal.md  ← appended during execution
```

The executor only needs to read **README.md** to orient. It
reads batch and task files on demand as it reaches them. Do not
load the entire plan directory into context at once.

## Startup Sequence

1. Read `README.md` from the brief directory
2. Read `decision-journal.md` (may have entries from earlier
   in the session, before compaction)
3. Identify which batch to start based on `[x]`/`[ ]` markers
   in README.md
4. Read that batch's `overview.md`
5. Announce: "Starting Batch N. Tasks: T1, T2, ..."
6. Begin work

## After Every Compaction

Context compaction erases nuance. After compaction:

1. Re-read `README.md` from the brief directory (do not trust
   summarized context)
2. Re-read `decision-journal.md`
3. Check which tasks are marked `[x]` vs `[ ]`
4. Read the current batch's `overview.md`
5. Resume from the first incomplete task

This is non-negotiable. The brief on disk is the source of truth,
not the compacted summary.

## Executing a Batch

1. Read the batch's `overview.md` to identify all tasks
2. Verify no write-set conflicts between parallel tasks
3. For each task, read its `TN-name.md` file — this contains
   the full agent prompt (context, write-set, read-set,
   contracts, quality bar). Pass it directly to the agent.
4. Launch parallel agents per `parallelism.md` rules
5. Wait for all agents to complete
6. Run quality gates (see below)
7. If gates pass: mark tasks `[x]` in both the batch
   `overview.md` and the brief's `README.md`, commit
8. If gates fail: fix issues, re-run gates, then proceed
9. Compact before moving to the next batch: `/compact preserve
   decision journal, current batch number, and any unresolved
   issues. Completed batches are recorded in the mission brief
   on disk — drop their details from context.`
10. Move to next batch

## Quality Gates (mandatory between batches)

After completing every batch, run all commands listed in the
mission brief's "Quality Gates" section. Additionally:

- Verify no files were modified outside the declared write-set
  (compare `git diff --name-only` against the batch's file list)
- Verify each completed task has exactly one commit
- Log gate results in the decision journal

If a quality gate fails:
1. Attempt to fix (max 2 tries per gate)
2. If fix succeeds, re-run all gates from scratch
3. If fix fails after 2 tries, STOP and document the failure
   in the decision journal with full error output

## Decision-Making Rules

### STOP and wait for human input when:

- Any stop condition listed in the mission brief is triggered
- A task requires modifying files outside its declared write-set
  AND those files aren't in any other task's write-set either
- Two consecutive quality gate failures on the same check
- The implementation contradicts an architecture decision in the
  brief
- An external service (API, database, third-party) behaves
  unexpectedly
- You realize a task was mis-scoped and actually needs to be
  split into subtasks

### PUSH FORWARD with judgment when:

- Any push-forward condition listed in the mission brief applies
- The choice is purely stylistic and doesn't affect behavior
- A task is simpler than estimated and can be done in fewer steps
- An error message is self-explanatory and the fix is obvious
- A dependency needs a minor/patch version bump

### Always log the decision either way

Every non-trivial judgment call gets a row in the decision journal.
"Non-trivial" means: if a reasonable developer might have chosen
differently, log it.

## Commit Discipline

- One commit per completed task (not per file, not per batch)
- Commit message references the task ID: `feat(T3): add confirm
  endpoint`
- Do NOT commit work-in-progress. If a task isn't done, don't
  commit it.
- If a quality gate fix requires changes to an already-committed
  task, create a `fix` commit referencing the task:
  `fix(T3): resolve lint errors in confirm endpoint`

## Progress Tracking

- Update task checkboxes in the mission brief file on disk as
  tasks complete
- Use TodoWrite for granular sub-steps within a task
- The mission brief's checkbox state is the canonical progress
  record

## Session End

When all tasks are complete (or a stop condition is hit):
1. Run final quality gates on the full feature branch
2. Write a summary at the bottom of the mission brief:
   - Tasks completed vs planned
   - Decisions made (count, with any flagged for review)
   - Quality gate results
   - Any known issues or follow-ups
3. The notify-on-stop hook will chime
