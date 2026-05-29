# Architecture

## Blast radius — think system-first, files-last

When assessing impact, work outward from the center:

1. **Data model** — does this change a schema, data format, or storage
   structure? What reads the old format? What migration is required?
2. **API contracts** — does this change request/response shapes, status
   codes, or field semantics? Who are the consumers (other services,
   mobile clients, third parties)?
3. **Service dependencies** — does this add, remove, or change a call
   to another service? What is the failure mode if that dependency is
   unavailable?
4. **Files** — which source files change? (This is where most reviews
   start; it should be the last concern, not the first.)

A change that touches 3 files but breaks an undocumented API contract
is far more dangerous than one that touches 30 files internally.

## Architecture Decision Records (ADRs)

Write an ADR when a decision:
- Affects multiple services or teams
- Changes a data model or API contract
- Introduces a new dependency or technology
- Is expensive or painful to reverse
- Contradicts an existing pattern in the codebase

ADR format:

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

## Fitness functions

Fitness functions are automated tests that verify architectural properties
— invariants that must hold as the codebase evolves.

Examples:
- "No module in `api/` may import from `api/` (no cross-handler imports)"
- "All HTTP handlers must be registered through the auth middleware"
- "No direct DB access outside the `repository/` layer"
- "Package dependency graph must be acyclic"

Fitness functions belong in CI, not in code review. If an architectural
rule matters, automate its enforcement. Relying on humans to catch
violations in review is unreliable.

When you introduce an architectural constraint, ask: can this be expressed
as a lint rule, import check, or test? If yes, write it.

## Reversibility

**Reversibility premium:** prefer reversible decisions. When two
approaches are otherwise equivalent, choose the one that's easier to
undo.

Mark irreversible decisions explicitly:
```
// IRREVERSIBLE: once deployed, existing records cannot be migrated back.
// See ADR-042 for the decision rationale.
```

Irreversible changes require:
- An ADR
- An explicit rollback plan documented in the PR
- Staged rollout (dark launch or feature flag) where possible

## Backwards compatibility

### Non-breaking (safe to deploy without coordination)
- Adding a new optional field to a response
- Adding a new endpoint
- Relaxing a validation (accepting more values)
- Adding a new enum value a client can ignore

### Breaking (requires versioning or coordinated migration)
- Removing or renaming a field
- Changing a field's type or nullability
- Removing an endpoint
- Changing HTTP method or status codes
- Tightening a validation (rejecting previously-accepted values)
- Reordering positional parameters

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

## Evolutionary architecture

- **Encapsulate variation** — put the thing most likely to change behind
  an interface. Don't expose implementation details across module
  boundaries.
- **Limit coupling** — measure coupling by the number of callers that
  must change when a component changes. High coupling is a liability.
- **Prefer composition over inheritance** — inheritance creates tight
  coupling to parent behavior. Composition is reversible.
- **Conway's Law is real** — if two teams own a component jointly, it
  will develop a seam between their ownership boundaries. Design for
  that seam explicitly.

## When to escalate

Stop and get architectural review (not just code review) when:
- A proposed change would cross a service boundary not in the current
  design
- A proposed change would require modifying a published API contract
- A proposed change requires a database migration on a table with > 1M
  rows or accessed by multiple services
- Two valid approaches exist and the choice affects multiple teams
