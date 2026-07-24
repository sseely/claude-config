# Confidence Scoring Rubric

Reference for **Step 4 — Confidence scoring** in `skills/code-review/SKILL.md`.
Relocated here under S2 (progressive disclosure) — content unchanged, only
moved out of the top-level skill file. Give this rubric, the filtering
rules, and the classification criteria below to each Haiku scoring agent
verbatim.

## Scoring rubric

Give agents this scoring rubric verbatim:

- **0** — False positive that doesn't stand up to light scrutiny, or
  describes a pre-existing issue not introduced by the current change.
- **25** — Might be real, but unverified. Could be a false positive.
  If stylistic, not explicitly called out in CLAUDE.md.
- **50** — Verified as real, but a nitpick or low-frequency issue.
  Relatively unimportant compared to the rest of the change.
- **75** — Double-checked and very likely real. Will be hit in practice.
  Directly impacts functionality, or explicitly mentioned in CLAUDE.md.
- **100** — Confirmed real, happens frequently, evidence is direct.

Filtering rules after scoring:

Give scoring agents these numeric rules verbatim — do not paraphrase:

> - Score 0: drop (confirmed false positive)
> - Score 1–24: drop (weak signal, not worth tracking)
> - Score 25–49: classify as Note or Suggestion (do not drop; see criteria
>   below)
> - Score 50–74: keep but cap severity at Suggestion regardless of what
>   the reviewing agent assigned
> - Score 75–100: keep as-is; never drop regardless of severity

- **Positives** skip scoring — include all of them in the final report.

### Classifying below-50 findings: Note vs. Suggestion

**Suggestion** — the code could be improved but it is low-priority:
- Structural or stylistic improvement with no risk implication
- Refactoring opportunity (extract function, simplify logic)
- Pattern inconsistency that would improve readability or consistency
- Missing check unlikely to be hit under normal conditions

**Note** — a concern worth preserving as an inline code comment so
future readers are aware even if no change is warranted now:
- A latent risk that would surface only under specific conditions
- An assumption in the code that could break if circumstances change
- A concurrency hazard, ordering dependency, or shared-state concern
- An edge case the author likely did not consider
- A design trade-off with future maintenance implications

For each **Note** finding, draft the inline comment that *would* be
added if the human authorizes it. Write it to the task file (see
Final report); do **not** add it to source code during the review.

```
// Code review: <what was found>. Revisit if <triggering condition>.
```

Example:
```
// Code review: concurrent writes to this cache are not synchronized.
// Revisit if this handler is ever called from multiple goroutines.
```

### False positives to watch for

False positives to instruct scoring agents to watch for:

- Pre-existing issues not introduced by the current change
- Something that looks like a bug but is not actually a bug
- Pedantic nitpicks a senior engineer wouldn't raise
- Issues a linter, typechecker, or compiler will catch automatically —
  assume CI runs these separately; do not flag them
- General quality issues (lack of tests, poor docs) unless CLAUDE.md
  explicitly requires them
- Issues silenced in code via lint-ignore comments
- Changes in functionality that are likely intentional given the broader
  change context
- Real issues on lines not touched by the current change
