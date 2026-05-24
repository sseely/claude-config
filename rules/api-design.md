# API Design Conventions

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
convention.

## Versioning

Version in the URL path: `/v1/users`, `/v2/users`.
Increment the major version when:
- Removing or renaming a field in a response
- Changing the type or nullability of a field
- Removing or renaming an endpoint
- Changing HTTP method or status codes for an existing operation

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
