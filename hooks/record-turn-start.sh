#!/bin/bash
set -e
# Records the current timestamp when a user prompt is submitted.
# Read by notify-on-stop.sh to compute turn duration.
RUNTIME_DIR="$HOME/.claude/.runtime"
mkdir -p "$RUNTIME_DIR"
date +%s > "$RUNTIME_DIR/claude-turn-start"
