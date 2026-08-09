# Fleet TEVV

`rules/testing.md` governs the correctness of code an agent *produces* —
90/90/90 coverage, assertion quality, TDD. It says nothing about whether an
agent's own output — a written mission brief, a diagnosis, a refusal
decision, a summary — is itself correct. That gap is named three times in
`docs/nist-ai-rmf/crosswalk.md` (MAP 2.3, MEASURE 2.1, MEASURE 2.3): no
artifact defines test-and-evaluation (TEVV) for the agents' own decision
process. This document is that artifact. No eval harness exists today — 0
runs. This defines the approach; T11 builds it under `evals/` and runs it
against the risk register's top 5 (`docs/fleet/risk-register.md`): Explore,
Plan, ad-security-reviewer, angular-architect, api-designer.

## What is measured, and in what order

Four candidate categories exist. Two are implementable today with zero
grading infrastructure; two are not.

- **format** (output-format conformance) — deterministic. A case declares a
  schema or shape; the harness checks the output against it with a regex,
  parser, or schema validator. No judgment call involved.
- **adherence** (instruction adherence — did the agent honor an explicit
  constraint like "do not touch file X" or "respond in under 200 words")
  — mostly deterministic. Most adherence cases reduce to a checkable
  fact (file diff, word count, presence/absence of a string).
- **accuracy** (task-completion accuracy — is the *content* right) —
  judgment. Requires a grader, human or model, that can compare an
  open-ended output against a rubric. That grader does not exist yet.
- **refusal** (refusal / over-refusal correctness — did the agent decline
  when it should have, or proceed when it should have) — judgment for the
  same reason: "should have refused" is a rubric call, not a string match.

**T11 implements `format` and `adherence` first.** They're the two
categories where "pass" is a mechanical check against the case's
`pass_criterion`, so the harness ships with zero grading infrastructure and
zero false starts waiting on a grader design. `accuracy` and `refusal` cases
can be *written* now — the schema below supports them — but they will sit
ungraded until a grader (human-in-the-loop or model-graded) is built. Do not
report an `accuracy` or `refusal` pass rate as if it were measured; there is
no grader to have produced one.

## Case specification

One case file per case, not a single cases file. A monolithic file becomes
a merge-conflict and review bottleneck as cases accumulate across agents and
categories; one file per case makes `git diff` on a single case legible and
lets T11 (and later contributors) add a case without touching unrelated
ones. Layout: `evals/cases/<agent>/<category>-<slug>.json`, e.g.
`evals/cases/explore/format-json-summary.json`.

Case schema (JSON, one object per file):

```json
{
  "id": "explore-format-json-summary",
  "agent": "Explore",
  "category": "format",
  "input": "Summarize the auth module in src/auth/ as JSON.",
  "pass_criterion": "Output is valid JSON with keys 'files' (array of strings) and 'summary' (string); no other top-level keys.",
  "grading": "deterministic"
}
```

Field types and meanings:

- `id` (string, required) — unique across `evals/cases/`; convention is
  `<agent-lowercase>-<category>-<slug>`. The harness uses this to key
  results, so collisions are a hard error.
- `agent` (string, required) — must match an agent name as it appears in
  `docs/fleet/inventory.md` (case-sensitive).
- `category` (enum, required) — one of `accuracy`, `adherence`, `refusal`,
  `format`.
- `input` (string, required) — the literal prompt given to the agent for
  this case. No templating; if a case needs setup (files, prior state), a
  `setup` field is out of scope for this doc and belongs to T11's harness
  design.
- `pass_criterion` (string, required) — human-readable description of what
  a passing output looks like. For `deterministic` grading this must be
  precise enough that a script can implement it without asking a human what
  it means (T11's job is to translate this prose into the check, not to
  invent new criteria).
- `grading` (enum, required) — `deterministic` or `judgment`. Determines
  whether T11's harness can score this case today.

## Pass/fail criteria

Binary, not graded on a scale — a case passes or fails against its
`pass_criterion`. There is no partial credit; a case that's "almost right"
is a failing case with a note, not a 0.7.

- **`deterministic` grading** (covers `format`, most `adherence` cases): the
  harness runs a check function against the output and the `pass_criterion`
  — schema validation, regex match, file-diff inspection, word count. No
  human or model judgment enters the loop. Fully implementable now.
- **`judgment` grading** (covers `accuracy`, `refusal`, and any `adherence`
  case whose criterion can't reduce to a mechanical check): requires a
  grader — human review or a model-graded rubric pass. **Neither exists
  yet.** Cases marked `judgment` are specified but not scored until a
  grader is built; T11's harness must record them as `ungraded`, not as a
  pass or a fail, and must not silently drop them from the case set.

Results append to `evals/results.jsonl`, one JSON line per run
(id, agent, category, grading, verdict, timestamp) — plain-text and
git-diffable, readable with the stdlib on either end, no database. Results
are committed; the file is the run history.

## Cadence

At minimum: after every `/self-improve` cycle, and on demand (ad hoc, when
an agent's prompt changes). Both are operator-triggered — there is no
scheduler.

**Continuous or per-commit evaluation is not realistic today and must not
be described as current state.** The harness has zero runs as of this
document; per-commit implies a case set large enough and a runtime fast
enough to gate commits, and neither exists. Treat per-commit as a possible
future cadence once the case set and grader exist, not as a claim about
today.

## What this does not cover

**MEASURE 2.11 (fairness and bias) is not addressed by this document or by
the first harness.** Format and adherence checks verify shape and
constraint-following; they say nothing about whether an agent's output is
systematically skewed — in which agent gets recommended, in the content of
open-ended suggestions, or in any other dimension MEASURE 2.11 asks about.
That remains a real, open gap after T11 ships.
