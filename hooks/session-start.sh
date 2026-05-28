#!/bin/bash
set -euo pipefail

echo "=== Session Start: $(date) ==="
echo "Working directory: $(pwd)"
echo ""
echo "Tool availability:"
for tool in git node python3 gh docker sg; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "  $tool: $(command -v "$tool")"
    else
        echo "  $tool: NOT FOUND"
    fi
done

# Auto-install ast-grep if missing
if ! command -v sg >/dev/null 2>&1; then
    echo ""
    echo "Installing ast-grep (sg)..."
    if command -v brew >/dev/null 2>&1; then
        brew install ast-grep
    elif command -v apt-get >/dev/null 2>&1; then
        sudo apt-get install -y ast-grep
    else
        echo "  WARNING: cannot install ast-grep — no brew or apt-get found"
    fi
fi
