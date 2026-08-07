#!/bin/bash
set -uo pipefail
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

mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

# Read the payload with a timeout so a stuck writer cannot stall session work.
payload=""
if ! IFS= read -r -t 5 -d '' payload; then
    # -d '' returns non-zero at EOF even on success; keep whatever we got.
    :
fi
[[ -n "$payload" ]] || exit 0

# Stamp arrival time and append. Prefer python3 for valid JSON assembly; fall
# back to a raw append so an absent interpreter costs evidence, not the event.
if command -v python3 >/dev/null 2>&1; then
    python3 -c '
import json, sys, datetime
raw = sys.argv[1]
try:
    event = json.loads(raw)
    if not isinstance(event, dict):
        event = {"raw": raw}
except Exception:
    event = {"raw": raw}
event["logged_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
with open(sys.argv[2], "a", encoding="utf-8") as fh:
    fh.write(json.dumps(event, separators=(",", ":")) + "\n")
' "$payload" "$LOG_FILE" 2>/dev/null || printf '%s\n' "$payload" >> "$LOG_FILE" 2>/dev/null
else
    printf '%s\n' "$payload" >> "$LOG_FILE" 2>/dev/null
fi

exit 0
