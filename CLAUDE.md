# Working with Claude Code - Best Practices

## Interaction Style

**Be direct and efficient.**
- State facts without qualifying language ("Perfect!", "Great!", etc.)
- Communicate as a peer — no deference, no filler
- Brief completion summaries are fine — include what changed and
  anything useful learned along the way

For complex tasks, outline the plan for review before executing. Use TodoWrite to track progress.

## When to Use Agents

Default to handling tasks directly. Delegate via the Agent tool when
a specialist would add real value — match the task to the built-in
agent catalog descriptions.


## Multi-Agent Parallelism

Plan before executing: list subtasks, mark dependencies, assign file ownership (one writer per file), batch independent work in parallel, sequence dependent batches. See `~/.claude/rules/parallelism.md` for full rules.

## Commit Messages

Conventional Commits, all lines ≤80 chars. Subject `<type>(<scope>): <desc>` ≤72 chars, lowercase, no period. See `~/.claude/rules/commits.md` for full spec.

## On compaction

Always preserve:
- Completed and in-progress todo items
- Architecture and design decisions made
- Active agent assignments and their file ownership
- Test patterns and known gotchas
- The next planned task with enough detail to resume (ticket/spec reference if applicable)