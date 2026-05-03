# Testability Principles

Design production code so that tests are easy to write. These rules govern
code *structure* — the complement to `testing.md` which governs how tests
are *written*.

## Priority order (highest first)

1. **Pure functions first.** Extract logic into pure functions — data in,
   data out, no side effects. Pure functions are the primary unit of
   testable code. DI is for the remaining impure seams, not the default
   tool.

2. **Functional core, imperative shell.** Domain logic computes *what*
   should happen and returns a data structure. A thin outer layer *does*
   it (writes to DB, fires HTTP, schedules alarms). Never mix decisions
   with effects in the same function.

3. **Observe, don't mock.** Prefer designs where the thing under test
   *returns* observable data rather than *calls* a collaborator. If a
   test requires more than 2-3 mocks, treat that as a design smell and
   restructure before writing more tests.

4. **Eliminate temporal coupling.** If function B must run after function
   A, make B's inputs the outputs of A. Invalid call sequences should be
   structurally impossible (builders, typed state machines), not just
   documented.

5. **Inject non-determinism.** Clocks, random, UUIDs, "now" — pass these
   in or produce them from a controlled source. This is the
   highest-leverage move against flaky tests.

6. **Contract tests for interfaces.** When multiple implementations share
   an interface (strategy pattern, plugins), write a shared test suite
   that every implementation must pass. Mocks must also satisfy the
   contract.

7. **DI, SRP, and strategy pattern are mechanisms, not goals.** Apply them
   when doing so moves code toward pure / deterministic / data-in-data-out.
   If applying them only adds indirection, reconsider.

## Meta-rule

Push complexity toward pure, deterministic functions. Make the
impure/effectful layer as thin and stupid as possible.