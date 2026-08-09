# Finding resolution — contradiction rubric, scoring, filtering

Reference for **Phase 3, step 3–5** in `skills/self-improve/SKILL.md`. Holds
the depth of how a finding survives or dies once Phase 3's three-step dedup
procedure (group → keep most specific → resolve contradictions) has grouped
it. The three-step procedure itself stays in `SKILL.md`; this file is what
"resolve contradictions" and "score and filter" mean in practice.

## Contradiction resolution — three tiers

Applies when a research-sourced finding (from Agent C or Agent G) conflicts
with an existing rule in `rules/`. Resolve genuine contradictions by
re-reading the source — do not use agent summaries as the arbiter.

- **High evidence + High applicability** → research overrides the rule.
  Include the specific rule change recommended.
- **Medium evidence + High applicability** (e.g., recent unreplicated
  preprints, ahead-of-consensus findings) → rule holds, but surface the
  finding as a Suggestion labeled `[frontier-lag]`. Include the existing
  rule text, the conflicting finding, and a one-sentence case for why it
  merits conscious re-evaluation rather than silent suppression. This makes
  the frontier-lag explicit and auditable.
- **Low evidence OR Low applicability** → rule wins, finding dropped.

**Document the reasoning in all three cases** — including the two where the
rule wins. A dropped or superseded finding with no recorded reasoning is
unauditable; the point of the `[frontier-lag]` tier specifically is that a
finding ahead of consensus gets consciously re-evaluated rather than
silently suppressed, and that guarantee only holds if the reasoning is
written down every time, not just when the finding survives.

## Scoring

Score each finding 0–100 using the shared rubric in
`skills/code-review/references/scoring-rubric.md` — see the "Scoring
rubric" heading for the 0/25/50/75/100 table, and the "Filtering rules"
text below it for the drop/classify/cap thresholds.

**Self-improve delta:** apply the rubric yourself. Unlike `/code-review`,
this skill does **not** spawn a separate Haiku scoring agent to run it —
Phase 3 scores its own findings inline. Do not add a scoring agent to this
phase; that would be a contract change, not a faithful application of the
shared rubric.

## Filtering thresholds

Apply the filtering rules from the same reference, after scoring:

- **0–24** → drop.
- **25–49** → classify as Note or Suggestion (do not drop).
- **50–74** → keep, but cap severity at Suggestion regardless of what the
  finding's source assigned.
- **75+** → keep as-is; never drop regardless of severity.

## Output

Write the deduplicated, scored, filtered findings to
`.agent-notes/self-improve-phase3.md`. Append `phase-3: done` to
`~/.claude/.self-improve-progress.md`.
