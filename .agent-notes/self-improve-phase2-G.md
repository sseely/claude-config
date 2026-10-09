# Agent G — Prompt structure audit (2026-10-08)

Sample: rules/ (26), CLAUDE.md, api-designer, backend-developer, code-reviewer,
security-auditor, it-ops-orchestrator (+ all 7 Opus agents), SKILL.md of
plan-mission / code-review / self-improve. Checklist = Agent C Misaligned set:
C1 (over-verification), C2 (emphasis / negative framing / placement), C3 (recency),
C4 (128k cliff claim), C6 (cloud-architect brevity), C8 (conditional constraints).
Not re-filed: F/H items (stale model claims in model-routing.md, PerspectiveGap
comment, prompting-quality citation prose, CLAUDE.md pointer sections).

## Standing brevity check (arxiv:2604.00025) — Opus-routed prompts

Opus-routed agents (`grep -rlE '^model: (opus|opusplan)' agents`) = 7, not 6
(C missed `agents/plantuml-visual-qa.md`). Result: 0 of 7 lack both an
output-length constraint and an output shape.

| Prompt | Evidence | Verdict |
|---|---|---|
| agents/03-infrastructure/cloud-architect.md | :18 "numbered ADRs (Context: 1 sentence; ... ≤4 items). No prose introductions or trailing summaries." | PASS — C6's claim is a **false positive** (C grepped for the literal "no preamble"; this file uses different wording) |
| agents/04-quality-security/ad-security-reviewer.md | :18 bullet schema + "No preamble, no trailing summary" | PASS |
| agents/04-quality-security/powershell-security-hardening.md | :17 same | PASS |
| agents/05-data-ai/llm-architect.md | :17 ADR/risk bullets + no preamble | PASS |
| agents/02-language-specialists/java-architect.md | :33 ADR/finding schema + no preamble | PASS |
| agents/01-core-development/graphql-architect.md | :34-36 "2-4 sentences" + :21-22 brevity line | PASS on length, shape is prose (see G2) |
| agents/plantuml-visual-qa.md | :12 structured table, no preamble | PASS |
| plan-mission Phase 3 / Phase 5 (Opus) | SKILL.md:180-181, :271-272, :395-401 | PASS |
| self-improve Phase 3 synthesis (Opus if >20 findings) | SKILL.md:71, :118 | PASS |

No Opus-routed Warning. Action for C6: drop the cloud-architect item.

## Findings

### G1. Warning — SYSTEMIC (6 files): prompt-author instruction pasted verbatim into agent bodies
- Files: graphql-architect.md:21-22, java-architect.md:21-22, cloud-architect.md,
  ad-security-reviewer.md, powershell-security-hardening.md, llm-architect.md
  (each carries the full "Opus behavioral compensation" block; grep count = 1 each).
- Violation: the line "End the prompt per `prompting-quality.md`'s brevity section:
  'Return only the structured result — no preamble, no trailing summary.'" is written
  for an *orchestrator composing a prompt* (rules/model-routing.md:~52). Inside an agent
  file the agent is the recipient, so "End the prompt" is an instruction it cannot
  execute and cites a rule file subagents do not auto-load. In 5 of 6 the file also has a
  real `**Output format:**` section saying the same thing, so the pasted line is redundant.
- Correct form: delete the "Output shape" bullet that contains "End the prompt..." from
  the 6 agents; keep only the "A spec ... is NOT ambiguous scope" bullet and the file's own
  Output format section. Saves ~45 tokens x 6 per Opus spawn.
- Confidence 80.

### G2. Warning — agents/01-core-development/graphql-architect.md:21-22 vs :34-36
- Violation: two conflicting output shapes in one prompt: "Return only the structured
  result" (a schema is implied, none defined) vs "State what changed and why in 2-4
  sentences". Opus 5 guide (C6): state length and shape once, explicitly.
- Correct form: single Output format section, e.g. "Schema diffs as SDL blocks;
  breaking-change risks as `Severity | Type.field | Issue | Fix` bullets. No preamble,
  no trailing summary." (matches sibling java-architect:33).
- Confidence 75.

### G3. Suggestion — SYSTEMIC (6 files): negative-only scope bullets in Opus compensation block
- Files: same 6 agents + rules/model-routing.md:44-47 ("Do NOT" x3).
- Violation (C2): all three scope prohibitions are stated without the positive form or
  reason; Anthropic guide prefers "do X because Y". C notes the Opus 5 guide itself uses
  negative scoping, so this is optional.
- Correct form: "Implement the simplest interpretation of unstated requirements (extra
  abstractions add review cost). Delegate to subagents only when the task names them."
- Confidence 40. Low priority; do only if G1 edit touches the block anyway.

### G4. Warning — rules/extended-thinking.md:24-30 (Self-refine)  [C1/C14 confirmed]
- Violation: instructs "generate ... critically evaluate ... then refine", 2-3 passes,
  for architecture/security/test-plan outputs — the very work routed to `opus` (5.5).
  Opus 5 guide: explicit verify/re-check instructions compound with built-in
  self-verification. Same file is the only verification instruction in the sample
  (grep `double-check|re-check|critically evaluate` over rules/, CLAUDE.md, 3 SKILL.md:
  only extended-thinking.md:27 + unrelated error-handling.md:68 "Re-check invariants",
  which is a code-semantic rule and fine).
- Correct form: "Self-refine: for Sonnet/Haiku-tier outputs where quality outweighs
  speed, generate -> critique against requirements -> refine (2-3 passes). On Opus 5+
  do not add explicit re-check passes; raise `effort` instead."
- Confidence 78. (F filed this only as citation padding; the behavioral misalignment is
  new.)

### G5. Suggestion — rules/prompting-quality.md:3-12, :64-76 (constraint keywords & placement)  [C2/C3 confirmed]
- :9-12 still lists "Prohibitions: do not, avoid, never" as a keyword class and the
  "Strong" example is purely negative ("do not change the session logic or touch any other
  handler"). No guidance exists on constraint placement; MOSAIC shows a recency effect on
  Claude, and Anthropic puts queries last in long prompts.
- Correct form: add one line to Constraint budget: "Place hard constraints last in a
  section/prompt (recency); pair each prohibition with the positive alternative and
  reason." Reword :66-69 per C3 ("qualitative bands read from MOSAIC Fig 3, models <=
  Claude 3.7").
- Confidence 60.

### G6. Suggestion — placement audit of sampled files (C3), no systemic breach
- agents sampled put Boundaries (hard constraints) near the end: graphql-architect:40-47,
  java-architect Quality bar -> Boundaries — recency-aligned. CLAUDE.md puts Interaction
  Style (constraints) first and Verification second; those are system-level and persist,
  so placement matters little (C2 "low relevance"). plan-mission puts Opus brevity
  constraint at call sites (:180, :271) and again in a trailing summary (:395-401) —
  recency-aligned, mildly duplicated (Suggestion: delete :395-401 table duplicate if
  H/F tighten the file; conf 45).

### G7. Suggestion — skills/plan-mission/SKILL.md:343 and :384-390 stale model naming
- :343 "ran on Opus 5, the session's default opus alias" — alias is now Opus 5.5
  (model-routing.md:10, :24). :388-390 repeat the PerspectiveGap "Known tension" box and
  "Opus 5 itself is untested ... v2.1.219+". F/H covered the model-routing.md copy of this
  note, not the plan-mission copy. Correct form: "Opus (current alias)" at :343; delete
  or shrink the box to one line. 18 resident-on-invoke lines. Confidence 70.

### G8. Suggestion — code-reviewer.md / security-auditor.md lack an output-shape section
- agents/04-quality-security/code-reviewer.md and security-auditor.md (both sonnet): no
  `Output format` section (grep). Not a standing-check failure (Sonnet), but they are the
  review agents; Opus 5 guide (C1) says "report everything, filter in a second pass" —
  code-review SKILL.md Step 4 does that, so correct form is just a one-line
  `Severity | File:Line | Issue | Fix` shape. Verify by Read before applying. Confidence 45.

### G9. Note — rules/prompting-quality.md:61-62 128k claim  [C4 confirmed]
- Conf 70. ">~128k tokens ... compact or split" rests on one preprint; Anthropic's Opus 5
  guide documents consistent behavior to 1M. Soften to "one preprint reports a cliff on
  some models; split on evidence, not a fixed trigger". (F touched citation prose here;
  this is the factual overreach, not the prose bloat.)

### G10. Note — C8 conditional-constraint finding applied
- rules/parallelism.md and autonomous-execution.md are the conditional-heavy files
  (parallelism.md "Exception — autonomous mode", "Trigger this planning step when" list,
  model-routing.md "overrides parallelism.md ... whenever the session model is Fable").
  The Fable/parallelism override is a 3-layer conditional; this is the one place the
  ManyIH/AGENTIF concern bites. Suggestion: express the single-agent-vs-Fable precedence
  as a 2-row table in parallelism.md rather than a cross-file override sentence. Conf 40.

## Aligned / Config-is-better confirmations (one concrete line each)

- C2 emphasis: **Aligned.** Zero CRITICAL/MUST/NEVER/ALWAYS/IMPORTANT hits across
  CLAUDE.md, rules/*.md, the 5 sampled agents, and 3 SKILL.md except
  rules/prompting-quality.md:16 (the note advising against them) and
  skills/plan-mission/SKILL.md:303 (single "MUST" on the executor-read README — one hit,
  not shouting). Residual shouting lives only in imported skills C already listed.
- C1 review pattern: **Aligned.** skills/code-review/SKILL.md:20 routes Step 4 scoring to
  a separate sonnet pass (filter-after-report), matching the Opus 5 recommendation.
- C6 operational advice: **Aligned.** plan-mission/SKILL.md:180-181 gives Opus an explicit
  format ("numbered ADR list ... No prose introduction or trailing summary").
- C8 tables for conditionals: **Aligned.** rules/model-routing.md:8-14 role/alias/effort
  table; plan-mission/SKILL.md:375-381 phase routing table.
- C9 session decay: **Aligned.** rules/prompting-quality.md:111-117 (work-type boundary)
  plus CLAUDE.md "On Compaction" hook.
- C12 structural coordination: **Config is better.** rules/parallelism.md write-set rules
  ("Each file may only be written by one agent at a time") plus agents' Boundaries.
- C7: **Config is better.** No rule cites Prompting Inversion.

## Top-line
Standing brevity check clean (7/7 agents + all Opus skill phases). C's cloud-architect
gap is a false positive. Real issues: pasted prompt-author instruction in 6 agents (G1),
Self-refine vs Opus 5 (G4), graphql-architect conflicting output shape (G2).
