# Self-Improve Phase 2 — Agent G: Prompt Structure Audit (2026-08-01)

Audited: all 23 files in `rules/`, `CLAUDE.md`, 5 agents
(backend-developer, api-designer, code-reviewer, architect-reviewer,
it-ops-orchestrator), 3 skills (plan-mission, code-review, self-improve).
Checklist sourced from Agent C's research this run (see prompt), not the
prior run's checklist (compare the stale 2026-07-24 copy this overwrites —
different principle set, not directly comparable).

---

## Systemic patterns (reported once)

### P8(a) — Unmeasurable adverb-stacked checklist bullets
`agents/10-research-analysis/research-analyst.md:9-16` (sample instance) —
Warning — Checklist items use adjective+verb+adverb inversion with no
acceptance criterion, e.g. "Sources credible maintained consistently",
"Insights actionable provided strategically". Grep used:
`grep -rnE "^- [A-Za-z ]+ (verified|achieved|delivered|provided|ensured|
controlled|demonstrated|maintained|implemented|executed|performed|managed|
handled|conducted|applied|integrated|optimized|validated|documented|
monitored) (thoroughly|comprehensively|effectively|efficiently|properly|
accurately|consistently|continuously|strategically|systematically|
proactively|measurably|appropriately|successfully|correctly)" agents/`
returns **88 matching lines across 50 files** (C's estimate: ~98 lines /
46 files — same order of magnitude, confirms the pattern; exact counts
differ because grep patterns differ, not because the phenomenon is
smaller). Fix: delete each line or replace with a measurable criterion
(e.g. "Zero unresolved contradictions between cited sources"). Pure
subtraction — no behavior lost. Confidence: 85.

In-sample note: `agents/04-quality-security/code-reviewer.md:12,14`
also matches the regex ("Zero critical security issues verified",
"Cyclomatic complexity < 10 maintained") but these ARE measurable
(numeric threshold) despite the awkward verb-at-end phrasing — do not
delete, reword only for clarity. Confidence: 80.

### P8(b) — "0 of 128 agents contain a worked example" — REFUTED
Warning (finding-integrity issue in the checklist itself) —
`grep -rlniE "^#+ .*example|Routing Example|Example [0-9]" agents/`
returns 9 files, not 0. Concrete counter-examples:
- `agents/09-meta-orchestration/agent-installer.md:74-90` — full worked
  "Usage Example": literal user prompt, the agent's actual table
  output, and a follow-up question. Genuine worked example.
- `agents/09-meta-orchestration/it-ops-orchestrator.md:41-54` (in this
  audit's sample) — three "Routing Examples", each a scenario
  decomposed into named sub-agent routing decisions. Weaker (no
  literal output shown) but still input->decision worked examples.
- 7 more files (`azure-infra-engineer.md:40-44`,
  `powershell-5.1-expert.md:46-51`, etc.) use "Example Use Cases" —
  example *prompts* only, no worked resolution shown.
Correct claim: worked examples with resolved output exist in ~1-2 of
128 agents; do not carry forward "0 of 128" into the final report.
Confidence: 90.

### P10 — inoperative "read only the relevant rule file" advice
`rules/prompting-quality.md:39-40` — Warning — Confirmed the only
occurrence of this specific advice in the audited sample. Searched all
23 `rules/` files, `CLAUDE.md`, the 5 agents, and the 3 skills; no
other file repeats it. `rules/parallelism.md:55-57` ("Subagents do not
auto-load `rules/`... must Read that file before relying on it") looks
adjacent but is not the same defect — subagents genuinely do not get
`rules/` injected, so scoped reading is *operative* there. Only the
orchestrator's own session (all 23 files injected unconditionally per
`prompting-quality.md:36`) has the inoperative version, and only in
this one place. `CLAUDE.md:64-74` lists all 23 rule files by category
with no "read only what's needed" framing. Net: single-file,
single-instance problem — a one-line fix at its origin, not a
sweep. Fix: replace `:39-40` with either an accurate statement that
resident cost is fixed regardless of reading discipline, or point to
the real levers already documented 15 lines below (`paths:`
frontmatter, `:54-55`) and trimming/consolidation (`:31-33`).
Confidence: 80.

---

## Per-principle findings

**P1** — `rules/parallelism.md:87` — Confirmed verbatim: routes
"Planning / architecture / implementation (heavy)" to `opus`, listing
"mission decomposition" under `When`. C's judgment (cautionary note,
no re-route, since Opus 5 is untested by PerspectiveGap) is reasonable
— Note, not Warning: PerspectiveGap is a single preprint and the delta
it measures (opus-4-8 vs Sonnet 5/Fable 5) predates Opus 5. Confidence:
75.

Extension — same unstated assumption found in
`skills/plan-mission/SKILL.md:367` ("Phase 5 | Task decomposition |
Opus + adaptive thinking") and `:365` ("Phase 3 | Architecture
decisions... | Opus + adaptive thinking"). Phase 5 is a direct
instance of "orchestration-prompt composition" — it literally produces
the per-task agent prompts that PerspectiveGap's benchmark evaluates.
Warning — this is a live, frequently-invoked routing decision (not
just a reference table) that inherits the same untested-on-Opus-5 gap
as P1. Fix: add the same cautionary note used for
`parallelism.md:87` as a one-line footnote to plan-mission's Model
Routing table; do not re-route. Confidence: 70.

No other file in the sample routes decomposition/architecture work to
opus without either caveating it or being a generic policy line too
unspecific to count as a separate instance
(`skills/upgrade-deps/SKILL.md:14`, `skills/explore/SKILL.md:8`,
`skills/review-pr/SKILL.md:12` — "Opus only for explicit architectural
decisions", no phase-specific routing).

**P2** — `rules/parallelism.md:40-42` — Confirmed: Section 0 "Prior
observations" instructs "inject them verbatim here" with no filter for
relevance, staleness, or distractor content, and no boundary rule
distinguishing task-relevant notes from unrelated accumulated context.
Warning, cheapest fix available. Fix: add one sentence — "Include only
entries relevant to this task's write-set or read-set; omit unrelated
observations even if present in the file." Confidence: 85.

Extension — checked all 3 sample skills that spawn agents for the same
defect. Not found: `skills/self-improve/SKILL.md` Phase 0 (`:44-45`)
has the orchestrator itself read `.agent-notes/` for its own context
(not injected into a fresh subagent prompt) — a different mechanism,
same risk surface, but outside this principle's literal scope. Phase 3
(`:648-651`) forwards "all agent outputs (A through H)" to a dedup
pass, but that content is each agent's own on-topic findings from
*this* run, not accumulated unrelated `.agent-notes/` — not a P2
instance. `code-review/SKILL.md` does not inject `.agent-notes/` into
subagents at all (its "verbatim" mentions at `:118` and `:176` forward
the review checklist and scoring rubric — required content, not
accumulated notes). No second instance of P2 found in the 3-skill
sample; report as single-file for now. Confidence: 70.

**P3** — `rules/parallelism.md:36-77` — Confirmed gap: the 10-item
agent prompt structure (Prior observations through Commit format) has
no Resumption section covering how a subagent should interpret a terse
follow-up message sent via SendMessage (e.g., "continue", "now also do
X"). Ambiguity handling exists at `:131` ("If scope is ambiguous,
implement the minimal interpretation") but that governs
original-task ambiguity, not resumption semantics. Searched all
`rules/`, the 5 sample agents, and 3 sample skills for
"resum-"/"terse follow-up"/"continuation" — every hit was either a
skill's own Step-0 resume-checkpoint logic (the orchestrator resuming
its *own* crashed multi-step run — a different concept from a subagent
interpreting a short follow-up message) or unrelated ("Continuation
patterns" in swift-expert.md, about Swift string literals). Gap
confirmed real and unaddressed anywhere in the sample. Warning. Fix:
add a Resumption subsection to the agent-prompt-structure procedure,
e.g.: "If resuming a prior agent via SendMessage rather than launching
fresh, terse follow-ups inherit the original task's
write-set/read-set/boundaries unless the message explicitly changes
them; do not treat a short follow-up as license to re-scope the task."
Confidence: 75.

**P6** — `skills/self-improve/SKILL.md` — Confirmed: `wc -l` = 831
lines. Checked all 28 `skills/*/SKILL.md`: next-largest is
`payments-setup/SKILL.md` at 498 lines (2 lines under the 500 ceiling
— Note-worthy, one small edit from breaching), then `doc-pptx` at 483.
No other skill exceeds 500. self-improve is confirmed the sole breach,
by a wide margin (66% over ceiling). Warning. `references/` subdirs
exist for exactly 2 skills — `skills/plan-mission/references/` and
`skills/code-review/references/` — both already used to move stable
material out of the top-level file (code-review moved its 11
checklists to `references/checklists.md` at `:112-119` and its scoring
rubric to `references/scoring-rubric.md` at `:165-177`). self-improve
has no `references/` dir despite being the skill that most needs it —
Phase 1 agent prompts (`:78-372`, ~295 lines) and Phase 2 audit
prompts (`:373-647`, ~275 lines) are both self-contained,
rarely-changing agent-prompt blocks that fit the same
extract-to-references pattern already proven twice in this codebase.
Fix: create `skills/self-improve/references/phase1-agents.md` and
`references/phase2-agents.md`. Confidence: 90.

**P7** — Confirmed: `find . -maxdepth 4 -type d -iname evals` and
`find agents skills -type d -iname "*eval*"` both return empty — 0
`evals/` dirs across all 28 skills and 128 agents. Note (per C's
scoping instruction, recommendation limited to code-review, fix,
plan-mission — the highest-blast-radius skills: code-review gates
merges, fix loops autonomously up to 5 iterations, plan-mission
generates autonomous-execution briefs). No eval harness exists for any
of the three. Confidence: 95 (direct `find`, unambiguous).

---

## Standing check — Scale-aware brevity on Opus-routed prompts/phases

Verified C's claim rather than assuming it: checked all 5 sample
agents' frontmatter — none route to `opus` (`backend-developer`:
sonnet, `api-designer`: sonnet, `code-reviewer`: sonnet,
`architect-reviewer`: sonnet, `it-ops-orchestrator`: sonnet). C's
"7 Opus-routed agents comply" claim concerns the full 128-agent set,
outside this sample's 5 named agents (all non-Opus) — not
independently re-verified here since it falls outside the assigned
5-agent sample.

Extended to Opus-routed **skill phases** (C did not cover this):
- `skills/plan-mission/SKILL.md` Phase 3 and Phase 5 route to "Opus +
  adaptive thinking" (`:365,367`). Both carry explicit brevity+shape
  constraints at `:374-378`: Phase 3 — "Return only the architecture
  decisions. Format: numbered ADR list..."; Phase 5 — "Return only the
  task breakdown. Format: numbered task list...". Both criteria
  (conciseness + shape) satisfied. Compliant — no finding.
- `skills/self-improve/SKILL.md` Phase 3 conditionally routes to Opus
  when >20 raw findings (`:822-826`), with "Return only the
  deduplicated, scored findings list — no preamble, no trailing
  summary." Satisfies criterion 1 (conciseness); shape is implied by
  Phase 3's own body format but not re-stated inline at the routing
  note. Borderline — Suggestion: add "as a scored findings list, one
  line per finding" to the instruction at `:825-826` for explicitness.
  Confidence: 60.
- `skills/code-review/SKILL.md` — no phase routes to Opus (Step 2:
  sonnet, Steps 3-4: haiku) — not applicable.

No Opus-routed skill phase in the 3-skill sample lacks both criteria;
C's compliance claim extends cleanly to skill phases for plan-mission,
and self-improve is a defensible borderline case.

---

## Confidence-filtered summary (>=70) for parent report

- P8(b) "0/128 worked examples" is REFUTED — agent-installer.md and
  it-ops-orchestrator.md (in-sample) both contain worked examples.
  Confidence 90.
- P8(a) adverb-stacked checklist pattern confirmed systemic: 88 lines /
  50 files (C: ~98/46 — same order of magnitude). Confidence 85.
- P2 confirmed at rules/parallelism.md:40-42, cheapest fix available;
  no second instance found in the 3-skill sample. Confidence 85
  (finding) / 70 (extension-not-found, reported so it isn't silently
  dropped).
- P10 confirmed single-instance (not systemic) at
  prompting-quality.md:39-40; no repeat elsewhere in sample.
  Confidence 80.
- P3 gap confirmed, no resumption guidance anywhere in sample.
  Confidence 75.
- P1 confirmed at parallelism.md:87; extension found at
  plan-mission/SKILL.md:365,367 (same untested-Opus-5 assumption, live
  routing decision). Confidence 75/70.
- P6 confirmed: self-improve 831 lines, sole breach; payments-setup at
  498 is one edit from breaching. references/ pattern exists (2
  skills) but not applied to self-improve despite fitting need.
  Confidence 90.
- P7 confirmed: 0 evals/ dirs anywhere. Confidence 95.
