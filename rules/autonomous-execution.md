# Autonomous Execution Protocol

A session is autonomous when a **mission brief** is active (a `plans/`
directory referenced in the initial prompt). If no brief is referenced,
these rules do not apply.

At mission start (and after every compaction), read
`docs/reference/autonomous-execution.md` in full — brief structure,
startup/compaction sequence, batch execution, quality gates,
STOP/PUSH-FORWARD rules, commit discipline, session-end steps.

Two distinct counters, do not conflate: the Quality Gates 2-fix cap
bounds attempts to fix *one specific failing gate check*; the
consecutive-fix stop rule (3+ edits) bounds repeated edits to *one code
location/approach* across the task.
