---
name: changelog-generator
description: >
  Generate a user-facing changelog from git commit history. Analyzes
  commits for a date range or between tags, filters out internal noise
  (refactors, test changes, CI), and produces customer-friendly release
  notes grouped by category.
  Usage: /changelog-generator [since] — e.g. "since v2.4.0" or "past 7 days"
---

# Changelog Generator

## Phase 1 — Determine scope

If `$ARGUMENTS` specifies a tag (e.g. `v2.4.0`) or date range (e.g.
`past 7 days`, `March 1..March 15`), use it. Otherwise default to
commits since the most recent tag:

```bash
git describe --tags --abbrev=0   # find latest tag
git log <tag>..HEAD --oneline    # commits since that tag
```

## Phase 2 — Fetch and filter commits

```bash
git log <range> --pretty=format:"%h %s" --no-merges
```

**Keep:** feat, fix, perf, security, breaking changes.
**Discard:** chore, refactor, test, ci, style, docs, build commits.

For Conventional Commits (`feat(scope): desc`), use the type and
description directly. For non-conventional commits, infer intent from
the message.

## Phase 3 — Categorize and translate

Map to these user-facing categories:

| Git type | Changelog heading |
|----------|------------------|
| feat | New Features |
| fix | Bug Fixes |
| perf | Performance |
| security | Security |
| breaking | Breaking Changes |

Translate each commit subject from developer language to customer
language:
- `fix(auth): resolve race condition in token refresh` → "Fixed an issue where sessions could expire unexpectedly"
- `feat(api): add batch endpoint` → "New: process multiple items in a single request"

Omit scope prefixes, ticket numbers, and implementation details.

## Phase 4 — Format output

```markdown
## [version or date range]

### ✨ New Features
- Description of feature (one line per change)

### 🔧 Improvements
- ...

### 🐛 Bug Fixes
- ...

### ⚡ Performance
- ...

### 🔒 Security
- ...

### ⚠️ Breaking Changes
- ...
```

Omit any heading with no entries. For Breaking Changes, always include
what to do differently.

## Phase 5 — Output

Print the changelog to stdout. If the user asks to save it:
- Append to `CHANGELOG.md` (newest at top) if the file exists
- Create `CHANGELOG.md` if it doesn't

Ask before overwriting any existing content.
