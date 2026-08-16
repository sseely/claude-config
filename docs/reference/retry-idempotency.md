# Retry — reference implementation

Lookup material for `rules/retry-idempotency.md`. The binding policy —
max 3 attempts, exponential backoff with ±20% jitter, the retryable and
non-retryable classifications, and idempotency-key handling — lives in that
rule file and is always resident. This is one worked implementation of it.

## TypeScript

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

Note what the classifier does *not* do: it treats 429 as retryable, and the
caller is still responsible for honoring `Retry-After` rather than falling
back to the computed delay.
