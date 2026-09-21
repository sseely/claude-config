# Retry — reference implementation

Lookup material for `rules/retry-idempotency.md`. The binding policy —
max 3 attempts, exponential backoff with ±20% jitter, the retryable and
non-retryable classifications, and idempotency-key handling — lives in that
rule file and is always resident. This is one worked implementation of it.

## TypeScript

```typescript
interface RetryableError {
  status?: number;
  headers?: Record<string, string>;
}

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
      const delay = retryAfterMs(err) ?? backoffMs(attempt, baseDelayMs);
      await new Promise(r => setTimeout(r, Math.min(delay, 5000)));
    }
  }
  throw new Error('unreachable');
}

function isNonRetryable(err: unknown): boolean {
  const status = (err as RetryableError).status;
  return status !== undefined && status >= 400 && status < 500 && status !== 429;
}

function backoffMs(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * 2 ** (attempt - 1) * (0.8 + Math.random() * 0.4);
}

// Honors Retry-After on 429s: seconds (e.g. "2") or an HTTP-date.
function retryAfterMs(err: unknown): number | undefined {
  const { status, headers } = err as RetryableError;
  if (status !== 429) return undefined;
  const value = headers?.['retry-after'];
  if (!value) return undefined;
  const seconds = Number(value);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const dateMs = Date.parse(value);
  return Number.isNaN(dateMs) ? undefined : Math.max(0, dateMs - Date.now());
}
```

The classifier treats 429 as retryable; `retryAfterMs` reads
`err.headers?.['retry-after']` and takes priority over the computed
backoff whenever the server names a wait time.
