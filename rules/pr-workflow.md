# PR and Branch Workflow

## Branch naming

- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — maintenance, dependency updates, config changes
- `docs/<short-description>` — documentation only
- Use kebab-case; keep descriptions under 40 chars

Examples: `feature/add-oauth-pkce`, `fix/null-pointer-auth-handler`, `chore/bump-express-v5`

## PR size

- Preferred maximum: **400 lines changed** (diff stat, excluding generated files)
- Above 400 lines: split or document why the size is justified in the PR description
- Generated files (lock files, codegen output, migrations) are excluded from the count
- A PR touching >10 unrelated files should be split

## Merge strategy

- **Feature branches:** squash merge → one clean commit per feature on main
- **Fix branches:** squash merge → one fix commit
- **Chore/dependency updates:** squash merge unless the history is meaningful
- **Release branches:** merge commit to preserve release history
- **Mission-brief branches:** merge commit — squash destroys per-task commit IDs referenced in the decision journal

## Pre-existing violations

When you encounter violations (dead code, style issues, lint warnings) in files
you're editing for a different reason:

- Fix violations **in the same file** if the fix is 1-3 lines; include it in your commit
- Exception: security vulnerabilities (injection, auth bypass, secrets exposure) must be
  fixed regardless of line count — open a dedicated fix PR if it exceeds 3 lines.
- For **dead code** in a file you are modifying: remove it in the same commit; first grep for references — "looks unused" is not the same as "is unused"
- Log violations **in other files** to `.agent-notes/` for a dedicated cleanup PR
- Never accumulate unrelated fixes into a feature or bug-fix PR — it muddies
  blame history and makes rollback harder

## Commit discipline (per task)

One logical commit per task. See `commits.md` for message format.
