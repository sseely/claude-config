# Naming Conventions

## Folder structure

Standard layout for server-side projects:

```
src/
  api/        — HTTP handlers / route definitions
  services/   — business logic, orchestration
  repository/ — data access layer (DB queries, external storage)
  models/     — data types, domain objects, DTOs
  lib/        — shared utilities with no domain knowledge
  workers/    — background jobs, queue consumers
  config/     — configuration loading and validation
test/
  helpers/    — shared test utilities, fixtures, builders
```

Deviations from this layout should be documented in the project's CLAUDE.md.

## File naming

| What | Convention | Example |
|------|-----------|---------|
| Class definition | PascalCase | `UserRepository.ts` |
| Module / utility | camelCase | `parseJwt.ts` |
| React component | PascalCase | `UserCard.tsx` |
| Test file | same as source + `.test` | `UserRepository.test.ts` |
| Type-only file | camelCase + `.types` | `user.types.ts` |
| Config file | kebab-case | `jest.config.ts`, `eslint.config.js` |
| Shell script | kebab-case | `notify-on-stop.sh` |

## Test file colocation

Co-locate test files with source:

```
src/api/users.ts
src/api/users.test.ts   ← same directory
```

Exception: integration tests that span multiple modules go in `test/integration/`.

## Symbol naming

- **Functions and variables:** camelCase
- **Classes and interfaces:** PascalCase
- **Constants (module-level, immutable):** UPPER_SNAKE_CASE
- **Enum members:** PascalCase (TypeScript) or UPPER_SNAKE_CASE (C-family)
- **Private class members:** use the language's `private` keyword, not underscore prefix

## Database

- **Tables:** snake_case, plural (`user_accounts`, `order_items`)
- **Columns:** snake_case (`created_at`, `user_id`)
- **Indexes:** `idx_<table>_<columns>` (`idx_orders_user_id`)
- **Foreign keys:** `fk_<table>_<referenced_table>` (`fk_orders_users`)
