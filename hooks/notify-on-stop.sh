#!/bin/bash
set -euo pipefail
# Code review (2026-09-02): Stop and StopFailure are not distinguished. Revisit if a failed turn is mistaken for a completed one.
# Chimes when Claude finishes, but only if the turn took longer than 30 seconds.
HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_hooklib.sh
source "$HOOKS_DIR/_hooklib.sh"

# F212: record one structured row per Stop event (event, session id,
# timestamp) so on-call can see turn-end volume alongside deny/ask rows.
LOG_DIR="$HOME/.claude/logs"
LOG_FILE="$LOG_DIR/hook-events.jsonl"
mkdir -p "$LOG_DIR" 2>/dev/null || true
hook_read_payload
if [[ -n "$HOOK_PAYLOAD" ]]; then
    hook_rotate_log "$LOG_FILE"
    hook_append_jsonl "Stop" "$HOOK_PAYLOAD" "$LOG_FILE"
fi

THRESHOLD=30
START_FILE="$HOME/.claude/.runtime/claude-turn-start"

if [[ -f "$START_FILE" ]] && [[ -s "$START_FILE" ]]; then
    START=$(cat "$START_FILE")
    if [[ "$START" =~ ^[0-9]+$ ]]; then
        NOW=$(date +%s)
        ELAPSED=$((NOW - START))
    else
        ELAPSED=$THRESHOLD  # corrupt start file, chime anyway
    fi
else
    ELAPSED=$THRESHOLD  # no start time recorded, chime anyway
fi

if [[ $ELAPSED -ge $THRESHOLD ]]; then
    if [[ $ELAPSED -ge 60 ]]; then
        DURATION="$((ELAPSED / 60))m $((ELAPSED % 60))s"
    else
        DURATION="${ELAPSED}s"
    fi
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "display notification \"Claude Code finished (${DURATION})\" with title \"Claude Code\" sound name \"Glass\"" \
            || echo "notify-on-stop: osascript notification failed (exit $?)" >&2
    elif command -v notify-send &>/dev/null; then
        notify-send "Claude Code" "Claude Code finished (${DURATION})" \
            || echo "notify-on-stop: notify-send notification failed (exit $?)" >&2
    fi
fi
