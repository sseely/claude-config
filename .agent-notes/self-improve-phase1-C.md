# Self-Improve Phase 1 — Agent C: System-Prompt / Agent-Instruction State of the Art

Read-only audit of `~/.claude` against the field on system-prompt design, agent
instruction formatting, and markdown directives. Research run fresh on 2026-06-20.
Verdict scale: **Aligned** / **Misaligned** / **Config is better** / **Ahead of field**.

Overall: the config is **aligned with or ahead of** the field on every principle
examined. The single substantive gap is a *latent* one (cumulative rule-file
footprint vs. just-in-time loading), not a current behavioral defect.

---

## 0. Pre-seeded finding — brevity constraints on Opus agents (evaluated first)

**Finding:** arxiv:2604.00025 (Hakim, 2026, preprint) claims explicit brevity
constraints on Opus-tier agents yield up to 26pp accuracy gains by suppressing
scale-dependent verbosity, sharpest on math/science.

- **Source:** arxiv:2604.00025 — Tier 4 (arxiv, AI/ML). URL not re-fetched; cited as
  given in task.
- **Evidence strength:** Low (single unreplicated preprint, not peer-reviewed).
- **Applies to Claude:** Medium. Opus 4.8 is explicitly an Opus-tier model and the
  config's own `parallelism.md` documents Opus over-elaboration as observed in
  production, so the mechanism is plausible for this fleet even if the 26pp figure
  is unverified.
- **Current config alignment: ALIGNED (already implemented, with correct caveats).**
  - `rules/prompting-quality.md:88-100` has a `## Scale-aware brevity constraints`
    section citing the exact paper, flagged "preprint, not validated on planning
    tasks or Opus-tier agents specifically" — correct epistemic hygiene for Low
    evidence.
  - It mandates: every Opus agent prompt must include "Return only the structured
    result — no preamble, no trailing summary" (`prompting-quality.md:95-96`).
  - Verified on disk: **all 6 Opus/opusplan agents carry an explicit `**Output
    format:**` brevity line.** Exhaustive list:
    - `agents/01-core-development/graphql-architect.md` (opusplan) — "No preamble, no trailing summary."
    - `agents/02-language-specialists/java-architect.md` (opusplan) — "No preamble, no trailing summary."
    - `agents/03-infrastructure/cloud-architect.md` (opusplan) — "No prose introductions or trailing summaries."
    - `agents/04-quality-security/ad-security-reviewer.md` (opus) — "No preamble, no trailing summary."
    - `agents/04-quality-security/powershell-security-hardening.md` (opus) — "No preamble, no trailing summary."
    - `agents/05-data-ai/llm-architect.md` (opusplan) — "No preamble, no trailing summary."
  - Model distribution confirms scope is right-sized: 106 sonnet, 13 haiku, 4
    opusplan, 2 opus (126 agent files). Brevity constraint is applied to exactly
    the cohort the paper targets (Opus-tier), not blanket-applied — which is the
    correct reading, since the cited benefit is scale-dependent.
  - `prompting-quality.md:98-100` correctly carves out the exception: "when
    reasoning trace is the deliverable (architecture proposals, extended thinking
    tasks) — verbosity is appropriate." This matches the paper's own scope limit.

  **No change recommended.** Config already does exactly what the finding prescribes
  and is appropriately skeptical about the magnitude. If anything, the config is
  slightly *ahead* — it generalized the principle into a reusable rule rather than
  a one-off agent tweak.

---

## 1. Instruction-hierarchy fragility — don't put security boundaries in the prompt

- **Finding:** Under conflicting instructions, models sharply lose the ability to
  honor the intended system > user > tool priority order. The most competitive
  open model resolves conflicts at only ~48% accuracy; *all* evaluated models
  decline sharply vs. their non-conflict baseline. Implication: system-prompt text
  alone cannot be relied on to enforce a security or authority boundary.
- **Source:** IHEval, *Evaluating Language Models on Following the Instruction
  Hierarchy*, arxiv:2502.08745 (2025). Tier 4 (arxiv). Corroborated in spirit by
  SysBench and "system prompt robustness" line of work surfaced in the same search.
- **Evidence strength:** Medium (benchmark paper, multiple corroborating
  benchmarks, but preprint tier).
- **Applies to Claude:** Medium–High. The instruction-hierarchy concept is an
  Anthropic-authored framing (the model-spec hierarchy); the failure mode is
  general across frontier models.
- **Current config alignment: ALIGNED.**
  - `rules/security.md:6` "Trust nothing from outside the process" and `:5-7`
    "Validate all input at system boundaries" already encode the correct posture:
    boundaries are enforced in code, not in prompt text.
  - `rules/security.md:37-42` lists injection vectors and mandates parameterized
    queries / sanitization — i.e., the config does not delegate authorization or
    injection defense to prompt instructions.
  - The global instruction `CLAUDE.md` likewise treats rules as behavioral guidance,
    not as a security control surface.
  - **Optional reinforcement (Low priority):** add one sentence to `security.md`
    making the IHEval lesson explicit: "Never rely on system-prompt instructions
    alone to enforce an authority or safety boundary; enforce in code, because
    models honor instruction-hierarchy priority unreliably under conflict (IHEval,
    arxiv:2502.08745)." This is a documentation nicety, not a behavioral gap — the
    config already behaves correctly.

---

## 2. Self-contained sub-agent prompts with explicit information boundaries

- **Finding:** Orchestrators frequently write sub-agent prompts that (a) leak
  distractor context irrelevant to the role, (b) omit shared context multiple roles
  need (actor roles missed shared fragments 12–39% of the time; reviewers 17–45%),
  and (c) mis-assign artifact ownership / handoffs (23.7–26.6% leaked to the wrong
  role). Core prescription: the "need-only rule" — each role receives exactly the
  fragments it needs; specify precisely which roles read/write/ignore each artifact;
  keep instructions self-contained (avoid the "bootstrap paradox" of putting
  instructions inside artifacts the agent can't see yet, and avoid gratuitous
  negations referencing out-of-scope actions). Even SOTA models hit only 62% pass
  rates; manual inspection of generated sub-agent prompts remains necessary.
- **Source:** *PerspectiveGap: A Benchmark for Multi-Agent Orchestration
  Prompting*, arxiv:2606.08878 (2026). Corroborated by MASPO (arxiv:2605.06623) and
  PerspectiveGap's framing of role-specific prompt design. Tier 4 (arxiv).
- **Evidence strength:** Medium (recent benchmark + corroborating papers; preprint).
- **Applies to Claude:** High. This is exactly the orchestrator→subagent pattern the
  config's `parallelism.md` governs via the Agent tool.
- **Current config alignment: ALIGNED — config is at or ahead of the field.**
  - `rules/parallelism.md` "Agent prompt structure" already mandates a 10-part
    self-contained template covering: Prior observations, Context, Task, **Write-set**,
    **Read-set**, Architecture decisions, **Interface contracts** (with JSON schema
    for machine-consumed output), Quality bar, Boundaries (Always/Ask-first/Never),
    Commit format. The opening line — "Subagents start with a blank slate … Every
    agent prompt must be self-contained" — is precisely PerspectiveGap's
    self-containment prescription.
  - Write-set / Read-set map directly onto PerspectiveGap's artifact-ownership and
    need-only rules; "one writer per file" prevents the handoff-confusion failure.
  - The config goes *beyond* the paper: it adds file-ownership collapse rules,
    context-budget caps (20–30 files/agent), and a tool-count cap (≤8) that the
    paper does not address.
  - **One nuance worth noting (not a defect):** PerspectiveGap warns that gratuitous
    negations ("don't do X" referencing out-of-scope actions) hurt compliance. The
    "Opus behavioral compensation" block in `parallelism.md` is a list of negations
    ("Do NOT infer…", "Do NOT over-engineer…"). These are *in-scope* behavioral
    guards, not out-of-scope references, so they don't trip the specific failure
    mode the paper describes — but if Opus-agent compliance ever looks degraded,
    this block is the first place to A/B test phrasing (positive framing vs.
    negation). Log only; no change now.

---

## 3. Markdown/XML section structure, role definition, explicit tool guidance

- **Finding:** Across real production system prompts (v0, ChatGPT, Cursor, Cline,
  Manus, same.new, Claude), the consistently recurring patterns are: (1) clear role
  definition and scope; (2) structured instructions via Markdown headings or
  XML-like tags to delineate rule sets; (3) explicit tool integration guidance
  (when/when-not, schemas); (4) step-by-step reasoning/planning; (5) consistent
  tone. Anthropic's own guidance independently prescribes the same: "organizing
  prompts into distinct sections … using XML tagging or Markdown headers to
  delineate these sections," with example sections `<background_information>`,
  `<instructions>`, `## Tool guidance`, `## Output description`.
- **Source:** `dontriskit/awesome-ai-system-prompts` (GitHub, 6,010★, created
  2025-03 — passes provenance gate: >1000★ AND >6mo history). Tier 5 curated, but
  **independently corroborated by Tier-3 Anthropic** "Effective context engineering
  for AI agents" (anthropic.com/engineering). Injection scan: one benign hit (a
  quoted excerpt of Cursor's own leaked prompt, not an attack); clone deleted.
- **Evidence strength:** Medium (Tier-3 Anthropic doc corroborates a Tier-5
  catalog; two independent sources agree).
- **Applies to Claude:** High (Anthropic is one of the corroborating sources).
- **Current config alignment: ALIGNED.**
  - Rule files and agents already use hierarchical Markdown headers, bolded section
    labels (`**Output format:**`, `**Task**`, `**Write-set**`), and tables. Agents
    carry role definitions in frontmatter `description` + body.
  - `rules/lsp.md` and tool-guidance sections give explicit when/when-not tool
    decision tables — matching pattern (3).
  - No action required. The config's formatting is already at field standard.

---

## 4. Context as a finite resource / "right altitude" / just-in-time loading

- **Finding (Anthropic, authoritative):** Treat context as "a finite resource with
  diminishing marginal returns"; aim for "the smallest possible set of high-signal
  tokens." Instructions should sit at the "right altitude" — the Goldilocks zone
  between brittle hardcoded if-else logic (fragile, high-maintenance) and vague
  high-level guidance (no concrete signal). Prefer agents that "maintain lightweight
  identifiers (file paths, stored queries, web links) and use these references to
  dynamically load data into context at runtime" over "pre-processing all relevant
  data up front" (progressive disclosure / just-in-time context).
- **Corroborating finding (arxiv):** *Analyzing and Internalizing Complex Policy
  Documents for LLM Agents*, arxiv:2510.11588 (2025) — agent compliance degrades
  substantially as policy documents grow longer / more numerous; mitigations are
  structured decomposition, retrieval rather than universal prompt injection,
  summarization, and restructuring by task context. Concrete guidance: "Avoid
  extremely lengthy single-document policies; favor modular structures."
- **Source:** Anthropic "Effective context engineering for AI agents" (Tier 3,
  practitioner-authoritative) + arxiv:2510.11588 (Tier 4). Two independent sources
  agreeing.
- **Evidence strength:** Medium–High (Anthropic first-party + corroborating
  benchmark paper).
- **Current config alignment: PARTIALLY MISALIGNED — the only real gap found.**
  - **What's already right:**
    - `CLAUDE.md` itself is 3,432 bytes — under the config's own 4KB cap
      (`prompting-quality.md:25-29` "Instruction bloat … Keep them under 4KB").
    - The config already practices modular decomposition: 21 separate rule files
      under `rules/`, exactly the "favor modular structures" prescription of
      arxiv:2510.11588.
    - `prompting-quality.md` "Right altitude" is implicitly honored — rules give
      heuristics + tables, not brittle if-else trees. `parallelism.md` even warns
      against thin prompts and over-specification.
    - The Anthropic just-in-time pattern is partly realized: the brief structure in
      `autonomous-execution.md` explicitly says "The executor only needs to read
      README.md to orient. It reads batch and task files on demand … Do not load the
      entire plan directory into context at once" — this *is* progressive disclosure.
  - **The gap:** the 21 rule files total **~62 KB** (`rules/*.md`), and the global
    `CLAUDE.md` enumerates and points at all of them. The Verification/Rules sections
    of `CLAUDE.md` reference every rule file by name, and several rule files are large
    (`parallelism.md` 7.7KB, `autonomous-execution.md` 6.5KB, `prompting-quality.md`
    4.9KB, `architecture.md` 4.6KB). Whether these are *all* injected on every turn
    depends on the harness's loading behavior (the session reminder in this very task
    shows many full rule files were inlined verbatim), but the design clearly trends
    toward a large always-on policy surface. arxiv:2510.11588 predicts compliance
    degradation precisely in this regime, and Anthropic's context-engineering doc
    argues for references-loaded-on-demand over up-front bulk.
  - **Recommended change (Medium priority, 2+ sources agree, no specificity lost):**
    1. Make rule-file loading *just-in-time* rather than always-on. Keep `CLAUDE.md`
       as a thin index of one-line rule summaries + file paths (it already nearly is),
       and have agents/skills pull the full rule file only when the task touches that
       domain (e.g., load `security.md` for auth work, `observability.md` for new
       endpoints). This mirrors `autonomous-execution.md`'s own README-first pattern,
       applied to the rules layer. The config has the mechanism (Read on path) — the
       gap is that the rules are framed as ambient policy rather than retrievable
       references.
    2. Apply the config's own `prompting-quality.md` "Instruction bloat" 4KB
       discipline to the *aggregate* always-loaded surface, not just `CLAUDE.md` in
       isolation. Today the per-file cap passes while the cumulative footprint
       (~65KB incl. CLAUDE.md) is ~16× that cap.
    3. Audit for redundancy across rule files (brevity guidance appears in both
       `parallelism.md` and `prompting-quality.md`; commit format appears in
       `CLAUDE.md`, `commits.md`, `parallelism.md`, `pr-workflow.md`, and
       `autonomous-execution.md`). Consolidate to one canonical location + cross-ref
       to cut the always-on token load without losing any rule.
  - **Why this is "Misaligned" not "Config is better":** two independent, credible
    sources (Anthropic first-party + a 2025 benchmark) converge on "don't keep a
    large policy surface always-resident; retrieve by task," and the config shows no
    documented rationale for diverging. The fix reduces token cost and degradation
    risk with zero loss of specificity — meeting the task's "recommend applying"
    bar.

---

## 5. Constraint-budget (≤6 hard constraints per section) — sanity re-check

- **Finding:** The config's `prompting-quality.md` already encodes a
  constraint-budget rule (≤6 hard prescriptive constraints per section, citing
  "MOSAIC research arxiv:2601.18554"). This was not independently re-verified in
  this run (the cited arxiv id was not fetched), but the *principle* — that long
  flat constraint lists degrade compliance — is directly corroborated by the
  PerspectiveGap and policy-internalization findings above (more rules → more
  omission/blending).
- **Evidence strength:** Low for the specific 6-item threshold and the specific
  citation (unverified this run); Medium for the underlying direction.
- **Current config alignment: ALIGNED (and self-consistent with §2/§4 findings).**
  - No change. Flagging only that the `arxiv:2601.18554` citation in
    `prompting-quality.md` should be spot-verified in a future pass; if it doesn't
    resolve, soften to "internal observation + corroborated by instruction-following
    benchmarks" rather than a hard citation.

---

## Summary verdict table

| # | Principle | Verdict | Action |
|---|-----------|---------|--------|
| 0 | Brevity constraints on Opus agents (pre-seeded) | Aligned (implemented + caveated) | None |
| 1 | Don't enforce security boundaries via prompt (IHEval) | Aligned | Optional 1-line note in security.md (Low) |
| 2 | Self-contained sub-agent prompts, need-only context (PerspectiveGap) | Aligned / ahead | None; watch negation phrasing in Opus-compensation block |
| 3 | Markdown/XML structure, role def, tool guidance | Aligned | None |
| 4 | Context as finite resource / JIT loading (Anthropic + 2510.11588) | **Partially misaligned** | **JIT rule loading + aggregate bloat cap + dedup (Medium)** |
| 5 | Constraint budget ≤6/section | Aligned | Spot-verify the 2601.18554 citation later (Low) |

**Net:** config is ahead of or aligned with the field on 5 of 6 principles. The one
actionable gap is the cumulative always-on rule-file footprint (~65KB) vs. the
field's converging "retrieve by task, keep the resident surface small" guidance —
fixable by making rule files just-in-time references (a pattern the config already
uses for mission briefs) and deduplicating cross-file repetition.

### Sources
- IHEval — arxiv:2502.08745 (Tier 4)
- PerspectiveGap — arxiv:2606.08878 (Tier 4); MASPO arxiv:2605.06623 (corroborating)
- Internalizing Complex Policy Documents — arxiv:2510.11588 (Tier 4)
- Anthropic, "Effective context engineering for AI agents" — anthropic.com/engineering (Tier 3)
- Anthropic, "Building effective agents" / "Writing tools for agents" — (Tier 3, background)
- dontriskit/awesome-ai-system-prompts — GitHub 6,010★, 2025-03 (Tier 5, passed provenance gate; injection-scanned clean; deleted)
- Pre-seeded: Hakim 2026, arxiv:2604.00025 (Tier 4, Low confidence — preprint)
