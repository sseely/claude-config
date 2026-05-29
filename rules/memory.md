# Agent Memory System

Two-tier memory: local `.agent-notes/` observations (per session) +
long-term Mem0 via MCP (cross-session).

## Before Starting Any Task

1. **Recall** — search Mem0 for prior discoveries related to the
   task, codebase, or pattern
2. **Read** — check local `.agent-notes/` files in the working
   directory
3. **Skip** — do not re-investigate what is already known

State what you found and how it affects your approach before
proceeding.

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

1. Review notes from this session
2. If no notes were generated, confirm the task produced no novel
   discoveries
3. Do not write directly to Mem0 — the memory-curator agent handles
   promotion

## Memory Scoping

Every memory stored in Mem0 must be tagged with a scope:

- `repo:{name}` — specific to one repository (conventions, quirks,
  config deviations)
- `project:{name}` — spans multiple repos (integration patterns,
  cross-repo dependencies)
- `org` — universally applicable (cloud gotchas, infrastructure
  patterns, language-level findings)

Default to the narrowest accurate scope. Ask: "Would an agent on a
different repo benefit?" → project. "Different project?" → org.

## Memory Durability

- `important` — durable fact unlikely to change; persists until
  explicitly contradicted
- `contextual` — true now, likely to change; gets a 30-day TTL

## Search Behavior

Default search order before a task (narrowest scope first):
1. `repo:{current-repo}` scope
2. `project:{name}` scope
3. `org` scope
4. Merge, deduplicate, inject into context

Always state what memories were found and from what scope. Flag
cross-scope memories: "This was observed in {scope} — verify it
applies here before relying on it." Never silently apply them.

## Curator Criteria (sponge-worthy evaluation)

### Store in Mem0 if the observation is

- **Reusable** — another agent on a different task would benefit
- **Non-obvious** — not discoverable in 60 seconds of reading docs
- **Stable** — unlikely to change in the next sprint/release
- **Actionable** — knowing this changes how you approach the work

### Do not store if

- Task-specific context with no future relevance
- Duplicates something already in Mem0 (search first)
- Temporary state (build broken, service down, PR pending)
- Derivable from source code or docs without significant effort

When storing: deduplicate, synthesize duplicates into one clean
memory, tag scope + durability, update contradicted memories rather
than creating conflicting entries.

## Mem0 MCP Tools

| Tool | Use When |
|---|---|
| `search_memories` | Before any task; unexpected behavior; missing context |
| `add_memory` | Curator agent only, after sponge-worthy evaluation |
| `update_memory` | Stored memory is partially outdated |
| `delete_memory` | Stored memory is fully obsolete or wrong |
| `list_memories` | Auditing what's stored for a given scope |
