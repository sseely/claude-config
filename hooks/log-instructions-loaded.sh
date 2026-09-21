#!/bin/bash
set -uo pipefail
# Code review (2026-09-02): intentional -e omission so the hook never blocks. Revisit if this script gains a failure path that must be surfaced.
# log-instructions-loaded.sh — InstructionsLoaded hook.
#
# Appends one JSON line per event to logs/instructions-loaded.jsonl so that
# path-scoped rules (`paths:` frontmatter) can be proven to fire — and, just
# as importantly, proven NOT to fire on non-matching reads. A `paths:` glob
# that never matches does not error; the rule silently stops loading. This
# log is the only positive evidence either way.
#
# The payload arrives on stdin as JSON: session_id, cwd, hook_event_name,
# file_path, load_reason.
#
# on-call: if logs/instructions-loaded.jsonl stops growing while rules carry
# `paths:` frontmatter, treat the scoping as unverified — delete the
# frontmatter to restore unconditional loading rather than assuming it works.
# Runbook: plans/code-review-tasks-2026-08/batch-2b/T13-paths-pilot.md
#
# Never blocks. InstructionsLoaded ignores exit codes, but a hang would still
# stall the session, so every path here is bounded and failure is swallowed.

LOG_DIR="$HOME/.claude/logs"
LOG_FILE="$LOG_DIR/instructions-loaded.jsonl"
HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=./_hooklib.sh
source "$HOOKS_DIR/_hooklib.sh"

mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

# Read the payload with a timeout so a stuck writer cannot stall session work.
hook_read_payload
[[ -n "$HOOK_PAYLOAD" ]] || exit 0

# Stamp arrival time and append. Prefer python3 for valid JSON assembly; fall
# back to a raw append so an absent interpreter costs evidence, not the event.
hook_rotate_log "$LOG_FILE"
hook_append_jsonl "InstructionsLoaded" "$HOOK_PAYLOAD" "$LOG_FILE"

exit 0
