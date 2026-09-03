---
name: commit
description: Stage and commit changes following Conventional Commits. Use when ready to commit — do not invoke automatically.
disable-model-invocation: true
allowed-tools: Bash
---

Stage and commit changes following Conventional Commits.

## Steps

1. Run `git status` to see what's changed. If nothing is staged or modified, stop and report.
2. Run `git diff --stat HEAD` to understand the scope of changes.
3. Draft a commit subject following Conventional Commits — see
   `~/.claude/rules/commits.md` for the type list, subject format, and
   character limits.
4. Stage changed files with `git add` (specific files, not `-A`). Do not stage `.env`, credentials, or secrets.
5. Commit using a heredoc to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
<subject line>

<optional body — see rules/commits.md for wrap width and content>
EOF
)"
```

6. Run `git status` to confirm the commit succeeded.

## Rules

- Never use `--no-verify`
- Never amend an existing commit — always create a new one
- Never commit `.env`, credentials, or binary blobs
- Body is optional but include it for non-trivial changes
