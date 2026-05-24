# Logging Conventions

## Format

All logs must be structured JSON. Never emit free-form strings to logs
in production code.

Required fields on every log entry:
- `level` — one of: `debug`, `info`, `warn`, `error`
- `msg` — short, human-readable description of the event
- `ts` — ISO 8601 timestamp (or let the logging framework add it)
- `service` — name of the service or worker emitting the log

For request-handling contexts, also include:
- `trace_id` — correlation ID threaded from the inbound request
- `method` and `path` for HTTP requests

## Log levels

| Level | Use for |
|-------|---------|
| `debug` | Development diagnostics; must be off in production by default |
| `info` | Normal operational events (startup, config loaded, job complete) |
| `warn` | Unexpected but recoverable conditions |
| `error` | Failures that require attention; always include the error object |

## No PII or secrets in logs

Never log:
- Passwords, tokens, API keys, or session identifiers
- Full credit card numbers, SSNs, or government IDs
- Raw request/response bodies unless you have confirmed they contain
  no sensitive fields
- Stack traces sent to external log aggregators without scrubbing

If you must log a user identifier for tracing, log a hashed or
truncated form, not the raw value.

## Error logging

Log errors at `ERROR` level with:
- The error message
- The error stack trace (server-side only)
- Enough contextual fields (IDs, operation name) to reproduce without
  re-running the operation

## Background tasks

Fire-and-forget tasks must catch all errors and log them. Silent
failure in background work is a production incident waiting to happen.
