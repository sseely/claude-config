#!/bin/bash
set -e
# Chimes when Claude finishes, but only if the turn took longer than 30 seconds.
THRESHOLD=30
START_FILE=/tmp/claude-turn-start

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
    osascript -e 'display notification "Claude Code finished" with title "Claude Code" sound name "Glass"'
fi
