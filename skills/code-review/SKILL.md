---
name: code-review
description: >
  Run a comprehensive parallel code review covering correctness, security,
  formatting, error handling, dependencies, test coverage, logging, type
  safety, performance, API contracts, dead code, and cyclomatic complexity.
  Defaults to staged changes; accepts an optional argument to scope the
  review differently (e.g. "full project", a file path, or a glob).
disable-model-invocation: false
---

# Code Review

## Model Routing

| Step | Agent role | Model |
|------|-----------|-------|
| Step 2 — 11 parallel reviewers | Code analysis | `sonnet` |
| Step 3 — Deduplication pass | Dedup + grouping | `sonnet` |
| Step 4 — Confidence scoring (batched by file) | Verify each finding against source | `sonnet` |

Scoring runs on Sonnet, not Haiku: the rubric asks the scorer to read the
source and verify the condition is real, which is code analysis, not
format checking. A weaker gatekeeper judging a stronger reviewer's output
is where true positives quietly die. Step 3 is routed to Sonnet for the
same reason: resolving a "cannot occur" contradiction requires reading
the source and reasoning about code paths, which is code analysis Haiku
is not routed for anywhere else in this skill — a wrong Haiku call at
this step silently drops a real finding before Step 4 ever sees it.

## Step 0 — Resume check

Before doing anything else, check whether `/tmp/code-review-findings.md`
exists.

**If it exists**, read its header and compare each identifier to the
current run:

| Header field | Compare against |
|--------------|-----------------|
| `repo_root`  | `git rev-parse --show-toplevel` |
| `head_sha`   | `git rev-parse HEAD` |
| `scope`      | `$ARGUMENTS` (empty string for the staged-changes default) |

- **All three match:** print
  `Resuming: Step 2 findings loaded from /tmp/code-review-findings.md`,
  skip Steps 1 and 2, and use the file's findings as the input to
  Step 3 (deduplication).
- **Any field differs, or the header is missing:** the file was left by
  a different repo, commit, or scope. Print
  `Discarding stale checkpoint ({repo_root}@{head_sha}, scope "{scope}")`,
  delete it, and continue as if it did not exist. Never merge findings
  from a checkpoint you cannot attribute to this exact run.

**If it does not exist:** continue to scope determination and Step 1 as normal.

---

## Determine scope

- If $ARGUMENTS is empty or not provided: review staged changes only.
  Run `git diff --cached` to get the diff and identify touched files.
- If $ARGUMENTS is "full project": review all source files in the repo
  (exclude `node_modules`, `dist`, `build`, `.git`, generated files).
- Otherwise treat $ARGUMENTS as a file path, glob, or description and
  review the files it identifies.

Record the **scope kind** for Step 4: `diff` when reviewing staged
changes or a commit range (including when invoked from `/review-pr`),
`files` for "full project", a path, or a glob. The scoring rubric's
pre-existing-issue rules apply only to `diff` scope — in `files` scope
every line is in scope by definition.

## Step 1 — File inventory (run this yourself before launching any agents)

Run the command below and record the output. This is the ground-truth
file list you will pass to every agent. Do NOT hand-construct it from
memory — incomplete lists are the primary source of missed findings.

```bash
find . \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/.wrangler/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/.venv/*' \
  -not -path '*/coverage/*' \
  -not -path '*/bin/*' \
  -not -path '*/obj/*' \
  -not -path '*/target/*' \
  -not -path '*/vendor/*' \
  -type f \
  \( -name '*.ts'   -o -name '*.tsx'  -o -name '*.js'  -o -name '*.jsx' \
     -o -name '*.py' -o -name '*.rb'  -o -name '*.go'  -o -name '*.rs' \
     -o -name '*.java' -o -name '*.kt' -o -name '*.swift' \
     -o -name '*.cs' -o -name '*.php' -o -name '*.c' -o -name '*.cpp' -o -name '*.h' \
     -o -name '*.sh' -o -name '*.ps1' -o -name '*.sql' -o -name '*.tf' \
     -o -name '*.html' -o -name '*.toml' -o -name '*.yaml' -o -name '*.yml' \
     -o -name 'Dockerfile' -o -name '*.dockerfile' \
     -o -name 'requirements*.txt' -o -name 'Gemfile' -o -name 'Gemfile.lock' \
     -o -name 'tsconfig*.json' -o -name 'package.json' -o -name 'pyproject.toml' \
     -o -name 'package-lock.json' -o -name 'yarn.lock' -o -name 'pnpm-lock.yaml' \
     -o -name 'poetry.lock' -o -name 'uv.lock' -o -name 'Cargo.toml' -o -name 'Cargo.lock' \
     -o -name 'go.mod' -o -name 'go.sum' -o -name 'composer.json' -o -name 'composer.lock' \
     -o -name '*.csproj' -o -name 'packages.lock.json' -o -name '*.lock' \) \
  | sort
```

The inventory must cover every file category below. If any category is
absent from the output, investigate why before proceeding:

- Primary language sources (`src/`, `lib/`, `app/`)
- Test files (`test/`, `spec/`, `__tests__/`)
- **Config files at the project root** (`tsconfig.json`, `wrangler.toml`,
  `vite.config.*`, `eslint.config.*`, `vitest.config.*`)
- **Secondary-language service directories** (e.g. a Python `report-service/`,
  a Go sidecar) — frequently omitted when the primary language is TypeScript
- **HTML entry points** (`index.html`, add-in manifests) — CSP, SRI, and
  external script tags live here, not in `.ts` files
- **Lock files and dependency manifests** (`package-lock.json`,
  `requirements.txt`, `Gemfile.lock`) — the `find` above matches them,
  so a manifest with no matching lock file in the output is a real
  absence, not an inventory gap. Confirm with `ls` before Agent 5
  reports it as Critical.

## Step 2 — Eleven parallel agents (launch all simultaneously)

Each agent receives the full file inventory from Step 1. Agents use
Read, Grep, Glob, Bash, WebSearch, and WebFetch. They must work through
the full inventory systematically — not hand-pick files. If a file leads
to another via import, read that file too.

Agents are: general-purpose, code-reviewer, security-auditor,
qa-expert, dependency-manager, or performance-engineer as appropriate.

For a "full project" scope, split the Step 1 file inventory across
agents whenever it would exceed ~128k tokens per agent — do not hand
one agent the entire inventory past that size.

### Agent crash handling

Assume every dispatched agent might not return — a crash, a kill, or a
timeout all look the same from here: no output. If a parallel review
agent from this step returns no output, relaunch that one agent once
(same dimension, same checklist, same file inventory). If the retry also
returns no output, do not silently drop that dimension: proceed with the
remaining agents' findings, and record an explicit gap in the Final
report — `**Dimension not reviewed:** Agent N — <name> — crashed on both
the original dispatch and the retry; findings for this dimension are
missing.` This gap must appear in the report even if every other
dimension comes back clean.

---

## Checklists

The 11 per-dimension checklists (Agent 1 — Correctness & Code Quality
through Agent 11 — Operability & Production Readiness) are stable,
rarely-changing reference material. They have been relocated to
[`references/checklists.md`](references/checklists.md) — read that file
and give each dispatched agent its corresponding checklist verbatim
before launching Step 2. No checklist item was dropped in the move.

---

## Save findings checkpoint (after all 11 agents complete)

Before running deduplication, save all raw findings to
`/tmp/code-review-findings.md`. This allows a resumed run (Step 0) to
skip straight to Step 3 without re-running the 11 agents.

```bash
# Write findings checkpoint — overwrite if retrying
cat > /tmp/code-review-findings.md << 'EOF'
# Code Review Findings Checkpoint
# Generated by /code-review — do not edit manually
repo_root: <output of git rev-parse --show-toplevel>
head_sha: <output of git rev-parse HEAD>
scope: <$ARGUMENTS verbatim, or empty>

<paste all agent output here>
EOF
```

The three header fields are what Step 0 checks on the next run. Omit
them and the checkpoint is unusable.

---

## Step 3 — Run a single Sonnet dedup agent (run after all 11 agents complete)

Run a single dedup agent, routed to Sonnet per the Model Routing table
above. Give it all findings from all 11 agents.

The dedup agent must:

1. **Group** findings that describe the same root issue (same file:line
   or same conceptual problem).

2. **Keep the most specific instance** of each duplicate group: the
   one with the precise file:line reference and concrete fix.

3. **Resolve genuine contradictions** by reading the relevant source
   file directly. Do not use any prior summary as the arbiter — read
   the code.

4. **Do not suppress findings.** Only drop a finding if:
   - It is a true duplicate of another finding already in the list, OR
   - Reading the source reveals the condition described cannot occur
     (explain why in a note).

5. **Return** the deduplicated list, preserving severity.

---

## Step 4 — Confidence scoring (run after dedup, before final report)

Group Step 3's deduplicated findings by the file they reference, then
launch one parallel Sonnet agent per file — not one agent per finding.
Give each agent all of that file's findings batched into a single
prompt, the file itself, any CLAUDE.md files that apply, the **scope
kind** (`diff` or `files`) from scope determination, and each finding's
originating agent dimension (so security findings can be recognised as
such). The agent scores each finding 0–100 independently and returns
one score plus a one-sentence justification per finding, not one score
for the whole file.

If a single file accumulates more than ~35 findings (rare — typically
only in a "full project" scope), split that file's findings across two
scoring agents rather than handing one agent an oversized prompt. This
is the batching rule the 2026-09-20 review run should have used from
the start: that run produced 198 raw findings and the orchestrator
batched them into 6 scoring agents ad hoc, by file, because spawning
one Sonnet agent per finding would have meant ~20 spawns re-reading the
same handful of files from scratch instead of ~8 agents each reading
their file once.

The scoring rubric, the numeric filtering rules, the Note-vs-Suggestion
classification criteria, and the false-positive watch-list are stable
reference material and have been relocated to
[`references/scoring-rubric.md`](references/scoring-rubric.md). Read
that file and give its contents to each scoring agent verbatim — nothing
was dropped in the move, only relocated out of this top-level file.

---

## Final report

> **Code review is output-only. Do not modify any source file,
> test file, or config during the review — not even to add a comment.**
> All actionable items are written to a task file for human authorization.

Merge the scored, filtered output into a single report organized by
severity:

**Critical** — must fix before merge  
**Warning** — should fix  
**Suggestion** — consider improving  
**Note** — low-confidence finding; suggested inline comment awaits authorization  
**Positive** — good practices worth noting  

## Verdict

After the final report, emit one of three verdicts based on the
deduplicated, scored finding counts:

| Verdict | Condition |
|---------|-----------|
| **APPROVE** | Critical = 0 AND Warning = 0 |
| **APPROVE WITH NITS** | Critical = 0 AND 1 ≤ Warning < 3 |
| **REQUEST CHANGES** | Critical > 0 OR Warning ≥ 3 |

State the verdict on its own line in bold at the top of the final
report, before the severity sections.

For Critical, Warning, and Suggestion: include `file:line`, confidence
score, what the issue is, and a concrete fix or recommendation.

For Notes: include `file:line`, what the review surfaced, and the
full suggested comment text ready to paste.

End with a one-line verdict: **APPROVE**, **APPROVE WITH NITS**, or
**REQUEST CHANGES**.

---

## Task file

After the report, write `code-review-tasks.md` in the project root.
This file is the authorization checklist — the human reviews it,
removes or modifies items, then runs a follow-up prompt to apply
what remains.

Format:

```markdown
# Code Review Tasks
<!-- Generated by /code-review. Review each item, remove any you
     don't want applied, then run: implement the tasks in
     code-review-tasks.md -->

## Must fix (Critical)
- [ ] `file:line` — <issue>. Fix: <recommendation>

## Should fix (Warning)
- [ ] `file:line` — <issue>. Fix: <recommendation>

## Consider improving (Suggestion)
- [ ] `file:line` — <issue>. Improvement: <recommendation>

## Inline comments to add (Notes — awaiting authorization)
- [ ] `file:line` — add comment:
  ```
  // Code review: <what was found>. Revisit if <triggering condition>.
  ```
```

Omit any section that has no items. Do not include Positives in the
task file — they require no action.

## Cleanup

After the task file is written, delete `/tmp/code-review-findings.md`.
The checkpoint exists to survive a crash mid-run, not to seed the next
run; leaving it behind makes every later review in any repo resume on
these findings (Step 0 would now discard it, but do not rely on that).
When invoked from `/review-pr`, that skill owns the cleanup instead —
leave the file for it.
