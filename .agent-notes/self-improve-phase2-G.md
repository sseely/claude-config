# Self-Improve Phase 2 — Agent G: Prompt-Structure Audit

Read-only audit. No files modified. Severity levels per `/code-review`
(Critical/Warning/Suggestion/Note), based on breadth + consequence,
not research confidence. Confidence score (0-100) per finding.

Files audited: all 21 `rules/*.md`, `CLAUDE.md`, 5 agents
(backend-developer, api-designer, architect-reviewer, code-reviewer,
it-ops-orchestrator), 3 skills (plan-mission, code-review, self-improve).

---

## Agent C's misaligned principle: Just-in-time context vs always-on policy surface

Sources: Anthropic "Effective context engineering for AI agents"; arxiv:2510.11588.
The concern: ~21 rule files ≈ 62KB (measured: 61,651 bytes) trending toward an
always-on resident policy surface; favors task-scoped retrieval, capping aggregate
resident footprint, and de-duplicating cross-file repetition.

### Structural assessment (mitigates severity)

CLAUDE.md does NOT `@`-import any rule file (confirmed: no `@~/.claude/rules`
lines). It references each rule by path with a one-line summary
(`CLAUDE.md:61` "All rules live in `~/.claude/rules/`:" + index). Rules are
read on demand, so the 62KB is **not** main-session resident via CLAUDE.md.
Agent "Required Rules" sections also reference-with-summary, not restate
(e.g. `backend-developer.md:53-67`). The architecture is therefore largely
aligned with just-in-time loading. The real residual cost is **content
duplicated across files**, which becomes always-on whenever any one copy
loads. Findings below target that duplication, not the file count itself.

### SYSTEMIC finding — commit-format duplication across 5 files

**Warning. Confidence: 90.** The commit-format spec is restated (not just
referenced) in 5 locations:
- `rules/commits.md:3-9` — canonical source (Conventional Commits, ≤80 lines,
  `<type>(<scope>): <description>` ≤72, lowercase, no period)
- `CLAUDE.md:57` — full restatement of subject format + ≤72/≤80 + lowercase/no period
- `rules/parallelism.md:62-63` — restates `type(scope): description ≤72 chars,
  lowercase, no period`
- `rules/autonomous-execution.md:156` — "One commit per completed task (not per
  file, not per batch)" (the per-task rule, also in pr-workflow)
- `rules/pr-workflow.md:43` — "One logical commit per task. See `commits.md`"
  (this one is correct: reference-only)

Correct form: `commits.md` is the single source of truth. CLAUDE.md:57 and
parallelism.md:62-63 should compress to a pointer (as pr-workflow.md:43 already
does) rather than re-spelling the ≤72/lowercase/no-period rule. CLAUDE.md
already says "See `~/.claude/rules/commits.md` for full spec" at the end of
line 57 — the preceding full restatement is the redundant part.
Fix: in CLAUDE.md:57 drop the inline subject spec, keep only the pointer; in
parallelism.md:62-63 replace the inline format with "per `commits.md`".

### Related duplication — blast-radius "data model → API → service deps → files"

**Suggestion. Confidence: 70.** The four-layer ordering is fully restated in
`rules/architecture.md:5-15` (canonical), `skills/plan-mission/SKILL.md:63-82`
(Phase 2, four labeled layers), and `skills/code-review/SKILL.md` (Agent 11 /
blast-radius). Agents reference it by summary (architect-reviewer.md:11,
code-reviewer.md:26 — correct). The skill restatements are arguably justified
because each skill is a self-contained execution context that may load without
architecture.md; this is a weaker case than commits. Fix (optional): in
plan-mission Phase 2, replace the prose re-derivation of the four layers with
"Work the four layers from `architecture.md` (data model → API contracts →
service deps → files)" and keep only the feature-specific questions.

### Aggregate-footprint note

**Note. Confidence: 60.** `prompting-quality.md:88` ("Scale-aware brevity")
and the broader file caps CLAUDE.md at 4KB but set **no aggregate cap** across
`rules/`. Two independent sources favor bounding the resident footprint. The
config bounds per-file size (Agent H's domain: post-compact ≤120 lines, rule
≤200 lines) but not the sum. Suggested inline comment for `prompting-quality.md`
near line 27:
```
// Per Anthropic context-engineering guidance + arxiv:2510.11588: cap the
// aggregate rules/ footprint, not just per-file size; dedup cross-file
// restatement (commit format, blast-radius layers) to one source each.
```

---

## Agent C's 5 aligned principles — confirmed with file:line evidence

1. **Just-in-time / reference-don't-restate.** Aligned.
   `CLAUDE.md:61` lists rules by path + one-line summary instead of inlining
   them; `backend-developer.md:53-67` "Required Rules" references each rule
   with a summary, not a copy.

2. **Instruction-bloat / context-budget cap.** Aligned.
   `prompting-quality.md:27-32` — "Keep them under 4KB… move project-specific
   rules to project-level CLAUDE.md." (CLAUDE.md measured 3,432 bytes — within cap.)

3. **Constraint budget ≤6 per section (MOSAIC / arxiv:2601.18554).** Aligned.
   `prompting-quality.md:55-66` — "Keep each section… to ≤6 hard prescriptive
   constraints… split into named sub-sections, each with ≤6 items."

4. **Register-shifting / verb strength (Tier 1 scan verbs).** Aligned.
   `prompting-quality.md:69-86` codifies it; applied in practice at
   `architect-reviewer.md:9` ("Critically analyse… Enumerate all…") and
   `code-reviewer.md:9` ("Enumerate all… Critically analyse…").

5. **Attention dilution with added context (arxiv:2509.21361).** Aligned.
   `prompting-quality.md:46-53` — "Cap file inventory at 20-30 files per agent;
   split larger inventories… Pass line ranges, not whole files." Reinforced in
   `plan-mission/SKILL.md:296-302` (scoped read-set references, line ranges).

---

## Standing check — scale-aware brevity (arxiv:2604.00025) on Opus-routed prompts

For each Opus-routed prompt: (1) explicit output-length/conciseness constraint?
(2) explicit output shape (schema/bullet/table) vs open-ended "report"/"explain"?
A prompt lacking BOTH = Warning.

### Sampled agents — all Sonnet-routed (check N/A)

backend-developer.md:5, api-designer.md:5, architect-reviewer.md:5,
code-reviewer.md:5, it-ops-orchestrator.md:5 — all `model: sonnet`. None route
to Opus, so the standing Warning does not apply. (Note: architect-reviewer and
code-reviewer still specify output shape — "findings with severity and specific
remediation" / "organized by severity… file location, specific issue, concrete
remediation" — good practice even on Sonnet.)

### plan-mission — Opus phases: PASS

Phases 3 & 5 route to Opus + adaptive thinking (`plan-mission/SKILL.md:403,405`)
and carry BOTH constraints explicitly (`:412-417`): "Return only the architecture
decisions. Format: numbered ADR list, one sentence each…" and "Return only the
task breakdown. Format: numbered task list…". Has length + shape. Aligned.

### code-review — Opus phases: none

Routes only to Sonnet (Step 2 reviewers) and Haiku (Steps 3-4 dedup/scoring) per
`code-review/SKILL.md:16-20`. No Opus phase. Check N/A. Output shape is tightly
specified throughout (severity sections, verdict table, task-file format).

### self-improve — Phase 3 conditionally Opus: WARNING

**Warning. Confidence: 75.** `self-improve/SKILL.md:791-793` routes Phase 3
synthesis to "Opus (adaptive thinking)… if there are >20 raw findings." The
Phase 3 instructions (`:616-649`) specify output **shape** well (numbered
steps, 0-100 scoring rubric, written to `.agent-notes/self-improve-phase3.md`)
but include **no explicit conciseness/length constraint** ("Return only the
deduplicated findings — no prose narration of the dedup process"). Per
arxiv:2604.00025 this is exactly the Opus over-elaboration case the config
flags elsewhere. Because output shape IS specified, this is a Warning, not a
miss of both criteria.
Fix: add to Phase 3 a line mirroring plan-mission's pattern, e.g. "When this
phase runs on Opus, return only the scored finding list in the Phase 4 report
shape — no narration of grouping/dedup reasoning."

Secondary (same file, lower priority): Agents A-H prompts inside self-improve
(Phase 1-2) are written for parallel subagents whose model is the inheriting
default; they specify output files and section headers (shape) but not length
bounds. Not flagged individually — Agent H's tightening audit owns aggregate
verbosity; raising here only as context for the Phase 3 fix.

---

## Summary of findings

| # | Severity | File:line | Issue | Conf |
|---|----------|-----------|-------|------|
| 1 | Warning | commits.md(src) vs CLAUDE.md:57, parallelism.md:62-63, autonomous-execution.md:156 | Commit-format spec restated in 5 files; collapse to pointers | 90 |
| 2 | Warning | self-improve/SKILL.md:791 + 616-649 | Conditionally-Opus Phase 3 lacks explicit brevity/length constraint (shape OK) | 75 |
| 3 | Suggestion | architecture.md:5-15 vs plan-mission:63-82, code-review Agent 11 | Blast-radius 4-layer ordering restated in skills | 70 |
| 4 | Note | prompting-quality.md (~line 27) | No aggregate cap on rules/ footprint; only per-file caps | 60 |

5 aligned principles all confirmed with concrete file:line evidence.
Sampled agents are Sonnet — standing Opus brevity Warning N/A for them;
plan-mission Opus phases PASS; self-improve Phase 3 is the one Opus-brevity gap.
