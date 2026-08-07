# Mission Brief Structure

Full directory layout, generation steps, and document hygiene rules
for Phase 7 of `skills/plan-mission/SKILL.md`. Linked from SKILL.md —
read this when you reach Phase 7.

## Directory structure

```
plans/[feature-name]/
  README.md              ← overview + index (the only file the
                           executor MUST read on startup)
  decisions.md           ← architecture decisions from Phase 3
  batch-1/
    overview.md          ← batch description, tasks, write-sets
    T1-[name].md         ← full task spec (context, read-set,
                           write-set, interface contracts, etc.)
    T2-[name].md
  batch-2/
    overview.md
    T3-[name].md
  diagrams/
    data-flow.md         ← PlantUML sequence diagrams
    component-map.md     ← PlantUML component diagram of affected
                           components
  decision-journal.md    ← empty at creation, appended during
                           execution
```

Phases may have sub-phases. If a batch has >5 tasks, split it
into sub-directories (`batch-2a/`, `batch-2b/`) with their own
overview docs.

## Generation steps

1. Create the directory structure above.
2. Write `README.md` as the overview and index:
   - Objective (one paragraph)
   - Branch info
   - Constraints (stop/push-forward conditions from Phase 6)
   - Quality gate commands (from Phase 1)
   - Table of batches with status checkboxes
   - Links to every other doc in the plan
   This is what the executor re-reads after compaction. Keep it
   under 200 lines — it must fit comfortably in context alongside
   the CLAUDE.md chain.
3. Write `decisions.md` with the confirmed architecture decisions
   from Phase 3.
4. For each batch, write `batch-N/overview.md` with:
   - Batch description and dependency summary
   - Task table with explicit dependency column:
     `| ID | Description | Agent | Writes | Depends On | Done |`
     The `Depends On` column lists task IDs (e.g. `T1, T2`) or
     `—` for tasks with no dependencies. Tasks within the same
     batch that have `—` or depend only on prior-batch tasks can
     run in parallel; the executor uses this column to decide.
5. For each task, write `batch-N/TN-[name].md` following the
   agent prompt structure from `parallelism.md`:
   - Context, task, write-set, read-set, architecture decisions
     relevant to this task, interface contracts, acceptance
     criteria (Given/When/Then from Phase 5), quality bar
   - **Observability requirements** — which SLIs this task must
     instrument, what trace spans to add, whether a dashboard
     panel needs updating. If none, write "N/A — no new
     observable operations."
   - **Rollback notes** — the rollback classification from Phase
     4 (Reversible / Reversible with migration / Irreversible)
     and any per-task migration steps required.
   - **Scope read-set references.** Instead of listing whole
     files, point to the relevant section or line range:
     `decisions.md#token-storage`, `src/api/subscribe.js:15-40`.
     This keeps agent context small — load only what the task
     needs, not the entire artifact.
   - The executor can pass this file directly as the agent prompt
6. Write PlantUML diagrams in `diagrams/`:
   - `data-flow.md` — sequence diagrams for key flows affected
     by the feature
   - `component-map.md` — component diagram showing which
     components are touched and how they relate
   Use PlantUML fenced blocks (```plantuml) wrapping `@startuml`
   … `@enduml`. Pick diagram types per
   `~/.claude/rules/diagrams.md`.
7. Write an empty `decision-journal.md` with just the table
   header.
8. Generate a project-specific `.claude/settings.autonomous.json`
   for autonomous execution. Start from
   `~/.claude/templates/autonomous-settings.json`, then tailor
   based on what Phase 1 discovered:
   - If the project uses MCP tools (playwright, etc.), add
     those permissions
   - If the project has specific build/test scripts, add
     those `Bash()` patterns
   - If the project doesn't need web access, drop `WebSearch`
     and `WebFetch`
   Write to `.claude/settings.autonomous.json` (NOT the active
   settings.json — the user toggles it on via
   `~/.claude/hooks/autonomous-toggle.sh`).
9. Ensure `plans/` and `.claude/` are in `.gitignore`.

## Document hygiene

These rules apply to every file generated in the plan directory:

- **No file > 500 lines.** If a document is growing past this,
  split it. The executor will read these into its context window —
  a 1000-line file wastes half the window on one doc.
- **Front-load the important content.** The first 50 lines of
  any doc should contain the information needed to decide whether
  to keep reading. Put tables, summaries, and decisions at the
  top. Put details, examples, and edge cases below.
- **Use PlantUML for all diagrams.** No ASCII art, no prose
  descriptions of relationships. Select the diagram type using
  the rubric in `~/.claude/rules/diagrams.md`.
- **One concept per file.** A task spec is one file. A batch
  overview is one file. Architecture decisions are one file. Don't
  combine unrelated concerns.
- **No minimum length.** A 3-line task file is fine. A one-liner
  decision doc is fine. Every file should be exactly as long as
  it needs to be — no padding, no boilerplate headers that add
  nothing. Short files are cheap to read into context; that's
  the point.
- **The README.md is an index, not a dump.** It links to other
  docs — it does not duplicate their content. If the executor
  needs detail, it follows a link and reads the specific file.
- **Logical directory nesting.** Group by batch, not by doc type.
  The executor works batch-by-batch, so the file structure should
  match the execution order.
