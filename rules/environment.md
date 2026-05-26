# Environment Variables

## Naming conventions

- ALL_CAPS_SNAKE_CASE for all environment variable names
- Prefix by service or feature domain: `AUTH_JWT_SECRET`, `DB_MAX_POOL_SIZE`
- Boolean flags: `FEATURE_X_ENABLED=true` / `false` (not 1/0 or yes/no)
- Secrets: suffix with `_SECRET` or `_KEY` to distinguish from config values

## Startup validation

Validate all required env vars at application startup, before accepting traffic:

```typescript
const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

Fail fast with a clear message — don't let missing config surface as a cryptic
runtime error deep in the request path.

## Logging redaction

Never log raw env var values. When logging config at startup:

- For non-secret config (port, log level, feature flags): log the value
- For secrets and keys: log only presence — `AUTH_JWT_SECRET: set`
- Never log the secret itself, even in debug mode

## Local development

Use `.env.local` (gitignored) for local overrides. Never commit `.env` files
containing real secrets. `.env.example` with placeholder values is encouraged.

See also `security.md` for injection prevention and secret-handling rules.
