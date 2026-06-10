---
name: upgrade-deps
description: >
  Audit and upgrade all dependencies in a project. Detects languages
  and frameworks, runs parallel research and security agents, spins up
  the appropriate language-pro agents for changes, then runs an
  iterative review loop until the code-reviewer approves or 4
  iterations are exhausted. For complex upgrades (breaking changes or
  multiple languages), integrates with /plan-mission to generate a
  mission brief instead of executing directly.
disable-model-invocation: false
---

Model routing: Sonnet for implementation; Haiku for verification/scoring; Opus only for explicit architectural decisions.

# Upgrade Dependencies

Audit and upgrade all dependencies for the current project.

**Input:** `$ARGUMENTS` — optional scope. If empty, upgrades all
dependencies. If provided, treats as a package name or glob
(e.g. `django`, `@angular/*`) and scopes to matching packages only.

## Phase 0 — Resume check

Before doing anything else, check whether `.upgrade-deps-progress.md` exists
in the working directory.

**If it exists:**
1. Read it.
2. Find the first phase entry that is still `[ ]` (unchecked).
3. If a phase is marked `[x]`, its output (e.g. detected languages, research
   findings) should be recorded in the file under `## Saved State` — extract
   and use those values instead of re-running that phase.
4. Print: `Resuming from [phase name].`
5. Jump directly to the first unchecked phase.

**If it does not exist:** continue to Phase 1 as normal.

---

## Phase 1 — Detect project languages and frameworks

Scan the project root and `src/` for manifest files and key
indicators. Build a roster of detected languages:

| Signal | Agent |
|--------|-------|
| `pyproject.toml` / `requirements.txt` / `setup.py` | `python-pro` |
| `package.json` + `tsconfig.json` | `typescript-pro` (TS5→TS6) |
| `package.json` (no tsconfig) | `javascript-pro` |
| `package.json` + `next` | `nextjs-developer` |
| `package.json` + `react` (no Next) | `react-specialist` |
| `package.json` + `vue` | `vue-expert` |
| `package.json` + `@angular/core` | `angular-architect` |
| `*.csproj` / `*.sln` (.NET 5+) | `dotnet-core-expert` |
| `*.csproj` (.NET Framework 4.x) | `dotnet-framework-4.8-expert` |
| `pom.xml` + Spring Boot | `spring-boot-engineer` |
| `pom.xml` / `build.gradle` (no Spring) | `java-architect` |
| `build.gradle.kts` + Kotlin | `kotlin-specialist` |
| `Cargo.toml` | `rust-engineer` |
| `go.mod` | `golang-pro` |
| `Gemfile` + `rails` | `rails-expert` |
| `Gemfile` (no Rails) | `ruby-specialist` |
| `composer.json` + Laravel | `laravel-specialist` |
| `composer.json` (no Laravel) | `php-pro` |
| `Package.swift` | `swift-expert` |

If multiple manifests are found, build the full roster — all detected
languages get an agent.

Announce: "Detected languages: [list]. Agents: [list]."

Write `.upgrade-deps-progress.md` (or update it if it exists):

```
# Upgrade-Deps Progress

## Phases
- [x] phase-1-detect-languages
- [ ] phase-1b-ts-migration-scan
- [ ] phase-2-research
- [ ] phase-3-scope-evaluation
- [ ] phase-3b-ts-migration-execution
- [ ] phase-4-build-prompts
- [ ] phase-5-execute-agents
- [ ] phase-6-review-loop
- [ ] phase-7-summary

## Saved State
detected_languages: <comma-separated list>
```

If Phase 1B does not apply (no TypeScript detected), mark `- [x] phase-1b-ts-migration-scan` immediately.
If Phase 3B does not apply, mark `- [x] phase-3b-ts-migration-execution` immediately.

## Phase 1B — TypeScript migration scan (conditional)

If TypeScript was detected in Phase 1, check the installed version:

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

On success, mark `- [x] phase-1b-ts-migration-scan` in `.upgrade-deps-progress.md`.
If Phase 1B was skipped (no TypeScript), it was already marked above.

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

## Phase 2 — Research (parallel)

Run `dependency-manager` and `security-auditor` in parallel.

**dependency-manager** — audit all deps: current vs latest version,
change type (patch/minor/major), breaking changes, affected files.
Output: `Package | Current | Latest | Change Type | Breaking | Files | Notes`

**security-auditor** — review upgrades for CVEs in current and target
versions, downgrades, new transitive deps. Output: findings with
severity (Critical/High/Medium/Low).

Both agents: prompt per `parallelism.md`, read-set = manifests +
lockfiles, write-set = none.

Wait for both agents to complete before proceeding.

On success, append the dependency and security findings tables to `.upgrade-deps-progress.md`:

```
## Phase 2 Findings
### Dependency audit
<dependency table>

### Security findings
<security findings>
```

Then mark `- [x] phase-2-research` in `.upgrade-deps-progress.md`.

## Phase 3 — Scope evaluation

Evaluate complexity based on research findings:

**Execute directly** (proceed to Phase 4) when ALL of:
- Only 1 language detected
- No major version bumps flagged
- No breaking changes requiring code edits
- No Critical/High security findings requiring immediate action

**Generate a mission brief** (hand off to `/plan-mission`) when ANY of:
- 2+ languages detected
- Any major version bump with breaking changes
- Critical security findings requiring coordinated fixes across languages
- Security-auditor flagged systemic issues

For mission-brief mode: pass the dependency-manager and
security-auditor findings to `/plan-mission` as the feature
description. The mission brief will structure the upgrade as
batched tasks per language, with the review loop as the final batch.
Tell the user:

> "This upgrade is complex ([reason]). Generating a mission brief
> via /plan-mission for structured execution."

Then stop — plan-mission takes over.

On success (direct-execution path), mark `- [x] phase-3-scope-evaluation` in `.upgrade-deps-progress.md`.

## Phase 3B — TypeScript migration execution (conditional)

If Phase 1B found TS5 patterns, execute fixes before the general
dependency upgrade:

1. If any findings are marked auto-fixable, run `npx ts5to6` first
   to handle `baseUrl` and `rootDir` adjustments automatically.
2. Run `typescript-pro` with the remaining findings:

```
Context: [project name, stack, tsconfig path(s)]
Task: Apply TS6-forward fixes for the following TS5 patterns:
  [findings table from Phase 1B, excluding auto-fixed items]

For each finding:
  1. Apply the replacement shown in the scan results
  2. Update tsconfig to TS7-forward defaults (see your agent instructions)
  3. Verify the build still passes after each change
  4. Run tests and fix any failures caused by the migration

Additional:
  - Add --stableTypeOrdering to the test script in CI config if
    present (package.json scripts, GitHub Actions, etc.)
  - Do NOT upgrade package versions — that happens in Phase 5.
    This phase is tsconfig + source pattern migration only.

Write-set: tsconfig*.json, source files listed in findings
Read-set: [manifest files, source files]
Quality bar: tsc --noEmit must pass. All tests must pass.
```

3. If `typescript-pro` reports failures it cannot fix, STOP and
   present the findings to the user before continuing.

On success, mark `- [x] phase-3b-ts-migration-execution` in `.upgrade-deps-progress.md`.

## Phase 4 — Build language agent prompts

For each language agent in the roster, construct a self-contained
prompt:

```
Context:
  Project: [name and brief description]
  Stack: [full detected stack]
  Your scope: [language/framework] files only

Dependency findings (your packages only):
  [filtered table from dependency-manager for this language]

Security findings (your packages only):
  [filtered list from security-auditor for this language]

TS migration status (TypeScript only):
  [summary of Phase 3B changes if applicable — tsconfig defaults
   already updated, source patterns already migrated. This phase
   handles package version bumps only.]

Task:
  1. Update the manifest file(s) for your language to the latest
     stable versions identified in the findings
  2. Apply any code changes required by breaking changes (see your
     Upgrade & Migration guidance)
  3. Run your post-upgrade commands (listed in your Upgrade &
     Migration section)
  4. Fix any test or build failures introduced by the upgrade
  5. Do NOT touch files owned by other language agents

Write-set: [manifest file(s) and source files for this language only]
Read-set: [manifest files, lockfiles, source files that import upgraded packages]

Quality bar: build and tests must pass before you finish.
Report: list every package changed (old → new version) and any
code changes made, with file:line references.
```

**File ownership rule:** if a file is referenced by multiple language
agents (e.g. a shared config importing both Python and TS packages),
assign it to the agent whose language *defines* the dependency. Flag
shared-boundary files explicitly in both prompts.

On success, mark `- [x] phase-4-build-prompts` in `.upgrade-deps-progress.md`.

## Phase 5 — Execute language agents (parallel)

Launch all language agents in parallel. Each owns its file set
exclusively.

Wait for all to complete. Collect their reports (packages changed,
code changes made, test results).

If any agent reports test failures it could not fix, STOP and report
to the user before continuing.

On success, mark `- [x] phase-5-execute-agents` in `.upgrade-deps-progress.md`.

## Phase 6 — Review loop

Run `code-reviewer` with a prompt scoped to the changed files:

```
Context: Dependency upgrade review, iteration [N] of 4
Changed files: [list from agent reports]
Prior review findings: [findings from iteration N-1, if any]

Task: Review the dependency upgrades and any associated code changes.
Focus on:
  - Breaking change handling: are deprecated APIs fully replaced
    (no partial migrations, no old import paths remaining)?
  - Do tests cover the changed behavior?
  - Any new magic strings/literals introduced by version changes?
  - Any `any` casts or type suppressions added to silence upgrade errors?
  - Lockfile updated and committed?

Output: APPROVE or a list of required changes with file:line.
Mark each finding as NEW or RECURRING (appeared in a prior iteration).
If a RECURRING finding has appeared 3+ times without resolution, stop and report it.
```

**Loop logic:**
- If `code-reviewer` outputs APPROVE → done, proceed to Phase 7
- If findings exist:
  - Extract the list of required changes
  - Pass them back to the relevant language agent(s) for fixes
  - Re-run `code-reviewer` (increment N)
- After 4 iterations without APPROVE:
  - Identify any RECURRING findings (same issue appeared 2+ times)
  - Present to user: "The following items could not be resolved after
    4 iterations. Please advise: [list with file:line and description]"
  - Stop and wait for user input

On APPROVE, mark `- [x] phase-6-review-loop` in `.upgrade-deps-progress.md`.

## Phase 7 — Summary

Report:
- Total packages upgraded (by language)
- Breaking changes handled (list)
- Security issues resolved (list)
- Iterations needed for review approval
- Any packages intentionally left at current version and why

Suggest a commit message following the project's commit conventions:
```
chore(deps): upgrade all dependencies to latest stable

[summary of major changes]
```

On success, mark `- [x] phase-7-summary` in `.upgrade-deps-progress.md`.
