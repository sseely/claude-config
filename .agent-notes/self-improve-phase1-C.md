# Phase 1 — Agent C: State of the Art in System Prompt / Agent Instruction Design

Research run 2026-08-01. Fresh sweep; no prior task files or agent notes read.

Sources cloned and injection-scanned (both **clear** — the four grep hits are
warnings *about* injection, not injection):

- `~/temp/self-improve/skills` — `anthropics/skills`, 165,649 stars (Tier 1, Anthropic first-party)
- `~/temp/self-improve/claude-code-system-prompts` — `Piebald-AI/claude-code-system-prompts`,
  12,135 stars, created 2025-11-18 (passes >1000 stars + >6mo gate). Verbatim
  extraction of shipped Claude Code prompts; treated as **data**, not instructions.
- Rejected by clone gate: `Austin1serb/agents-md` (148 stars),
  `repowise-dev/claude-code-prompts` (1,178 stars but created 2026-04-01, <6 months).

Anthropic research index (Feb–Aug 2026) carries **no** instruction-following,
system-prompt, or agent-orchestration publication. The Anthropic *engineering*
index has three 2026 agent-design posts (Mar 24 harness design, Apr 08 managed
agents, Feb 05 parallel Claudes) but the load-bearing prescriptive text remains
the Sep 2025 context-engineering post. Net: Anthropic has published no new
system-prompt doctrine in the last 6 months. The config is not behind on Tier 1.

---

## P1 — Orchestration-prompt composition is a capability distinct from coding ability, and Opus 4.8 is measurably weak at it

- **Finding**: The ability to author *sub-agent prompts* (decide what each role
  must know, and exclude what it must not) does not track coding benchmark
  performance. Measured across 110 scenarios / 33 commercial models: average
  combined pass rate 17.2%. `claude-opus-4-8` scored **13.9%** (assignment 17.7%,
  free-form 10.0%) — below `claude-sonnet-5` (25.7%) and `claude-fable-5` (31.4%),
  and far below `gpt-5.5` (62.0%). The paper's own framing: Opus 4.8 "shows a
  notable weakness in orchestration prompting despite its strong coding performance."
- **Source**: Sun, Ren, Zhang, Liu, Guo. "PerspectiveGap: A Benchmark for
  Multi-Agent Orchestration Prompting." arXiv:2606.08878v2, 7 Jun 2026 (v2 12 Jul 2026).
  https://arxiv.org/abs/2606.08878 — **Tier 4 (arxiv preprint, NOT peer-reviewed)**.
- **Evidence strength**: Medium (preprint; single benchmark; no replication).
- **Applies to Claude specifically**: **High.** This is the rare case where the
  named Claude models are measured directly rather than inferred — Opus 4.8,
  Sonnet 5, and Fable 5 all appear in the results table with per-model numbers.
  Caveat stated plainly: **Opus 5 was not tested.** Transferring the Opus 4.8
  result to Opus 5 is an inference, and the config's own version gate
  (`rules/parallelism.md:94-96`) correctly warns those are different models.
- **Current config alignment**: ***Misaligned*** — `rules/parallelism.md:87`
  routes "mission decomposition" and "Phase 3 decisions" to `opus`, and
  `settings.json:141` makes `opus` the session default, so the orchestrator that
  writes every sub-agent prompt is Opus. The file's justification for this row is
  *cost and reasoning depth* (`rules/parallelism.md:115-119`), which is the wrong
  axis — the paper's claim is that orchestration-prompt authoring is an
  **orthogonal** capability that coding strength does not predict. What to change:
  add a note under the model table at `rules/parallelism.md:87` recording that
  orchestration-prompt composition is a measured-distinct capability, that Opus
  4.8 benchmarked worst-in-family on it, and that this is untested on Opus 5.
  Do **not** re-route on this evidence alone — one preprint, one benchmark, wrong
  model generation. Flagging beats reflex.
  Corroborating detail: the config's *existing* Fable recommendation for
  autonomous execution (`rules/parallelism.md:88`, `skills/plan-mission/SKILL.md:332`)
  is **supported** by this data — Fable 5 is the best-scoring Claude at 31.4%.

## P2 — The "need-only rule": sub-agent prompts fail more from over-inclusion than under-inclusion

- **Finding**: Each role should receive exactly the fragments needed to discharge
  its documented responsibility and nothing more. Strict pass requires
  FP = 0 *and* FN = 0. Five named failure modes, in the paper's order:
  (1) **distractor leakage** — irrelevant context (explicitly including
  "prompt-engineering tips") passed to sub-agents that don't need it;
  (2) **out-of-role information leakage** — fragments belonging to role A copied
  into role B, enabling reward hacking and constraint violation;
  (3) **artifact ownership / handoff confusion**; (4) **dropped shared context**
  (miss rates 12.1%–44.9%); (5) **bootstrap paradox** — instructions placed inside
  artifacts the agent cannot yet read. Average leakage rate across models was
  217.9% (per-scenario leak-event count, not a proportion).
- **Source**: PerspectiveGap, arXiv:2606.08878v2 — **Tier 4 preprint**.
  https://arxiv.org/abs/2606.08878
- **Evidence strength**: Medium (preprint, single benchmark).
- **Applies to Claude specifically**: **High** — Claude models are among the 33
  evaluated and sit in the failing majority.
- **Current config alignment**: ***Misaligned*** — `rules/parallelism.md:36-40`
  states the agent-prompt structure as an *inclusion* checklist and its section 0
  actively pushes context inward: "If `.agent-notes/` contains relevant findings
  for this task, inject them verbatim here. Do not rely on the agent to discover
  them." There is no counterweight anywhere in the file. Grepping
  `rules/parallelism.md` for exclusion language returns only write-set ownership
  rules (`:26`, `:29`) — file-collision control, not information-boundary control.
  What to change: add a **boundary precision** clause to the agent-prompt
  structure section (`rules/parallelism.md:36-77`) requiring that each sub-agent
  prompt carry only the fragments that role needs, and qualify section 0 so
  `.agent-notes/` injection is filtered to the *receiving role's* scope rather
  than pasted verbatim. This is the single highest-value change in this report:
  it costs nothing, reduces tokens, and targets the #1 measured failure mode.

## P3 — Sub-agent prompts need an explicit resumption contract and a failure/ambiguity protocol

- **Finding**: Anthropic's shipped coordinator-worker prompt is 45 lines and five
  sections: Environment, Scope, **Resumed Tasks**, **When Things Go Wrong**,
  Output. Two of those five have no analogue in this config's agent-prompt spec.
  Verbatim from the shipped prompt — resumption: "You may be resumed with
  follow-up instructions... You retain full context from your previous work — use
  it... Your new instructions may be brief (e.g., 'now add tests for that') — this
  is intentional, not ambiguous." Failure handling: "If the task is ambiguous,
  pick the most likely interpretation and note your assumption"; "Don't retry the
  same failed approach more than once." Output framing: "Your response goes
  directly to the coordinator (not the user)," with a contrasting good/bad summary
  example.
- **Source**: `~/temp/self-improve/claude-code-system-prompts/system-prompts/agent-prompt-coordinator-worker-instructions.md`
  (ccVersion 2.1.217), verbatim extraction of Anthropic's shipped prompt.
  https://github.com/Piebald-AI/claude-code-system-prompts — **Tier 1 in
  substance** (it is Anthropic's own production text), **Tier 5 in channel** (a
  third-party mirror). Weight accordingly; the text is self-consistent with
  Anthropic's published guidance.
- **Evidence strength**: Medium — first-party artifact, third-party transmission,
  no effect sizes attached.
- **Applies to Claude specifically**: **High.** This prompt runs against Claude in
  production. It is the most direct available evidence of what Anthropic believes
  a Claude sub-agent prompt should contain.
- **Current config alignment**: ***Misaligned*** — the nine-section agent-prompt
  structure at `rules/parallelism.md:36-77` has no resumption section, despite the
  Agent tool now supporting `SendMessage` resumption with context intact. What to
  change: add a tenth section, *Resumption*, to `rules/parallelism.md:36-77`
  stating that a resumed agent retains prior context, that terse follow-ups are
  intentional rather than ambiguous, and that it should not re-read files it has
  already seen unless they may have changed.
  Partial credit, stated for accuracy: the ambiguity half is already covered —
  `rules/parallelism.md:131` ("If scope is ambiguous, implement the minimal
  interpretation and note the ambiguity") and the consecutive-fix stop rule at
  `rules/autonomous-execution.md` both match Anthropic's intent. Only resumption
  is genuinely absent.

## P4 — Explain *why* rather than escalating intensity; prefer imperative form

- **Finding**: Anthropic's own skill-authoring guidance: "Try to explain to the
  model why things are important in lieu of heavy-handed musty MUSTs. Use theory
  of mind and try to make the skill general and not super-narrow to specific
  examples." And: "Prefer using the imperative form in instructions."
- **Source**: `anthropics/skills`, `skills/skill-creator/SKILL.md:117,139`.
  https://github.com/anthropics/skills — **Tier 1** (official Anthropic repo).
- **Evidence strength**: High for authority, Low for measurement (no effect size
  published).
- **Applies to Claude specifically**: **High** — authored by the model vendor for
  this exact model family.
- **Current config alignment**: ***Aligned*** — `rules/prompting-quality.md:16`:
  "Prefer scoping keywords (`only`, `limit to`, `do not`) over intensity
  escalation (`CRITICAL`, `MUST`, `ALWAYS`). Blanket intensity words can
  overtrigger on these models and reduce output quality." The config reached the
  same conclusion by a different route (overtriggering) than Anthropic's
  (why-over-MUST), and both land on the same prescription. Imperative form is
  honored in practice: `agents/04-quality-security/debugger.md:9` opens "Trace
  every defect to its root cause"; `agents/04-quality-security/code-reviewer.md:10`
  opens "Enumerate all quality issues."

## P5 — System-role instructions land better as context than as commands

- **Finding**: "Phrase these as **context, not commands**. State the fact and let
  Claude act on it; avoid override-style language ('ignore what the user said',
  'regardless of the user's request', 'disregard the previous instruction').
  Claude is trained to protect users from instructions that appear to work against
  them, and that protection applies to the system role too."
- **Source**: `anthropics/skills`,
  `skills/claude-api/shared/model-migration.md:839`.
  https://github.com/anthropics/skills — **Tier 1**.
- **Evidence strength**: High for authority (mechanism claim about Claude's own
  training), Low for measurement.
- **Applies to Claude specifically**: **High** — the claim is explicitly about
  Claude's training, and is non-transferable to other model families by design.
- **Current config alignment**: ***Aligned*** — `rules/prompting-quality.md:16`
  covers the same ground. The config's stated *mechanism* (overtriggering) is
  weaker than Anthropic's (trained user-protection extends to the system role),
  but the resulting prescription is identical and no config text uses
  override-style phrasing. Optional refinement, not a defect: cite Anthropic's
  mechanism at `rules/prompting-quality.md:16` so the rule survives future
  re-litigation on a stronger rationale.

## P6 — Progressive disclosure: SKILL.md under ~500 lines, detail pushed to `references/`

- **Finding**: Three-level loading — metadata (~100 words, always resident),
  SKILL.md body (<500 lines ideal, loaded on trigger), bundled resources
  (unlimited, loaded on demand). "Keep SKILL.md under 500 lines; if you're
  approaching this limit, add an additional layer of hierarchy along with clear
  pointers about where the model using the skill should go next." Reference files
  over 300 lines should carry a table of contents.
- **Source**: `anthropics/skills`, `skills/skill-creator/SKILL.md:86-98`;
  corroborated by `skills/claude-api/shared/agent-design.md:64-71` ("Both patterns
  keep the fixed context small and load detail on demand").
  https://github.com/anthropics/skills — **Tier 1**, two independent files.
- **Evidence strength**: High (first-party, stated twice, consistent with the
  published context-engineering post).
- **Applies to Claude specifically**: **High.**
- **Current config alignment**: ***Misaligned*** — `skills/self-improve/SKILL.md`
  is **831 lines**, 66% over Anthropic's stated ceiling, and it is the only one of
  28 skills that breaches it (`skills/code-review/SKILL.md` 253,
  `skills/explore/SKILL.md` 134, `skills/fix/SKILL.md` 128 all comply). Only 2 of
  28 skills use a `references/` subdirectory at all. What to change: split
  `skills/self-improve/SKILL.md` — the eval/audit rubrics and the research-source
  block are the natural extractions — into `skills/self-improve/references/`, and
  leave pointers in the body. The rest of the skill corpus is in good shape; this
  is one file, not a systemic problem.

## P7 — Skills and agent prompts should ship with test cases and a baseline comparison

- **Finding**: Anthropic's authoring loop is not write-then-ship. After drafting:
  produce 2–3 realistic test prompts, save to `evals/evals.json`, spawn
  **with-skill and baseline runs in the same turn**, draft assertions while runs
  are in flight, grade, aggregate, and iterate. There is a separate
  description-optimization loop for trigger accuracy, with dedicated grader,
  analyzer, and comparator sub-agents.
- **Source**: `anthropics/skills`, `skills/skill-creator/SKILL.md:141-408`, plus
  `skills/skill-creator/agents/{grader,analyzer,comparator}.md` and
  `references/schemas.md`. https://github.com/anthropics/skills — **Tier 1**.
- **Evidence strength**: High (first-party, fully specified with runnable scripts).
- **Applies to Claude specifically**: **High.**
- **Current config alignment**: ***Misaligned*** — no eval harness exists anywhere
  in `~/.claude`: `find` for `evals/`, `eval*.json`, or `test-cases*` returns
  empty across all 28 skills and 128 agents. Every prompt in this repo is
  unvalidated by construction; changes are justified by argument, never by
  measurement. This is the widest structural gap between the config and current
  first-party practice. What to change: adopt the pattern for the highest-traffic
  skills first — `skills/code-review/`, `skills/fix/`, `skills/plan-mission/` —
  by adding `evals/evals.json` with 2–3 realistic prompts each and running the
  baseline-vs-with-skill comparison. Scoping to three skills keeps this tractable;
  a repo-wide rollout is not warranted yet.

## P8 — Instruction specificity: unmeasurable checklist items consume budget without constraining

- **Finding**: Two Tier-1 sources converge. Anthropic on altitude: prompts must be
  "specific enough to guide behavior effectively, yet flexible enough to provide
  the model with strong heuristics," with the vague failure mode being guidance
  that "fails to give the LLM concrete signals for desired outputs." Anthropic on
  examples: "curate a set of diverse, canonical examples that effectively portray
  the expected behavior of the agent. For an LLM, examples are the 'pictures'
  worth a thousand words." Reinforced by MOSAIC-style constraint budgeting — vague
  items still count against the per-section limit and dilute the real constraints.
- **Source**: Anthropic, "Effective context engineering for AI agents,"
  https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
  — **Tier 1** (official Anthropic engineering doc); plus `anthropics/skills`,
  `skills/skill-creator/SKILL.md:115-135` (Writing Patterns / Examples pattern).
- **Evidence strength**: High for authority, Medium for measurement.
- **Applies to Claude specifically**: **High.**
- **Current config alignment**: ***Misaligned***, on two counts.
  (a) **Filler checklist lines** — 98 lines matching the adverb-stacked
  unmeasurable pattern `^- <Word> <word> <adverb>$` across **46 of 128** agent
  files. Worked example, `agents/10-research-analysis/research-analyst.md:12-16`:
  "Analysis comprehensive achieved properly / Synthesis clear delivered
  effectively / Insights actionable provided strategically / Bias minimized
  controlled continuously." These constrain nothing, are unverifiable, and count
  against the ≤6 constraint budget the config sets at
  `rules/prompting-quality.md:77-80`. Contrast the same repo done right:
  `agents/04-quality-security/code-reviewer.md:14` ("Cyclomatic complexity < 10
  maintained") and `agents/01-core-development/backend-developer.md:8`
  ("enforce 90% test coverage... meet the per-endpoint p95 latency target"). What
  to change: delete or make measurable the 98 flagged lines in those 46 files.
  (b) **No worked examples** — grep for `^**Example`, `^Example N`, `^Input:` across
  `agents/` returns **0 of 128**; only 9 of 128 contain any fenced block at all.
  Anthropic ranks examples as the highest-leverage instruction component and the
  config uses them nowhere in its agent corpus. What to change: add one
  input/output example to the highest-traffic agents (`code-reviewer`, `debugger`,
  `backend-developer`), matching the format at `skills/skill-creator/SKILL.md:129-135`.
  Noted for fairness: `rules/prompting-quality.md:12-14` *does* model the
  weak/strong example pattern — the rule knows better than the agent corpus does.

## P9 — Scale-aware brevity constraints (the pre-seeded finding), evaluated

- **Finding as claimed**: explicit brevity constraints suppress scale-dependent
  verbosity, yielding up to 26pp accuracy gain and reversing large-vs-small model
  performance hierarchies; sharpest on math/science.
- **Source**: Hakim. "Brevity Constraints Reverse Performance Hierarchies in
  Language Models." arXiv:2604.00025, submitted **11 Mar 2026**.
  https://arxiv.org/abs/2604.00025 — **Tier 4 (preprint, NOT peer-reviewed)**.
- **Verification performed**: fetched the abstract directly. Confirmed: 31 models,
  0.5B–405B parameters, 1,485 problems across 5 datasets. Confirmed the headline
  26pp figure and the 7.7pp/28.4pp reversal figures. Confirmed the abstract names
  **no frontier closed model** — no Claude, GPT, or Gemini variant appears.
- **Evidence strength**: Medium-Low. Single preprint, no replication located, and
  the parameter range tops out at 405B open-weight — the regime the claim would be
  applied to (Opus-tier) is outside the tested range entirely.
- **Applies to Claude specifically**: **Low.** "Scale-dependent verbosity" is
  inferred to continue past 405B into Opus-tier; the paper does not measure it.
  Applying it to Claude is an extrapolation across both a scale gap and an
  open/closed training gap.
- **Current config alignment**: ***Config is better.*** Three reasons, each
  checked rather than assumed.
  1. **The characterization is honest.** `rules/prompting-quality.md:103-108`
     reads: "preprint... tested only on open models, not validated on planning
     tasks or Opus-tier agents specifically. Opus-tier models have been observed
     in practice to over-elaborate without explicit constraint — treat this as an
     operational heuristic, not an established finding." That is a more accurate
     statement of the evidence than the paper's own abstract, which asserts
     "scale-aware prompt engineering" as a general necessity. The softening in
     `4385fc7 docs(rules): correct rule-residency claim, soften 2604 citation`
     was the right call and should not be reverted. Only nit: the citation says
     "Hakim, 2026" in body text while the task brief says 2025 — arXiv confirms
     **2026**, so the config is correct and the brief is wrong.
  2. **The rule is actually applied.** `rules/prompting-quality.md:110-111`
     requires every Opus agent prompt to carry a brevity constraint. Audited all
     7 Opus-routed agents (3 × `model: opus`, 4 × `model: opusplan`) — **7 of 7
     comply**, each with an explicit output *shape* rather than a bare length cap:
     `agents/plantuml-visual-qa.md:12`, `agents/04-quality-security/ad-security-reviewer.md:9`,
     `agents/04-quality-security/powershell-security-hardening.md`,
     `agents/05-data-ai/llm-architect.md:9`, `agents/03-infrastructure/cloud-architect.md:10`,
     `agents/01-core-development/graphql-architect.md`,
     `agents/02-language-specialists/java-architect.md`. Specifying shape, not just
     brevity, is stronger than the paper's intervention.
  3. **Scale-aware routing is covered in both files.** `rules/parallelism.md:123-135`
     ("Opus behavioral compensation") and `rules/parallelism.md:136-152` ("Fable
     behavioral compensation," which *inverts* the constraints) encode
     per-model-family prompt adaptation — a more sophisticated position than
     2604.00025's single global brevity lever. `rules/prompting-quality.md:116-117`
     carries the correct exception (verbosity is right when reasoning trace is
     the deliverable). Answering the brief's three questions directly: yes, Opus
     prompts include brevity constraints; yes, `parallelism.md` covers scale-aware
     prompting; yes, `prompting-quality.md` does too — and its characterization of
     the evidence is honest.

## P10 — Compression is U-shaped: medium compression is the worst regime, not the safest

- **Finding**: Constraint compliance and semantic accuracy are statistically
  orthogonal (r=0.193, p=0.084), with constraint effects **2.9× larger** than
  semantic effects. Performance follows a U-curve across compression: extreme
  compression (~2 words) outperforms *medium* compression (~27 words), where
  constraint violations peak at **97.2% prevalence**. Attributed mechanism: RLHF
  helpfulness behaviors override constraint adherence specifically in the medium
  band; suppressing those signals improved compliance by 598%.
- **Source**: "Separating Constraint Compliance from Semantic Accuracy"
  (Compression-Decay Comprehension Test). arXiv:2512.17920, submitted 2 Dec 2025.
  https://arxiv.org/abs/2512.17920 — **Tier 4 (preprint, NOT peer-reviewed)**.
  9 frontier LLMs, 8 concepts, 5 compression levels.
- **Evidence strength**: Medium-Low. Preprint; the model list is not disclosed in
  the abstract, so Claude inclusion is unconfirmed; the 598% figure comes from an
  ablation, not a deployment condition.
- **Applies to Claude specifically**: **Medium.** "Frontier LLMs" plausibly
  includes Claude and the RLHF-helpfulness mechanism is generic to RLHF'd
  assistants, but this is inference — the paper does not name the models. Do not
  treat as Claude-validated.
- **Current config alignment**: ***Misaligned***, though not on the U-curve —
  on the two self-referential claims in the same section.
  `rules/prompting-quality.md:36-41` asserts the `rules/` footprint is "~62KB...
  22 files, ~10.3k words / ~14k tokens." Measured today: **23 files, 72,367
  bytes** — roughly 17% larger than the documented figure and one file heavier
  (`rules/diagrams.md` was added in `73837bd` without updating the count). A rule
  whose stated purpose is auditing instruction bloat has itself drifted.
  Second and more substantive: the section's prescribed mitigation — "prefer
  task-scoped reading of the one or two relevant rule files over loading the set"
  — **is inoperative**. All 23 rule files were injected verbatim into this
  session's context before any task-scoped reading could occur; confirmed by
  direct observation of the system prompt, not inferred. Task-scoped reading
  cannot reduce a cost that has already been paid at session start.
  What to change: correct the figures at `rules/prompting-quality.md:36-38` to
  23 files / ~72KB, and replace the inoperative mitigation with one that acts on
  the actual lever — reducing resident bytes (consolidate or trim rule files), or
  moving domain-specific rules behind `paths:` frontmatter as the same file
  already recommends at `:54-55`. On the U-curve itself the config needs no
  change: its guidance targets *authoring* concision, not input compression, and
  a single preprint with an undisclosed model list does not justify restructuring
  a working rule. Recording the U-curve as a caution against half-compressing
  rule files during any future trim is sufficient.

## P11 — Policy-document length degrades compliance; primacy favors early placement

- **Finding**: Agentic policy documents expand with requirements and impose
  compliance cost; complex *conditional* specifications governing workflows are
  the hardest category for agents to follow. The paper's remedy is Category-Aware
  Policy Continued Pretraining (CAP-CPT), which parses policies into factual,
  behavioral, and conditional categories and internalizes them via pretraining
  loss — up to 41%/22% gains and 97.3% prompt-length reduction.
- **Source**: "Analyzing and Internalizing Complex Policy Documents for LLM
  Agents." arXiv:2510.11588v1, submitted 13 Oct 2025, 42pp, cs.AI.
  https://arxiv.org/abs/2510.11588 — **Tier 4 (preprint, NOT peer-reviewed)**.
- **Evidence strength**: Low **for this config's purposes**. The headline results
  are a *fine-tuning* method, not a prompt-authoring technique. Headline numbers
  are on **Qwen-3-32B** only.
- **Applies to Claude specifically**: **Low.** CAP-CPT requires modifying model
  weights — unavailable and irrelevant to a Claude Code config. The
  transferable residue is the taxonomy (factual / behavioral / conditional) and
  the observation that conditional rules are the expensive kind.
- **Current config alignment**: ***Config is better.*** The config already
  organizes rules by domain with pointer-based indexing (`CLAUDE.md:60-73`), keeps
  `CLAUDE.md` at **3,921 bytes** — genuinely under the 4KB ceiling it sets for
  itself at `rules/prompting-quality.md:27-29` — and front-loads the highest-
  priority material (Interaction Style, Verification) at `CLAUDE.md:3-24`, which
  is what the primacy result would recommend anyway. Adopting anything further
  from this paper would mean importing a weight-modification method as if it were
  a prompting principle. Declining it is correct.

---

## Summary tally

| Verdict | Count | Principles |
|---|---|---|
| Misaligned | 7 | P1, P2, P3, P6, P7, P8, P10 |
| Aligned | 2 | P4, P5 |
| Config is better | 2 | P9, P11 |

**Overall judgment: aligned-to-ahead on doctrine, behind on validation.**

Where the config states a principle, it is generally current with or ahead of the
field — its treatment of the brevity preprint (P9) is more epistemically careful
than the paper itself, and its per-model-family prompt compensation
(`rules/parallelism.md:123-152`) has no equivalent in any source surveyed. The
weaknesses are not doctrinal. They are (a) execution drift between what the rules
say and what the 128-file agent corpus does — 98 unmeasurable checklist lines,
0 worked examples, one 831-line skill; and (b) the absence of any measurement
loop at all (P7), which is what allows drift to accumulate unnoticed.

Two Misaligned items are cheap and high-value and should go first: **P2**
(boundary precision in sub-agent prompts — targets the top measured orchestration
failure mode, costs nothing, saves tokens) and **P8a** (delete 98 filler lines
across 46 files — pure subtraction, no judgment calls). **P7** is the highest
long-term value and the largest effort; scope it to three skills, not the corpus.

## Preprint register

Every arxiv source above is a **preprint and not peer-reviewed**:
arXiv:2606.08878 (PerspectiveGap), arXiv:2604.00025 (Hakim, brevity),
arXiv:2512.17920 (CDCT), arXiv:2510.11588 (policy internalization).
Per `rules/research-sources.md`, Tier 4 is admissible for AI/ML topics only and
must carry this flag. No peer-reviewed (Tier 2) source on system-prompt authoring
surfaced in this sweep — the practice is running ahead of the literature, which
is itself a finding: on this topic, Anthropic's first-party repos are the
strongest evidence available, and they were weighted accordingly.

## Sources

- [PerspectiveGap: A Benchmark for Multi-Agent Orchestration Prompting (arXiv:2606.08878)](https://arxiv.org/abs/2606.08878)
- [Brevity Constraints Reverse Performance Hierarchies in Language Models (arXiv:2604.00025)](https://arxiv.org/abs/2604.00025)
- [Separating Constraint Compliance from Semantic Accuracy / CDCT (arXiv:2512.17920)](https://arxiv.org/abs/2512.17920)
- [Analyzing and Internalizing Complex Policy Documents for LLM Agents (arXiv:2510.11588)](https://arxiv.org/abs/2510.11588)
- [Effective context engineering for AI agents — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic Research index](https://www.anthropic.com/research)
- [Anthropic Engineering index](https://www.anthropic.com/engineering)
- [anthropics/skills](https://github.com/anthropics/skills)
- [Piebald-AI/claude-code-system-prompts](https://github.com/Piebald-AI/claude-code-system-prompts)
