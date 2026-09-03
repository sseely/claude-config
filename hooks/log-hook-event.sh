#!/bin/bash
set -uo pipefail
# log-hook-event.sh <event-name> — generic append-only hook logger.
#
# Usage in settings.json:
#   "PermissionDenied":   [{"hooks":[{"type":"command","command":"~/.claude/hooks/log-hook-event.sh PermissionDenied"}]}]
#   "PostToolUseFailure": [{"hooks":[{"type":"command","command":"~/.claude/hooks/log-hook-event.sh PostToolUseFailure"}]}]
#   "SubagentStop":       [{"hooks":[{"type":"command","command":"~/.claude/hooks/log-hook-event.sh SubagentStop"}]}]
#   "PostModelSwitch":    [{"hooks":[{"type":"command","command":"~/.claude/hooks/log-hook-event.sh PostModelSwitch"}]}]
#
# Appends one JSON line per event to logs/hook-events.jsonl, stamped with the
# event name and arrival time. Same fail-open shape as log-instructions-loaded.sh:
# never blocks, never exits non-zero, bounded stdin read. Exit code is ignored
# by every event this is meant for; a hang is the only way to hurt the session.
#
# on-call: if logs/hook-events.jsonl shows repeated PermissionDenied rows for
# one tool, the auto-mode classifier is fighting a rule — fix the rule, do not
# widen permissions. PostModelSwitch rows with reason "fallback" mean Fable's
# safety classifier rerouted the session to Opus 4.8 (see rules/model-routing.md).

EVENT="${1:-unknown}"
LOG_DIR="$HOME/.claude/logs"
LOG_FILE="$LOG_DIR/hook-events.jsonl"

mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

payload=""
if ! IFS= read -r -t 5 -d '' payload; then
    :
fi
[[ -n "$payload" ]] || exit 0

if command -v python3 >/dev/null 2>&1; then
    python3 -c '
import json, sys, datetime
event_name, raw, path = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    event = json.loads(raw)
    if not isinstance(event, dict):
        event = {"raw": raw}
except Exception:
    event = {"raw": raw}
event["event"] = event_name
event["logged_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
with open(path, "a", encoding="utf-8") as fh:
    fh.write(json.dumps(event, separators=(",", ":")) + "\n")
' "$EVENT" "$payload" "$LOG_FILE" 2>/dev/null || printf '{"event":"%s","raw":%s}\n' "$EVENT" "$payload" >> "$LOG_FILE" 2>/dev/null
else
    printf '%s\n' "$payload" >> "$LOG_FILE" 2>/dev/null
fi

exit 0
