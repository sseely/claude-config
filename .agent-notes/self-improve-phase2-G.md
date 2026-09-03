# Phase 2 — Agent G (prompt structure audit)

Read-only. Checklist = Agent C's 10 principles (phase1-C.md) applied
dynamically, not a fixed list. Sample: all `rules/*.md`, `CLAUDE.md`,
5 agents (backend-developer, fullstack-developer, security-auditor,
qa-expert, it-ops-orchestrator), 3 SKILL.md (plan-mission, code-review,
self-improve) + their Opus-routed `references/*.md`.

---

## Standing brevity check (arxiv:2604.00025)

Ran `grep -rn "model: opus\|opus" agents/ skills/*/SKILL.md
skills/*/references/*.md` repo-wide, not just the 5-agent sample (per
task instruction "regardless of Agent C findings").

**Correction to Agent C's sampling-shortfall note**: Agent C's
`grep -c '^model: opus' agents/*.md` returns 1 because the glob
`agents/*.md` does not recurse into subdirectories (e.g.
`agents/04-quality-security/*.md`). The actual repo-wide count of
`model: opus` / `model: opusplan` frontmatter is **7 agents**, plus 2
Opus-routed skill phases and 1 conditional skill phase. Confidence: 100
(directly grepped, glob behavior verified).

| Prompt location | Model routing | Length constraint | Output shape | Verdict |
|---|---|---|---|---|
| `agents/plantuml-visual-qa.md:5,12` | `opus` | Yes ("No preamble, no trailing summary") | Yes (structured table, named columns) | Pass |
| `agents/04-quality-security/powershell-security-hardening.md:5,8` | `opus` | Yes | Yes (`Severity\|File:Line\|Issue\|Fix` bullets) | Pass |
| `agents/04-quality-security/ad-security-reviewer.md:5,8` | `opus` | Yes | Yes (`Severity\|Finding\|Attack path\|Remediation`) | Pass |
| `agents/03-infrastructure/cloud-architect.md:5,9` | `opusplan` | Yes | Yes (numbered ADRs, ≤4-item bullets) | Pass |
| `agents/01-core-development/graphql-architect.md:5,9` | `opusplan` | Yes | Yes (`Issue\|File:Line\|Fix` / numbered ADRs) | Pass |
| `agents/02-language-specialists/java-architect.md:5,9` | `opusplan` | Yes | Yes (numbered ADRs / `Severity\|File:Line\|Issue\|Fix`) | Pass |
| `agents/05-data-ai/llm-architect.md:5,9` | `opusplan` | Yes | Yes (numbered ADRs / `Severity\|Component\|Issue\|Mitigation`) | Pass |
| `skills/plan-mission/SKILL.md:365,386-387` (Phase 3) | Opus + adaptive thinking | Yes | Yes (numbered ADR list) | Pass — but see P2 (constraint sits 230+ lines from Phase 3 task def) |
| `skills/plan-mission/SKILL.md:367,388-389` (Phase 5) | Opus + adaptive thinking | Yes | Yes (numbered task list w/ write-set etc.) | Pass — same P2 caveat |
| `skills/self-improve/SKILL.md:112` (Phase 3, conditional >20 findings) | Opus | Yes ("no preamble, no trailing summary") | Partial (says "list", no schema/columns) | Pass (Suggestion: name the shape explicitly) |

**No Warnings.** Every Opus/opusplan-routed prompt found repo-wide in
this sample already carries both an explicit length constraint and an
output shape. This is a stronger result than Agent C's pre-seeded
assessment, which reported a "sampling shortfall" based on an
undercounted grep. `agents/explore.md` and `agents/plan.md` mention
`opus` only in prose explaining why they are pinned to `model: haiku`
(built-in Explore/Plan override) — not Opus-routed, excluded.
`skills/code-review/SKILL.md` has no Opus routing (sonnet/haiku only,
confirmed via grep) — excluded.

---

## Per-principle results

**P1 (Aligned)** — Confirmed. `rules/prompting-quality.md:70-82`
(Constraint budget) states the ≤6/7-15/>15 degradation bands, matching
Agent C's citation exactly.

**P2 (Misaligned — placement)** — Violations found, file:line, systemic
(7 files).
1. `skills/plan-mission/SKILL.md:153-175` (Phase 3 task definition) and
   `:228-263` (Phase 5 task definition) vs. the brevity/shape constraint
   that binds to them at `:383-389` ("Brevity constraints for Opus
   phases"), inside a "Model Routing" section **~210-230 lines later**.
   Violation: the hard output-shape constraint for Phase 3/5 is not
   adjacent to the phase it governs. Correct form: state the constraint
   inline at the end of each phase's own section (`## Phase 3 —
   Surface architecture decisions` at :153, `## Phase 5 — Decompose
   into tasks` at :228), not only in a trailing routing table.
   Confidence: 70 (single preprint backs the general principle; this is
   a concrete, unambiguous instance of the pattern it describes).
2. `skills/self-improve/SKILL.md:65-75` (Phase 3 definition) vs. its
   brevity constraint at `:112` inside the "Rules" section, ~40 lines
   later. Milder instance of the same pattern. Confidence: 55.
3. `agents/fullstack-developer.md:10-89` (task checklists: API design,
   auth, testing, etc., stated as bare noun-phrase bullets with no
   inline "must/never" language) vs. the only rule pointers — including
   `security.md` for the auth section at lines 30-38 — appearing solely
   in `## Required Rules` at `:210-219`, ~130-200 lines later.
   Confidence: 55.
4. `agents/security-auditor.md:10-118` (checklist sections) vs.
   `## Required Rules` trailing block at `:120-127`. Confidence: 50.
5. `agents/qa-expert.md:10-118` (checklist sections) vs. `## Required
   Rules` trailing block at `:120-126`. Confidence: 50.
6. `agents/it-ops-orchestrator.md:16-39` (Task Routing Logic,
   Orchestration Behaviors) vs. `## Required Rules` trailing block at
   `:56-65`. Confidence: 50.
7. `agents/backend-developer.md:58-75` — partial exception: this file
   *does* place `security.md` inline under `### Security Standards`
   (:25-34) before the trailing `## Required Rules` index, but the
   other 12 referenced rule files (testing.md, api-design.md,
   observability.md, etc.) are only ever named in the trailing block,
   not adjacent to the sections they bind (Testing at :44-49,
   Performance at :35-42). Confidence: 45.

**Systemic pattern**: all 5 sampled agents and 2 of 3 sampled skills
put rule-file/constraint references in one trailing block, separated by
40-230 lines from the task text they govern. See Systemic Patterns
below.

**P3 (Config is better)** — Confirmed, no correction needed.
`rules/diagrams.md:9-11` mandates a markdown fenced block for PlantUML
diagrams as a harness/rendering requirement ("In Markdown, use a fenced
block... wrapping `@startuml`…`@enduml`"), not an accuracy claim — no
markdown-superiority assertion exists to correct.

**P4 (Config is better)** — Confirmed.
`rules/prompting-quality.md:84-101` (Register shifting) ties verb
choice (Tier 1 `audit`/`verify`/`enumerate` vs. Tier 3
`look at`/`note`) to intended processing depth — the transferable half
of CFPO's content/format coupling finding, at a level that survives the
paper's ≤8B-model caveat.

**P5 (Misaligned — context cliff, no token threshold)** — Violation,
not systemic (1 rule-file gap + 1 corroborating skill instance).
1. `rules/prompting-quality.md:59-68` (Agent context budget) bounds
   context by file count (20-30) only; no token threshold anywhere in
   the file (confirmed by full read — no other mention of "128k",
   "cliff", or token count exists in the section). Fix (per Agent C):
   add "recall degrades sharply past ~128k tokens
   (arxiv:2607.19257, preprint); compact or split when context passes
   that band, regardless of file count." Confidence: 65.
2. Corroborating real-world instance:
   `skills/code-review/SKILL.md:87-95` (Step 2 — eleven parallel
   agents) hands each of 11 agents "the full file inventory from Step
   1" with no file-count or token cap when scope is `"full project"` —
   the exact gap the rule-file fix would close. Confidence: 55 (the
   step doesn't itself violate a stated rule since none exists yet;
   it's evidence the gap has a live blast radius).

**P6 (Aligned)** — Confirmed, strengthened beyond Agent C's citation.
`rules/prompting-quality.md:103-117` (Scale-aware brevity constraints)
states the rule with the correct preprint caveat. Standing check above
found **7 agent files + 2 skill phases**, not just
`agents/plantuml-visual-qa.md:12`, all already compliant — e.g.
`agents/04-quality-security/ad-security-reviewer.md:8` and
`skills/plan-mission/SKILL.md:386-389`.

**P7 (Aligned)** — Confirmed. `rules/autonomous-execution.md:32-47`
(Startup Sequence, immediately followed by "After Every Compaction")
implements the progress-file + re-read-from-disk pattern the Anthropic
engineering post describes.

**P8 (Aligned)** — Confirmed. `rules/parallelism.md:161` states "Tool
list >8 per agent... Scope to 3-5 tools per agent" with the MCP
carve-out immediately following at `:163-175`. Cross-check against the
5-agent sample: `agents/qa-expert.md:4` and
`agents/security-auditor.md:4` both list exactly 8 tools (Read, Grep,
Glob + 5 Serena MCP tools as one cohesive group per the carve-out) —
consistent with the rule.

**P9 (Misaligned — Anthropic Engineering absent from Tier 3)** —
Confirmed, not systemic (single source-of-truth file).
`rules/research-sources.md:35-49` (Tier 3 block) lists Google SRE,
Netflix, Cloudflare, AWS, Stripe, Martin Fowler, High Scalability — no
`anthropic.com/engineering` entry anywhere in the file (confirmed by
full read). Fix: add `**Anthropic Engineering** —
anthropic.com/engineering (agent harness, context engineering, tool
design)` after `High Scalability` at line 46. Confidence: 85.

**P10 (Misaligned — `paths:` self-contradiction)** — Confirmed, not
systemic. `grep -rn "paths:" skills/*/SKILL.md agents/*.md agents/*/*.md
rules/*.md` (excluding tool-parameter false positives) returns exactly
two hits, both inside the same file: `rules/prompting-quality.md:37-38`
("`paths:` frontmatter... is not used here: a pilot came back RED and a
gate enforces its absence") directly contradicts
`rules/prompting-quality.md:56-57` ("Domain-specific rules should use
`paths:` frontmatter to load only when matching files are in play").
No other file in the sample references `paths:` frontmatter at all, so
the contradiction is self-contained to this one file — confirms Agent
C's fix (delete :56-57) is sufficient; no wider cleanup needed.
Confidence: 90.

**2604.00025 (Aligned, additive fix)** — Confirmed and strengthened.
`rules/prompting-quality.md:103-117` states the finding with the
correct scope caveat. The standing brevity check above supersedes
Agent C's "sampling shortfall" note: the requested 3-Opus-agent sample
is in fact overmet (7 agents + 3 skill phases), and 100% already carry
the recommended constraint — evidence the additive fix Agent C proposed
(`rules/parallelism.md:129-141`, Opus behavioral compensation block) is
low-urgency: the guidance is already followed in practice even though
the pointer is missing from that specific block.

---

## Systemic patterns (>3 files)

1. **Trailing constraint/rule-reference block, disconnected from task
   text (P2)** — `agents/backend-developer.md:58-75`,
   `agents/fullstack-developer.md:210-219`,
   `agents/security-auditor.md:120-127`, `agents/qa-expert.md:120-126`,
   `agents/it-ops-orchestrator.md:56-65`,
   `skills/plan-mission/SKILL.md:383-389`,
   `skills/self-improve/SKILL.md:112` — 7/8 sampled agent+skill files
   with rule references place them in a single end-of-file block, 40-230
   lines from the sections they govern. Severity: Warning (broad,
   consistent pattern; per-instance confidence 45-70 since backed by one
   preprint). Fix: for each file, move the specific rule citation into
   the section it binds (e.g. move the `security.md` pointer into
   `### Security Standards`, not only `## Required Rules`); keep the
   trailing block only as a full-list index for subagents that "do not
   auto-load rules/."

2. **No token-based context ceiling anywhere in the rule set (P5)** —
   `rules/prompting-quality.md:59-68` is the sole owner of agent context
   budgeting and states file-count caps only; `skills/code-review/
   SKILL.md:87-95` and `skills/plan-mission/SKILL.md` Phase 1-2 (codebase
   understanding, blast-radius phases, both file-count-unbounded for a
   large repo) inherit the gap. 3 files touched (1 rule + 2 skills) —
   reported as a corroborated gap rather than a 4th systemic file per
   the >3-file bar, but flagged since the mechanism (file count ≠ token
   count under the Sonnet-5 ~1.3x tokenizer note at
   `rules/prompting-quality.md:67-68`) compounds across all three.
