# Fleet Monitoring

This document names the metrics, gates, and note-taking mechanisms this repo
already has, and maps each to a MEASURE/MANAGE subcategory. It introduces no
new metrics — every claim below points at something that already exists
(rule, hook, gate, or file) or is explicitly labeled "unverified intention."

## MEASURE 1.2 — periodic reassessment of risk-relevant metrics

Two metrics are under active review:

- **Test coverage floor.** `rules/testing.md`, "Coverage — 90/90/90 rule":
  90% line, 90% branch, 90% function coverage, treated as a floor, not a
  ceiling.
- **Complexity limits.** `rules/code-principles.md`, "Complexity limits
  (hook-enforced)": file length ≤500 lines, function length ≤30 NLOC,
  cyclomatic complexity ≤10 CCN, ≤5 parameters. Enforced mechanically by
  `hooks/check-complexity.py`, a `PostToolUse` hook that blocks a `Write` or
  `Edit` outright when a threshold is exceeded — not a lint warning that can
  be ignored.

**How reassessment happens today:** manually, via `skills/self-improve`
audits. That skill's stated goal is to keep this repo "at distinguished-
engineer quality — not just functional, but current with the toolchain,
internally consistent, and continuously improving," run periodically (its
own description says "e.g., after major Anthropic releases"). It is
operator-triggered, not scheduled.

**Gap, stated as unverified intention:** MEASURE 1.2 calls for periodic,
scheduled reassessment. Nothing in this repo currently schedules a
self-improve run — no cron, no calendar hook, no reminder. "Periodic" today
means "whenever the operator decides to invoke it." Closing that gap (a
scheduled trigger) is an unverified intention, not a built mechanism.

## MEASURE 2.4 — post-deployment monitoring and drift

This repo has no deployment step in the conventional sense — there's no
release pipeline pushing agents/skills/rules to a runtime distinct from the
repo itself. "Drift" here means three concrete, checkable signals:

1. **Frontmatter parse rate.** Every `agents/**/*.md` and `skills/*/SKILL.md`
   frontmatter block must parse as YAML. The floor is 159/159 files; any
   file that fails to parse is drift.
2. **Inventory divergence.** A generated fleet inventory is checked against
   source via a `--check` regeneration gate, landing as
   `scripts/gen-fleet-inventory.py` (per decision FD-7). This gate does not
   exist yet — labeled here as unverified intention until that script lands.
3. **Rules budget.** The aggregate line count across `rules/*.md`
   (`cat rules/*.md | wc -l`) is capped at 2020 lines, currently sitting at
   2018 — two lines of headroom. Per decision AD-2, the answer to running out
   of room is a new file under `docs/`, not raising the cap.

## MEASURE 3.1 — risk tracking

Risk tracking will live in `docs/fleet/risk-register.md`. That file does not
exist yet as of this document; its contents (what gets scored, how, and
against what scale) are that file's job to define, not this one's.

## MANAGE 4.1 — near-miss capture, feedback on agent output, appeal path

**Near-miss capture today:** `.agent-notes/{task-id}.md`, per
`rules/memory.md`. Any agent that hits unexpected behavior, an undocumented
convention, a dependency quirk, or an error pattern writes a structured entry
(title, context, finding, impact, confidence) before finishing its task. This
is the closest thing this repo has to near-miss capture — it records
deviations and close calls without waiting for a full incident, and later
tasks are expected to read prior notes before starting similar work.

**Feedback on agent output:** the operator reading agent output and deciding
whether to accept, edit, or discard it — no separate feedback channel exists
beyond that review.

**Appeal path, stated honestly:** there isn't one, beyond the operator
revising a decision. This is a solo-operator repo with no reviewer distinct
from the person who wrote the instructions in the first place. Framing a
second look as a formal appeal mechanism would overstate what's here.

## MANAGE 4.3 — error tracking and communication

Errors surface in three places:

- **Quality-gate failures.** Mission briefs define gates as
  `command` / `pass` / `on_fail` triples (`on_fail` one of `retry`,
  `fix_and_rerun`, or `stop`); a failing gate is a tracked, named failure,
  not a silent one.
- **`.agent-notes/` entries.** Error patterns and their root causes are an
  explicit category in `rules/memory.md`'s list of what to record.
- **Commit history.** Conventional-commit types make corrections traceable
  as a class: a `fix:` or `revert:` commit records that something was wrong
  and what closed it, so the error and its remedy are linked in history
  rather than only in the diff.

No dedicated error-tracking system sits outside these three; this doc names
where errors already surface rather than proposing a new one.
