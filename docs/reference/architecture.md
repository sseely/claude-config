# Architecture — ADR format, compatibility taxonomy, migration patterns

Lookup material for `rules/architecture.md`. The judgment content (blast
radius, reversibility, evolutionary architecture, when to escalate)
lives in that rule file and is always resident; this is the reference
detail it points to.

## ADR format

Write an ADR when a decision:
- Affects multiple services or teams
- Changes a data model or API contract
- Introduces a new dependency or technology
- Is expensive or painful to reverse
- Contradicts an existing pattern in the codebase

```markdown
# ADR-NNN: <short title>

## Status
Proposed | Accepted | Superseded by ADR-NNN

## Context
What problem are we solving? What constraints apply?

## Decision
What did we decide?

## Consequences
What becomes easier? What becomes harder? What new risks are introduced?
```

Keep ADRs short — 1 page maximum. The goal is to record the reasoning,
not to write a design doc.

## Backwards compatibility

**Non-breaking** (safe to deploy without coordination): adding a new
optional field to a response; adding a new endpoint; relaxing a
validation (accepting more values); adding a new enum value a client
can ignore.

**Breaking** (requires versioning or coordinated migration): removing
or renaming a field; changing a field's type or nullability; removing
an endpoint; changing HTTP method or status codes; tightening a
validation (rejecting previously-accepted values); reordering
positional parameters.

For breaking changes: version the API (`/v2/`), dual-write during
migration, then deprecate with a sunset date. Never silently break
consumers.

## Migration patterns

| Pattern | When to use |
|---------|-------------|
| Strangler fig | Replacing a large component incrementally; new and old coexist |
| Expand-contract | Schema migration: add new column/field, migrate data, drop old |
| Feature flag | New behavior with uncertain rollout; enables instant rollback |
| Blue-green | Full environment swap; costly but clean cutover |
| Dark launch | New path receives production traffic but results are discarded |

Choose the pattern before writing migration code. Write the rollback
path before the forward path.

Any backfill must have:
- **Batch size** — bounded batches, never an unbounded table scan
- **Resumability** — a failure partway restarts from where it stopped,
  not from zero
- **Abort switch** — a way to stop an in-flight backfill without leaving
  data half-migrated

For AI-feature decommissioning (GOVERN 1.7/MANAGE 2.4) and third-party
contingency (GOVERN 6.2/MANAGE 3.1) mapped to these patterns, see
`docs/nist-ai-rmf/crosswalk.md`.
