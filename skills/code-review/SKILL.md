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
| Step 4 — Confidence scoring | Pass/fail evaluation | `haiku` |
| Step 3 — Deduplication pass | Dedup + grouping | `haiku` |

## Step 0 — Resume check

Before doing anything else, check whether `/tmp/code-review-findings.md`
exists.

**If it exists:**
1. Read it.
2. Print: `Resuming: Step 2 findings loaded from /tmp/code-review-findings.md`
3. Skip Steps 1 and 2 entirely. Use the findings in that file as the
   input to Step 3 (deduplication).

**If it does not exist:** continue to scope determination and Step 1 as normal.

---

## Determine scope

- If $ARGUMENTS is empty or not provided: review staged changes only.
  Run `git diff --cached` to get the diff and identify touched files.
- If $ARGUMENTS is "full project": review all source files in the repo
  (exclude `node_modules`, `dist`, `build`, `.git`, generated files).
- Otherwise treat $ARGUMENTS as a file path, glob, or description and
  review the files it identifies.

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
  -type f \
  \( -name '*.ts'   -o -name '*.tsx'  -o -name '*.js'  -o -name '*.jsx' \
     -o -name '*.py' -o -name '*.rb'  -o -name '*.go'  -o -name '*.rs' \
     -o -name '*.java' -o -name '*.kt' -o -name '*.swift' \
     -o -name '*.html' -o -name '*.toml' -o -name '*.yaml' -o -name '*.yml' \
     -o -name 'Dockerfile' -o -name '*.dockerfile' \
     -o -name 'requirements*.txt' -o -name 'Gemfile' \
     -o -name 'tsconfig*.json' -o -name 'package.json' -o -name 'pyproject.toml' \) \
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
  `requirements.txt`, `Gemfile.lock`) — absence is itself a finding

## Step 2 — Eleven parallel agents (launch all simultaneously)

Each agent receives the full file inventory from Step 1. Agents use
Read, Grep, Glob, Bash, WebSearch, and WebFetch. They must work through
the full inventory systematically — not hand-pick files. If a file leads
to another via import, read that file too.

Agents are: general-purpose, code-reviewer, security-auditor,
qa-expert, dependency-manager, or performance-engineer as appropriate.

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
<paste all agent output here>
EOF
```

---

## Step 3 — Deduplication pass (run after all 11 agents complete)

Run a single dedup agent. Give it all findings from all 11 agents.

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

For each finding from Step 3, launch a parallel Haiku agent. Give each
agent the finding, the relevant source file(s), and any CLAUDE.md files
that apply. The agent must score the finding 0–100 and return the score
with a one-sentence justification.

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
| **APPROVE WITH NITS** | Critical = 0 AND Warning < 3 |
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
