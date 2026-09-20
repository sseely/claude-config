# API Design Conventions

Applies only to REST/HTTP API work.

- Never mix response envelopes within one service — a list endpoint
  wraps results (`{ data, total, page, pageSize }`), a single resource
  returns directly, and every error is the flat `{ error, message }`
  shape.
- A breaking change (removed/renamed field, changed type, removed
  endpoint, tightened validation) always bumps the major version path
  (`/v1/` → `/v2/`).

Full conventions (resource naming, HTTP methods, pagination, status
codes): `docs/reference/api-design.md`.
