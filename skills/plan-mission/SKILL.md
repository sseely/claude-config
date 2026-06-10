---
name: plan-mission
description: >
  Turn a feature idea into a mission brief for autonomous execution.
  Explores the existing codebase, identifies affected files, surfaces
  architecture decisions, and generates a filled-in mission brief.
  Accepts a feature description as $ARGUMENTS.
disable-model-invocation: false
allowed-tools: Bash, Read, Grep, Glob, Agent, Write, Edit, TodoWrite
---

# Plan Mission

Turn a feature description into a complete mission brief that can
drive 1-4 hours of autonomous execution.

**Input:** `$ARGUMENTS` — a plain-English description of the feature
or change. May be a single sentence or multiple paragraphs.

If `$ARGUMENTS` is empty, ask the user to describe what they want
built.

## Phase 1 — Understand the codebase

Check whether an architecture overview exists in the current project.
Look in this order:

1. `docs/architecture/overview.md`
2. `architecture/overview.md` (top-level)

If found, read it and skip to Phase 2. If neither exists, tell the user:

> No architecture overview found. Run `/explore` first for the
> best results, or I can do a lighter-weight scan now.

If the user says to proceed without `/explore`, do a lightweight
scan:

1. Read `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`,
   `*.csproj`, `*.sln`, or equivalent to identify the stack.
2. Read the project's `CLAUDE.md` or `README.md` if present.
2a. If a `src/` or `app/` directory exists, read one representative API
    handler file (look for files named `handler`, `controller`, `router`,
    or the first file in `routes/`). Record the request/response shape.
2b. If an ORM or schema file exists (look for `schema.prisma`, `models/`,
    `db/models/`, `*.model.ts`, `*.entity.ts`), read one data model.
    Record its fields and relationships.
3. Identify the test framework and how to run tests
   (`npm test`, `pytest`, `go test`, etc.).
4. Identify the linter and how to run it.
5. Identify the build command if applicable.
6. Map the top-level directory structure (`ls -1` at root, then
   one level deep in `src/` or equivalent).

Record findings in a scratchpad (TodoWrite or inline) — do NOT
write files yet.

## Phase 2 — Identify the blast radius

Think system-first, files-last. Work through these four layers in order
before producing the file table.

**Layer 1 — Data model**
Does the feature change a schema, data format, or storage structure?
What reads the current format? Is a migration required, and can it
run without downtime?

**Layer 2 — API contracts**
Does the feature change request/response shapes, status codes, or
field semantics for any endpoint or event? Who are the consumers
(other services, mobile clients, third parties)? Is this a breaking
or non-breaking change per `architecture.md`?

**Layer 3 — Service dependencies**
Does the feature add, remove, or change a call to another service,
queue, or external API? What is the failure mode if that dependency
is unavailable?

**Layer 4 — Files**
Only after the above: which source files change, which are created,
and which are read-only context.

Using the codebase understanding from Phase 1 and the feature
description, answer each layer, then present the file table:

```
| File | Action | What changes |
|------|--------|-------------|
| src/api/subscribe.js | Modify | Replace direct add with token flow |
| src/api/confirm.js | Create | Token verification endpoint |
| ... | ... | ... |
```

Also note: new packages, env vars, and database changes.

Ask: **"Does this blast radius look right? Anything missing or
out of scope?"**

Wait for user confirmation before proceeding.

## Phase 3 — Surface architecture decisions

Identify decisions that need to be made before implementation.
These are choices where:
- Multiple valid approaches exist
- The choice affects multiple files or the data model
- Reversing the choice later would be expensive

For each decision, present:
- The question
- 2-3 options with tradeoffs
- A recommendation with rationale

Example:
> **Decision: Where to store pending tokens?**
> - Option A: KV store (simple, auto-expiry via TTL, no migrations)
> - Option B: D1 database (queryable, needs migration, manual expiry)
> - Recommendation: KV — single key-value lookup, native TTL

Present all decisions together and ask the user to approve or
override each one. These become the "Architecture Decisions
(pre-made)" section of the brief.

## Phase 4 — Operational readiness

Before decomposing tasks, answer these questions and present the
answers for user confirmation. These are not architecture decisions
(those are Phase 3) — they are operational requirements that must
be satisfied before the feature can be considered done.


**Observability**
- What are the SLIs for this feature? (rate, error rate, latency
  for each key operation)
- What are the alert thresholds — i.e. what value of each SLI means
  "this is broken"?
- What traces need instrumentation? (every new service call, every
  background job)
- Is there an existing dashboard to update, or does one need to be
  created?

**Rollback strategy**
Classify the change as one of:
- **Reversible** — can be rolled back by reverting the deploy
- **Reversible with migration** — can be rolled back, but requires
  a compensating data migration
- **Irreversible** — cannot be rolled back once deployed to production

If Irreversible: flag it as a mission brief constraint and require
explicit user acknowledgement before proceeding.

**Scalability envelope**
- What is the expected load at launch? At 10x?
- Is there a component that becomes a bottleneck before 10x? (DB
  query, cache miss, external API rate limit, lock contention?)
- Is the feature gated behind a flag for gradual rollout?

**On-call story**
- What are the 2–3 most likely production failure modes?
- For each: how does an on-call engineer detect it (metric, log
  pattern, alert)? What is the immediate mitigation?
- Does this require a new runbook entry or `// on-call:` comment?

**Backwards compatibility**
- Does this change any API contract (request shape, response shape,
  status codes, field semantics)?
- Does this change any data schema visible to consumers?
- If yes: what is the migration strategy? (versioning, dual-write,
  deprecation period, coordinated deploy?)

Ask: **"Does this operational readiness picture look right?
Anything to add or change before we decompose tasks?"**

Wait for user confirmation before proceeding.

## Phase 5 — Decompose into tasks

Break the work into tasks. File ownership and agent prompt structure
follow `parallelism.md`. Additionally:

1. Each task = one commit
2. No two tasks in the same batch write the same file
3. Every task that modifies logic includes its tests (TDD)
4. Write 2-5 acceptance criteria per task in Given/When/Then format
   — each becomes both the definition of done and the test spec
5. For each task that another task depends on, declare its output interface
   — the data shape the dependent task will consume. Keep it minimal:
   field names, types, and any nullability constraints. This becomes the
   "Interface contracts" section in the task file.

Present the task sequence to the user:

```
Batch 1 (parallel):
  T1: [description] → agent: [type], writes: [files]
      Interface outputs: { tokenId: string, expiresAt: Date } (consumed by T2)
      - Given a valid token, when POST /confirm, then 201 + subscription activated
      - Given an expired token, when POST /confirm, then 410 Gone
  T2: [description] → agent: [type], writes: [files]
      Interface inputs: { tokenId: string, expiresAt: Date } (from T1)

Batch 2 (parallel, after Batch 1):
  T3: [description] → agent: [type], writes: [files], needs: T1
  T4: [description] → agent: [type], writes: [files], needs: T2
```

Ask: **"Does this decomposition look right? Any tasks that should
be split, merged, or reordered?"**

Wait for user confirmation before proceeding.

## Phase 6 — Define stop conditions

Propose stop conditions based on the feature's risk profile:

- **Always include:** files outside write-set need changes,
  2 consecutive gate failures, architecture decision contradicted
- **For features touching auth/payments/data:** add "stop if
  security implications are unclear"
- **For features with external API calls:** add "stop if API
  behaves unexpectedly"
- **For large refactors:** add "stop if >N files need changes
  beyond the planned write-set"

Also propose push-forward conditions (things the AI should decide
on its own).

Present both lists. Ask: **"Any stop conditions to add or remove?"**

## Phase 7 — Generate the mission brief and project settings

The brief is a **directory of focused documents**, not a single
monolithic file. This keeps each doc within a healthy context
window and avoids burying critical information deep in a long file.

### Directory structure

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
    data-flow.md         ← mermaid sequence diagrams
    component-map.md     ← mermaid graph of affected components
  decision-journal.md    ← empty at creation, appended during
                           execution
```

Phases may have sub-phases. If a batch has >5 tasks, split it
into sub-directories (`batch-2a/`, `batch-2b/`) with their own
overview docs.

### Generation steps

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
6. Write mermaid diagrams in `diagrams/`:
   - `data-flow.md` — sequence diagrams for key flows affected
     by the feature
   - `component-map.md` — graph showing which components are
     touched and how they relate
   Use mermaid fenced blocks (```mermaid).
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

## Phase 8 — Pre-flight check

Before handing off, verify:

- [ ] Every file in every task's write-set exists (for Modify) or
      its parent directory exists (for Create)
- [ ] The test command runs successfully right now (baseline green)
- [ ] The lint command runs successfully right now (baseline clean)
- [ ] The feature branch doesn't already exist
- [ ] No uncommitted changes in the working tree that would
      interfere
- [ ] Every task spec includes observability requirements (even
      if "N/A")
- [ ] Every task spec includes rollback classification
- [ ] Any Irreversible change has explicit user acknowledgement
      recorded in `decisions.md`

Report results. If anything fails, fix it or flag it.

Print the path to the generated brief and tell the user:

> Mission brief ready at `plans/[name]/README.md`.
> To start autonomous execution:
> 1. `~/.claude/hooks/autonomous-toggle.sh on .`
> 2. "Execute the mission brief at plans/[name]/README.md"
> Recommended execution model: `claude-fable-5` (long-horizon, native 1M context). Enable with `~/.claude/hooks/autonomous-toggle.sh on`.

## Rules

- Never skip a user confirmation step. Phases 2, 3, 4, 5, and 6
  each require explicit user approval.
- If the user changes a decision, propagate the change to all
  affected tasks before moving forward.
- Keep task granularity small: a single task should be completable
  in 5-15 minutes of AI work. If it seems larger, split it.
- Tests are part of the task, not separate tasks. A task that
  writes `confirm.js` also writes `confirm.test.js`.
- Use the project's existing patterns. If tests use vitest, don't
  introduce jest. If the project uses snake_case, don't introduce
  camelCase.

## Document hygiene

These rules apply to every file generated in the plan directory:

- **No file > 500 lines.** If a document is growing past this,
  split it. The executor will read these into its context window —
  a 1000-line file wastes half the window on one doc.
- **Front-load the important content.** The first 50 lines of
  any doc should contain the information needed to decide whether
  to keep reading. Put tables, summaries, and decisions at the
  top. Put details, examples, and edge cases below.
- **Use mermaid for all diagrams.** No ASCII art, no prose
  descriptions of relationships. Mermaid renders in most editors
  and is token-efficient.
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

## Model Routing

Use these defaults when invoking agents during brief generation:

| Phase | Task | Model |
|-------|------|-------|
| Brief execution (autonomous) | Long-horizon autonomous execution (this brief) | `claude-fable-5` — native 1M context; use via autonomous-toggle |
| Phase 3 | Architecture decisions (multiple competing trade-offs) | Opus + adaptive thinking |
| Phase 4 | Operational readiness questions | Sonnet |
| Phase 5 | Task decomposition | Opus + adaptive thinking |
| Phase 7 | Brief file generation (mechanical writing) | Sonnet |
| Parallel review agents in Phase 2 | File-by-file analysis | Sonnet |

Request extended thinking for Phase 3 and 5 explicitly:
"Think through the trade-offs before recommending an approach."

**Brevity constraints for Opus phases** (per arxiv:2604.00025 — Opus over-elaborates on
planning tasks without explicit constraints):
- Phase 3: "Return only the architecture decisions. Format: numbered ADR list, one sentence
  each for Context / Decision / Consequences. No prose introduction or trailing summary."
- Phase 5: "Return only the task breakdown. Format: numbered task list with write-set,
  read-set, and acceptance criteria per task. No prose introduction or trailing summary."
