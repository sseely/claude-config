#!/bin/bash
# Chimes when Claude finishes, but only if the turn took longer than 30 seconds.
THRESHOLD=30
START_FILE=/tmp/claude-turn-start

if [[ -f "$START_FILE" ]]; then
    START=$(cat "$START_FILE")
    NOW=$(date +%s)
    ELAPSED=$((NOW - START))
else
    ELAPSED=$THRESHOLD  # no start time recorded, chime anyway
fi

if [[ $ELAPSED -ge $THRESHOLD ]]; then
    osascript -e 'display notification "Claude Code finished" with title "Claude Code" sound name "Glass"'
fi
