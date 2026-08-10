# Fleet monitoring and lifecycle drift

Agent B runs this each `/self-improve` execution, in addition to its
generic model/API-surface duties in
[phase1-research-agents.md](phase1-research-agents.md#agent-b--model-version-and-api-surface-changes).
Self-contained, readable without `SKILL.md` open, same bar as
[nist-refresh.md](nist-refresh.md).

## What Agent B additionally checks

Two local, read-only comparisons — no fetch, no URL, no addition to the
NIST-style fetch cap (this check has none; see "No new fetch budget" below):

1. **Model-deprecation drift.** Read `docs/fleet/lifecycle.md`'s "Model and
   API-surface monitoring (MANAGE 3.2)" section for its stated guidance on
   what counts as a deprecated model or alias. Compare that guidance against
   the pre-seeded alias table Agent B already carries
   (`phase1-research-agents.md:42-75`) and against the `model:` frontmatter
   field of every file under `agents/**/*.md`. A model or alias the guidance
   marks deprecated is drift if it still appears in any agent's `model:`
   field.
2. **Unmeasured monitoring signal.** Read `docs/fleet/monitoring.md`'s five
   sections (MEASURE 1.2, MEASURE 2.4, MEASURE 3.1, MANAGE 4.1, MANAGE 4.3)
   for the metrics, gates, and cadences each one names as already defined.
   For each named signal, check `.agent-notes/` for evidence it has actually
   been measured — a note, a gate result, a recorded value — within the last
   self-improve cycle (since the prior run's `.agent-notes/self-improve-
   phase1-B.md`, or since repo history began if this is the first run). A
   signal `monitoring.md` defines but that has no corresponding
   `.agent-notes/` evidence of measurement is drift. `monitoring.md` already
   labels several of its own gaps "unverified intention" (e.g. MEASURE 1.2's
   scheduled-trigger gap, MEASURE 3.1's not-yet-created risk register) —
   those are not new drift, they are pre-declared and out of scope for this
   check; only flag a signal `monitoring.md` presents as *already existing*
   that nonetheless has no measurement evidence.

## The two drift conditions

Each condition names its detection and the severity of the
`code-review-tasks.md` entry it produces, mirroring the drift-condition →
severity pattern in [nist-refresh.md](nist-refresh.md#the-three-drift-conditions):

1. **Deprecated model still referenced** — a model or alias
   `docs/fleet/lifecycle.md`'s MANAGE 3.2 guidance identifies as deprecated
   is still present in an agent's `model:` field. Detection: string compare
   between the deprecated set (lifecycle.md guidance ∩ Agent B's alias
   table) and every `agents/**/*.md` frontmatter `model:` value. Produces a
   **Must-fix** task: update the agent's `model:` field to a current alias
   or ID, per the routing table in `rules/parallelism.md`. Must-fix because
   a deprecated model reference can fail at dispatch time, not just read as
   stale.
2. **Monitoring signal unmeasured for >1 cycle** — a signal
   `docs/fleet/monitoring.md` presents as already-defined (not one it
   already labels "unverified intention") has no `.agent-notes/` evidence
   of measurement across two or more consecutive self-improve runs.
   Detection: absence in `.agent-notes/` for the signal's name or synonym
   across both the current and immediately prior cycle. Produces a
   **Should-fix** task: either produce the missing measurement or downgrade
   the section in `monitoring.md` to "unverified intention" so the doc
   stops overstating what's measured. Should-fix, not Must-fix — an
   unmeasured signal is a monitoring gap, not a broken reference.

## No new fetch budget

This check is read-only against local `docs/fleet/monitoring.md` and
`docs/fleet/lifecycle.md` plus a local `.agent-notes/` scan — no HTTP fetch,
no WebSearch. It does not count against Agent C's 3-URL-per-run NIST fetch
cap (`nist-refresh.md`) or Agent B's existing fetch-guard duties
(`phase1-research-agents.md:95-98`); those caps exist to bound *external*
network calls in a synchronization-barrier phase. Reading two files already
in the working tree adds no latency comparable to a fetch, so it is not
rationed the same way.

## Outputs

Both drift conditions fold into `.agent-notes/self-improve-phase1-B.md` —
the same file Agent B already writes
(`SKILL.md` Phase 1 completion note), not a new filename. AD-10 freezes
`.agent-notes/self-improve-phaseN-*` names; this check adds a section to
existing content, it never creates
`self-improve-phase1-fleet.md` or any other new output. From there,
findings flow through the normal Phase 3 dedup pass into
`code-review-tasks.md` at their stated severity, exactly like every other
Agent B finding — this check introduces no new phase, no new agent letter,
and no new report path.
