# code-review evals

Test cases for the `/code-review` skill. Each case is a tiny fixture with
known defects plus the findings a correct review must surface.

This is the first eval harness in this repo and is meant to be copied. If you
are adding evals to another skill, take the structure from here.

## Why this exists

Anthropic's skill-creator guidance asks for two things: test cases, and a
baseline-vs-with-skill comparison. A skill without them can rot silently —
`/code-review`'s failure mode is a **missed** finding, which is invisible.
A clean report and a broken skill look identical from the outside. These
cases make the difference visible.

## Design constraints

This repo has **no test runner, no CI, and no package.json**, and evals must
not introduce one. So the harness is a shell script plus markdown
expectations, runnable by hand. Grading is done by reading — the assertion
is "did the review name this defect," which no exit code can answer.

## Layout

```
evals/
  README.md          you are here
  run.sh             prints each case and its expectations; no network, no deps
  cases/
    NN-name.fixture.<ext>   the code under review
    NN-name.expected.md     findings a correct review must surface
```

Fixture and expectation share the `NN-name` stem. `run.sh` pairs them by that
stem, so adding a case is two files and no registration step.

## Running

```bash
./run.sh              # list all cases with their expectations
./run.sh 01           # one case, by number or name fragment
```

`run.sh` does not invoke Claude — it prepares the material. The loop is:

1. `./run.sh 01` — read the fixture and what the review must catch.
2. In a session **without** the skill, ask for a review of the fixture file.
   Record what came back. This is the baseline.
3. In a fresh session, run `/code-review <fixture path>`.
4. Grade both against the `.expected.md` file.

Steps 2 and 3 must be separate sessions. A baseline taken after reading the
expectations, or in a context that already saw the skill, measures nothing.

## Grading

Each expectation carries a required severity and the substance of the
finding. Score per case:

| Outcome | Meaning |
|---------|---------|
| **HIT** | Finding surfaced, at the required severity or higher, naming the right line |
| **DOWNGRADE** | Correct finding, severity too low (a Critical reported as a Suggestion) |
| **MISS** | Not surfaced at all |
| **NOISE** | Reported defect that is not real |

A case passes when every `MUST` expectation is a HIT and there is no NOISE.
`SHOULD` expectations are tracked but do not fail the case.

Severity floors come from the skill's own scale — Critical (must fix before
merge), Warning (should fix), Suggestion (consider improving). A Critical
reported as a Suggestion is a DOWNGRADE, not a HIT: severity is what decides
whether a human acts before merging.

Assert on the specific defect, not on the review being non-empty. Per
`rules/testing.md`, "the review returned findings" is the assertion-quality
equivalent of `expect(res).toBeTruthy()` — it passes when the skill is
broken.

## Baseline vs. with-skill

Record results in a table like this. The number that matters is not the
with-skill column alone — it is the **delta**. A skill that finds what an
unassisted model already finds is not earning its context.

| Case | Dimension | Baseline | With skill |
|------|-----------|----------|------------|
| 01 | Correctness | | |
| 02 | Security | | |
| 03 | Dead code / style | | |

Fill in HIT/MISS/DOWNGRADE per cell. Re-run after any material change to
`SKILL.md` or `references/checklists.md`; a dimension that regresses to
baseline is the signal this harness exists to produce.

## Adding a case

1. Write the smallest fixture that exhibits the defect — a few dozen lines.
   Large fixtures make a MISS ambiguous: you cannot tell whether the skill
   failed to detect the bug or failed to reach the file.
2. Give it exactly one primary defect. Incidental style issues are fine as
   `SHOULD` expectations.
3. Write `.expected.md` with a `MUST`/`SHOULD` line per finding, each with a
   severity floor and the line number.
4. Make the defect real. A fixture whose "bug" is arguable produces arguments
   about the eval instead of the skill.

Cover a dimension that is not yet covered before adding a second case to one
that is.
