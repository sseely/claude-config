# Self-Improve Phase 2 — Agent H (Tightening Audit)

Read-only audit of `~/.claude` for instruction bloat, cross-file redundancy,
verbose prose, dead content, and post-compact calibration. All findings have a
concrete fix. No files were modified.

## Size baseline (none breach hard limits)

| File | Measure | Limit | Status |
|------|---------|-------|--------|
| CLAUDE.md | 3432 bytes | 4KB | OK (568 B headroom) |
| post-compact-context.md | 24 lines | 120 | OK |
| autonomous-execution.md | 185 lines | 200 (split) | OK, near ceiling |
| architecture.md | 129 lines | 200 | OK |
| parallelism.md | 118 lines | 200 | OK |
| sampled agents | ≤67 lines | 300 (trim) | OK |

No hard size violations. All bloat findings below are about *redundant content*
and *compressible prose*, not raw file size.

---

## Bloat

**B1 — `rules/parallelism.md:32-71` Agent prompt structure (10 numbered items +
prose).** Severity: Note. The 0–9 numbered agent-prompt template is the single
source of truth and is correctly referenced by `plan-mission.md:178-179,286`, so
it is not redundant — but the section runs ~40 lines where the constraint budget
in `prompting-quality.md` caps prescriptive lists at ≤6. It is exempt as an
ordered procedure, so leave as-is. Concrete fix: none required; recorded so a
future run does not re-flag it as a budget violation.

**B2 — `rules/autonomous-execution.md` is at 185/200 lines and overlaps
post-compact + parallelism.** Severity: Suggestion. After applying R1 and R3
below (removing the duplicated compaction sequence and commit spec), the file
drops well under 160 lines with no split needed. Concrete fix: apply R1+R3;
no structural split required.

---

## Redundancy

**R1 — Compaction/startup recovery sequence triplicated.** Severity: Warning.
- `rules/autonomous-execution.md:32-41` (Startup Sequence, 6 steps)
- `rules/autonomous-execution.md:43-55` (After Every Compaction — steps 1-5 are
  a near-verbatim repeat of Startup steps 1-5, minus the announce step)
- `post-compact-context.md:6-15` (Autonomous Execution Recovery — same 5 steps
  again, third copy)

The "After Every Compaction" block inside autonomous-execution.md duplicates its
own "Startup Sequence" almost line-for-line, and post-compact-context.md carries
a third copy. Per-session cost: the post-compact copy is re-injected on *every*
compaction event (~10 lines each time). Single source of truth: keep
`post-compact-context.md:6-15` as the injected restore copy (that is its job),
and in `autonomous-execution.md` collapse "After Every Compaction" to a one-line
pointer. Concrete fix: replace `autonomous-execution.md:43-55` body with:
"After compaction, follow the recovery sequence in `post-compact-context.md`
(re-read README.md + decision-journal.md, check `[x]`/`[ ]`, resume). The brief
on disk is source of truth, not the summary." Saves ~10 lines, removes a
self-duplication.

**R2 — Commit format stated in full in 4 locations.** Severity: Warning.
- `rules/commits.md:1-37` — full spec (correct SoT)
- `CLAUDE.md` "Commit Messages" — already a pointer (`See rules/commits.md`) ✓
- `post-compact-context.md:21-24` — restored copy (subject/body/types) — keep,
  it is the post-compact restore
- `rules/parallelism.md:62-64` — restates "`type(scope): description` ≤72 chars,
  lowercase, no period. Body explains why if >3 files change"
- `rules/autonomous-execution.md:156-166` — Commit Discipline restates format +
  examples (`feat(T3): ...`, `fix(T3): ...`)

SoT: `rules/commits.md`. Concrete fix: in `parallelism.md:62-64` replace the
inline spec with "Message format per `commits.md`." (drop the duplicated rule
text, keep the one-commit-per-task constraint). In `autonomous-execution.md:156-166`
the task-ID examples are autonomous-specific and worth keeping, but the generic
"≤72 chars, lowercase" wording is redundant — trim to the task-ID-specific
guidance and reference commits.md for format. Per-session cost: low individually,
but four copies drift independently (maintenance hazard).

**R3 — Model routing table duplicated across 4 files.** Severity: Suggestion.
- `rules/parallelism.md:77-95` — full routing table (SoT, most detailed)
- `post-compact-context.md:17-19` — condensed restore (keep)
- `skills/plan-mission/SKILL.md:396-407` — per-phase routing table
- `CLAUDE.md` references the parallelism table ✓

The plan-mission table is phase-specific (adds value), and the post-compact copy
is a legitimate restore. No action required beyond noting that any change to the
Opus/Sonnet/Haiku role split must be propagated to all three. Concrete fix:
add a comment in `parallelism.md` marking it as the canonical table so editors
know to propagate. No deletion.

**R4 — `opusplan` alias defined in 3 places.** Severity: Note.
`rules/parallelism.md:91`, `skills/self-improve/SKILL.md:131`, and the model
table. Consistent, so harmless. Concrete fix: none; recorded for awareness.

---

## Verbose prose (compression >50%, no nuance lost)

**V1 — `rules/autonomous-execution.md:43-55`** (After Every Compaction).
Current: ~80 words of prose + 5 steps that repeat Startup Sequence. Rewrite
(<40 words): "After compaction, re-run the startup sequence above (steps 1-5):
re-read README.md and decision-journal.md from disk, check `[x]`/`[ ]`, resume
from the first incomplete task. The brief on disk is source of truth." Saves the
duplicate numbered list. (Pairs with R1.)

**V2 — `skills/plan-mission/SKILL.md:230-235`** (Phase 7 preamble).
Current (~55 words): "The brief is a **directory of focused documents**, not a
single monolithic file. This keeps each doc within a healthy context window and
avoids burying critical information deep in a long file." Rewrite (<25 words):
"The brief is a directory of focused docs, not one monolithic file — keeps each
doc within a healthy context window." Compression ~55%, rationale preserved.

**V3 — `rules/parallelism.md:1-6`** (Multi-agent justification).
Current (~60 words across opening + 3-item list + "Default to single-agent"
sentence). The "~15× cost" figure and the default-to-single-agent rule are the
load-bearing parts; the 3 numbered justification triggers restate what the
"Justify multi-agent when" sentence already says. Rewrite (<35 words):
"Multi-agent costs ~15× the tokens of single-agent dispatch. Default to
single-agent; split only for a demonstrated parallel bottleneck, required
domain/compliance isolation, or a needed cognitive boundary." Compression ~45%
— below the 50% bar, so Suggestion only, not a required rewrite.

**V4 — `rules/code-principles.md` "Build to the defined scope" intro** (lines
~3-12 of that section). The two-failure-modes framing is good and counterintuitive
(keep), but the closing restatement at the section end ("Two equal failure
modes: trimming a required item...and inventing an unrequested one") duplicates
the bullet content above it. Severity: Note. Concrete fix: the closing sentence
is a deliberate summary — keep; flagged only to confirm it is not accidental
duplication.

---

## Dead content

**None found.** Severity: N/A.
- No lingering `Fable` references in CLAUDE.md, rules/, post-compact, or the
  sampled agents/skills (deliberate removal confirmed clean via grep).
- No stale model names — `claude-opus-4-8` / `claude-sonnet-4-6` /
  `claude-haiku-4-5-20251001` are current; no `claude-3`/`gpt-4`/`opus-4-[0-7]`.
- No open `<!-- Code review: ... -->` comments (the matches in
  `self-improve/SKILL.md:575` and code-review/SKILL.md are template text in the
  audit instructions themselves, not actual stale review comments).
- No TODO/REVISIT/FIXME/TBD markers in CLAUDE.md, rules/, or post-compact.

---

## post-compact calibration

**P1 — `post-compact-context.md` is well-calibrated.** Severity: Note (positive).
All four sections (header, Autonomous Recovery, Model Routing, Commit Format) are
≤9 lines; the only one approaching the >6-line flag is Autonomous Recovery
(6-15 = 10 lines incl. the 5 numbered steps). It restores a genuine behavioral
rule (the disk-is-source-of-truth recovery) NOT present verbatim in CLAUDE.md —
CLAUDE.md only says "A PostCompact hook injects..." without the steps. Keep.

**P2 — `post-compact-context.md:6-15` slightly over the ≤4-line target.**
Severity: Suggestion. 10 lines incl. numbered steps. The steps are load-bearing
and CLAUDE.md does not carry them, so full removal would lose behavior. Concrete
fix (optional): compress the 5 steps to 2 lines: "Re-read README.md +
decision-journal.md from the brief dir (not the summary), check `[x]`/`[ ]`
markers and the current batch overview.md, resume from first incomplete task."
Drops ~4 lines per compaction injection while keeping every action.

**P3 — No section duplicates CLAUDE.md verbatim.** Severity: Note. Model Routing
(17-19) and Commit Format (21-24) restore content that CLAUDE.md only *points to*
(rules/parallelism.md, rules/commits.md) — those rule files are NOT auto-reloaded
into a compacted subagent context, so the restore is justified, not redundant.
Calibration is correct.

---

## Summary of concrete fixes (priority order)

1. (Warning) R1/V1 — collapse `autonomous-execution.md:43-55` to a pointer at
   `post-compact-context.md`; removes a self-duplicated compaction sequence.
2. (Warning) R2 — replace inline commit-format text in `parallelism.md:62-64`
   and trim generic format wording in `autonomous-execution.md:156-166`;
   reference `commits.md` as SoT.
3. (Suggestion) R3 — mark `parallelism.md` model table canonical; ensure
   plan-mission + post-compact stay in sync.
4. (Suggestion) V2 — compress `plan-mission.md:230-235` directory-rationale.
5. (Suggestion) P2 — optionally compress post-compact recovery steps to 2 lines.
