# Fleet TEVV eval harness

Implements `docs/fleet/tevv.md`. Evaluates the top-5 agents from
`docs/fleet/risk-register.md` (decision FD-9): Explore, Plan,
ad-security-reviewer, angular-architect, api-designer.

- `run_evals.py` — the harness. Plain Python, stdlib only, no test
  framework. Invokes the `claude` CLI headlessly per case and grades
  `format`/`adherence` cases deterministically. `accuracy`/`refusal`
  cases record `outcome: "ungraded"` — no grader exists yet.
- `checks.py` — the deterministic checkers, one per case id.
- `cases/<agent>/<category>-<slug>.json` — one file per case, schema per
  `docs/fleet/tevv.md`.
- `results.jsonl` — append-only run history, one JSON object per line
  (decision FD-4: JSONL, git-committed, no database).

Run: `python3 evals/run_evals.py` (optionally `--agent <name>` to
restrict, repeatable).

## Honest limitation

This first run is a baseline, not a trend — `results.jsonl` has exactly
one run's worth of data per case as of this commit. MEASURE 4.3
(tracking change over time) reaches partially-addressed at best: the
interface (the JSONL schema) now exists and one data point has landed,
but "trend" requires multiple runs over time, which requires the cadence
described in `docs/fleet/tevv.md` (after `/self-improve`, and ad hoc) to
actually happen. MEASURE 4.2 (regression testing before deployment) now
has something to validate against — but validating it, i.e. wiring this
harness into a gate, is not performed here.
