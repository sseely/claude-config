# Confidence Scoring Rubric

Reference for **Step 4 — Confidence scoring** in `skills/code-review/SKILL.md`.
Relocated here under S2 (progressive disclosure). Give this rubric, the
filtering rules, the security floor, and the classification criteria
below to each Sonnet scoring agent verbatim, together with the run's
**scope kind** (`diff` or `files`) and the finding's originating agent.

## Scoring rubric

Give agents this scoring rubric verbatim:

- **0** — False positive that doesn't stand up to light scrutiny, or
  (in `diff` scope only, and never for security findings) describes a
  pre-existing issue not introduced by the current change.
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

### Security floor

Frequency is the wrong axis for security findings: an exploitable
condition is low-frequency in normal traffic almost by definition, and
`~/.claude/rules/pr-workflow.md` requires security vulnerabilities to be
fixed regardless of where they sit. So, for any finding from Agent 2
(Security) or that describes missing auth/authz, injection, SSRF, XSS,
secret exposure, or weak crypto:

> - If you verify the condition is reachable by an untrusted caller,
>   score **at least 75** — the 50 "low-frequency" tier does not apply.
> - Do **not** score it 0 for being pre-existing or on an untouched
>   line. Score it on its merits and note `pre-existing` in the
>   justification; the report keeps it, labelled pre-existing, instead
>   of dropping it.
> - Only score below 25 if you can state why the condition cannot occur
>   (the input is already validated upstream, the endpoint is
>   internal-only, and so on) — cite the file:line that proves it.

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

- Pre-existing issues not introduced by the current change — **`diff`
  scope only.** In `files` scope (full project, path, glob) nothing is
  "pre-existing"; every line is under review. Security findings are
  exempt in either scope (see the security floor).
- Something that looks like a bug but is not actually a bug
- Pedantic nitpicks a senior engineer wouldn't raise
- Lint-class issues hand-flagged by an agent *other than* Agent 3 —
  assume CI runs the linter. Agent 3's verbatim linter output is
  evidence, not a guess; keep it, grouped as one finding per tool.
- Generic quality complaints ("needs more tests", "docs are thin")
  with no specific target. Agent 6 findings that name a handler with
  zero tests, an untested security path, or a test that passes with the
  implementation deleted are specific — keep them.
- Issues silenced in code via lint-ignore comments
- Changes in functionality that are likely intentional given the broader
  change context
- Real issues on lines not touched by the current change — **`diff`
  scope only**, and never for security findings
