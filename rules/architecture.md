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

Write an ADR for a decision that affects multiple services/teams,
changes a data model or API contract, introduces a new dependency, is
expensive to reverse, or contradicts an existing pattern. Format
(Status/Context/Decision/Consequences) and a 1-page-max guideline:
`docs/reference/architecture.md`.

## Fitness functions

Fitness functions: automated tests verifying architectural invariants in
CI. Examples: 'no cross-handler imports', 'auth middleware on all
handlers', 'no direct DB access outside repository/'. Express every
architectural constraint as a lint/import check/test — not code review.

## Reversibility

**Reversibility premium:** prefer reversible decisions. When two
approaches are otherwise equivalent, choose the one that's easier to
undo.

Mark irreversible decisions explicitly:
```
// IRREVERSIBLE: once deployed, existing records cannot be migrated back.
// See ADR-042 for the decision rationale.
```

Irreversible changes require an ADR, an explicit rollback plan
documented in the PR, and staged rollout (dark launch or feature flag)
where possible.

## Backwards compatibility and migrations

Non-breaking vs. breaking-change taxonomy, versioning guidance, the
migration-pattern table (strangler fig, expand-contract, feature flag,
blue-green, dark launch), and backfill requirements (batch size,
resumability, abort switch) are in `docs/reference/architecture.md`.
Choose the pattern and write the rollback path before the forward path.

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
