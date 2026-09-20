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
HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=./_hooklib.sh
source "$HOOKS_DIR/_hooklib.sh"

mkdir -p "$LOG_DIR" 2>/dev/null || exit 0

hook_read_payload
[[ -n "$HOOK_PAYLOAD" ]] || exit 0

hook_rotate_log "$LOG_FILE"
hook_append_jsonl "$EVENT" "$HOOK_PAYLOAD" "$LOG_FILE"

exit 0
