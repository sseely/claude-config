---
name: review-pr
description: >
  Review a GitHub PR end-to-end: fetch the PR diff, run the full
  /code-review checklist across all changed files, then post every
  finding as an inline review comment on the PR (without submitting —
  the human submits). Accepts a PR URL or number as $ARGUMENTS; if
  omitted, infers from the current branch.
disable-model-invocation: true
---

# Review PR

Run a full code review on a GitHub PR and post the findings as a
**pending** review, ready for the human to read and submit. Nothing this
skill posts is visible to anyone else until the human clicks Submit.

## Model Routing

Delegates to `/code-review` for the review phase — see that skill's model routing table.
Phase 4 (line anchoring) runs inline. Phase 5 (posting the review) uses `gh` CLI.

| Phase | Task | Model |
|-------|------|-------|
| Phase 3 — Code review | Delegates to `/code-review` | Sonnet + Haiku per that skill |
| Phase 4 — Line anchoring | Mechanical check | Inline (no sub-agent) |

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
     --jq '{number, head_sha: .head.sha, base_sha: .base.sha, base: .base.ref, head: .head.ref}'
   ```
5. Save `head_sha`, `base_sha`, `owner`, `repo`, and `number` — they
   are needed in every subsequent API call.

---

## Phase 0 — Resume check (runs after Phase 1, not before)

The checkpoint is only trustworthy once you know which PR you are
reviewing, so this check runs after Phase 1 has resolved the PR.

Check whether `/tmp/review-pr-findings.md` exists.

**If it exists**, read its header and compare every identifier —
`owner`, `repo`, `number`, and `head_sha` — to the values from Phase 1.

- **All four match:** print
  `Resuming: Phase 3 findings loaded from /tmp/review-pr-findings.md`,
  skip Phases 2 and 3, and use the file's findings as the input to
  Phase 4.
- **Any identifier differs:** the file belongs to another PR or to an
  older head of this one. Print
  `Discarding stale checkpoint (was {owner}/{repo}#{number}@{head_sha})`,
  delete it, and also delete `/tmp/code-review-findings.md` if present
  (it was written by the same stale run). Continue to Phase 2.

**If it does not exist:** continue to Phase 2 as normal.

---

## Phase 2 — Fetch the diff and changed files

1. Get the list of changed files with their patches:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number}/files --paginate \
     --jq '[.[] | {filename, status, patch}]' \
     > /tmp/review-pr-{owner}-{repo}-{number}-{head_sha}-files.json
   ```
2. **Verify the local checkout matches the PR head.** Run
   `git rev-parse HEAD` and compare it to `head_sha`.
   - If they match, read each changed file from disk.
   - If they differ, do **not** read from disk — the surrounding
     context would come from the wrong version of the code. Instead:
     ```bash
     git fetch origin "+refs/pull/{number}/head:refs/remotes/origin/pr/{number}" \
       "{base_sha}"
     git show {head_sha}:{filename}
     ```
     and read every changed file through `git show`. Print one line
     saying the review is reading from `{head_sha}`, not the working
     tree.
   Read the full current file content, not just the diff — many
   issues only become visible in context. Skip files whose `status`
   is `removed`.
3. Get the complete unified diff with
   `git diff {base_sha}...{head_sha}` (both SHAs are local after the
   fetch above).

---

## Phase 3 — Run the code review

Read `~/.claude/skills/code-review/SKILL.md` and execute the full
parallel review defined there, using the PR diff and changed files as
the scope (equivalent to passing the commit range as $ARGUMENTS).
Tell that skill the scope is a **diff**, so its pre-existing-issue
filter applies.

Two modifications apply when running from this skill:

1. **Add this cross-cutting instruction to every agent:**
   > Also assess whether old functionality is likely preserved by the
   > changes — look for semantic differences between the old and new
   > implementations, not just syntactic ones.

2. **Only Critical and Warning findings become inline comments.**
   Omit Suggestions and Notes entirely — they create resolvable
   threads with no code change required.
   Collect Positive findings separately; they go into the review body
   in Phase 5, not into inline comments.

---

## Save findings checkpoint (after Phase 3 completes)

Before anchoring, save all findings plus the PR identifiers to
`/tmp/review-pr-findings.md`. This allows a resumed run (Phase 0) to
skip Phases 2–3 without re-running the code review.

```
owner: <value>
repo: <value>
number: <value>
head_sha: <value>

<all Phase 3 findings>
```

---

## Phase 4 — Anchor findings to diff lines

GitHub's review API takes a file `line` number plus a `side`; the
older `position` (offset from the first `@@` header) is marked
closing down in the API docs and is not used here.

A comment can only be anchored to a line that appears in the PR
diff. For each Critical or Warning finding with a `file:line`
reference, decide whether it is anchorable:

1. Look up the file's `patch` in
   `/tmp/review-pr-{owner}-{repo}-{number}-{head_sha}-files.json`. A
   finding on a file that is not in the PR (an agent followed an
   import) is not anchorable.
2. Parse each hunk header `@@ -a,b +c,d @@`. The new-side range is
   lines `c` through `c + d - 1` inclusive (a missing `,d` means one
   line). The finding is anchorable if its line falls inside any
   hunk's new-side range.
3. Anchorable → inline comment with `line: <line>` and
   `side: "RIGHT"`.
4. Not anchorable → goes into the review body (Phase 5), prefixed
   with the file path and line so the reviewer can find it.

A one-screen Python or shell snippet is enough for step 2; there is
no position arithmetic to get wrong.

---

## Phase 5 — Post the pending review

Build a single review payload and submit it via one API call:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  --method POST \
  --input /tmp/review-pr-{owner}-{repo}-{number}-{head_sha}-payload.json \
  --jq '.id, .state'
```

The payload shape:
```json
{
  "commit_id": "<head_sha>",
  "body": "<review body — see below>",
  "comments": [
    {
      "path": "relative/file/path",
      "line": <file line number>,
      "side": "RIGHT",
      "body": "<markdown comment>"
    }
  ]
}
```

**Do not include an `event` field.** Per the GitHub docs, leaving
`event` blank creates the review in `PENDING` state; any value —
including `"COMMENT"` — submits it immediately. Confirm the returned
`.state` is `PENDING`; if it is anything else, stop and tell the user
exactly what was published.

### Review body

The body is the only place for anything that is not an inline
comment, and it stays pending with the rest of the review. Assemble it
in this order, omitting empty sections:

```
## Findings outside the diff
**{Severity} — `{file}` line {line}:** {one-sentence problem}. {fix}

## Positives
- {good practice worth noting}
```

If there are no unanchored findings and no Positives, set `body` to
`"Automated review — see inline comments."` rather than an empty
string.

### Inline comment body format

Each comment body must be self-contained:

```
**{Severity}:** {one-sentence description of the problem}

{optional: short code snippet showing the issue}

{concrete fix or recommendation}
```

Severity labels: `Critical`, `Warning`.

### Cleanup

After the API call returns `PENDING`, delete
`/tmp/review-pr-findings.md`, `/tmp/code-review-findings.md`,
`/tmp/review-pr-{owner}-{repo}-{number}-{head_sha}-files.json`, and
`/tmp/review-pr-{owner}-{repo}-{number}-{head_sha}-payload.json`. A
checkpoint that outlives its run is the next run's contamination.

---

## Phase 6 — Report to the user

After the review is created, print a summary table:

| File | Line | Severity | Placement | Topic |
|------|------|----------|-----------|-------|
| `file.cs` | 42 | Critical | inline | Description |
| `lib/x.ts` | 7 | Warning | body | Description |

Remind the user that the review is **pending** — only they can see it
until they open the PR and click Submit, where they choose Comment,
Approve, or Request changes.

---

## Rules

- Never set `event` on the review payload. A blank `event` is what
  keeps the review pending; `"COMMENT"`, `"APPROVE"`, and
  `"REQUEST_CHANGES"` all publish it. The human controls submission.
- Never post a PR issue comment from this skill. Issue comments are
  public the moment they land; everything goes into the pending review
  (inline or body).
- Never post Suggestions or Notes as review comments — they create
  resolvable threads with no code change needed.
- Never read review context from a working tree whose HEAD differs
  from `head_sha` (Phase 2 step 2).
- If the PR has no changed files or the diff is empty, stop and report.
- If `gh` is not authenticated, stop and tell the user to run
  `gh auth login`.
- On a transient `gh`/network failure (5xx, connection refused, read
  timeout), retry per `~/.claude/rules/retry-idempotency.md` (max 3
  attempts, exponential backoff) before aborting. Do **not** retry on
  4xx (404 missing PR, 403 auth) except 429 — honor `Retry-After`.
  A 422 on the reviews call means a comment failed validation
  (usually an unanchorable line); fix the payload, do not retry it
  verbatim.
- Post all inline comments in a **single** review API call (not one
  call per comment) so there is exactly one pending review to submit.
