## Observation: test_check_frontmatter.py's F136 case races under concurrent quality-gate.sh
- **Context**: T8 acceptance criterion requires running
  `hooks/quality-gate.sh ~/.claude` twice concurrently (`&` + `wait`) and
  verifying `.agent-notes/fleet-signals.md` gets exactly one deduped row for
  today. That part passed on the new `mkdir`-lock-based `fleet_signals_gate`.
- **Finding**: `hooks/test_check_frontmatter.py`'s F136 case (line ~264,
  "missing-venv branch blocks citing PyYAML/setup-complexity.sh")
  temporarily renames `hooks/.venv` aside to `hooks/.venv.backup-missing`,
  runs a check, then renames it back. Two concurrent `quality-gate.sh`
  invocations both spawn a `hook-tests` gate; if one process's F136 subtest
  has `hooks/.venv` renamed away at the moment the other process tries to
  invoke `hooks/.venv/bin/python` (for its own `test_check_complexity.py`,
  `test_guard_bash.py`, or the `frontmatter_gate`'s venv python call), that
  second process spuriously fails. Reproduced: two sequential runs both
  passed F136; the concurrent run (`&`/`wait`) failed it in one of the two
  processes non-deterministically.
- **Impact**: this is a real race condition in shared test-suite state
  (`hooks/.venv` is a single shared directory), not a defect in T8's own
  changes. It only surfaces when `quality-gate.sh` is invoked concurrently
  against `~/.claude`, which was not previously exercised until T8's
  acceptance test required it. `hooks/test_check_frontmatter.py` is owned
  by T7 (already committed at ebc5f6b) and is outside T8's write-set, so
  T8 did not fix it — flagging here per boundaries ("stop and report it
  instead of editing").
- **Impact (fix direction)**: F136 should isolate its venv-rename under a
  lock (e.g. the same `mkdir`-lockdir pattern T8 added to
  `fleet_signals_gate`), or use a process-unique temp copy instead of
  renaming the shared `hooks/.venv` in place, before any task next touches
  that test file.
- **Confidence**: High — reproduced with two independent concurrent runs;
  both sequential (non-concurrent) runs of the same suite passed.
