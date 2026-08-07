# Self-Improve Phase 2 — Agent H: Tightening Audit

Generated 2026-08-01. Read-only audit of `~/.claude` for instruction bloat,
cross-file redundancy, and verbose prose. Scope: CLAUDE.md,
post-compact-context.md, all 23 rules/*.md, 5 sampled agents, 3 sampled
skills. Supersedes the 2026-07-24 copy of this file.

**Baseline measurements:**
- CLAUDE.md: 3921 bytes (limit 4096 / 4KB)
- post-compact-context.md: 30 lines (limit 120)
- rules/: 23 files, 1766 lines, 72367 bytes total; largest by lines is
  autonomous-execution.md (179), largest by bytes is parallelism.md (10610)
- Sampled agents: 69–217 lines; none over the 300-line ceiling

---

## Bloat

No file breaches the hard thresholds in prompting-quality.md /
self-improve's Agent H spec (CLAUDE.md ≤4KB, post-compact ≤120 lines,
rule files ≤200 lines, agent files ≤300 lines). Two items worth tracking:

- `CLAUDE.md:1-75` — Note — file is 3921/4096 bytes (95.7% of the 4KB
  ceiling). No headroom left for future additions. Fix: no action now;
  the next addition to CLAUDE.md must cut an equal or greater amount
  elsewhere first (e.g. the `## Rules` file-list section, lines 64-74,
  could drop to one line per bucket). Confidence 60.
- `rules/parallelism.md:1-166` — Suggestion — largest rule file by both
  line count (166) and bytes (10610, ~15% of the entire rules/ budget),
  driven by the Model Selection section (2 tables + 4 prose blockquotes,
  lines 96-160). Under the 200-line cap but the fastest-growing file
  across the last several routing-economics updates. Fix: apply the
  Verbose Prose rewrites below (#1, #2) to reclaim ~80 words without
  losing the routing table or behavioral-compensation bullets.
  Confidence 70.

---

## Redundancy

- `agents/01-core-development/backend-developer.md:25-31` vs
  `rules/security.md:3-12` — **Warning** — The "Security Standards"
  bullet list restates content from a rule file the agent already pulls
  in via `## Required Rules` line 66 (`security.md`). Location 1
  (backend-developer.md:26): `"Input validation at all system
  boundaries"`. Location 2 (security.md:5): `"Validate all input at
  system boundaries — user input, external API responses, URL
  parameters, request bodies, headers."` Same pattern at
  backend-developer.md:27 (`"Parameterized queries — no SQL
  interpolation"`) vs security.md's Common Injection Vectors bullet
  (`"Use parameterized queries — never interpolate user input into
  SQL"`). Cost: ~7 lines / ~45 words reloaded on every invocation of
  this agent, indefinitely. Single source of truth: `security.md`. Fix:
  replace backend-developer.md:25-31 with `Execute security
  requirements per \`~/.claude/rules/security.md\`.` plus only the
  genuinely backend-specific items not already in security.md (JWT
  rotation, RBAC, encryption at rest — keep those three). Model this on
  `architect-reviewer.md:13` (`"Execute per
  ~/.claude/rules/architecture.md."`), which already uses the pointer
  pattern instead of restating. Confidence 80.

- `agents/01-core-development/backend-developer.md:50-51` vs
  `rules/observability.md:29-33` and `rules/retry-idempotency.md`
  (both already referenced at backend-developer.md:62,67) — **Suggestion**
  — `"Distributed tracing with W3C traceparent"` (line 50) restates
  observability.md:33 (`"Inject trace ID and span ID into outbound HTTP
  headers (\`traceparent\` / W3C Trace Context...)"`) near-verbatim.
  `"Idempotency guarantees on all queue consumers"` (line 51) restates
  the idempotency-key mechanism already owned by retry-idempotency.md.
  Fix: fold both into the same pointer sentence as the finding above;
  keep only `"Dead letter queue handling with monitoring and
  alerting"` (line 52) — genuinely new, not covered by either
  referenced rule. Confidence 65.

- `skills/self-improve/SKILL.md:361-364` vs
  `skills/self-improve/SKILL.md:636-639` — **Suggestion** — the
  "Agent-crash handling" paragraph is byte-identical in both locations
  (4 lines / ~40 words each), inside one file that loads as a single
  unit whenever `/self-improve` runs:
  > `**Agent-crash handling:** If any agent in this phase returns no
  > output (crashed, killed, or timed out), relaunch it once. If it
  > fails again on retry, proceed without it and record the unaudited
  > axis as an explicit gap in the Phase 4 report.`
  Fix: state the policy once (e.g. a "## Agent-crash handling policy"
  subsection right after Phase 0), then replace both inline copies with
  `Agent-crash handling: see policy above.` Saves ~40 words per skill
  load. Confidence 85.

- `CLAUDE.md:58` vs `rules/commits.md:5-6` — **Note** — CLAUDE.md's
  `"Subject \`<type>(<scope>): <desc>\` ≤72 chars, lowercase, no
  period"` restates commits.md's Subject spec near-verbatim rather than
  purely pointing to it. Low cost (1 line, ~15 words) and arguably
  intentional — CLAUDE.md gives the one fact needed 90% of the time,
  full spec is one hop away. Flagging for awareness only. Fix if
  desired: `"Conventional Commits — see \`~/.claude/rules/commits.md\`
  for format."` Confidence 40.

**Checked and NOT flagged:** 119 of 128 agent files carry the identical
line `"Read the referenced rule file before relying on it — subagents
do not auto-load rules/."` This looks like mass duplication but is not
a fixable redundancy: each agent file is loaded standalone by an
isolated subagent that never sees `rules/parallelism.md` (where the
policy is also stated once, for the orchestrator). Removing the
per-agent line would silently break correctness for every subagent
invocation. No action recommended.

---

## Verbose prose

- `rules/parallelism.md:109-113` — **Suggestion** — 5-line/~58-word
  blockquote leads with routing-economics narrative before its one
  actionable clause. Rewrite (23 words, 60% shorter): `"Sonnet 5 ≈
  near-Opus-4.8 quality at ~60% of Opus token cost — covers most
  implementation and routine agentic work now. Default-to-Sonnet is
  stronger, not weaker."` Confidence 65.

- `rules/parallelism.md:115-121` — **Suggestion** — 7-line/~72-word
  blockquote, same pattern for Opus 5. Rewrite (29 words, 60% shorter):
  `"Opus 5 ≈ Fable-class capability at ~half Opus 4.8's token cost —
  viable for more implementation/routine agentic work, not just deep
  architectural decisions. Fable still owns long-horizon/mission-brief
  execution (see table above)."` Confidence 65.

- `post-compact-context.md:6-15` — **Warning** — "Autonomous Execution
  Recovery" section runs 8 content lines (~73 words) — the only section
  in this file over the 6-line flag threshold (target ≤4 lines/rule per
  the Agent H spec). Rewrite (33 words, 55% shorter, all 5 steps
  preserved): `"If a \`plans/\` mission brief is active: re-read
  \`README.md\` and \`decision-journal.md\` from disk — not the
  compacted summary — check \`[x]\`/\`[ ]\` task status, read the
  current batch's \`overview.md\`, then resume from the first
  incomplete task."` Confidence 80.

---

## Dead content

- `rules/prompting-quality.md:36-37` — **Warning** — stale metrics:
  `"...aggregate resident footprint of \`rules/\` (~62KB). All rule
  files are injected verbatim every session — confirmed by direct
  inspection (22 files, ~10.3k words / ~14k tokens)..."` Measured today:
  23 files (`ls ~/.claude/rules/*.md | wc -l`), 72367 bytes (~70.7KB,
  `wc -c ~/.claude/rules/*.md`), 1766 lines. The count is stale by
  exactly one file — `rules/diagrams.md`, added 2026-08-01 per the
  working tree (`?? rules/diagrams.md` in git status), is not yet
  reflected. Fix: update to "23 files, ~72KB" or, to avoid re-staling,
  replace the hardcoded numbers with an instruction to check current
  footprint (`wc -c ~/.claude/rules/*.md | tail -1`). Confidence 90.

- Mermaid references — **Note** — `grep -rni "mermaid" ~/.claude
  --include="*.md"` returned zero hits across rules/, agents/, skills/.
  rules/diagrams.md's PlantUML-default policy (added 2026-08-01) has no
  stragglers to clean up. No action needed — recording the clean result
  per the task's explicit check. Confidence 95.

- No open `<!-- Code review: ... -->` comments found (the only hit is
  the literal pattern description inside self-improve/SKILL.md:601,
  not an actual unresolved comment). No TODO/FIXME/REVISIT markers
  found in rules/, CLAUDE.md, post-compact-context.md, or agents/. One
  `ADR-N2` comment exists at
  `agents/09-meta-orchestration/it-ops-orchestrator.md:7-11`, explicitly
  flagged in-file as awaiting a user decision (not stale — correctly
  self-documenting a deferred capability change). No fix needed.
  Confidence 85.

---

## post-compact calibration

- `post-compact-context.md:6-15` "Autonomous Execution Recovery" — see
  **Verbose prose** finding above (same location, same fix) — the only
  section exceeding the ≤6-line flag / ≤4-line target.

- All other sections are already well-calibrated: "Model Routing"
  (17-19, 2 body lines), "Commit Format" (21, 1 line), "Autonomous
  Restraint" (23-27, 4 body lines — exactly at the ≤4-line target), and
  "Batch Close-Out" (29-30, 1 line) each restore a genuine behavioral
  rule at or under the target length, condensed from — not copied
  verbatim from — their source rule files
  (autonomous-execution.md's Consecutive-fix stop rule and Quality
  Gates sections, parallelism.md's Model Selection table). No further
  compression recommended; further cuts would start losing the
  triggering condition (the "3x consecutively" / "2 consecutive
  failures" thresholds), which is exactly the kind of nuance
  post-compact restoration exists to preserve. Confidence 75.

---

## Summary of scored findings (≥70 confidence)

| Finding | Severity | Confidence |
|---|---|---|
| backend-developer.md:25-31 restates security.md | Warning | 80 |
| post-compact-context.md:6-15 over 6-line threshold | Warning | 80 |
| prompting-quality.md:36-37 stale rules/ file count & size | Warning | 90 |
| SKILL.md:361-364 / 636-639 byte-identical crash-handling text | Suggestion | 85 |
| parallelism.md largest rule file, growing | Suggestion | 70 |
| mermaid grep clean (no stragglers) | Note | 95 |

Estimated per-session token savings if all rules/ and post-compact
fixes are applied: ~80 words (~105 tokens) from parallelism.md
Verbose-prose rewrites, recurring every session since rules/ loads
verbatim every session; ~40 words (~50 tokens) from the
post-compact-context.md rewrite, recurring every compaction event.
Agent- and skill-level fixes (backend-developer.md, self-improve
SKILL.md) save tokens only when that specific agent/skill is invoked,
not on the per-session baseline.
