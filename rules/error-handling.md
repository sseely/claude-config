# Error Handling

## Throw vs. return

- **Throw** (or reject a Promise) for truly unexpected conditions:
  programmer errors, broken invariants, unrecoverable states.
- **Return an error type** (`Result<T, E>`, `{ error, data }`, or
  a typed error union) for expected failure modes that callers must
  handle: validation failures, not-found, permission denied.

If a caller might reasonably need to inspect the error and take
different actions, return it. If the error means "this should never
happen," throw it.

## Wrap at module boundaries

Catch and re-wrap low-level errors (DB driver errors, HTTP client
errors, filesystem errors) before they cross module boundaries.
Callers should not need to know the underlying library's error types:

```typescript
try {
  const row = await pool.query(sql);
} catch (err) {
  throw new DatabaseError("Failed to fetch user", { cause: err });
}
```

## Error message quality

Error messages must answer: *what happened* and *what the caller
should do next* (if anything).

- Include the relevant identifier or value: "User 42 not found"
  not "User not found"
- Do not include internal details (stack traces, SQL, file paths)
  in messages surfaced to clients
- Log the full detail server-side at ERROR level

## Async errors

Every `async` function must either:
- Have a `try/catch` wrapping the awaited calls, OR
- Let exceptions propagate intentionally and be caught at a boundary

Never use `.catch(() => {})` or empty catch blocks — they silently
swallow errors.

## External calls

Every call to an external service (HTTP, DB, queue, cache) must have:
- A timeout configured (reasonable defaults: 5s for synchronous API calls,
  30s for batch/long-running operations, 1s for cache reads; make the
  timeout configurable via env var or options object)
- An error handler that logs the failure and re-throws or returns
  an error type

A hung external call with no timeout hangs the caller indefinitely.

## Cancellation and shared state

- **Cancellation propagation.** When an operation is cancelled (abort,
  timeout, cancel token), every downstream `await` it triggered must
  observe the cancellation and stop — don't let work continue silently
  after the caller has moved on.
- **Race conditions across awaits.** State read before an `await` can
  be stale by the time execution resumes — another concurrent call may
  have run in between. Re-check invariants after the `await`, or use a
  lock, compare-and-swap, or optimistic version check to close the gap.
- **Shared mutable state.** Prefer immutable data passed through the
  call chain over shared mutable state touched from multiple
  concurrent paths. Where shared mutable state is unavoidable (cache,
  connection pool, in-memory counter), document the concurrency
  contract at the declaration — what guarantees ordering, and what
  happens under concurrent access.
