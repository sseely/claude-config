# Claude Code — Global Instructions

## Interaction Style

- Be direct. No filler phrases ("Perfect!", "Great!", "Certainly!"), no pleasantries.
- After completing a task, briefly summarize what was done and the reasoning behind any non-obvious decisions. Identify any agents used.

## Verification

Before answering questions about code, APIs, or libraries, use tools first:

- **API/library behavior** → read the docs or use Context7 before answering
- **File content** → Read the file; don't assume what it contains
- **Recent facts** → WebSearch first; training data may be stale
- **Uncertain** → state the uncertainty explicitly; don't fill gaps with guesses

Confidence levels — declare these when the accuracy of a claim matters:

- **HIGH**: Verified via tool or cited source
- **MEDIUM**: Single source, or strong training knowledge — add a caveat
- **LOW**: Memory only, unverified — say so
- **UNKNOWN**: Cannot verify — admit it rather than fabricate

## On Compaction

CLAUDE.md is automatically reloaded from disk after compaction —
it survives verbatim. Instructions lost after compaction were given
only in conversation, not written to CLAUDE.md.

A `PostCompact` hook injects `~/.claude/post-compact-context.md`
for content that isn't in any instruction file: the autonomous
execution recovery sequence.

## Complex Tasks

For multi-part tasks or more than ~2 pages of output:
1. Present an outline for review before executing
2. Complete one section at a time
3. Use TodoWrite to track progress

For features requiring 1-4 hours of autonomous work, use `/plan-mission` to generate a mission brief first.

## Agents

Agents live in `~/.claude/agents/`. Invoke via the Agent tool with `subagent_type` matching the agent's `name`. Default to handling tasks directly for tasks under ~30 min; delegate when the task clearly falls within a specialist's domain. Agent descriptions are loaded automatically. Always announce which agent you are invoking and why before calling it.

## Multi-Agent Parallelism

Plan before executing: list subtasks, mark dependencies, assign file ownership (one writer per file), batch independent work in parallel, sequence dependent batches. See `~/.claude/rules/parallelism.md` for full rules.

## Commit Messages

Conventional Commits, all lines ≤80 chars. Subject `<type>(<scope>): <desc>` ≤72 chars, lowercase, no period. See `~/.claude/rules/commits.md` for full spec.

## Rules

All rules live in `~/.claude/rules/`:
- **code-principles.md** — YAGNI (design decisions, not spec fidelity), SOLID, no magic strings, native fetch
- **security.md** — input validation, secrets handling, error hygiene
- **testing.md** — TDD, 90/90/90 coverage, assertion quality
- **testability.md** — pure functions, functional core/imperative shell, DI as mechanism
- **commits.md** — Conventional Commits format and full spec
- **parallelism.md** — multi-agent execution, file ownership, batching rules
- **autonomous-execution.md** — mission briefs, quality gates, compaction recovery
- **memory.md** — Mem0 usage, scoping, curator criteria
- **lsp.md** — code navigation with typescript-lsp, pyright-lsp, rust-analyzer-lsp
- **extended-thinking.md** — when to use extended thinking and how to request it
- **logging.md** — structured JSON logs, log levels, required fields, no PII
- **error-handling.md** — throw vs return, wrap at boundaries, message quality
- **api-design.md** — resource naming, standard envelopes, versioning strategy
- **observability.md** — SLO-first design, RED metrics, distributed tracing, alerting
- **architecture.md** — blast radius layers, ADRs, fitness functions, reversibility
- **research-sources.md** — 5-tier source hierarchy for technical claims and design decisions
- **prompting-quality.md** — constraint keywords, specificity, instruction bloat, session hygiene
- **environment.md** — env var naming (CAPS_SNAKE), startup validation, logging redaction
- **naming-conventions.md** — folder layout, file naming, symbol naming, database naming
- **pr-workflow.md** — branch naming, PR size (≤400 lines), merge strategy, pre-existing violations
- **retry-idempotency.md** — 3-attempt backoff, jitter, idempotency keys, when not to retry

## Agent Memory

Search Mem0 before every task; state what you found and how it affects scope. See `~/.claude/rules/memory.md`.
