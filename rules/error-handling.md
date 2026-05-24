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
Callers should not need to know the underlying library's error types.

```typescript
// Wrong: leaks pg.DatabaseError to the caller
const row = await pool.query(sql);

// Right: wrap at the repository boundary
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
- A timeout configured
- An error handler that logs the failure and re-throws or returns
  an error type

A hung external call with no timeout hangs the caller indefinitely.
