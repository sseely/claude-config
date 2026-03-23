#!/bin/bash
set -e
# Records the current timestamp when a user prompt is submitted.
# Read by notify-on-stop.sh to compute turn duration.
date +%s > /tmp/claude-turn-start
