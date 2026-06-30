# Claude Code — Global Instructions

## Interaction Style

- Be direct. No filler phrases ("Perfect!", "Great!", "Certainly!"), no pleasantries.
- After completing a task, briefly summarize what was done and the reasoning behind any non-obvious decisions. Identify any agents used.

## Verification

Before answering questions about code, APIs, or libraries, use tools first:

- **API/library behavior** → fetch the official docs (WebFetch) before answering
- **File content** → Read the file; don't assume what it contains
- **Recent facts** → WebSearch first; training data may be stale
- **Uncertain** → state the uncertainty explicitly; don't fill gaps with guesses

Confidence levels — declare these when the accuracy of a claim matters:

- **HIGH**: Verified via tool or cited source
- **MEDIUM**: Single source, or strong training knowledge — add a caveat
- **LOW**: Memory only, unverified — say so
- **UNKNOWN**: Cannot verify — admit it rather than fabricate

## Session Notes

Check `.agent-notes/` in the working directory before any task. Write observations during execution. See `~/.claude/rules/memory.md`.

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

Agents live in `~/.claude/agents/`. Invoke via the Agent tool with `subagent_type` matching the agent's `name`. Default to handling tasks directly for tasks under ~30 min; delegate when the task clearly falls within a specialist's domain. Agent descriptions are loaded automatically. Always announce which agent you are invoking and why before calling it. Use Workflow (via `Workflow` tool) for multi-step parallel orchestration with deterministic control flow. Prefer Agent tool for individual specialist delegation. Workflow is user-opt-in only — never invoke unless the user explicitly requests it or a skill instructs it.

## Multi-Agent Parallelism

Plan before executing: list subtasks, mark dependencies, assign file ownership (one writer per file), batch independent work in parallel, sequence dependent batches. See `~/.claude/rules/parallelism.md` for full rules.

## Commit Messages

Conventional Commits, all lines ≤80 chars. Subject `<type>(<scope>): <desc>` ≤72 chars, lowercase, no period. See `~/.claude/rules/commits.md` for full spec.

## Diagnosis

When an observed discrepancy appears (failing test, oracle mismatch, symptom contradicting intent), enter diagnosis mode per `~/.claude/rules/diagnosis.md`: state the mechanism — cause, `file:line` origin, causal chain, what you ruled out — before proposing any fix. Symptom gone ≠ done. Does not apply to greenfield work with no observed defect.

## Rules

All rules live in `~/.claude/rules/`:
- **code-principles.md, security.md, testing.md, testability.md** — code quality
- **parallelism.md, autonomous-execution.md, memory.md** — agent execution
- **lsp.md, extended-thinking.md, prompting-quality.md** — tooling and prompting
- **logging.md, error-handling.md, api-design.md, observability.md** — quality standards
- **diagnosis.md** — root-cause discipline for observed defects
- **architecture.md, research-sources.md, environment.md** — design and environment
- **naming-conventions.md, pr-workflow.md, commits.md, retry-idempotency.md** — workflow
