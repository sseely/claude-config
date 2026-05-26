#!/bin/bash
set -euo pipefail

echo "=== Session Start: $(date) ==="
echo "Working directory: $(pwd)"
echo ""
echo "Tool availability:"
for tool in git node python3 gh docker; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "  $tool: $(command -v "$tool")"
    else
        echo "  $tool: NOT FOUND"
    fi
done
