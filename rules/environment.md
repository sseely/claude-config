# Environment Variables

- Naming: ALL_CAPS_SNAKE_CASE, prefixed by service/feature domain
  (`AUTH_JWT_SECRET`); secrets suffixed `_SECRET` or `_KEY`.
- Validate all required env vars at application startup, before accepting
  traffic — fail fast with a clear message.
- Never log a secret's raw value, even in debug mode — log only presence
  (`AUTH_JWT_SECRET: set`).

Full detail (startup-validation example, local-dev `.env.local` guidance):
`docs/reference/environment.md`.
