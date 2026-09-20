# Phase 1 — Agent C (prompt structure + AI governance)

Run date: 2026-09-02. Prior run: 2026-08-01. Read-only.

## Sources fetched

| URL | Status | Content |
|---|---|---|
| https://airc.nist.gov/airmf-resources/airmf/ | 200 | rich (NIST fetch 1/3) |
| https://airc.nist.gov/airmf-resources/playbook/audit-log/ | 200 | rich (NIST fetch 2/3) |
| https://airc.nist.gov/airmf-resources/playbook/ | 200 | rich, but does NOT enumerate subcategories (NIST fetch 3/3) |
| https://www.anthropic.com/research | 200 | rich (Agent C active URL) |
| https://arxiv.org/abs/2607.19257 | 200 | rich — paper 1 |
| https://arxiv.org/pdf/2606.20683 | 200 | PDF, truncated extraction — paper 2 |
| https://arxiv.org/html/2502.04295v3 | 200 | rich — paper 3 |
| https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | 200 | rich (tier-3 practitioner) |

WebSearch runs: arxiv prompt/instruction design (7 results); Anthropic
engineering context/harness guidance (7 results). No repos cloned — no
candidate repo met the provenance gate with a structurally novel approach.

---

## Prompt-structure assessments

### P1 — Instruction count, not per-section constraint count, is the binding limit

- **Finding**: Perfect-response rate collapses to zero by N=80 instructions
  for every model, format, and placement tested.
- **Source**: arxiv:2607.19257, *Prompt Design at Scale* (Eliav, 2026),
  Tier 4 — **preprint, not peer-reviewed**. 5 models, VeyraBench,
  instruction counts 10–160.
- **Evidence strength**: Medium (preprint, controlled synthetic benchmark).
- **Applies to Claude**: Medium — instruction-following models were in the
  test set family, but no Opus/Sonnet-tier model was named.
- **Alignment**: Aligned. `rules/prompting-quality.md:70-82` (Constraint
  budget) already caps ≤6 hard constraints per section with degradation
  bands at 7–15 and >15, sourced to MOSAIC (arxiv:2601.18554). This paper
  is a second, independent source agreeing on the same monotone-degradation
  shape.
- **Verdict**: **Aligned** — `rules/prompting-quality.md:70-82`. Upgrade
  available: the constraint budget now rests on two independent preprints,
  not one; the rule's confidence wording could say so.

### P2 — Instruction *placement* matters at least as much as format

- **Finding**: Placement effects on adherence are at least as large as
  format effects in most models tested.
- **Source**: arxiv:2607.19257, Tier 4 — **preprint, not peer-reviewed**.
- **Evidence strength**: Medium.
- **Applies to Claude**: Medium.
- **Alignment**: Misaligned (gap). `rules/prompting-quality.md` governs
  constraint *count* (:70-82), *verb register* (:84-101), and *brevity*
  (:103-117) but says nothing about where in a prompt a constraint should
  sit. `rules/parallelism.md:33-82` orders agent-prompt sections but the
  ordering is justified as an assembly sequence, not as a placement-effect
  finding.
- **Verdict**: **Misaligned** — `rules/prompting-quality.md:70` (section
  boundary). **Fix**: add one bullet to the Constraint budget section:
  "Place hard constraints adjacent to the task they bind, not in a trailing
  block — placement effects on adherence are comparable to format effects
  (arxiv:2607.19257, preprint)." **Confidence: 60** — single preprint;
  worth one bullet, not a new section.

### P3 — Markdown carries no universal formatting advantage

- **Finding**: Markdown showed no universal advantage over other formats;
  one 35B model performed better on plain text.
- **Source**: arxiv:2607.19257, Tier 4 — **preprint, not peer-reviewed**;
  corroborated in direction by arxiv:2502.04295 (CFPO, May 2025, Tier 4 —
  **preprint**): "no universal format excels across all models," 2–8%
  benchmark spread from format alone.
- **Evidence strength**: Medium (two independent preprints agree).
- **Applies to Claude**: Low–Medium — neither study tested a Claude-tier
  model, and Anthropic's own docs (Tier 1) specify markdown for CLAUDE.md,
  skills, and agent frontmatter. Tier 1 wins per the judgment criteria.
- **Alignment**: Config is better. The repo uses markdown because the
  harness requires it, and nowhere claims markdown improves accuracy — so
  there is no claim to correct.
- **Verdict**: **Config is better** — no config claim asserts markdown
  superiority; the format is harness-mandated, so a model-specific format
  preference is not actionable here.

### P4 — Format and content must be optimized jointly, not separately

- **Finding**: The optimal format for a prompt depends on its content;
  separate content/format optimization is suboptimal (CFPO beats
  content-only by 2–8%).
- **Source**: arxiv:2502.04295v3 (May 2025), Tier 4 — **preprint, not
  peer-reviewed**. Mistral-7B, LLaMA-3/3.1-8B, Phi-3-Mini.
- **Evidence strength**: Medium.
- **Applies to Claude**: Low — all four tested models are ≤8B open models;
  the paper's own result is that format sensitivity is model-specific, which
  blocks transfer to Opus/Sonnet.
- **Alignment**: Config is better. `rules/prompting-quality.md:84-101`
  (register shifting) already ties verb choice to intended processing depth
  — a content/format coupling stated at a level that survives the
  model-specificity caveat, without an automated search loop the repo has
  no way to run.
- **Verdict**: **Config is better** — `rules/prompting-quality.md:84-101`
  encodes the transferable half of this finding; the automated joint-search
  half is not applicable to a hand-authored rule set.

### P5 — Context degradation is a cliff at 64–128k, not a gradual slope

- **Finding**: Recall stable through 64–128k tokens, then degrades sharply
  and format-dependently; accuracy spreads reach 48 points at 128k.
- **Source**: arxiv:2607.19257, Tier 4 — **preprint, not peer-reviewed**.
- **Evidence strength**: Medium.
- **Applies to Claude**: Medium — the repo defaults to 1M-context models
  (`claude-opus-5[1m]`, Fable 5), so the tested range sits well inside the
  window the config routinely fills.
- **Alignment**: Misaligned (gap). `rules/prompting-quality.md:59-68`
  (Agent context budget) bounds context by *file count* (20–30) and cites
  attention dilution (arxiv:2509.21361), but names no token threshold.
  `rules/autonomous-execution.md` compacts between batches on a structural
  trigger (batch boundary), not on a context-fill trigger.
- **Verdict**: **Misaligned** — `rules/prompting-quality.md:64`. **Fix**:
  add to the Agent context budget bullets: "A 1M window is not a licence to
  fill it — recall degrades sharply past roughly 128k tokens
  (arxiv:2607.19257, preprint). Compact or split when an agent's context
  passes that band, regardless of file count." **Confidence: 65** — the
  file-count cap already proxies for this in most cases, so the fix is
  additive, not corrective.

### P6 — Explicit brevity constraints on high-capability models

- **Finding**: See the pre-seeded assessment below (arxiv:2604.00025).
- **Alignment**: Aligned. `rules/prompting-quality.md:103-117` owns the
  caveated wording; `agents/plantuml-visual-qa.md:12` — the repo's only
  `model: opus` agent — carries "Return a structured table … No preamble,
  no trailing summary"; `skills/self-improve/SKILL.md:112` instructs the
  same for Opus-routed Phase 3 synthesis.
- **Verdict**: **Aligned** — `rules/prompting-quality.md:103-117`,
  `agents/plantuml-visual-qa.md:12`. See pre-seeded block for the sampling
  caveat.

### P7 — Long-running agents need a durable progress surface, not compaction alone

- **Finding**: "Compaction isn't sufficient" for work spanning multiple
  context windows; use a progress file, a structured status file the agent
  may only narrowly edit, descriptive git commits, and a session-startup
  sequence that reads progress + git log before new work. Use a distinct
  initializer prompt for the first context window.
- **Source**: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
  (2025-11-26), Tier 3 practitioner (Anthropic engineering).
- **Evidence strength**: Medium (single high-credibility practitioner source).
- **Applies to Claude**: High — authored by the model vendor about this
  exact harness.
- **Alignment**: Aligned. `rules/autonomous-execution.md` implements every
  element: the mission-brief directory as the progress surface, the
  "After Every Compaction" re-read-from-disk rule, checkbox state as the
  canonical progress record, one-commit-per-task discipline, and the
  Startup Sequence (read README.md → decision-journal → batch overview).
  `CLAUDE.md` adds the PostCompact hook restoring condensed rules.
- **Verdict**: **Aligned** — `rules/autonomous-execution.md` Startup
  Sequence and "After Every Compaction". The repo is *ahead* of the post on
  one point: it also restores rule content via a PostCompact hook, which
  the post does not describe.

### P8 — Curate a small high-signal tool set per agent

- **Finding**: 2026 practice is a small curated tool set per agent, with a
  tool-search mechanism exposing the long tail; tool parameters should be
  unambiguously named (`user_id`, not `user`).
- **Source**: Anthropic engineering — writing-tools-for-agents and
  effective-context-engineering-for-ai-agents (Tier 3, surfaced via
  WebSearch; not individually fetched this run).
- **Evidence strength**: Low–Medium (search-snippet level, not full read).
- **Applies to Claude**: High.
- **Alignment**: Aligned. `rules/parallelism.md:161` caps agents at >8 tools
  ("Scope to 3–5 tools per agent") with the MCP cohesive-group carve-out at
  `rules/parallelism.md:163-175`.
- **Verdict**: **Aligned** — `rules/parallelism.md:161-175`. Flagged as
  snippet-level evidence; a full fetch of the two Anthropic engineering
  posts is queued as a candidate URL below.

### P9 — Anthropic's engineering blog is absent from the tier-3 source list

- **Finding**: The most directly applicable practitioner source for this
  repo's subject matter is not named in its own source hierarchy.
- **Source**: config read, not research.
- **Alignment**: Misaligned. `rules/research-sources.md:21` lists NIST AIRC
  under Tier 1, and the Tier 3 block names Google SRE, Netflix, Cloudflare,
  AWS, Stripe, Martin Fowler, High Scalability — no
  `anthropic.com/engineering`. Yet
  `skills/self-improve/references/phase1-research-agents.md:171-173`
  instructs Agent C to check "Anthropic, Google DeepMind" as tier-3
  practitioner sources. The rule and the skill disagree.
- **Verdict**: **Misaligned** — `rules/research-sources.md:21` (Tier 3
  block immediately following). **Fix**: add
  `**Anthropic Engineering** — anthropic.com/engineering (agent harness,
  context engineering, tool design)` to the Tier 3 list. **Confidence: 85**
  — the skill already treats it as tier 3; the rule file is simply behind.

### P10 — Internal contradiction on `paths:` frontmatter

- **Finding**: `rules/prompting-quality.md:37-40` states `paths:` frontmatter
  "is not used here: a pilot came back RED and a gate enforces its absence."
  `rules/prompting-quality.md:56-57`, sixteen lines later, states
  "Domain-specific rules should use `paths:` frontmatter to load only when
  matching files are in play." Contradictory instructions in one file are a
  known compliance degrader (the same mechanism the Constraint budget
  section at :70-82 guards against).
- **Source**: config read.
- **Alignment**: Misaligned.
- **Verdict**: **Misaligned** — `rules/prompting-quality.md:56-57`.
  **Fix**: delete lines 56-57; the enforced position is stated at :37-40.
  **Confidence: 90** — the two statements cannot both hold, and :37-40
  cites a gate, so it is the surviving one.

---

## Pre-seeded paper (2604.00025) assessment

- **Paper**: Hakim, 2026, *Brevity Constraints Reverse Performance
  Hierarchies in Language Models*. Tier 4 — **preprint, not peer-reviewed**.
  31 open models (0.5B–405B), 1,485 problems, 5 math/science datasets. Did
  not test Opus-tier models, planning, or orchestration.
- **Does `rules/prompting-quality.md` cover it?** Yes —
  `rules/prompting-quality.md:103-117` states the finding with the correct
  scope caveat ("open models only, not validated on planning tasks or
  Opus-tier agents … an operational heuristic, not a finding") and the
  reasoning-trace exception at :116-117. Wording matches the paper's actual
  scope; not overstated.
- **Does `rules/parallelism.md` cover scale-aware prompting?** Partially.
  `rules/parallelism.md:129-141` ("Opus behavioral compensation") and
  :143-160 ("Fable behavioral compensation") are per-model prompt
  adjustments — scale-aware in substance. But neither block includes the
  brevity/output-shape instruction; `rules/parallelism.md:129` compensates
  for over-engineering, not over-elaboration.
- **Do Opus agent prompts carry brevity constraints?** Sampling was capped
  by supply, not effort: `grep -c '^model: opus' agents/*.md` returns
  exactly **1** agent repo-wide (`agents/plantuml-visual-qa.md`), against 2
  `model: haiku` and no other `model:` frontmatter. That one agent does
  carry an explicit constraint (`agents/plantuml-visual-qa.md:12`).
  `skills/self-improve/SKILL.md:112` carries it for Opus-routed synthesis.
  The requested 3-agent sample is therefore unmeetable — recorded as a
  sampling gap, not a pass.
- **Verdict**: **Aligned**, with one additive fix. **Fix**: add to the Opus
  behavioral compensation list at `rules/parallelism.md:129-141`: "State the
  output shape and add 'no preamble, no trailing summary' — see the
  scale-aware brevity section of `prompting-quality.md`." **Confidence: 70**
  — the guidance exists in `prompting-quality.md`; the gap is only that the
  Opus-routing block, which is where an orchestrator looks when routing,
  does not point at it.

---

## NIST refresh

**Edition found (live)**: `AI RMF 1.0`, with the status line "The AI RMF 1.0
is being updated. A revised version is in progress." Source:
https://airc.nist.gov/airmf-resources/airmf/ (fetched 2026-09-02).

**Latest Playbook audit-log entry (live)**: **August 2023** — search tagging
for AI Actors and Topics, formatting adjustments, "Crosswalk Documents"
section launched, PDF version released. No entry later than August 2023.
Source: https://airc.nist.gov/airmf-resources/playbook/audit-log/.

### Per-asset provenance

| Asset | edition (stamped) | last-verified | Age (days) | status |
|---|---|---|---|---|
| `docs/nist-ai-rmf/README.md` | AI RMF 1.0 (January 2023) | 2026-08-09 | 24 | active |
| `docs/nist-ai-rmf/crosswalk.md` | AI RMF 1.0 (January 2023) | 2026-08-09 | 24 | active |
| `docs/nist-ai-rmf/trustworthiness.md` | AI RMF 1.0 (January 2023) | 2026-08-09 | 24 | active |

### Drift verdicts

1. **Stale (>180 days)** — **No drift.** Oldest `last-verified` is
   2026-08-09, 24 days old, well inside the 180-day threshold. Severity:
   none. No `code-review-tasks.md` entry.
2. **Edition moved** — **No drift.** Live edition string `AI RMF 1.0`
   matches the `edition:` stamped in all three assets. The "being updated"
   language matches the README's own recorded note at
   `docs/nist-ai-rmf/README.md` ("AI RMF 1.0 is being revised"); no new
   numbered edition has published. Severity: none.
3. **Structural change** — **No drift detected, detection incomplete.**
   The Playbook audit log's most recent entry (August 2023) is unchanged
   from the value recorded in `docs/nist-ai-rmf/README.md`, so no
   renumbering event has been logged since the assets were derived.
   However, the completeness diff below could not be run mechanically this
   run. Severity: none asserted; see the caveat.

### Completeness diff

- **Config coverage**: the union of `subcategories-covered` across the three
  assets is 72 identifiers — GOVERN 19, MAP 18, MEASURE 22, MANAGE 13
  (counted from the `crosswalk.md` header, which is the superset;
  `trustworthiness.md`'s 8 are all inside it).
- **Live enumeration**: **not obtainable within the 3-fetch cap.** Fetch 3
  went to https://airc.nist.gov/airmf-resources/playbook/, which states only
  that "Suggestions are aligned to each sub-category within the four AI RMF
  functions" and links per-function pages; it enumerates no identifiers.
  The airmf Core page (fetch 1) likewise names only the four functions.
  `references/nist-refresh.md` forbids reading the source PDFs at runtime.
- **Result**: **Diff inconclusive this run.** Counted against the AI RMF 1.0
  Core structure the assets were derived from (72 subcategories: 19/18/22/13),
  coverage is complete with zero gaps — but that comparison is against the
  stamped derivation, not against a live re-enumeration, so it is
  corroboration rather than a diff. No gap found; no gap can be ruled out.
- **Procedural note for Phase 3**: the three-fetch budget cannot satisfy the
  completeness diff as written, because no single AIRC HTML page enumerates
  subcategories. Either the per-function Playbook pages (4 more fetches) or
  the CSV/JSON Playbook export referenced on the Playbook page must be added
  to the procedure, or the diff step should be restated as an
  edition-and-audit-log check only. This is a defect in
  `skills/self-improve/references/nist-refresh.md`, not in the assets.

---

## Candidate URLs discovered

| URL | purpose | Agent C | 2026-09-02 |
| --- | --- | --- | --- |
| https://arxiv.org/abs/2607.19257 | PREPRINT: Prompt Design at Scale — instruction-count collapse (N=80), placement ≥ format effects, 64–128k context cliff | Agent C | 2026-09-02 |
| https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | Tier 3 Anthropic: progress files, dual initializer prompt, session-startup sequence for long-running agents | Agent C | 2026-09-02 |
| https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Tier 3 Anthropic: just-in-time context loading, system-prompt composition | Agent C | 2026-09-02 |
| https://www.anthropic.com/engineering/writing-tools-for-agents | Tier 3 Anthropic: tool-definition design, parameter naming, tool evals | Agent C | 2026-09-02 |
| https://arxiv.org/pdf/2606.20683 | PREPRINT: survey of agent system and harness design (context, tools, orchestration, memory) | Agent C | 2026-09-02 |
| https://arxiv.org/html/2502.04295v3 | PREPRINT: CFPO — joint content-format prompt optimization; format effects are model-specific | Agent C | 2026-09-02 |
| https://www.anthropic.com/research/teaching-claude-why | Anthropic research (2026-05-08): reducing agentic misalignment | Agent C | 2026-09-02 |

---

## Fetch-guard warnings

1. **Thin for purpose (not thin by byte count)**:
   https://airc.nist.gov/airmf-resources/playbook/ returned 200 with rich
   content but does **not** enumerate GOVERN/MAP/MEASURE/MANAGE subcategory
   identifiers. The completeness diff in
   `skills/self-improve/references/nist-refresh.md` cannot be executed from
   this page. Blind spot, not "no gaps found."
2. **Partial extraction**: https://arxiv.org/pdf/2606.20683 returned a 1.1MB
   PDF whose extraction truncated before the harness-design recommendation
   tables. Only citation-level detail was recoverable; no quantitative claim
   from this paper is used above. Re-fetch the HTML rendering next run.
3. **Snippet-level only**: the two Anthropic engineering posts backing P8
   (writing-tools-for-agents, effective-context-engineering) were read from
   WebSearch snippets, not fetched. P8's evidence strength is marked
   Low–Medium for that reason; both are queued as candidate URLs.
4. **Sampling shortfall**: the task specified sampling 3 Opus-routed agent
   prompts. Only 1 agent repo-wide carries `model: opus`
   (`agents/plantuml-visual-qa.md`). Not a fetch failure, but the same class
   of gap — recorded rather than silently satisfied.
