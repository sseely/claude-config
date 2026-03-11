# Commit Messages

Follow Conventional Commits. All lines ≤80 chars.

**Subject:** `<type>(<scope>): <description>` — lowercase, no period
- Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`, `ci`
- Scope optional. Subject ≤72 chars.

**Body:** Normal prose, wrapped at 80 chars, separated from subject by blank line.

**Footer:** Always required.
```
Jira: PROJECT-123
```
Extract ticket ID from branch name if not stated. If not found, ask before committing.
