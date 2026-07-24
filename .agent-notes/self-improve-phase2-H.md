# Self-Improve Phase 2 — Agent H: Tightening Audit
Generated 2026-07-24. Read-only audit of `~/.claude` for instruction bloat,
cross-file redundancy, and verbose prose. Scope: CLAUDE.md,
post-compact-context.md, all rules/*.md, 5 sampled agents, 3 sampled skills.

**Regression check against the prior Agent-H run found in this file:** the
prior run's file (CLAUDE.md at 3432B, `autonomous-execution.md` at 185
lines — both now different) flagged R1 ("After Every Compaction" in
`rules/autonomous-execution.md` near-verbatim repeating "Startup Sequence")
and R2 (commit format restated in `autonomous-execution.md`'s Commit
Discipline section). Both are confirmed fixed in the current file:
- `rules/autonomous-execution.md:43-47` now reads "Same as the Startup
  Sequence above, but re-read every file from disk..." (pointer, not a
  repeat) — R1 resolved.
- `rules/autonomous-execution.md:146-150` now reads "Commit message format:
  see `~/.claude/rules/commits.md`. The conventions below are the
  autonomous-specific additions to that spec." — R2 resolved for this file.
- R2 is only *partially* resolved elsewhere — see Redundancy #7 below,
  a small residual in `rules/parallelism.md:65-67`.

## Bloat

- **CLAUDE.md** — 3790B against the 4096B (4KB) cap in
  `rules/prompting-quality.md:27-29`. Headroom: **306 bytes (~7.5%)**
  remaining. Severity: Note. No violation — reporting headroom only, per
  task instructions not to manufacture one.
- **post-compact-context.md** — 30 lines against the 120-line ceiling.
  Severity: Note. No violation.
- **rules/*.md** — largest is `rules/autonomous-execution.md` at 179 lines,
  under the 200-line split-candidate threshold (next: `rules/parallelism.md`
  149, `rules/architecture.md` 129, `rules/prompting-quality.md` 125).
  Severity: Note. No violation.
- **agents sampled** — largest is `backend-developer.md` at 69 lines, far
  under the 300-line trim threshold. Severity: Note. No violation.

No Bloat findings require action this run.

## Redundancy

1. **[Suggestion]** `skills/self-improve/SKILL.md:646-654` (Phase 3, steps
   4-5: scoring rubric + filter table) duplicates
   `skills/code-review/SKILL.md:390-412` (Step 4 scoring rubric + filtering
   rules) instead of referencing it.
   - self-improve:648-652 — `**0**: False positive, pre-existing issue not
     worth surfacing` … `**100**: Confirmed, happens frequently, direct
     evidence`
   - code-review:392-400 — `**0** — False positive that doesn't stand up to
     light scrutiny, or describes a pre-existing issue not introduced by the
     current change.` … `**100** — Confirmed real, happens frequently,
     evidence is direct.`
   - The two rubrics have already drifted: code-review's version adds a
     CLAUDE.md-relevance clause at line 395 ("If stylistic, not explicitly
     called out in CLAUDE.md") that self-improve's copy lacks.
   - self-improve's own Agent G section already uses the correct pattern —
     `skills/self-improve/SKILL.md:489`: "Assign confidence 0–100 using the
     same rubric as `/code-review`." Phase 3 (same file) should follow that
     same pattern instead of re-deriving its own copy.
   - Cost: ~150 words (~200 tokens) duplicated once per full self-improve
     run (Phase 3 synthesis), plus ongoing drift risk on every edit to
     either rubric.
   - Fix: replace `skills/self-improve/SKILL.md:648-654` with: "Score each
     finding 0-100 using the same rubric and filtering rules as
     `/code-review` Step 4 (`skills/code-review/SKILL.md`)." Single source
     of truth: `skills/code-review/SKILL.md:390-412`.

2. **[Suggestion]** `skills/self-improve/SKILL.md:678` condenses the
   verdict logic from `skills/code-review/SKILL.md:482-486` and **loses
   precision** — a genuine ambiguity, not just duplicated tokens.
   - self-improve:677-679: `(APPROVE if Critical=0; NITS if Critical=0 and
     Warning<3; REQUEST CHANGES if Critical>0 or Warning≥3)`
   - code-review:482-486 (table): `APPROVE` → `Critical = 0 AND Warning =
     0`; `APPROVE WITH NITS` → `Critical = 0 AND Warning < 3`.
   - When Critical=0 and Warning=0, self-improve's prose satisfies *both*
     the APPROVE clause and the NITS clause (0 < 3) — the verdict is
     undefined at that boundary. code-review's table avoids this because
     APPROVE requires `Warning = 0` exactly, making the branches
     mutually exclusive.
   - Fix: replace `skills/self-improve/SKILL.md:678` with the same
     mutually-exclusive table form used in code-review, or state `NITS if
     Critical=0 and 1<=Warning<3` to close the gap.

3. **[Note]** `agents/01-core-development/backend-developer.md:25-31`
   ("Security Standards") restates content already covered by
   `rules/security.md`, which the same agent file already references at
   `backend-developer.md:66`.
   - backend-developer.md:26-29 — "Input validation at all system
     boundaries" / "Parameterized queries — no SQL interpolation" /
     "Authentication token management (JWTs, rotation)" / "Role-based
     access control (RBAC)"
   - rules/security.md:5-7, 39, 29-35 — same four items near-verbatim.
   - Lines 30-31 (encryption at rest/in transit, audit logging) are *not*
     covered by security.md — legitimate agent-specific additions, keep.
   - Cost: ~35 words duplicated in every backend-developer subagent
     context.
   - Fix: trim `backend-developer.md:26-29` to the two items security.md
     doesn't cover; let the Required Rules pointer at line 66 carry the
     rest.

4. **[Note]** `agents/01-core-development/backend-developer.md:10-16`
   ("API Design") partially duplicates `rules/api-design.md`, referenced
   at `backend-developer.md:59`.
   - backend-developer.md:13 — "API versioning strategy (`/v1/`, `/v2/`)"
     ↔ `rules/api-design.md:40-47`.
   - backend-developer.md:14 — "Rate limiting and pagination for list
     endpoints" ↔ `rules/api-design.md:49-52`.
   - backend-developer.md:15 — "Standardized error envelope: `{ error,
     message }`" ↔ `rules/api-design.md:32-35` — and these have drifted:
     api-design.md requires `{ "error": "short_code", "message": ... }`
     (with `short_code`); the agent's version omits it.
   - Fix: drop the versioning/pagination/error-envelope bullets from
     `backend-developer.md:13-15` (covered via the Required Rules pointer);
     correct or remove the drifted error-envelope example if kept.

5. **[Note]** `CLAUDE.md:34-36` mischaracterizes what
   `post-compact-context.md` restores, and is stale relative to the file's
   current content.
   - CLAUDE.md:34-36 — "A `PostCompact` hook injects
     `~/.claude/post-compact-context.md` for content that isn't in any
     instruction file: the autonomous execution recovery sequence."
   - `post-compact-context.md` has 4 sections: Autonomous Execution
     Recovery (6-16), Model Routing (17-19), Commit Format (21-24),
     Autonomous Restraint (26-30). CLAUDE.md names only the first.
   - "Content that isn't in any instruction file" is also inaccurate for 3
     of 4 sections: Model Routing condenses `rules/parallelism.md`'s Model
     Selection table, Commit Format condenses `rules/commits.md`, and
     Autonomous Restraint condenses `rules/autonomous-execution.md` +
     `rules/parallelism.md` — all in rules/ files, just not auto-loaded.
   - Fix: reword `CLAUDE.md:34-36` to: "A `PostCompact` hook injects
     `~/.claude/post-compact-context.md` — condensed restores of rules/
     content not auto-loaded after compaction (autonomous execution
     recovery, model routing, commit format, autonomous restraint)."

6. **[Note]** `post-compact-context.md:22` repeats a fragment already in
   `CLAUDE.md:57`, which auto-reloads verbatim after compaction per
   CLAUDE.md's own claim (`CLAUDE.md:30-32`).
   - CLAUDE.md:57 — "Conventional Commits, all lines ≤80 chars. Subject
     `<type>(<scope>): <desc>` ≤72 chars, lowercase, no period."
   - post-compact-context.md:22 — `` `type(scope): description` ≤72
     chars, lowercase, no period. ``
   - Only the Body-requirement and Types-list lines (23-24) are genuinely
     new relative to CLAUDE.md.
   - Cost: ~1 line / ~15 tokens per compaction event, compounding across a
     long autonomous session with many compactions.
   - Fix: trim `post-compact-context.md:21-24` to:
     ```
     ## Commit Format (restored)
     Body (blank-line separated) explains why; required for >3-file changes.
     Types: feat, fix, chore, refactor, test, docs, style, perf, ci.
     ```

7. **[Note]** `rules/parallelism.md:65-67` still carries a small residual
   of the commit-format duplication a prior Agent-H run flagged (see
   Regression check above; the `autonomous-execution.md` instances of this
   were fixed, this one was not).
   - parallelism.md:65-67 — "**Commit format** — One commit per completed
     task. Message format per `~/.claude/rules/commits.md`:
     `type(scope): description` ≤72 chars, lowercase, no period. Body
     explains why if >3 files change."
   - Already has the pointer ("per `~/.claude/rules/commits.md`") but then
     restates the format string anyway.
   - Fix: "Message format per `~/.claude/rules/commits.md`. One commit per
     completed task; body explains why if >3 files change." (drop the
     restated `type(scope): description ≤72 chars...` fragment).

## Verbose prose

No qualifying findings. Scanned all rules/*.md, CLAUDE.md,
post-compact-context.md, and the 5 sampled agents/3 sampled skills for
paragraphs of ≥4 sentences preceding a duplicate bullet list, "for
example" blocks illustrating an already-clear rule, and unnecessary
motivational rationale. The config is table/bullet-driven throughout.
Candidates considered and rejected:
- `plan-mission/SKILL.md:114-118` and `:191-205` — example blocks, but
  they demonstrate exact output *formatting* (blockquote/table syntax) not
  otherwise specified in the preceding bullets; removing them loses
  nuance. Not proposed.
- `code-review/SKILL.md:440-444` — inline-comment example; the template
  at line 437 is already fully specified, but savings (~20 words) are
  marginal and the one-shot example plausibly improves output calibration.
  Not proposed.
- `CLAUDE.md:49` ("Agents" section) — a single unstructured paragraph
  carrying ~8 distinct constraints (location, invocation, default/delegate
  threshold, auto-loaded descriptions, announce-before-invoking, Workflow
  scope, Workflow opt-in). This brushes against the constraint-budget rule
  in `rules/prompting-quality.md:69-81` (>6 parallel constraints per
  section risks "unpredictable compliance"), but no bullet rewrite
  achieves the required >50% word-count compression without dropping a
  constraint (best attempt: 95 words → ~50 words, ~47%). Per the task's
  compression bar, not proposed as a Verbose Prose finding — noted only as
  an observation for a future constraint-density pass, outside this
  agent's mandate.

This is a valid outcome: the config is already tight in this dimension.

## Dead content

1. **[Warning]** `rules/prompting-quality.md:52-55` — an open, unresolved
   `<!-- Code review (2026-07-01): ... -->` comment, 23 days old as of
   today (2026-07-24). Not present in the prior Agent-H run's file (which
   reported zero open review comments) — added since, and still
   unresolved:
   ```
   <!-- Code review (2026-07-01): `paths:`-scoped rule loading (load a
   domain rule only when matching files are open) would cut per-session
   token load, but is not yet confirmed as a Claude Code feature. Verify
   support against code.claude.com/docs/en/settings before adding `paths:`
   frontmatter to rules. -->
   ```
   No `paths:` frontmatter appears anywhere in the rules/ files read this
   run, confirming the comment's premise was never acted on.
   Fix: verify `paths:`-scoped rule loading against
   `code.claude.com/docs/en/settings` (Tier 1 source per
   `rules/research-sources.md`). If unsupported, delete the comment (dead
   speculation with no path to resolution). If supported, implement
   `paths:` scoping for the largest rule files and remove the comment.
   Requires a WebFetch step outside this read-only agent's scope — log to
   the task file for follow-up.

No other open code-review comments, stale TODO/REVISIT markers, dangling
tool/model references, or rules fully subsumed by a later, more specific
rule were found in the files read this run.

## post-compact calibration

`post-compact-context.md` is well calibrated overall (30/120 lines; no
section exceeds the 6-line flag threshold).

- **Autonomous Execution Recovery** (lines 6-16, 5 numbered steps, ~2
  lines/step) — restores `rules/autonomous-execution.md`'s Startup
  Sequence (`rules/autonomous-execution.md:32-47`) at reasonable
  compression (16 source lines → 10 restored lines). No finding —
  necessary since `rules/autonomous-execution.md` is not auto-loaded
  after compaction.
- **Model Routing** (lines 17-19, 2 content lines) — compresses
  `rules/parallelism.md`'s 74-line Model Selection table to 2 lines.
  Excellent compression, no finding.
- **Commit Format** (lines 21-24, 4 content lines) — see Redundancy
  finding #6: 1 of 4 lines duplicates content CLAUDE.md already
  auto-restores. Fix given there.
- **Autonomous Restraint** (lines 26-30, 4 content lines) — compresses
  two distinct rules (`rules/autonomous-execution.md:132-138` and
  `rules/parallelism.md:111-117`) into 2 lines each under one heading.
  No finding — under the 6-line cap, and the shared "restraint" framing
  is a reasonable merge.
- **CLAUDE.md's own description of this file** (`CLAUDE.md:34-36`) is
  stale relative to its actual 4-section content — see Redundancy #5.
- No adjacent sections warrant merging; the 4 sections cover distinct,
  non-overlapping concerns.

## Summary

Already-tightened configuration; a prior Agent-H pass's Warning-level
findings (autonomous-execution.md self-duplication) are confirmed fixed.
Remaining: 7 Redundancy items (2 Suggestion, 5 Note — one a genuine logic
ambiguity, not just token cost), 1 Warning (stale open code-review
comment), 0 Bloat violations, 0 qualifying Verbose Prose findings.
Highest-value fix: close the APPROVE/NITS ambiguity in
`skills/self-improve/SKILL.md:678` (Redundancy #2) — a correctness gap,
not just a token-cost issue.
