# Claude Code — Global Instructions

## Interaction Style

- Be direct. No filler phrases ("Perfect!", "Great!", "Certainly!"), no pleasantries.
- After completing a task, briefly summarize what was done and the reasoning behind any non-obvious decisions. Identify any agents used.

## Complex Tasks

For multi-part tasks or more than ~2 pages of output:
1. Present an outline for review before executing
2. Complete one section at a time
3. Use TodoWrite to track progress

For features requiring 1-4 hours of autonomous work, use `/plan-mission` to generate a mission brief first.

## Agents

Agents live in `~/.claude/agents/`. Invoke via the Agent tool with `subagent_type` matching the agent's `name`. Default to handling tasks directly; delegate when the task clearly falls within a specialist's domain. Agent descriptions are loaded automatically. Always announce which agent you are invoking and why before calling it.

## Multi-Agent Parallelism

Plan before executing: list subtasks, mark dependencies, assign file ownership (one writer per file), batch independent work in parallel, sequence dependent batches. See `~/.claude/rules/parallelism.md` for full rules.

## Commit Messages

Conventional Commits, all lines ≤80 chars. Subject `<type>(<scope>): <desc>` ≤72 chars, lowercase, no period. See `~/.claude/rules/commits.md` for full spec.

## Rules

See `~/.claude/rules/` for: code-principles (YAGNI, SOLID, no magic
strings, native fetch), security (validation, secrets, error hygiene),
testing (TDD, 90/90/90 coverage), commits (Conventional Commits),
parallelism (multi-agent execution), autonomous-execution (mission briefs).

## Agent Memory

Two-tier: local `.agent-notes/` observations + long-term Mem0 via MCP.
The `memory-curator` agent handles promotion. See `MEMORY_SYSTEM.md`.

## On Compaction

After compaction, treat all prior context as stale. Re-read CLAUDE.md
and the active mission brief (if any) before continuing. See
`autonomous-execution.md` for the full post-compaction recovery sequence.
