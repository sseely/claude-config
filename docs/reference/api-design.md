# API Design Conventions — reference

Lookup material for `rules/api-design.md`. The binding rule — this applies
only to REST/HTTP API work; never mix response envelopes within one
service; a breaking change always bumps the major version path — lives in
that rule file and is always resident. This is the full convention set:
resource naming, HTTP methods, envelopes, versioning, pagination, and
status codes.

## Resource naming

- Use plural nouns for collections: `/users`, `/orders`, `/products`
- Use kebab-case for multi-word resources: `/payment-methods`
- Nest resources only one level deep: `/users/{id}/orders` is fine;
  `/users/{id}/orders/{id}/items/{id}` is not
- Actions that don't map to CRUD go on a sub-resource noun:
  `/orders/{id}/cancellation` (POST) not `/orders/{id}/cancel`

## HTTP methods

| Method | Use for |
|--------|---------|
| GET | Read; must be idempotent and safe (no state change) |
| POST | Create or trigger an action |
| PUT | Full replacement of a resource |
| PATCH | Partial update |
| DELETE | Remove a resource |

## Response envelopes

All list endpoints wrap results:
```json
{ "data": [...], "total": 42, "page": 1, "pageSize": 20 }
```

All single-resource endpoints return the resource directly (no
`{ data: ... }` wrapper for single objects).

All error responses use:
```json
{ "error": "short_code", "message": "Human-readable description" }
```

Never mix envelopes — all endpoints in a service must use the same
convention. On a paginated endpoint an error response replaces the list
envelope entirely; the two never nest. There is no
`{ "data": [...], "error": ... }` shape — an error is always the flat
`{ "error", "message" }` object, with no list metadata.

## Versioning

Version in the URL path: `/v1/users`, `/v2/users`.
Increment the major version on any breaking change per
`~/.claude/rules/architecture.md` breaking-change taxonomy.

Minor/patch changes (adding optional fields, new endpoints) do not
require a version bump.

## Pagination

All list endpoints must be paginated. Never return unbounded lists.
Default page size: 20. Maximum page size: 100.

## Status codes

| Situation | Code |
|-----------|------|
| Success, resource returned | 200 |
| Resource created | 201 |
| Success, no body | 204 |
| Bad input | 400 |
| Unauthenticated | 401 |
| Authenticated but not authorized | 403 |
| Resource not found | 404 |
| Conflict (duplicate, state mismatch) | 409 |
| Gone (intentionally removed) | 410 |
| Server error | 500 |
