# Security Practices

## Input Validation

Validate all input at system boundaries — user input, external API
responses, URL parameters, request bodies, headers. Trust nothing
from outside the process.

- Parse and validate with a schema (Zod, io-ts, JSON Schema) rather
  than ad-hoc checks
- Reject unexpected fields rather than silently ignoring them
- Enforce length limits, type constraints, and allowed-value sets

## Secrets

- Never hardcode secrets, API keys, or credentials in source code
- Use environment variables or a secrets manager
- Never log secrets, tokens, or PII
- Never include secrets in error messages or HTTP responses

## Error Responses

- Return generic error messages to clients ("Bad Request",
  "Internal Server Error")
- Never expose stack traces, SQL errors, file paths, or internal
  IDs in responses
- Log full error details server-side at ERROR level for diagnosis

## Authentication & Authorization

- Every endpoint that modifies state or returns private data must
  require authentication
- Verify the caller owns the resource they're accessing (authz),
  not just that they're logged in (authn)
- Use timing-safe comparison for secrets and tokens

## Common Injection Vectors

- Use parameterized queries — never interpolate user input into SQL
- Escape or sanitize user content rendered in HTML (XSS)
- Never pass user input to shell commands (command injection)
- Validate and sanitize URLs before server-side fetches (SSRF)
