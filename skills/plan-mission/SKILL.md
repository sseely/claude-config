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

## Phase 0 — Resume check

**Resume check**: Before doing anything, check `.plan-mission-progress.md`
in the project root. This mirrors the resume-gate pattern in
`skills/self-improve/SKILL.md` Phase 0.

If it exists:
- Read it. It records, for each phase (1 through 7), whether that
  phase's output is `pending`, `in-progress`, or `confirmed` — and for
  phases 2-6 it embeds the confirmed content itself (file table,
  architecture decisions, operational-readiness answers, task
  decomposition, stop conditions).
- Skip straight past any phase marked `confirmed` or `done` — reuse the
  recorded content instead of re-deriving it.
- Resume from the first phase marked `pending`, `in-progress`, or
  absent. If a phase's analysis exists but is not yet `confirmed`,
  re-present that existing output to the user for confirmation — do
  not redo the analysis.
- If the file doesn't exist, this is a fresh run: start at Phase 1.

After completing Phase 1, and after every user confirmation in Phases 2
through 6, and after Phase 7 finishes, write or update
`.plan-mission-progress.md`:

```
# Plan Mission Progress — [feature-name]

## Phase 1: done
[stack, test/lint/build commands, directory map]

## Phase 2: confirmed
[file table]

## Phase 3: confirmed
[architecture decisions]

## Phase 4: confirmed
[operational readiness answers]

## Phase 5: confirmed
[task decomposition]

## Phase 6: confirmed
[stop / push-forward conditions]

## Phase 7: done
Brief written to plans/[feature-name]/
```

Delete `.plan-mission-progress.md` once Phase 8 passes and the brief is
handed off — its content now lives in the generated brief.

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

Full directory layout and the step-by-step generation procedure are
in [references/brief-structure.md](references/brief-structure.md) —
read that file when you reach this phase. Summary of what gets
created under `plans/[feature-name]/`:

- `README.md` — overview + index (the only file the executor MUST
  read on startup)
- `decisions.md` — architecture decisions from Phase 3
- `batch-N/overview.md` + `batch-N/TN-[name].md` — per-batch task
  specs (context, read-set, write-set, interface contracts,
  observability requirements, rollback notes, acceptance criteria)
- `diagrams/data-flow.md` and `diagrams/component-map.md` — mermaid
  diagrams
- `decision-journal.md` — empty at creation, appended during execution
- `.claude/settings.autonomous.json` — tailored from
  `~/.claude/templates/autonomous-settings.json`

Ensure `plans/` and `.claude/` are in `.gitignore`.

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
> Note: the interactive planning phases you just went through (Phases 1-6, 8) ran on Opus 5, the session's default `opus` alias — this recommendation covers autonomous mission execution only.

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

Full rules (file length limits, front-loading, mermaid usage,
one-concept-per-file, README as index not dump, directory nesting)
are in
[references/brief-structure.md#document-hygiene](references/brief-structure.md#document-hygiene).
They apply to every file generated in the plan directory during
Phase 7.

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
