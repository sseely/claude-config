# Code Design Principles

## YAGNI — You Aren't Gonna Need It

Only build what is explicitly required right now.

- No speculative abstractions, hooks, or extension points for
  "future" requirements that haven't been asked for
- No configuration knobs that have only one caller
- No helper functions written in anticipation of reuse that doesn't
  yet exist
- Three similar lines of code is better than a premature abstraction

If a future requirement arrives, refactor then. Not now.

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
