# Code Design Principles

## Build to the defined scope — no more, no less

Before building, identify what defines "done":

- **An external source defines it** — a spec, a ticket enumerating
  requirements, a library or codebase being ported/translated, an API
  contract. Completeness IS that source. Every item is required;
  omitting one is a bug, not a simplification. Do not judge listed
  items as unnecessary and drop them.
- **You are making the design choice** — greenfield, no enumerated
  source. Build what was asked. No speculative abstractions, no config
  knobs with one caller, no extension points for needs nobody stated.
  When a real future requirement arrives, refactor then.

Two equal failure modes: trimming a required item because it "looks
unused," and inventing an unrequested one because it "might help."

## SOLID

**Single Responsibility** — A module, class, or function does one
thing. If you need "and" to describe what it does, split it.

**Open/Closed** — Extend behavior by adding code, not by modifying
existing code. Prefer composition over inheritance.

**Liskov Substitution** — Subtypes must be substitutable for their
base types without breaking callers.

**Interface Segregation** — Prefer narrow, focused interfaces over
fat ones. Callers shouldn't depend on methods they don't use.

**Dependency Inversion** — Depend on abstractions, not concretions.
High-level modules shouldn't import low-level implementation details.

## Defensive code

Don't write guards for states that genuinely cannot occur — but
"cannot occur" means provably so, not merely "shouldn't."

- No error handling or fallbacks for states that cannot occur given
  surrounding invariants — trust internal code and framework guarantees
- No null checks on values the type system or caller contract guarantees
  are non-null
- No validation at internal call sites — validate at system boundaries
  (user input, external APIs) only; don't re-validate between layers
  that share the same invariants

## No magic strings or literals in production code

Any string, number, or value with domain meaning that appears in
more than one place belongs in a named constant, enum, or config
entry — not repeated inline.

**Examples:**
- HTTP status codes used in multiple places → named constant
- Table names, column names referenced in multiple queries → constant
- Repeated timeout/limit values → config or named constant
- Feature flag keys, event names, cookie names → enum or const map

When you spot a repeated literal while working on something else,
extract it. Don't leave it for later.

## HTTP clients

Prefer native `fetch`. Add libraries only when fetch is genuinely
insufficient.

| Runtime | Use | Library fallback |
|---------|-----|-----------------|
| Workers / edge | `fetch` | none — libraries won't bundle |
| Node 18+ | `fetch` | `ky` or `axios` if retry/interceptors needed |
| Browser | `fetch` | none unless project-standardized |
| Deno / Bun | `fetch` | none |

Flag `XMLHttpRequest`, `require('http')`, or unnecessary HTTP
libraries when native fetch would work.

## Dead code policy

See `pr-workflow.md` — Pre-existing violations section.
