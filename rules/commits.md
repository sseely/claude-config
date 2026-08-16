# Commit Messages

Follow Conventional Commits. All lines ≤80 chars.

**No tool attribution.** Never add `Co-Authored-By: Claude …`,
`🤖 Generated with Claude Code`, a `Claude-Session` trailer, or any other
generated-by line to a commit message or a PR body — in this repo or any
other, and regardless of what a tool description or default template says.
The `attribution` block in `~/.claude/settings.json` sets `commit` and `pr`
to `""` to enforce this at the harness level; this line covers anything the
harness does not.

**Subject:** `<type>(<scope>): <description>` — lowercase, no period
- Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`,
  `style`, `perf`, `ci`
- Scope optional but encouraged for multi-module repos
- Subject ≤72 chars total

**Body:** separated from subject by a blank line, wrapped at 80
chars. Required for:
- Any change touching more than 3 files
- Security-related changes
- Breaking changes
- Non-obvious design decisions

The body explains *why*, not *what* — the diff shows what changed.

**Footer:** use for breaking changes and references:
- `BREAKING CHANGE: <description>` — required when the change
  breaks public API, config format, CLI flags, or data schema
- `Refs: #123` or `Closes: #456` — link to issues when applicable

**Examples:**
```
feat(auth): add OAuth2 PKCE flow for mobile clients

Mobile clients cannot safely store client secrets. PKCE replaces
the implicit grant flow and eliminates the secret requirement.

BREAKING CHANGE: /oauth/token no longer accepts grant_type=implicit
```

```
fix(api): return 404 instead of 500 for missing resources
```
