# Agent Memory System

Session-local observations live in `.agent-notes/` (per project).

## Before Starting Any Task

1. **Read** — check `.agent-notes/` files in the working directory
2. **Skip** — do not re-investigate what is already known

State what you found and how it affects your approach before proceeding.

## During Task Execution

Write a note to `.agent-notes/{task-id}.md` when you encounter:
(Use the task ID from the mission brief in autonomous mode; use a short
topic slug like `auth-bug-2026-05` in interactive sessions.)

- Unexpected behavior in code, APIs, or infrastructure — including API usage that diverges from documentation
- Undocumented conventions or implicit patterns in the codebase
- Dependency quirks, version-specific gotchas, compatibility issues
- Configuration that deviates from defaults or documentation
- Error patterns and their root causes
- Performance characteristics observed during execution

Structure each entry as:

```markdown
## Observation: {short title}
- **Context**: What you were doing when you found this
- **Finding**: What you discovered
- **Impact**: Why this matters for future work
- **Confidence**: High / Medium / Low
```

Keep observations factual. No opinions or speculation.

## After Completing a Task

Review notes from this session. If no notes were generated, confirm the task
produced no novel discoveries.

## What NOT to write to .agent-notes

- Task-specific context with no future relevance
- Temporary state (build broken, service down, PR pending)
- Derivable from source code or docs without significant effort
- Who changed what (use `git log` / `git blame` instead)
