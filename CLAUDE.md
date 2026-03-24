# Claude Code — Global Instructions

## Interaction Style

- Be direct. No filler phrases ("Perfect!", "Great!", "Certainly!"), no pleasantries.
- After completing a task, briefly summarize what was done and the reasoning behind any non-obvious decisions. Identify any agents used.

## Complex Tasks

For multi-part tasks or more than ~2 pages of output:
1. Present an outline for review before executing
2. Complete one section at a time
3. Use TodoWrite to track progress

## Agents

Agents live in `~/.claude/agents/`. Invoke via the Agent tool with `subagent_type` matching the agent's `name`. Default to handling tasks directly; delegate when the task clearly falls within a specialist's domain. Agent descriptions are loaded automatically. Always announce which agent you are invoking and why before calling it.

## Multi-Agent Parallelism

Plan before executing: list subtasks, mark dependencies, assign file ownership (one writer per file), batch independent work in parallel, sequence dependent batches. See `~/.claude/rules/parallelism.md` for full rules.

## Commit Messages

Conventional Commits, all lines ≤80 chars. Subject `<type>(<scope>): <desc>` ≤72 chars, lowercase, no period. See `~/.claude/rules/commits.md` for full spec.

## Code Design Principles

YAGNI, SOLID, no magic strings or literals in production code. See `~/.claude/rules/code-principles.md`.

## Testing

TDD (red-green-refactor), no magic strings or literals repeated across test files. See `~/.claude/rules/testing.md` for full conventions.

## Autonomous Execution

Mission-brief-driven autonomous sessions. See `~/.claude/rules/autonomous-execution.md` for full protocol.

## On Compaction

Always preserve:
- Completed and in-progress todo items
- Architecture and design decisions made
- Active agent assignments and their file ownership
- Test patterns and known gotchas
- The next planned task with enough detail to resume

After compaction, treat all prior context as stale. Re-read the full CLAUDE.md
chain before continuing.
