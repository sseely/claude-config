# Retry and Idempotency

## Retry policy

- **Max attempts:** 3 (1 original + 2 retries)
- **Backoff:** exponential — 100ms base, 2× multiplier, 5s cap
  - Attempt 1: immediately
  - Attempt 2: ~100ms
  - Attempt 3: ~200ms
- **Jitter:** add ±20% random jitter to prevent thundering herd

## When NOT to retry

- **4xx errors** (except 429): the request is broken; retrying won't help
  - 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found → fail immediately
  - 409 Conflict → fail immediately; the caller must resolve the conflict
- **429 Too Many Requests:** retry after the `Retry-After` header value (or 1s if absent)
- **Non-idempotent operations without idempotency keys:** creating a resource
  twice has real consequences; only retry if you can guarantee deduplication

## When to retry

- **5xx errors:** server-side failures are often transient; retry up to the limit
- **Network timeouts:** connection refused, DNS failure, read timeout
- **429:** rate limited; honor `Retry-After`

## Idempotency keys

Operations that create or modify state must be safe to retry:

- Generate a UUID or deterministic hash as the idempotency key
- Pass it in a standard header: `Idempotency-Key: <uuid>`
- Server stores the key + response for 24h; duplicate requests return the cached response
- Key TTL: 24 hours (sufficient for client retry windows)
- Key scope: per-operation, per-client; never reuse keys across different operations

## Implementation pattern

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 100,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      if (isNonRetryable(err)) throw err;
      const delay = baseDelayMs * 2 ** (attempt - 1) * (0.8 + Math.random() * 0.4);
      await new Promise(r => setTimeout(r, Math.min(delay, 5000)));
    }
  }
  throw new Error('unreachable');
}

function isNonRetryable(err: unknown): boolean {
  const status = (err as { status?: number }).status;
  return status !== undefined && status >= 400 && status < 500 && status !== 429;
}
```
