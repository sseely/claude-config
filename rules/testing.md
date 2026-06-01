# Testing Conventions

## TDD — Test-Driven Development

Write the test before writing the implementation.

1. **Red** — write a failing test that captures the requirement
2. **Green** — write the minimum code to make it pass
3. **Refactor** — clean up without breaking the test

Don't write implementation code that isn't covered by a test you
wrote first. If you're adding to existing code without tests, write
the tests for the existing behaviour before changing anything.

Exceptions: pure config files, generated code, one-off migration
scripts, and UI markup with no logic.

## DRY in tests

Apply the no-magic-strings rule (see `code-principles.md`) to test
code. Extract repeated values (BASE_URL, auth headers, fixture
builders) to `test/helpers/`.

## Coverage — 90/90/90 rule

Target at least 90% line coverage, 90% branch coverage, and 90%
function coverage. Treat these as a floor, not a ceiling.

Exclude from coverage: generated code, schema migrations, one-off scripts,
pure config files, and test helper files in `test/helpers/`.

## Assertion quality

Every test must assert on specific output values or state changes —
not just non-null / no-exception. Examples:

- **Wrong:** `expect(res).toBeTruthy()`
- **Right:** `expect(res.status).toBe(200)` and
  `expect(body.id).toBe(expectedId)`

- **Wrong:** `expect(() => fn()).not.toThrow()`
- **Right:** `expect(fn()).toEqual({ count: 3, total: 42 })`

If a function's only observable effect is a side effect (DB write,
KV set, email sent), assert on that state change directly — query
the DB or read back the KV value in the same test.

## Test helper location

Put shared test utilities in `test/helpers/`. If a `db.ts` (or
equivalent) already exists there, add constants and helpers to it
rather than creating extra files.
