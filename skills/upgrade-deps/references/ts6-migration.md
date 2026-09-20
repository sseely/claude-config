# TS6 migration checklist

Referenced from `SKILL.md` Phase 1B — TypeScript migration scan
(conditional). Read this file only when TypeScript is detected and
its major version is below 6.

Check the installed version:

```bash
npx tsc --version
```

If the major version is already 6+, skip this phase entirely — the
codebase is current. Only proceed if the project is on TypeScript 5.x
or lower.

Run `typescript-pro` with this prompt:

```
Context: [project name, tsconfig path(s), source directories]
Task: Scan for TS5-era patterns that are deprecated or removed in TS6.
Check both tsconfig and source code:

tsconfig:
  - target below es2025
  - baseUrl used for path aliasing
  - moduleResolution set to "node" or "classic"
  - outFile, downlevelIteration, module amd/umd/systemjs/none
  - esModuleInterop set to false
  - allowSyntheticDefaultImports set to false
  - missing explicit rootDir, types, verbatimModuleSyntax
  - types not explicitly set (TS6 defaults to [] — no @types loaded)
  - missing isolatedDeclarations (recommended for monorepos)

Source code:
  - `module Foo {}` syntax (should be `namespace Foo {}`)
  - import assertions (`assert {}`) instead of attributes (`with {}`)
  - `/// <reference no-default-lib="true"/>` directives (removed in TS6)
  - `Date` usage where Temporal API is appropriate
  - `Map` has/get/set patterns where getOrInsert fits
  - manual regex escaping where RegExp.escape() works
  - baseUrl-relative imports that should use #/ subpath imports
  - const enums in declaration files

For each finding, provide:
  - file:line
  - Current pattern
  - TS6-forward replacement
  - Whether ts5to6 CLI can auto-fix it

Read-set: tsconfig*.json, src/**/*.ts, src/**/*.tsx
Write-set: none (scan only)
Output: structured table with columns:
  File | Line | Pattern | Replacement | Auto-fixable
```

If `ts5to6` can handle any findings, note it — Phase 4 will run it
before the manual `typescript-pro` agent pass.

If no TS5 patterns are found, skip this and proceed normally.

Regardless of whether TS5 patterns were found, if the project does
not already run `tsgo --noEmit` or `--stableTypeOrdering` in CI,
add a **Suggestion** to the final report:

> Consider adding `npx tsgo --noEmit` as a non-blocking CI job and
> `--stableTypeOrdering` to your test script to detect TS7
> incompatibilities before they become hard errors.

### Monorepo conflict resolution

If a workspace layout is detected (presence of `pnpm-workspace.yaml`, `lerna.json`,
`nx.json`, or `workspaces` field in root `package.json`):

1. Check for incompatible shared dependency versions across packages:
   `pnpm ls --recursive --json 2>/dev/null | jq '[.[] | {name, version}]'` or equivalent
2. If two packages require incompatible versions of the same dependency:
   - Pin the shared dependency at the root `package.json` with a version satisfying both
   - Document the pin in the PR description: "Pinned <package>@<version> at root to resolve
     cross-workspace conflict between <pkg-a>@<req-a> and <pkg-b>@<req-b>"
3. If no compatible version exists, flag the conflict and stop — do not auto-resolve
