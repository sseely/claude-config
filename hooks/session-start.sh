#!/bin/bash
set -euo pipefail

echo "=== Session Start: $(date) ==="
echo "Working directory: $(pwd)"
echo ""
HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIZARD_BIN="$HOOKS_DIR/.venv/bin/lizard"

echo "Tool availability:"
for tool in git node python3 gh docker sg; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo "  $tool: $(command -v "$tool")"
    else
        echo "  $tool: NOT FOUND"
    fi
done
if [[ -x "$LIZARD_BIN" ]]; then
    echo "  lizard: $LIZARD_BIN"
else
    echo "  lizard: NOT FOUND (venv)"
fi

# Auto-install ast-grep if missing (opt-in: set CLAUDE_AUTO_INSTALL_TOOLS=true)
if ! command -v sg >/dev/null 2>&1; then
    if [[ "${CLAUDE_AUTO_INSTALL_TOOLS:-false}" == "true" ]]; then
        echo ""
        echo "Installing ast-grep (sg)..."
        if command -v brew >/dev/null 2>&1; then
            brew install ast-grep
        elif command -v apt-get >/dev/null 2>&1; then
            sudo apt-get install -y ast-grep
        else
            echo "  WARNING: cannot install ast-grep — no brew or apt-get found"
        fi
    else
        echo "  sg: NOT FOUND (set CLAUDE_AUTO_INSTALL_TOOLS=true to auto-install)"
    fi
fi

# Auto-setup lizard venv if missing
if [[ ! -x "$LIZARD_BIN" ]]; then
    echo ""
    echo "Setting up lizard complexity checker..."
    bash "$HOOKS_DIR/setup-complexity.sh"
fi
