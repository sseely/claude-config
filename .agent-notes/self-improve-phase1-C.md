# Phase 1 — Agent C: Prompt structure and instruction design research (2026-07-24)

## 1. Instruction-count ceiling: compliance collapses well before the resident rule load

- **Finding**: Instruction-following decays steeply as the number of simultaneous
  system-prompt rules grows. N=40 is a *redesign* point (every model tested is on a
  steep decline by then); perfect-response rate hits zero by N=80 for every model,
  format, and placement. The recommended remedy is splitting instructions across
  turns/files, not formatting polish.
- **Source**: Prompt Design at Scale: How Format, Instruction Count, and Context
  Length Shape Instruction Adherence and Hallucination in LLMs — arXiv:2607.19257
  (2026). https://arxiv.org/abs/2607.19257 — Tier 4 (arxiv preprint, AI/ML only).
  **Preprint, not peer-reviewed.**
- **Evidence strength**: Medium (preprint; but controlled, 5 models, 8,780-entity
  synthetic corpus, crossed design).
- **Applies to Claude specifically**: **High** — Claude Sonnet 5 and Claude Haiku
  are two of the five models tested by name. This is not a general-NLP transfer.
- **Current config alignment**: **Misaligned.**
  `~/.claude/rules/prompting-quality.md:35-39` asserts: "Rules are referenced by
  pointer from CLAUDE.md, not `@`-imported, so they are not all resident — keep it
  that way." **This is empirically false in practice.** In this session's system
  prompt, all 22 files under `~/.claude/rules/` were injected verbatim as memory
  alongside `~/.claude/CLAUDE.md` — measured 10,772 words and **394 directive
  bullets/numbered steps** resident before any task text. That is ~5x the N=80
  collapse threshold. `~/.claude/CLAUDE.md:63-77` lists rules as pointers, but
  Claude Code's memory loader picks up `rules/*.md` regardless.
  **What to change**: (a) verify the actual resident set — the pointer assumption at
  `prompting-quality.md:35-39` is the load-bearing error; correct it or stop the
  auto-load; (b) if all rules must stay resident, collapse the 394 directives to a
  small always-on core (the `post-compact-context.md` model) and move the rest to
  task-scoped reads, which `prompting-quality.md:38-39` already recommends but the
  loader defeats.

## 2. PRE-SEEDED — Scale-aware brevity constraints on Opus-routed prompts

- **Finding**: Explicit brevity constraints suppress scale-dependent verbosity and
  can reverse inverse-scaling on math/science tasks (+26pp accuracy; performance gap
  reduced by two-thirds). Universal prompting masks latent capability.
- **Source**: Hakim, *Brevity Constraints Reverse Performance Hierarchies in
  Language Models* — arXiv:2604.00025 (2026). https://arxiv.org/abs/2604.00025 —
  Tier 4. **Preprint, not peer-reviewed.**
- **Evidence strength**: Medium-Low (single unreplicated preprint).
- **Applies to Claude specifically**: **Low-Medium.** Verified against the source:
  the paper tests "31 models (0.5B-405B parameters)" over 1,485 problems and
  **does not name any model, nor establish that any frontier closed-weight model
  was included**. The 0.5B-405B parameter framing implies an open-weight sample.
  Corroborating evidence cuts against transfer: the Format Tax study (principle 7)
  found closed-weight models including `claude-haiku-4.5` show *near-zero*
  degradation where open-weight models lose 5.8pp. The 26pp figure itself is
  confirmed accurate against the abstract.
- **Current config alignment**: **Aligned** — and applied, not merely stated.
  All 7 Opus-routed agents carry an explicit output-shape + brevity constraint:
  `~/.claude/agents/05-data-ai/llm-architect.md:9` ("Return design decisions as
  numbered ADRs; ... No preamble, no trailing summary"),
  `~/.claude/agents/03-infrastructure/cloud-architect.md:10`,
  `~/.claude/agents/04-quality-security/ad-security-reviewer.md:9`, plus
  `graphql-architect.md`, `java-architect.md`, `powershell-security-hardening.md`,
  `plantuml-visual-qa.md`. Skills apply it too:
  `~/.claude/skills/plan-mission/SKILL.md:411-417` (Phases 3 and 5) and
  `~/.claude/skills/self-improve/SKILL.md:803`. The rule text lives at
  `~/.claude/rules/prompting-quality.md:102-116`. Audit coverage is enforced by
  `~/.claude/skills/self-improve/SKILL.md:478-484` (Agent G standing check).
  **Residual gap (Suggestion, not Misaligned)**: 106/106 `model: sonnet` agents and
  13/13 `model: haiku` agents carry no brevity constraint. `parallelism.md:98-102`
  itself states Sonnet 5 "reaches near-Opus-4.8 quality," and the paper's mechanism
  is scale-dependent verbosity — so the constraint's rationale now extends to
  Sonnet 5 at 1M context. Extending the `**Output format:**` line to Sonnet agents
  is cheap and loses no specificity.

## 3. Evidence-strength claim for arXiv:2604.00025 is overstated in the rule text

- **Finding**: A rule's stated provenance must match what the cited source actually
  establishes; otherwise downstream agents inherit false confidence.
- **Source**: arXiv:2604.00025 abstract, read directly (see principle 2), compared
  against `~/.claude/rules/research-sources.md` Tier 4 handling requirement
  ("Always flag the finding as: 'preprint, not peer-reviewed'"; "For empirical
  claims ... wait for replication or use with explicit uncertainty") — Tier 4 plus
  internal rule.
- **Evidence strength**: High (direct source comparison).
- **Applies to Claude specifically**: High (config-internal consistency).
- **Current config alignment**: **Misaligned.**
  `~/.claude/rules/prompting-quality.md:104-107` reads "across 31 general LLMs
  (preprint, not validated on planning tasks or Opus-tier agents specifically).
  **Opus-tier models over-elaborate without explicit constraint.**" The parenthetical
  caveat is correct, but the sentence that follows asserts an Opus-tier claim the
  paper does not support, and `:109` then converts it to a hard "must".
  **What to change**: restate `:107` as an observed-in-practice heuristic rather
  than a research finding — e.g. "Higher-tier models over-elaborate in this config's
  own experience; the cited paper does not test frontier closed-weight models."
  Keep the practice (principle 2 shows it is applied and costs nothing); fix the
  warrant.

## 4. Governance decay: behavioral constraints are silently erased by compaction

- **Finding**: When context is compacted, embedded constraints are frequently
  dropped from the summary. Violation rate rises from 0% (full context) to 30%
  overall and 59% for the worst model. When constraints survive summarization,
  violations stay at 0%; when dropped, 38%. Mitigation — "Constraint Pinning":
  quarantine governance constraints from lossy compaction — restores 0%.
- **Source**: *Governance Decay: How Context Compaction Silently Erases Safety
  Constraints in Long-Horizon LLM Agents* — arXiv:2606.22528 (2026).
  https://arxiv.org/abs/2606.22528 — Tier 4. **Preprint, not peer-reviewed.**
  7 model families, 1,323 episodes, ConstraintRot benchmark with deterministic
  tool-call grading.
- **Evidence strength**: Medium (preprint, but deterministic grading).
- **Applies to Claude specifically**: **High** — the failure mode is a property of
  the harness (compaction), which Claude Code performs; 7 model families tested.
- **Current config alignment**: **Config is better / ahead of the literature.**
  The config independently implements Constraint Pinning:
  `~/.claude/settings.json:171-177` registers a `PostCompact` hook that cats
  `~/.claude/post-compact-context.md`, which re-injects exactly the constraints most
  likely to be summarized away — the STOP brake, Opus restraint, model routing, and
  commit format. `~/.claude/CLAUDE.md:28-36` documents the mechanism and its
  rationale; `~/.claude/rules/autonomous-execution.md:43-45` adds the disk-is-truth
  re-read ("re-read every file from disk — do not trust the compacted summary").
  This is a stronger implementation than the paper's proposal because it pins to a
  *file on disk* rather than to a summarizer instruction that is itself subject to
  the same lossy pass. No change recommended.

## 5. "Right altitude" and the minimal-information principle — avoid exhaustive rule lists

- **Finding**: Effective agent system prompts occupy a Goldilocks zone between
  over-specification (brittle hardcoded logic) and under-specification. Aim for
  "the minimal set of information that fully outlines your expected behavior"
  ("minimal does not necessarily mean short"). Anthropic explicitly warns against
  "a laundry list of edge cases ... in an attempt to articulate every possible rule
  — **we do not recommend this**."
- **Source**: Anthropic, *Effective context engineering for AI agents*, Anthropic
  Engineering Blog.
  https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
  — Tier 1/3 (vendor-authoritative for Claude behavior).
- **Evidence strength**: High for Claude (first-party, from the team that builds
  Claude Code).
- **Applies to Claude specifically**: **High** (first-party guidance for Claude).
- **Current config alignment**: **Misaligned** (partially).
  `~/.claude/rules/autonomous-execution.md` carries **53 directive bullets** and
  enumerates stop/push-forward conditions, gate formats, commit rules, and progress
  tracking in one always-resident file; `~/.claude/rules/parallelism.md` carries 34;
  `~/.claude/rules/architecture.md` 30; `~/.claude/rules/observability.md` 29. That
  is the "laundry list of edge cases" shape.
  The config already knows this: `~/.claude/rules/prompting-quality.md:69-81` sets a
  <=6-hard-constraints-per-section budget and cites the same degradation curve.
  **What to change**: apply the config's own `prompting-quality.md:69-81` budget to
  `autonomous-execution.md` and `parallelism.md` — split into named sub-sections of
  <=6 parallel prescriptive rules, or demote enumerations to heuristics. Note the
  budget rule exempts numbered sequential procedures, which covers much of
  `autonomous-execution.md:53-69`; the real exposure is in the parallel prescriptive
  blocks (Decision-Making Rules, Commit Discipline, Quality Gates).

## 6. Progressive disclosure: SKILL.md is a ~500-token router, not the payload

- **Finding**: Agent Skills use three-tier progressive disclosure — metadata
  (~50 tokens, always loaded) -> SKILL.md body (~500 tokens, loaded on trigger) ->
  `references/` files (2,000+ tokens, loaded only on demand). Sophisticated skills
  split supporting material into a `references/` directory to keep SKILL.md focused.
- **Source**: Anthropic, *Building Agents with Skills: Equipping Agents for
  Specialized Work*.
  https://claude.com/blog/building-agents-with-skills-equipping-agents-for-specialized-work
  — Tier 1/3 (vendor-authoritative; Agent Skills is Anthropic's own open standard,
  published at agentskills.io).
- **Evidence strength**: High for Claude (first-party spec author).
- **Applies to Claude specifically**: **High** (defines the mechanism the config uses).
- **Current config alignment**: **Misaligned.**
  `~/.claude/skills/self-improve/SKILL.md` is 809 lines / 5,277 words (~7,000 tokens)
  in a single file with **no `references/` subdirectory**;
  `~/.claude/skills/code-review/SKILL.md` is 534 lines / 3,224 words, also with no
  subdirectory. Both are 7-14x the tier-2 budget, so the entire payload loads the
  moment the skill triggers. `plan-mission` (417 lines), `upgrade-deps`,
  `review-pr`, and `project-bootstrap` have the same shape.
  Notably, `~/.claude/skills/plan-mission/SKILL.md:371-379` already states the
  correct principle for the artifacts it *generates* ("No file > 500 lines... The
  executor will read these into its context window") — it just does not apply that
  rule to itself.
  **What to change**: split the per-agent prompt bodies out of
  `self-improve/SKILL.md` (Phases 1-2, lines 78-624) into
  `self-improve/references/agent-<X>.md`, leaving the phase table and routing in
  SKILL.md; same for the 11 reviewer prompts in `code-review/SKILL.md`.
  (Counter-evidence considered: `analytics-setup`, `auth-setup`, `testing-setup`,
  `compliance-setup`, `i18n-setup` do have subdirectories, but those hold code
  templates, not prompt reference tiers — they do not satisfy this principle.)

## 7. The "format tax" — separate reasoning from formatting; Claude is largely immune

- **Finding**: Requiring structured output degrades reasoning on open-weight models
  (-5.8pp avg across GPQA/MATH-500/ZebraLogic; 72/144 model-task-format combinations
  significant), and **the cost enters at the prompt level, not the decoder** (36 of
  39 significant effects, 92%, appear without grammar-constrained decoding). Recent
  closed-weight models — `claude-haiku-4.5` explicitly — show near-zero degradation.
  Mitigations that recover accuracy: 2-turn generation (+6.8pp) and **extended
  thinking (+9.2pp)**.
- **Source**: *The Format Tax* — arXiv:2604.03616 (2026).
  https://arxiv.org/html/2604.03616v1 — Tier 4. **Preprint, not peer-reviewed.**
- **Evidence strength**: Medium (preprint; 10 models x 4 formats, ablated).
- **Applies to Claude specifically**: **Medium-High** — Claude was tested by name,
  and the result is that Claude *resists* the effect. Directional guidance transfers;
  the magnitude does not.
- **Current config alignment**: **Aligned.**
  The config already prescribes the higher-recovery mitigation:
  `~/.claude/rules/extended-thinking.md:1-30` mandates adaptive-effort thinking for
  architecture, security analysis, and test strategy — precisely the reasoning-heavy
  tasks the paper shows benefit most (+9.2pp; 22/24 MATH-500 comparisons improved).
  `~/.claude/rules/parallelism.md:80-88` sets `effort: high` as the tier default.
  This is a case where the config's structured-output requirements (principle 2) and
  its reasoning requirements are correctly decoupled rather than in tension.

## 8. Do not default to markdown — format choice is model-specific

- **Finding**: There is no universal markdown advantage. A 35B model reliably
  favored plain text at high instruction counts (+4.8pp at N=160); markdown carries
  +22% to +37% token overhead vs plain text; Claude Haiku collapsed to 38.3% recall
  under *plain text* at 128k tokens. Authors: "Do not default to markdown, and do
  not default to any other format, without testing your own model."
- **Source**: arXiv:2607.19257 (as in principle 1), format section. Tier 4.
  **Preprint, not peer-reviewed.**
- **Evidence strength**: Medium.
- **Applies to Claude specifically**: **Medium** — the anti-markdown result came
  from open-weight models; the Claude-specific result in the same paper is that
  *plain text* was the risky format at long context.
- **Current config alignment**: **Config is better.**
  The config is markdown-throughout (all rules, all 126 agents, all SKILL.md files),
  and Tier 1 wins here per `~/.claude/rules/research-sources.md`: Anthropic's own
  prompt-engineering guidance states "clear headings, whitespace, and explicit
  language ... work just as well with less overhead"
  (https://claude.com/blog/best-practices-for-prompt-engineering), and the
  context-engineering post recommends exactly the section structure the config uses
  ("`## Tool guidance`, `## Output description`"). The one paper result that names
  Claude argues *against* switching away from markdown. The +22-37% token overhead
  is real and worth noting against principle 1, but it is the cost of the structure
  Anthropic endorses. No change recommended.

## 9. Instruction placement (system prompt vs. user turn) is model-specific

- **Finding**: Moving an identical instruction block between the system prompt and
  the user turn changed adherence by up to 8.7pp at N=160 — helping Claude Haiku
  (+6.6pp) and Qwen 35B (+5.1pp), hurting Gemini Flash (-8.7pp). **Claude Sonnet 5
  was statistically indistinguishable.** Recommendation: test both placements
  empirically rather than adopt a default rule.
- **Source**: arXiv:2607.19257, placement section. Tier 4. **Preprint, not
  peer-reviewed.**
- **Evidence strength**: Medium.
- **Applies to Claude specifically**: **Medium** — measured on Claude, but the
  measurement says the effect is null for the config's primary implementation model.
- **Current config alignment**: **Config is better.**
  The config already implements the front-loading half of this at the document level
  — `~/.claude/skills/plan-mission/SKILL.md:373-378` ("Front-load the important
  content. The first 50 lines of any doc should contain the information needed to
  decide whether to keep reading") — and every audited agent opens its body with a
  single Tier-1 directive sentence before any checklist (e.g.
  `~/.claude/agents/04-quality-security/code-reviewer.md:9`,
  `~/.claude/agents/01-core-development/backend-developer.md:8`,
  `~/.claude/agents/09-meta-orchestration/it-ops-orchestrator.md:7`). Adding a
  system-vs-user placement rule would be premature: the effect is null on Sonnet 5
  and the paper itself declines to recommend a default. No change recommended.

## 10. Subagents should return condensed summaries (1,000-2,000 tokens)

- **Finding**: In sub-agent architectures, "each subagent might explore extensively,
  using tens of thousands of tokens ... but returns only a condensed, distilled
  summary of its work (often 1,000-2,000 tokens)." The return budget is part of the
  architecture, not an afterthought.
- **Source**: Anthropic, *Effective context engineering for AI agents* (as in
  principle 5) — Tier 1/3.
- **Evidence strength**: High for Claude (first-party).
- **Applies to Claude specifically**: **High**.
- **Current config alignment**: **Misaligned** (narrow gap).
  `~/.claude/rules/parallelism.md:32-75` specifies a 10-part agent prompt structure
  including "Interface contracts" (section 6) — which governs the *shape* of the
  return (JSON schema / prose) but never its *size*. No section of `parallelism.md`
  sets a return-token budget. `prompting-quality.md:109-110` gets closest ("Return
  only the structured result") but is scoped to Opus prompts only.
  **What to change**: add a return-size clause to `parallelism.md` section 6 —
  "State the return budget: ~1,000-2,000 tokens of distilled findings, not raw
  exploration output" — and apply it at all tiers, not just Opus. This costs one
  line and directly reduces orchestrator context pressure, the same lever as
  principle 1.

## 11. Prompt-optimization payoff concentrates in coordinator and reasoning agents

- **Finding**: Prompt-optimization gains in multi-agent systems are **not uniform**
  across roles. Specialized coordinator and reasoning agents (complex decision-
  making, synthesis, task coordination) show the strongest improvement; support and
  straightforward-execution agents show minimal gains. Recommendation: prioritize
  specialist/coordinator roles; avoid uniform optimization strategies.
- **Source**: *MAS-PromptBench: When Does Prompt Optimization Improve Multi-Agent
  LLM Systems?* — arXiv:2606.23664 (2026). https://arxiv.org/pdf/2606.23664 —
  Tier 4. **Preprint, not peer-reviewed.** Claude, Gemini, Llama, and GPT tested.
- **Evidence strength**: Medium (preprint; benchmark spans four model families
  including Claude).
- **Applies to Claude specifically**: **Medium-High** (Claude included in the
  benchmark; the finding is architectural rather than model-specific).
- **Current config alignment**: **Aligned.**
  Routing already concentrates the highest-capability models and effort on exactly
  the coordinator/reasoning roles the paper identifies:
  `~/.claude/rules/parallelism.md:78-84` routes planning/architecture to Opus and
  scoring/dedup/validation to Haiku, and `parallelism.md:145-151` names "Opus for
  trivial edits" and "Sonnet for simple scoring/grep" as explicit anti-patterns.
  Concretely, the 7 Opus/opusplan agents are all architect/reviewer roles
  (`cloud-architect`, `graphql-architect`, `java-architect`, `llm-architect`,
  `ad-security-reviewer`, `powershell-security-hardening`, `plantuml-visual-qa`)
  while the 13 Haiku agents are research/lookup roles (`research-analyst`,
  `search-specialist`, `trend-analyst`, `agent-installer`, ...). This is the paper's
  recommendation implemented ahead of publication.

## 12. XML tags are no longer required for structure in modern Claude models

- **Finding**: "XML tags were once a recommended way to add structure and clarity to
  prompts ... while modern models are better at understanding structure without XML
  tags, they can still be useful in specific situations." For most use cases, clear
  headings and whitespace work as well with less overhead. Related: "The best prompt
  isn't the longest or most complex. It's the one that achieves your goals reliably
  with the minimum necessary structure."
- **Source**: Anthropic, *Prompt engineering best practices for 2026*.
  https://claude.com/blog/best-practices-for-prompt-engineering — Tier 1/3.
- **Evidence strength**: High for Claude (first-party).
- **Applies to Claude specifically**: **High**.
- **Current config alignment**: **Aligned.**
  No agent, rule, or SKILL.md in the config uses XML-tag scaffolding; all use
  markdown headings — e.g. `~/.claude/agents/04-quality-security/code-reviewer.md`
  uses `## Required Rules` plus a plain checklist, and
  `~/.claude/rules/prompting-quality.md:83-97` codifies verb strength ("register
  shifting") rather than tag structure as the mechanism for enforcing thoroughness.
  The config also anticipates the "minimum necessary structure" line at
  `prompting-quality.md:25-33` (Instruction bloat, 4KB cap).

---

**Provenance-gate record (method note, not a principle):** two GitHub repos passed
the star/age gate — `anthropics/skills` (anthropics org; 163,865 stars) and
`dontriskit/awesome-ai-system-prompts` (6,098 stars, created 2025-03-05). Both were
cloned `--depth 1 --single-branch` to `~/temp/self-improve/` and both **hit the
injection grep**, so per the gate **both were excluded as sources** and no principle
above cites them. (`skills/skills/claude-api/shared/model-migration.md:834` is a
benign false positive — it is guidance *against* override-style phrasing;
`awesome-ai-system-prompts/Cursor/Agent.md:60` is verbatim third-party prompt text
containing "ignore previous user queries".) `ai-boost/awesome-harness-engineering`
(3,231 stars) was rejected before cloning: created 2026-03-29, under the 6-month
commit-history minimum.
