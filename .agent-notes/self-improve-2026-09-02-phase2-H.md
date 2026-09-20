# Phase 2 Agent H — Tightening Audit (2026-09-02)

Prior run: 2026-08-01 / implemented 2026-08-07 (commits 48c162d, 44d23ae,
cb0b38c, 37ee159 already compressed most bloat). This pass measures what
remains post-compression.

## Measurements

| File | Lines | Bytes | Bar | Over/Under |
|---|---|---|---|---|
| CLAUDE.md | 69 | 3534 | <200 lines (rules/prompting-quality.md:28) | Under (66% margin) |
| post-compact-context.md | 34 | 1810 | <=120 lines (Agent H spec) | Under |
| rules/ aggregate | 1913 | 80616 | 2020-line cap (docs/fleet/monitoring.md:50, decision AD-2) | Under, 107 lines headroom |
| rules/parallelism.md | 211 | 13541 | 200-line single-file flag (Agent H spec) | Over by 11 lines |
| rules/autonomous-execution.md | 187 | 6890 | 200 | Under |
| rules/architecture.md | 133 | 4785 | 200 | Under |
| rules/prompting-quality.md | 126 | 5799 | 200 | Under |
| rules/research-sources.md | 114 | 4797 | 200 | Under |
| skills/plan-mission/SKILL.md | 389 | n/a | <500-line skill ceiling | Under, 111 lines headroom |
| agents/*.md (5 sampled) | 23-75 | n/a | <300-line agent flag | All well under |

## Bloat

- **Suggestion** `rules/parallelism.md` (211 lines, 13541 bytes): exceeds
  the 200-line single-rule-file flag by 11 lines and is 2.3x the size of
  the next-largest rule file. Fix: split "Model Selection" (lines ~60-140,
  the routing table + Opus/Fable behavioral compensation blocks) into
  `rules/model-routing.md`; keep orchestration/parallelism planning rules
  in `parallelism.md`. Two files under the 200-line bar instead of one over it.
- **Note** `skills/plan-mission/SKILL.md` (389 lines) is at 78% of the
  500-line skill ceiling stated in `skills/self-improve/references/phase2-audit-agents.md:1-3`.
  No fix required now; flag for the next audit if it grows further.

## Redundancy

- **Warning** `rules/autonomous-execution.md:86-89` vs
  `rules/diagnosis.md:53-57` — same rule stated at equal verbosity in both
  files, each cross-referencing the other instead of one being canonical:
  - autonomous-execution.md:86-89: "The 2-try cap bounds **fix attempts,
    not investigation.** Reaching it is a valid halt only if the STOP
    entry carries the full diagnosis artifact defined in
    `rules/diagnosis.md` — mechanism, origin, causal chain, ruled out —
    plus the error output. 'Two attempts failed' is not a diagnosis."
  - diagnosis.md:53-57 ("### Under autonomous execution"): "The
    2-fix-attempt cap in `rules/autonomous-execution.md` bounds edits,
    not inquiry. Halting on a spent budget is valid only when the
    decision-journal entry carries the artifact above; spending the
    budget is not a diagnosis."
  - Cost: ~2x40 words = ~110 tokens duplicated, injected every session
    (both files load verbatim at session start).
  - Single source of truth: `rules/diagnosis.md` (it owns the diagnosis
    artifact definition the passage depends on). Fix: replace
    autonomous-execution.md:86-89 with one line: "The 2-try cap bounds
    fix attempts, not investigation — see `rules/diagnosis.md` § Under
    autonomous execution for the halt condition."
- No other cross-file restatements found at equal verbosity. CLAUDE.md's
  Commit Messages (line 58), Multi-Agent Parallelism (line 54), and
  Diagnosis (line 62) sections are all single-line pointers into their
  rules/ files, not restatements — this pattern is already correctly
  applied repo-wide post-2026-08-07 compression.
- Sampled agents (backend-developer, api-designer, architect-reviewer,
  code-reviewer, it-ops-orchestrator) all use one-line glosses in
  `## Required Rules` and explicitly avoid restating rule bodies (e.g.
  backend-developer.md:26-29: "Apply `~/.claude/rules/security.md` in
  full ... are not restated here"). No restatement found in this sample.

## Verbose prose

No section met the >50%-compression-with-no-nuance-lost bar this pass.
Checked rules/code-principles.md ("Build to the defined scope"),
rules/architecture.md ("Blast radius", "Reversibility"),
rules/observability.md ("SLO-first design"), rules/prompting-quality.md
("Instruction bloat"), rules/autonomous-execution.md ("Consecutive-fix
stop rule", "Quality Gates"), and skills/self-improve/SKILL.md (Phase
0-1) — all are already bullet-first or dense multi-clause sentences with
no filler paragraph preceding a redundant list. This dimension is clean
post-2026-08-07 compression; nothing to report.

## Dead content

Grepped whole repo (excluding projects/, agent-memory/, .agent-notes/,
temp/) for `<!-- Code review`, TODO, REVISIT, FIXME, Opus 4.6, Sonnet
4.6, claude-3, claude-4-:

- **Warning** `skills/self-improve/references/phase2-audit-agents.md:194,203` —
  stale: "`prompting-quality.md` requires CLAUDE.md ≤ 4KB" and "CLAUDE.md
  > 4KB → flag". The byte cap was retired 2026-08-07 (commit 37ee159);
  current rule (`rules/prompting-quality.md:28`) is "under 200 lines".
  Fix: replace both lines with the 200-line bar (CLAUDE.md is 69 lines,
  well under either bar, so no downstream finding changes).
- **Live, open** `rules/parallelism.md:95` — code-review comment dated
  2026-08-01/corrected 2026-08-08 about PerspectiveGap orchestration
  scores; explicit revisit condition "if Opus 5 orchestration data
  appears" not yet met (Opus 5 cost/quality is discussed elsewhere in
  this same file but not the specific orchestration-prompt-composition
  benchmark the comment tracks). Not stale — condition genuinely unmet.
  No fix; correctly left open.
- **Live, open** `code-review-tasks.md:279,283` — same pattern, same
  2026-08-01 dated comments, stated revisit conditions (Opus 5
  orchestration data; candidate table passing 120 entries) not yet met.
  No fix.
- **Live, open** `code-review-tasks.md:32` — 2026-08-07 note: "the three
  Criticals that stalled autonomous dispatch (T1, T3) could not be
  implemented — the harness auto-mode classifier denies every edit to a
  permissions file." Still unresolved per file's own "Already resolved"
  section not listing it. No fix (outside this audit's write-set).
- **Live, open** `agents/09-meta-orchestration/it-ops-orchestrator.md:7-11` —
  ADR-N2 comment: agent's description promises routing to specialist
  agents but frontmatter grants no `Agent`/`Task` tool. Verified current
  frontmatter (line 4: `tools: Read, Write, Edit, Bash, Glob, Grep`) —
  still no Agent tool, so the comment remains accurate, not stale. No fix
  (explicitly awaiting user decision per its own text).
- **Addressed, false positive** `settings.json:172`,
  `templates/autonomous-settings.json:109` — literal string `'-- COMPACTING:
  verify open TODOs are committed --'` is an echo command, not an actual
  TODO marker. No fix needed.
- Historical `.agent-notes/*.md` and `skills/self-improve/references/
  phase1-research-agents.md` hits naming Opus 4.6/Sonnet 4.6 are
  legitimate — they document the deprecated-model tier for comparison,
  not a live claim that those models are current. Not flagged.

## Post-compact calibration

`post-compact-context.md` (34 lines, 5 sections) — per-section content
line counts (excluding header/separator):
- Autonomous Execution Recovery (7-11): 5 lines
- Model Routing (14-15): 2 lines
- Commit Format (18-23): 6 lines
- Autonomous Restraint (26-29): 4 lines
- Batch Close-Out (32-34): 3 lines

- **Note** `post-compact-context.md:18-23` (Commit Format section): 6
  lines — at the hard flag threshold ("Flag any section > 6 lines", Agent
  H spec dimension 5) and above the file's own softer 4-line-per-rule
  target. This is a drift from the 2026-08-07 recalibration baseline
  (prior observation states "5 sections, each <=5 lines" — no longer
  true; likely grew when commit 37ee159 folded the attribution
  consolidation into this section). Fix: trim to 5 lines by merging
  lines 21-23 (the no-attribution rule) into one sentence: "No
  attribution (Co-Authored-By, Generated-by) in commits/PRs; a 'Built
  with Claude Code' README line is fine." Saves 1 line, brings the
  section to the file's own target.
- Autonomous Execution Recovery (7-11) at 5 lines also exceeds the
  ≤4-line-per-rule target stated in the Agent H spec, but is under the
  hard 6-line flag — no fix required, Suggestion-level only if tightened
  further.
- No section restates content CLAUDE.md already restores verbatim —
  CLAUDE.md's "On Compaction" section (lines 34-37) only names the 5
  section titles, it does not repeat their content. No merge candidates
  among adjacent sections; each covers a distinct behavioral domain.
