#!/bin/bash
set -euo pipefail
# Records the current timestamp when a user prompt is submitted.
# Read by notify-on-stop.sh to compute turn duration.
mkdir -p ~/.claude/logs
# Fail-safe: setup errors must never block the user's prompt.
trap 'echo "[record-turn-start] error at line $LINENO — see ~/.claude/logs/record-turn-start.err" >> ~/.claude/logs/record-turn-start.err 2>/dev/null; exit 0' ERR
RUNTIME_DIR="$HOME/.claude/.runtime"
mkdir -p "$RUNTIME_DIR"
date +%s > "$RUNTIME_DIR/claude-turn-start"
