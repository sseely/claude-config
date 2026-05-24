# Multi-Agent Parallelism

Before executing any task that involves multiple agents or multiple independent workstreams, always produce an execution plan and present it for review before proceeding:

**Exception — autonomous mode:** When a mission brief is active (`plans/` directory referenced
at session start), skip the user review presentation step. Log the execution plan to
`decision-journal.md` instead and proceed immediately.

1. **List the subtasks** — what needs to happen
2. **Mark dependencies** — which subtasks require output from another before they can start
3. **Assign file ownership** — for each subtask, list the files it will write; if two agents would write the same file, collapse them into one agent with combined instructions
4. **Batch independent work** — invoke all dependency-free subtasks with non-overlapping write sets as parallel agent calls in a single response
5. **Sequence dependent work** — only after a batch completes, start the next dependent batch

**Trigger this planning step when:**
- More than one file, module, or component needs the same type of work (analysis, refactoring, test writing)
- A feature spans multiple domains (e.g., backend + frontend + tests)
- A task has a research phase and an implementation phase that can be split

**File ownership rules:**
- Each file may only be written by one agent at a time
- If two planned agents would write the same file, collapse them into a single agent with the combined instructions
- Related changes across multiple files that must stay consistent (e.g., an interface change + all its call sites) are assigned to one agent as a logical unit
- Read-only access is unrestricted — multiple agents may read the same file concurrently
- If the plan produces a write conflict that can't be resolved by collapsing, that's a signal the subtasks aren't actually independent and should be a single agent

**Agent prompt structure:**

Subagents start with a blank slate — no conversation history, no
CLAUDE.md, no awareness of prior decisions. Every agent prompt
must be self-contained:

0. **Relevant memories** — If the orchestrator found Mem0 memories relevant to this
   task, they are injected verbatim here. Do not rely on the agent to self-recall;
   the orchestrator's job is to pre-load this context.
1. **Context** — what the project is, what stack it uses, and
   what conventions to follow (test framework, naming, patterns)
2. **Task** — what to build or change, with enough detail that
   the agent doesn't need to guess
3. **Write-set** — which files to create or modify (explicitly)
4. **Read-set** — which files to read for context before starting
   (e.g., "read `src/api/subscribe.js` for the existing pattern")
5. **Architecture decisions** — any pre-made decisions relevant
   to this task (e.g., "use KV not D1", "use vitest not jest")
6. **Interface contracts** — types, function signatures, or data
   shapes this task must produce or consume
7. **Quality bar** — "run `npm test` before finishing; all tests
   must pass"
8. **Commit format** — One commit per completed task. Message format per
   `~/.claude/rules/commits.md`: `type(scope): description` ≤72 chars, lowercase,
   no period. Body explains why if >3 files change.

Omit sections that don't apply, but never omit context, task, or
write-set. If the agent lacks enough information to do the work
without guessing, the prompt is too thin.

**Default rule:** If subtasks don't share write targets and don't depend on each other's output, run them in parallel. Don't serialize work that can be parallelized.

## Model Selection

Match model to task complexity and cost:

| Role | Model | When |
|------|-------|------|
| Planning / architecture | Opus (adaptive thinking) | Phase 3 decisions, mission decomposition, threat modeling |
| Implementation | Sonnet | Feature work, bug fixes, refactoring, code generation |
| Scoring / dedup / validation | Haiku | Confidence scoring, dedup passes, format checking, simple grep tasks |

Default to Sonnet for implementation agents unless the task requires deep
multi-path reasoning. Use Haiku aggressively for any agent whose job is to
evaluate, score, or format — not to create.

**Opus behavioral compensation:**

When routing a task to Opus, add these constraints to the prompt to counteract
known Opus tendencies (validated in production):

- Do NOT infer unstated requirements — implement the simplest interpretation
- Do NOT over-engineer — no speculative abstractions or extension points
- Do NOT spawn subagents unless the task explicitly requires it
- If scope is ambiguous, implement the minimal interpretation and note the
  ambiguity; do not silently expand

**Anti-patterns to avoid:**

| Anti-pattern | Why it hurts | Fix |
|---|---|---|
| Opus for trivial edits | 5–10× cost with no quality gain | Use Sonnet; reserve Opus for multi-path architectural decisions |
| Max thinking for routine tasks | 2–4× token multiplier | Adaptive thinking only when 3+ significantly different approaches exist (see `extended-thinking.md`) |
| Haiku for code generation | Under-powered; produces more errors requiring fix loops | Sonnet minimum for any task that writes or modifies code |
| Sonnet for simple scoring/grep | Wasted cost | Haiku for pass/fail checks, dedup, format validation |
