---
name: self-improve
description: >
  Strategic self-review of the ~/.claude configuration repo. Researches
  new Claude Code features and Anthropic best practices, audits skills,
  rules, agents, hooks, and settings for gaps and contradictions, then
  produces a prioritized improvement report and task file. Run this
  periodically (e.g., after major Anthropic releases) to keep the
  configuration current with the ecosystem.
disable-model-invocation: false
allowed-tools: Bash, Read, Grep, Glob, Agent, Write, Edit, WebFetch, WebSearch, TodoWrite
clone-dir: ~/temp/self-improve
---

# Self-Improve

Strategic audit of the `~/.claude` configuration repo against the
current state of the Claude Code ecosystem. Produces an actionable,
prioritized improvement list and a task file ready for `/plan-mission`.

**Goal**: Keep the configuration at distinguished-engineer quality —
not just functional, but current with the toolchain, internally
consistent, and continuously improving.

---

## Phase 0 — Recall prior findings

**Resume check**: Before doing anything, check `~/.claude/.self-improve-progress.md`.

If it exists:
- If `phase-1: done` is set, skip Phase 1 agents — load their outputs from
  `.agent-notes/self-improve-phase1-A.md`, `-phase1-B.md`, `-phase1-C.md`, `-phase1-X.md`.
- If `phase-2: done` is set, skip Phase 2 agents — load their outputs from
  `.agent-notes/self-improve-phase2-D.md` through `-phase2-H.md`.
- If `phase-3: done` is set, skip Phase 3 — load deduplicated findings from
  `.agent-notes/self-improve-phase3.md`.
- Resume from the first incomplete phase.

Continue with Phase 0 steps 1–5 regardless — they are fast and idempotent.

Before doing any new work, check what's already known:

1. Read `.agent-notes/` in the current working directory for
   any session observations from prior runs of this skill.
2. State what was found and how it affects scope. If a prior
   self-improve run produced findings that are already in
   `code-review-tasks.md`, skip re-deriving them.
3. Ensure the clone workspace exists:
   ```bash
   mkdir -p ~/temp/self-improve
   ```
   Any git repos cloned during research go here so local tools
   (grep, find, Glob) can run against them without network
   round-trips.
4. **Read the URL registry**: Load
   `~/.claude/skills/self-improve/research-urls.md`. This file is the
   single source of truth for which URLs Agents A, B, and C fetch. Check
   for any entries with `status: unreachable` or `status: deprecated` —
   flag these at the top of Phase 4 output as existing known gaps, not
   new findings.
5. **Prior-change regression gate**: If `code-review-tasks.md` exists with
   checked-off (`[x]`) items from a prior run, verify those changes landed
   cleanly:
   ```bash
   git log --oneline --since="180 days ago" -- ~/.claude/ | head -30
   ```
   For each commit that appears to implement a self-improve finding, read its
   diff (`git show <sha> --stat`) and confirm: (a) the change is still present
   in the config, (b) the area it touched has no new contradictions apparent
   from a quick grep. State the result explicitly — "Prior run implemented N
   changes; spot-checked M: [result]." If the prior run produced findings but
   zero commits followed, name that gap — it is itself a signal worth surfacing
   in Phase 4.
6. **Reconcile the task file against git, then rewrite it.** Checkbox state
   drifts: the 2026-07-24 task file was fully implemented across ~25 commits
   yet left every box unticked, which forced the next run to reconstruct
   state from history and risk re-deriving findings already fixed.

   For each unticked `[ ]` item in `code-review-tasks.md`, look for evidence
   it landed — a commit touching the named file, or the current file
   contents themselves. Tick the ones that are done and **write the file
   back** before any new analysis. Reconciling in your head does not help
   the next run; the file on disk is the handoff.

   **A missing commit is not proof of non-implementation.** When the target
   is gitignored — `.mcp.json`, `.claude/`, the Anthropic-proprietary
   `skills/doc-*` — a task can be genuinely complete with no commit to find.
   Check the file on disk before concluding anything, and record how each
   item was verified.

---

## Phase 1 — Ecosystem research (parallel)

### The four research agents

Launch **A, B, C, and X together** — they share no write targets. Full
prompts, fetch guards, output schemas, and the crash/retry rule are in
[references/phase1-research-agents.md](references/phase1-research-agents.md);
read it before dispatching.

| Agent | Scope |
|-------|-------|
| **A** | What's new in the Claude ecosystem — features, hooks, routing, MCP, cost |
| **B** | Model version and API surface changes |
| **C** | Prompt structure and instruction-design research |
| **X** | Source discovery across all themes, and candidate-queue draining (below) |

### Drain the candidate queue

Discovery has always outrun promotion — the candidate table in
`research-urls.md` grew 31 → 36 → 57 → 91 while only 6 entries were ever
promoted. The cause: Phase 6 promotes only URLs "fetched this run," and
agents A/B/C each fetch from their own *active* list, so no agent ever
fetched a candidate. Nothing consumed the queue.

Agent X therefore **fetches the top 5 candidate URLs by relevance** to this
run's themes, and records an outcome for each:

- **Promote** — content is substantive (≥1000 chars for an Agent A-class
  source, ≥500 for B/C-class) and bears on this config. Move it into the
  matching active section with today's date as `last-verified`.
- **Demote** — unreachable, thin, redirected off-domain, or no longer
  relevant. Leave it in the candidate table and append a `Demoted:` note
  with the date and reason.

Never delete a candidate. Promotion and demotion are both recorded
outcomes; silent deletion destroys the evidence that the queue was worked.

**Phase 1 completion:** each agent writes its full output to
`.agent-notes/self-improve-phase1-[A|B|C|X].md` before returning. Once all
four have completed (or been retried/gapped per the crash-handling rule in
the reference), append `phase-1: done` to
`~/.claude/.self-improve-progress.md`.

---

## Phase 2 — Configuration audit (parallel)

### The five audit agents

Launch **D, E, F, G, and H together** — all read-only, no shared write
targets. Full prompts, file lists, and sampling rules are in
[references/phase2-audit-agents.md](references/phase2-audit-agents.md);
read it before dispatching.

| Agent | Scope |
|-------|-------|
| **D** | Settings, hooks, and MCP |
| **E** | Skills quality |
| **F** | Rules and CLAUDE.md |
| **G** | Prompt structure audit |
| **H** | Tightening audit |

**Phase 2 completion:** each agent writes its full output to
`.agent-notes/self-improve-phase2-[D|E|F|G|H].md` before returning. Once all
five have completed (or been retried/gapped per the crash-handling rule in
the reference), append `phase-2: done` to
`~/.claude/.self-improve-progress.md`.

---

## Phase 3 — Synthesize and deduplicate

Run a single dedup pass across all agent outputs (A through H, plus
Agent X's Discovery Summary):

1. Group findings that describe the same root issue.
2. Keep the most specific instance (file:line + concrete fix).
3. Resolve genuine contradictions by re-reading the source — do not
   use agent summaries as the arbiter. For research-sourced findings
   (from Agents C and G), if a finding conflicts with an existing rule
   in `rules/`, apply this three-tier resolution:
   - **High evidence + High applicability** → research overrides the rule.
     Include the specific rule change recommended.
   - **Medium evidence + High applicability** (e.g., recent unreplicated
     preprints, ahead-of-consensus findings) → rule holds, but surface
     the finding as a Suggestion labeled `[frontier-lag]`. Include the
     existing rule text, the conflicting finding, and a one-sentence case
     for why it merits conscious re-evaluation rather than silent
     suppression. This makes the frontier-lag explicit and auditable.
   - **Low evidence OR Low applicability** → rule wins, finding dropped.
   Document the reasoning in all three cases.
4. Score each finding 0-100 using the shared rubric in
   `skills/code-review/references/scoring-rubric.md` (see the "Scoring
   rubric" heading for the 0/25/50/75/100 table, and the "Filtering rules"
   below it for the drop/classify/cap thresholds).
   **Self-improve delta:** apply the rubric yourself — unlike code-review,
   this skill does not spawn a separate Haiku scoring agent to run it.
5. Apply the filtering rules from that same reference (drop 0-24; classify
   25-49 as Note or Suggestion; cap 50-74 at Suggestion; keep 75+ as-is).

**Phase 3 completion:** Write the deduplicated, scored, filtered findings to
`.agent-notes/self-improve-phase3.md`. Append `phase-3: done` to
`~/.claude/.self-improve-progress.md`.

---

## Phase 4 — Report

Produce a final report structured as:

**Critical** — must fix before next autonomous run  
**Warning** — should fix  
**Suggestion** — consider improving  
**Note** — low-confidence; suggested inline comment  
**Positive** — good practices worth noting  

For Critical/Warning/Suggestion: include approximate `file:line`,
confidence score, issue, and concrete fix.

For Notes: include the full comment text ready to paste.

**Verdict**: APPROVE / APPROVE WITH NITS / REQUEST CHANGES
(APPROVE if Critical=0 and Warning=0; NITS if Critical=0 and 1≤Warning<3;
REQUEST CHANGES if Critical>0 or Warning≥3)

**Convergence alarm — required when verdict is APPROVE or APPROVE WITH NITS:**
The loop's characteristic failure mode is quietly converging on "you're fine"
while drifting in a direction no single run detects. A clean verdict requires
explicit evidence, not just the absence of new findings. State:

1. The 3 most recent findings from the prior run (from checked-off `[x]` items
   in `code-review-tasks.md` or from the git log regression gate in Phase 0).
2. For each: (a) confirmed implemented — cite the commit SHA, or (b) confirmed
   not regressed — describe what you checked, or (c) still pending — explain
   why it wasn't addressed.

If you cannot complete this check (no prior findings, no git history, no
task file), say so explicitly: "No prior run data found — convergence check
not possible." Silence at this point is not acceptable; an unverified APPROVE
is the failure mode the loop exists to prevent.

Append `phase-4: done` to `~/.claude/.self-improve-progress.md`.

---

## Phase 5 — Task file

Write `~/.claude/code-review-tasks.md` (overwrite if it exists).

Format:

```markdown
# Self-Improvement Tasks — ~/.claude Configuration
<!-- Generated by /self-improve on [date].
     Review each item, remove any you don't want,
     then run: /plan-mission implement code-review-tasks.md -->

## Must fix (Critical)
- [ ] `file:line` — issue. Fix: recommendation

## Should fix (Warning)
- [ ] `file:line` — issue. Fix: recommendation

## Consider improving (Suggestion)
- [ ] `file:line` — issue. Fix: recommendation

## Inline comments to add (Notes)
- [ ] `file:line` — add comment:
  // Code review: <what>. Revisit if <condition>.
```

Omit empty sections. Do not include Positives in the task file.

Append `phase-5: done` to `~/.claude/.self-improve-progress.md`.

For any URL the fetch guard marked unreachable or thin this run, add an entry
under "Must fix" or "Should fix" (depending on which agent depended on it):

```
- [ ] `skills/self-improve/research-urls.md` — URL unreachable: [URL].
  Fix: find replacement URL (check Anthropic docs index, sitemap, or
  search for the page title); update the registry entry or remove if
  content is no longer published.
```

---

## Phase 6 — Update URL registry and offer next step

**Update `~/.claude/skills/self-improve/research-urls.md`:**

1. For every URL (active or candidate) that was fetched this run and passed
   the thin-content bar (≥1000 chars for Agent A context, ≥500 chars for
   Agent B/C context, no redirect stub / login wall / paywall teaser):
   - If the URL is already in an active section: set `last-verified` to today
     and confirm `status: active`.
   - If the URL was in the **Candidate URLs** section: move the row to the
     appropriate active section (Agent A, B, or C) and remove it from
     Candidate URLs. A 200 status alone does not qualify for promotion.
2. **Staleness decay:** for every `status: active` entry whose `last-verified`
   date is older than 90 days from today, change `status` to `unknown`. Do not
   remove the entry. An `unknown` URL will be re-verified on the next run before
   being used as a source.
3. For every URL the fetch guard flagged as unreachable or thin:
   set `status` to `unreachable`. Do not remove the entry — the task file
   records the recommendation to find a replacement.
4. If Agent A or Agent B discovered new documentation pages worth tracking,
   they will have added entries to the **Candidate URLs** section already.
   Confirm those entries are present; do not promote them to active sections
   this run (they have not yet been fetched and verified against the thin-content bar).
5. Update `Last full verification:` at the top of the file to today's date
   only if all entries were actually checked. If Agent A ran partial (Phase 1
   barrier), note "Partial verification — Agent A incomplete."

This file is operational metadata, not a config file — updating it during the
run is correct behavior, unlike source files which are read-only during review.

**Then tell the user:**

> Task file written to `~/.claude/code-review-tasks.md`.
> URL registry updated at `~/.claude/skills/self-improve/research-urls.md`.
> Run `/plan-mission implement the tasks in code-review-tasks.md`
> to generate a mission brief for autonomous execution.

If the total task count is fewer than 5, the changes are small enough
to implement directly — offer to do so without a mission brief.

Append `phase-6: done` to `~/.claude/.self-improve-progress.md`.
Delete `~/.claude/.self-improve-progress.md` — the run is complete and
a fresh run should start from Phase 0.

---

## Rules

- Never modify any source file, hook, or agent during the review.
  All changes go through the task file, then user review, then
  `/plan-mission`.
- Every finding must be traceable to a specific source (file:line
  or URL).
- Do not re-derive findings already captured in `code-review-tasks.md`
  from a prior run unless you have evidence they've been addressed.
- Prefer findings that the next autonomous run would actually hit
  over theoretical concerns.
- Model routing for this skill: use Opus (adaptive thinking) for
  Phase 3 synthesis if there are >20 raw findings; Sonnet is
  sufficient for smaller sets. When routing Phase 3 to Opus, instruct:
  "Return only the deduplicated, scored findings list — no preamble, no
  trailing summary." (operational heuristic — see the scale-aware brevity
  section of `~/.claude/rules/prompting-quality.md` for the evidence and its
  limits).
- Cloned repos live in `~/temp/self-improve/`. Clone with
  `--depth 1 --single-branch` (default branch only, minimal history). Do not delete the directory
  after the run — subsequent runs reuse existing clones (pull to
  update if the directory already exists rather than re-cloning).
  Only clone public repos; skip any private or auth-required URL.
