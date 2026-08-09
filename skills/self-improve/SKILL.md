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

Strategic audit of the `~/.claude` configuration repo against the current state of the Claude Code ecosystem. Produces an actionable, prioritized improvement list and a task file ready for `/plan-mission`.

**Goal**: Keep the configuration at distinguished-engineer quality — not just functional, but current with the toolchain, internally consistent, and continuously improving.

## Phase 0 — Recall prior findings

**Resume check**: Before doing anything, check `~/.claude/.self-improve-progress.md`.

If it exists:
- If `phase-1: done` is set, skip Phase 1 agents — load their outputs from `.agent-notes/self-improve-phase1-A.md`, `-phase1-B.md`, `-phase1-C.md`, `-phase1-X.md`.
- If `phase-2: done` is set, skip Phase 2 agents — load their outputs from `.agent-notes/self-improve-phase2-D.md` through `-phase2-H.md`.
- If `phase-3: done` is set, skip Phase 3 — load deduplicated findings from `.agent-notes/self-improve-phase3.md`.
- Resume from the first incomplete phase.

Continue with Phase 0 steps 1–6 regardless — fast and idempotent. Full steps (read `.agent-notes/`, ensure the clone workspace, read the URL registry, the prior-change regression gate, reconcile the task file against git) are in [references/phase0-recall.md](references/phase0-recall.md).

## Phase 1 — Ecosystem research (parallel)

Launch **A, B, C, and X together** — they share no write targets. Full prompts, fetch guards, output schemas, and the crash/retry rule are in [references/phase1-research-agents.md](references/phase1-research-agents.md).

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

**Phase 1 completion:** each agent writes its full output to `.agent-notes/self-improve-phase1-[A|B|C|X].md` before returning. Once all four have completed (or been retried/gapped per the crash-handling rule in the reference), append `phase-1: done` to `~/.claude/.self-improve-progress.md`.

## Phase 2 — Configuration audit (parallel)

Launch **D, E, F, G, and H together** — all read-only, no shared write targets. Full prompts, file lists, and sampling rules are in [references/phase2-audit-agents.md](references/phase2-audit-agents.md).

| Agent | Scope |
|-------|-------|
| **D** | Settings, hooks, and MCP |
| **E** | Skills quality |
| **F** | Rules and CLAUDE.md |
| **G** | Prompt structure audit |
| **H** | Tightening audit |

**Phase 2 completion:** each agent writes its full output to `.agent-notes/self-improve-phase2-[D|E|F|G|H].md` before returning. Once all five have completed (or been retried/gapped per the crash-handling rule in the reference), append `phase-2: done` to `~/.claude/.self-improve-progress.md`.

## Phase 3 — Synthesize and deduplicate

Run a single dedup pass across all agent outputs (A through H, plus Agent X's Discovery Summary):

1. Group findings that describe the same root issue.
2. Keep the most specific instance (file:line + concrete fix).
3. Resolve genuine contradictions by re-reading the source — do not use agent summaries as the arbiter.

Then score and filter what survives. The three-tier contradiction rubric, the scoring rubric, and the drop/classify/cap filtering thresholds are in [references/finding-resolution.md](references/finding-resolution.md).

**Phase 3 completion:** Write the deduplicated, scored, filtered findings to `.agent-notes/self-improve-phase3.md`. Append `phase-3: done` to `~/.claude/.self-improve-progress.md`.

## Phase 4 — Report

Produce the report: five severities (Critical/Warning/Suggestion/Note/Positive), `file:line` + confidence + fix per finding, and the required convergence alarm when the verdict is clean. Full structure and the convergence-alarm procedure are in [references/output-formats.md](references/output-formats.md).

**Verdict**: APPROVE / APPROVE WITH NITS / REQUEST CHANGES (APPROVE if Critical=0 and Warning=0; NITS if Critical=0 and 1≤Warning<3; REQUEST CHANGES if Critical>0 or Warning≥3)

Append `phase-4: done` to `~/.claude/.self-improve-progress.md`.

## Phase 5 — Task file

Write `~/.claude/code-review-tasks.md` (overwrite if it exists). Section format, the unreachable-URL entry template, and the omit-empty-sections rule are in [references/output-formats.md](references/output-formats.md).

Append `phase-5: done` to `~/.claude/.self-improve-progress.md`.

## Phase 6 — Update URL registry and offer next step

Update `~/.claude/skills/self-improve/research-urls.md`: promote and re-verify fetched URLs, apply the 90-day staleness decay, mark unreachable URLs, confirm candidate entries, and update the verification header. Full five-step procedure is in [references/url-registry.md](references/url-registry.md).

**Then tell the user:**

> Task file written to `~/.claude/code-review-tasks.md`.
> URL registry updated at `~/.claude/skills/self-improve/research-urls.md`.
> Run `/plan-mission implement the tasks in code-review-tasks.md`
> to generate a mission brief for autonomous execution.

If the total task count is fewer than 5, offer to implement directly instead of via a mission brief.

Append `phase-6: done` to `~/.claude/.self-improve-progress.md`. Delete `~/.claude/.self-improve-progress.md` — the run is complete and a fresh run should start from Phase 0.

## Rules

- Never modify any source file, hook, or agent during the review. All changes go through the task file, then user review, then `/plan-mission`.
- Every finding must be traceable to a specific source (file:line or URL).
- Do not re-derive findings already captured in `code-review-tasks.md` from a prior run unless you have evidence they've been addressed.
- Prefer findings the next autonomous run would actually hit over theoretical concerns.
- Model routing: use Opus (adaptive thinking) for Phase 3 synthesis if there are >20 raw findings; Sonnet suffices for smaller sets. When routing to Opus, instruct: "Return only the deduplicated, scored findings list — no preamble, no trailing summary" (see the scale-aware brevity section of `~/.claude/rules/prompting-quality.md`).
- Cloned repos live in `~/temp/self-improve/`. Clone with `--depth 1 --single-branch`. Do not delete the directory after the run — subsequent runs reuse existing clones (pull to update if the directory already exists). Only clone public repos; skip any private or auth-required URL.
