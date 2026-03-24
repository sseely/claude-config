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

## DRY: No magic strings or literals in tests

Any value used in more than one test file belongs in a shared helper,
not repeated inline.

**Common cases:**
- Base URLs (e.g. `http://localhost:8787`) → export `BASE_URL` from
  the test helpers file
- Auth headers, cookie names → export named constants
- Repeated fixture builders (create user, create session) → export
  helper functions

When you notice a literal repeated across test files, extract it
immediately — don't defer it.

## Coverage — 90/90/90 rule

Target at least 90% line coverage, 90% branch coverage, and 90%
function coverage. Treat these as a floor, not a ceiling.

## Test helper location

Put shared test utilities in `test/helpers/`. If a `db.ts` (or
equivalent) already exists there, add constants and helpers to it
rather than creating extra files.
