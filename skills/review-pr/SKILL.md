---
name: review-pr
description: >
  Review a GitHub PR end-to-end: fetch the PR diff, run the full
  /code-review checklist across all changed files, then post every
  finding as an inline review comment on the PR (without submitting —
  the human submits). Accepts a PR URL or number as $ARGUMENTS; if
  omitted, infers from the current branch.
disable-model-invocation: false
---

# Review PR

Run a full code review on a GitHub PR and post the findings as inline
comments, ready for the human to review and submit.

**Input:** `$ARGUMENTS` — a GitHub PR URL (e.g.
`https://github.com/org/repo/pull/123`) or a bare PR number.
If empty, run `gh pr view --json url` on the current branch and use
that PR.

---

## Phase 1 — Resolve the PR

1. If `$ARGUMENTS` is a full URL, extract `owner/repo` and the PR
   number from it.
2. If `$ARGUMENTS` is a bare number, run
   `gh repo view --json nameWithOwner` to get the `owner/repo`.
3. If `$ARGUMENTS` is empty, run `gh pr view --json number,url` on the
   current branch to find the PR. If no PR exists, stop and tell the
   user.
4. Fetch PR metadata:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number} \
     --jq '{number, head_sha: .head.sha, base: .base.ref, head: .head.ref}'
   ```
5. Save `head_sha`, `owner`, `repo`, and `number` — they are needed
   in every subsequent API call.

---

## Phase 2 — Fetch the diff and changed files

1. Get the list of changed files with their patches:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number}/files \
     --jq '[.[] | {filename, patch}]' > /tmp/pr_files.json
   ```
2. For each changed file, read the full current file content from disk
   (not just the diff) — many issues only become visible in context.
   If a file no longer exists locally (deleted in the PR), skip it.
3. Run `git diff {base}...{head}` to get the complete unified diff.

---

## Phase 3 — Run the code review

Read `~/.claude/skills/code-review/SKILL.md` and execute the full
parallel review defined there, using the PR diff and changed files as
the scope (equivalent to passing the commit range as $ARGUMENTS).

Two modifications apply when running from this skill:

1. **Add this cross-cutting instruction to every agent:**
   > Also assess whether old functionality is likely preserved by the
   > changes — look for semantic differences between the old and new
   > implementations, not just syntactic ones.

2. **Only include Critical and Warning findings as review comments.**
   Omit Suggestions entirely — they create noise that developers must
   resolve without any code change required.
   Collect Positive findings separately and post them as a single
   PR-level issue comment (not a review comment) at the end, so they
   appear in the conversation thread without creating resolvable
   threads. If there are no Positive findings, skip this comment.

---

## Phase 4 — Map findings to diff positions

For each finding that has a `file:line` reference, compute the GitHub
diff position (the 1-based line index within the unified diff hunk
required by the GitHub review API).

Use this algorithm in a Python script:

```python
import json, re

with open('/tmp/pr_files.json') as f:
    files = json.load(f)

def get_position(filename, target_line):
    for file in files:
        if file['filename'] != filename:
            continue
        patch = file.get('patch', '')
        if not patch:
            return None
        pos, current_line = 0, 0
        for line in patch.split('\n'):
            if line.startswith('@@'):
                m = re.search(r'\+(\d+)', line)
                if m:
                    current_line = int(m.group(1)) - 1
                pos += 1
            elif line.startswith('-'):
                pos += 1
            elif line.startswith('+'):
                current_line += 1
                pos += 1
                if current_line == target_line:
                    return pos
            else:
                current_line += 1
                pos += 1
                if current_line == target_line:
                    return pos
    return None
```

- If `get_position` returns a value → attach the comment inline at
  that position.
- If it returns `None` (line is outside all diff hunks) → post it as
  a PR issue comment via
  `gh api repos/{owner}/{repo}/issues/{number}/comments` with the
  file path and line number in the comment body so the reviewer can
  find it.

---

## Phase 5 — Post the review

### Inline comments (lines that map to diff positions)

Build a single review payload and submit it via one API call:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  --method POST \
  --input /tmp/review_payload.json \
  --jq '.id'
```

The payload shape:
```json
{
  "commit_id": "<head_sha>",
  "body": "",
  "event": "COMMENT",
  "comments": [
    {
      "path": "relative/file/path",
      "position": <diff_position>,
      "body": "<markdown comment>"
    }
  ]
}
```

Use `event: "COMMENT"` — **do not use `"REQUEST_CHANGES"` or
`"APPROVE"`**. The human decides how to submit.

### Comment body format

Each comment body must be self-contained:

```
**{Severity}:** {one-sentence description of the problem}

{optional: short code snippet showing the issue}

{concrete fix or recommendation}
```

Severity labels: `Critical`, `Warning`.

Do **not** include Positive findings or Suggestions.

### PR-level comments (lines outside the diff)

For findings that couldn't be anchored to a diff line, post each as a
separate issue comment. Prefix the body with the file path and
approximate line so the reviewer can locate it:

```
**{Severity} — `{file}` line {line}:** {body}
```

---

## Phase 6 — Report to the user

After all comments are posted, print a summary table:

| File | Line | Severity | Topic |
|------|------|----------|-------|
| `file.cs` | 42 | Critical | Description |
| …    | …    | …        | …     |

Note which comments are inline vs. PR-level. Remind the user that the
review is **pending** — they must open the PR and click Submit to
publish it.

---

## Rules

- Never submit the review (`"APPROVE"` / `"REQUEST_CHANGES"`) — always
  use `"COMMENT"` so the human controls submission.
- Never post Suggestions as review comments — they create resolvable
  threads with no code change needed.
- Never post Positive findings as review comments — post them as a
  single PR-level issue comment so they appear in the conversation
  thread without requiring resolution.
- If the PR has no changed files or the diff is empty, stop and report.
- If `gh` is not authenticated, stop and tell the user to run
  `gh auth login`.
- Post all inline comments in a **single** review API call (not one
  call per comment) to avoid spamming the PR timeline.
