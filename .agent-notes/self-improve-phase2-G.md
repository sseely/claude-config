# Self-Improve Phase 2 — Agent G Audit (2026-07-24)

Scope: rules/*.md (22), CLAUDE.md, 5 sample agents, 3 sample skills.
Method: direct grep/wc/read verification against Agent C's dynamic
checklist — no re-derivation of Agent C's research claims, only
config-side verification.

---

## M1. Instruction-count ceiling (arXiv:2607.19257, preprint)

**Finding M1-1 [Critical, conf 100].** Per-file directive-bullet counts
(lines starting `-`, `*`, or a numbered step), all 22 files:
autonomous-execution.md 53, parallelism.md 34, architecture.md 30,
observability.md 29, research-sources.md 27, prompting-quality.md 22,
retry-idempotency.md 19, pr-workflow.md 19, security.md 17,
extended-thinking.md 17, memory.md 16, logging.md 13, diagnosis.md 10,
naming-conventions.md 9, error-handling.md 9, commits.md 9,
code-principles.md 9, testing.md 7, testability.md 7, lsp.md 7,
environment.md 7, api-design.md 4. **Total ≈ 374** (my count; Agent C
reported 394 — gap is methodology, likely code-fence example lines I
included, e.g. `- command: <exact bash command>` in
autonomous-execution.md:89). Both counts are far past the N=80
zero-perfect-response threshold, and this run's own system prompt
contains all 22 files verbatim — confirmed directly by inspection of
this session's context, not inferred.

**Finding M1-2 [Critical, conf 90].** `rules/autonomous-execution.md`
alone = 53 directive bullets, exceeding the N=40 single-prompt
compliance-degradation ceiling **by itself**, before any of the other
21 files are added. No other single file exceeds 40.

**Finding M1-3 [Critical, conf 100].** `rules/prompting-quality.md:35-39`
("Rules are referenced by pointer from CLAUDE.md, not `@`-imported, so
they are not all resident") is refuted by `CLAUDE.md:65-72`, which
references every `rules/*.md` file by plain backtick path with **no**
`@`-import syntax anywhere in the file (`grep -n "@~/.claude/rules"
CLAUDE.md` → 0 hits) — yet all 22 rule files were resident verbatim in
this run's system prompt regardless. The claim cannot be repaired by
wording alone: fixing the sentence to say "all rules are resident"
would be honest but leaves the underlying N=40/N=80 problem
unaddressed. A real fix requires a **structural** change — either
reduce aggregate rule content, or implement genuine conditional
loading. Note `prompting-quality.md:52-55` already flags
`paths:`-scoped loading as **unconfirmed** as a Claude Code feature —
the config's own comment admits the mechanism referenced by :35-39
doesn't exist yet.

---

## M2. Overstated research warrant for arXiv:2604.00025

Appears in 3 files (not >3), reported per-file per audit method.

**Finding M2-1 [Warning, conf 90] `rules/prompting-quality.md:104-107`.**
Self-contradicts within two sentences: hedges "(preprint, not validated
on planning tasks or Opus-tier agents specifically)" then immediately
asserts as fact "Opus-tier models over-elaborate without explicit
constraint." Line 109 escalates the unvalidated claim to a hard "must."
Correct form: drop the flat assertion; replace with "observed in this
config's own agent outputs" or similar — an in-repo empirical claim,
not a borrowed research finding, since the paper (31 open models,
0.5B–405B, no frontier closed-weight model tested) doesn't license the
Opus-tier claim.

**Finding M2-2 [Warning, conf 85] `skills/plan-mission/SKILL.md:412`.**
"per arxiv:2604.00025 — Opus over-elaborates on **planning tasks**
without explicit constraints" — asserts applicability to planning
tasks specifically, which directly contradicts
`prompting-quality.md:105-106`'s own hedge ("not validated on planning
tasks ... specifically") in the same config. Two files disagree on
what the same citation supports.

**Finding M2-3 [Warning, conf 80] `skills/self-improve/SKILL.md:243,804`.**
Line 243: "Larger models over-elaborate without explicit constraint" —
stated as settled finding with no Opus/Claude qualifier at all,
extrapolating from the paper's open-model scale range to "larger
models" in general. Line 804 restates the same unhedged claim in a
live model-routing instruction ("per arxiv:2604.00025 — Opus
over-elaborates without it"), even though line 238 two paragraphs
earlier correctly labels the source "preprint, not peer-reviewed."
Recommendation for all 3 findings: keep the practice (it's good
config hygiene independent of the citation), restate the causal claim
as an observed-in-practice heuristic, keep "preprint" labeling
consistent, and fix the citation-year mismatch (prompting-quality.md
says "Hakim, 2026"; self-improve/SKILL.md and phase1-C notes say
"Hakim, 2025").

---

## M3. Right altitude / no laundry lists — per-section ≤6 budget

**Finding M3-1 [Note, conf 100] — correction to the aggregate framing.**
Counted every H2/H3 section in `autonomous-execution.md` (10 sections)
and `parallelism.md` individually. **No section in autonomous-execution.md
exceeds 6** parallel-prescriptive bullets: "STOP and wait" = 6 exactly
(:112-121), "PUSH FORWARD" = 5 (:125-130), "Commit Discipline" = 5
(:148-158), "Quality Gates" bullets = 3 (:73-76), "Progress Tracking" =
3 (:164-167); everything else is a numbered procedure (exempt) or
prose. The file's 53-directive total is an **aggregate across 10
compliant sections**, not a section-level violation of the
`prompting-quality.md:78-81` budget. Agent C's framing ("these files
violate" the per-section budget) does not hold up at the section
level for this file — flag as a correction, not a new defect.

**Finding M3-2 [Warning, conf 70] `parallelism.md:38-67`
"Agent prompt structure."** The numbered list 0–9 (10 items: Prior
observations, Context, Task, Write-set, Read-set, Architecture
decisions, Interface contracts, Quality bar, Boundaries, Commit
format) is the one genuine candidate for a real per-section violation.
These are independent template *components*, not an execution
*procedure* — no item requires the prior item to complete first — so
the "numbered sequential steps are exempt" carve-out in
`prompting-quality.md:80-81` arguably does not apply, and the list
reads as 10 parallel prescriptive constraints against a budget of 6.
Fix: split into two named sub-lists (e.g., "Required always" /
"Include when applicable") of ≤6 items each, consistent with
`prompting-quality.md:79-80`'s own instruction for over-budget
sections.

---

## M4. Progressive disclosure (SKILL.md tiering)

`wc -l ~/.claude/skills/*/SKILL.md` confirms 14 of 28 skills exceed
~300 lines; **zero** skills anywhere in the repo have a `references/`
directory (`ls skills/*/references/` → no matches, any skill). Within
the assigned 3-skill sample, all three exceed the threshold:

**Finding M4-1 [Warning, conf 90] `skills/self-improve/SKILL.md`
(809 lines, no references/).** Two clear overflow candidates: Phase 1
sub-agent prompts A/B/C/X (`:78-355`, 277 lines) used only during
Phase 1 research; and the Phase 2 Agent G/H audit checklists
(`:462-624`, ~162 lines, includes the very checklist this run is
executing) used only during Phase 2. Move both to
`references/phase1-research-agents.md` and
`references/phase2-audit-checklists.md`, loaded on demand by the
orchestrator when launching those specific sub-agents.

**Finding M4-2 [Warning, conf 85] `skills/code-review/SKILL.md`
(534 lines, no references/).** The `## Checklists` section
(`:99-340`, 240 lines — 11 per-agent checklists) is loaded on every
invocation, but any single launched reviewer agent needs only ~1/11 of
it. Move to `references/checklists.md`; have the orchestrator extract
and pass only the relevant agent's checklist section into that
sub-agent's prompt.

**Finding M4-3 [Suggestion, conf 70] `skills/plan-mission/SKILL.md`
(417 lines, no references/).** The skill states the correct
progressive-disclosure principle for its own *generated* artifacts at
`:371-379` ("No file > 500 lines... front-load... one concept per
file") but doesn't apply it to itself. Nuance: 417 < 500, so it
technically satisfies its own **line**-based rule for generated docs —
but Anthropic's actual SKILL.md guidance is a **~500-token** tier, and
417 lines is roughly 2,500–3,000 tokens, ~5-6x that budget. The
self-inconsistency is real but subtler than "breaks its own rule" —
it satisfies the wrong (looser) version of the rule.

---

## M5. Subagent return-size budget

**Finding M5-1 [Warning, conf 85].** Confirmed by grep across
`rules/*.md` and `skills/*/SKILL.md` for token-budget/return-size
language ("1k-2k", "token budget", "return size") — the only hits are
`prompting-quality.md:29` (about *input* instruction-bloat, not
subagent *returns*) and `self-improve/SKILL.md:505` (about read-only
file scope, not return size). **No rule anywhere states a subagent
return-size budget.** `rules/parallelism.md:56-59` §6 "Interface
contracts" governs return *shape* only, exactly as flagged. Concrete
in-sample manifestation: `skills/code-review/SKILL.md` Step 2
(`:87-340`) launches 11 parallel Sonnet reviewer agents with no
per-agent return-size cap; their raw output is concatenated verbatim
into a checkpoint file (`:352`, literal `<paste all agent output
here>` placeholder) with no truncation or size constraint applied.
Fix: add one line to `parallelism.md:56-59` — "Target subagent return
size: 1k–2k tokens (Anthropic guidance); structured findings, not raw
logs or full file dumps." One line, one location — this is a
one-line gap, not a rewrite.

---

## Standing check — Opus output-length/shape constraints

**Finding S-1 [Note, conf 100] — sample-scope gap.** None of the 5
assigned agents route to Opus: `backend-developer.md:5`,
`api-designer.md:5`, `code-reviewer.md:5`, `architect-reviewer.md:5`,
`it-ops-orchestrator.md:5` are all `model: sonnet`. The Opus-specific
"report as Warning" instruction therefore produces zero findings from
this agent sample by construction. Repo-wide check instead: 6 agents
carry `model: opus` or `model: opusplan` (not 7, correcting Agent C's
aligned-claims count) — `graphql-architect.md`, `java-architect.md`,
`cloud-architect.md`, `llm-architect.md`, `ad-security-reviewer.md`,
`powershell-security-hardening.md`. **All 6/6** carry an explicit
"Output format:" line with both brevity ("No preamble, no trailing
summary") and shape (e.g. `Severity | File:Line | Issue | Fix`)
constraints — verified directly, e.g. `cloud-architect.md:10`,
`graphql-architect.md:9`. Full compliance among true Opus agents.

**Finding S-2 [Warning, conf 90] — partial compliance within the
5-agent sample.** `code-reviewer.md:9` and `architect-reviewer.md:9`
specify output **shape** ("Deliver findings organized by severity —
Critical, Warning, Suggestion — with file location...") but no
explicit **length/brevity** constraint (no "no preamble"/"no trailing
summary" equivalent) — partial, not full, compliance with the pattern
used on Opus agents. `backend-developer.md`, `api-designer.md`, and
`it-ops-orchestrator.md` have neither, though as code-writing/routing
agents (not report-generating) the rationale for the constraint is
weaker for the first two.

**Finding S-3 [Warning, conf 95] — repo-wide Sonnet/Haiku gap,
independently verified.** `grep -rl "^model: sonnet"` → 106 files;
`^model: haiku` → 13 files. Case-insensitive search for any of
`no preamble|return only|no prose|structured result|output format`
across those files: **1/106** Sonnet agents and **0/13** Haiku agents
match. This corroborates and sharpens Agent C's number — effectively
118/119 (99%) of non-Opus agents carry no brevity or shape constraint
at all, versus 6/6 (100%) of Opus agents. `parallelism.md:100-104`
states Sonnet 5 "reaches near-Opus-4.8 quality," which is the premise
Agent C used to question whether the gap matters.

**Finding S-4 [Suggestion, conf 60] — recommendation on extending the
constraint.** Defensible middle ground, not blanket extension: apply
the brevity+shape constraint to Sonnet/Haiku agents whose **deliverable
is a text report or finding list** (reviewers, auditors, analysts —
the same functional class already covered on the Opus tier), not to
the ~90+ framework-specific implementation agents (react-specialist,
golang-pro, etc.) whose deliverable is code, not prose — the
over-elaboration failure mode this constraint targets applies weakly
to a code diff. Blanket application to all 119 agents would also
conflict with `parallelism.md:149`'s own anti-pattern warning against
identical treatment of structurally different agent roles. Concrete
fix: add a "reporting-class agents" sub-bullet to
`parallelism.md`'s Model Selection section requiring the same
"Output format:" line already used on the 6 Opus agents, scoped to
Sonnet/Haiku agents whose `description:` frontmatter indicates a
report/audit/review role (`code-reviewer`, `architect-reviewer`,
`security-auditor`, `qa-expert`, etc. — starting point: the ~15 Sonnet
agents with `disallowedTools: Write, Edit` or similar read-only
signatures, since read-only tools strongly correlate with
report-generating role).

---

## Aligned / config-is-better — confirmed with one concrete example each

- **Opus brevity constraints:** confirmed 6/6 (not 7/7 — see S-1),
  e.g. `agents/03-infrastructure/cloud-architect.md:10`.
- **Constraint pinning through compaction:** `settings.json:171-176`
  (`PostCompact` hook runs `cat ~/.claude/post-compact-context.md`),
  paired with `CLAUDE.md:28-36` describing the mechanism. Confirmed.
- **Extended-thinking recovers format tax:**
  `rules/extended-thinking.md:47-58` cites NeurIPS 2023 self-refine
  ("Two to three passes yield ~20% quality improvement"). Caveat
  [conf 50]: the file doesn't use the literal term "format tax" —
  this is adjacent supporting evidence (iterative refinement quality
  gain), not a literal match to the claim as phrased.
- **Markdown-only, no mandated XML tags:** every prompt-bearing file
  in `rules/`, `skills/*/SKILL.md`, and `agents/**/*.md` is `.md`;
  grep for XML-tag prompting patterns across `rules/` and `skills/`
  returns zero hits outside unrelated OOXML file-format reference
  material in `doc-pptx/` and `doc-docx/` (a different, legitimate use
  of "XML"). Confirmed — both claims verified together since they're
  the same underlying fact (markdown chosen, XML never required).
- **Front-loaded instruction placement:** `CLAUDE.md:3-6`
  ("## Interaction Style") is the first substantive section
  immediately after the title, ahead of Verification, Session Notes,
  etc. Confirmed.
- **Optimization concentrated in coordinator agents:** 6 Opus agents
  are architect/reviewer roles (cloud/java/graphql/llm-architect,
  ad-security-reviewer, powershell-security-hardening); 13 Haiku
  agents confirmed by direct count matching Agent C's figure. Opus
  count corrected from 7 to 6 (see S-1) — minor, doesn't change the
  underlying "coordinators get the expensive tier" pattern.

---

## Summary counts

- Total findings: 20 (M1: 3, M2: 3, M3: 2, M4: 3, M5: 1, Standing: 4,
  Aligned confirmations: 6 grouped items — not counted as defects).
- Critical: 3 (all M1). Warning: 10. Suggestion: 3. Note: 2.
- Highest-confidence, highest-severity item: M1-3 — the
  "not all resident" claim is directly falsified by this run's own
  system prompt contents plus the absence of `@`-import syntax in
  CLAUDE.md. Fixing the sentence is a 10-minute edit; fixing the
  underlying token-budget problem it was trying to justify is not.
