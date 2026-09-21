# Naming Conventions

- Folder layout: `src/{api,services,repository,models,lib,workers,config}`,
  `test/helpers/`. Deviations documented in the project's CLAUDE.md.
- Symbol case: camelCase (functions/variables), PascalCase
  (classes/interfaces), UPPER_SNAKE_CASE (module-level constants).
- DB naming: indexes `idx_<table>_<columns>`, foreign keys
  `fk_<table>_<ref>`; tables/columns snake_case.

Full detail (file-naming table, test colocation): `docs/reference/naming-conventions.md`.
