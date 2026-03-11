---
name: commit
description: Stage and commit changes following Conventional Commits with a mandatory Jira footer. Use when ready to commit — do not invoke automatically.
disable-model-invocation: true
allowed-tools: Bash
---

Stage all modified/new files and create a Conventional Commits message with a Jira footer.

## Steps

1. Run `git status` to see what's changed. If nothing is staged or modified, stop and report.
2. Run `git diff --stat HEAD` to understand the scope of changes.
3. Extract the Jira ticket ID:
   - Run `git branch --show-current` and look for a pattern like `PROJECT-123` or `PROJ-456` in the branch name.
   - If no ticket is found in the branch name, ask: "What is the Jira ticket ID for this commit?"
4. Draft a commit subject following Conventional Commits:
   - Format: `<type>(<scope>): <description>` — lowercase, no trailing period
   - Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`, `ci`
   - Subject must be ≤72 characters total
5. Stage changed files with `git add` (specific files, not `-A`). Do not stage `.env`, credentials, or secrets.
6. Commit using a heredoc to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
<subject line>

<optional body, wrapped at 80 chars>

Jira: <TICKET-ID>
EOF
)"
```

7. Run `git status` to confirm the commit succeeded.

## Rules

- Never use `--no-verify`
- Never amend an existing commit — always create a new one
- Never commit `.env`, credentials, or binary blobs
- Body is optional but include it for non-trivial changes
- Footer `Jira: TICKET-ID` is mandatory — always required
