#!/bin/bash
set -euo pipefail

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$HOOKS_DIR/.venv"
REQUIREMENTS="$HOOKS_DIR/requirements.txt"

echo "Setting up complexity checker..."
echo ""

if ! command -v python3 &>/dev/null; then
    echo "ERROR: python3 not found. Please install Python 3.8+." >&2
    exit 1
fi

echo "Python: $(python3 --version)"
echo "Venv:   $VENV_DIR"
echo ""

if [[ -d "$VENV_DIR" ]]; then
    echo "Venv exists — upgrading..."
else
    echo "Creating venv..."
    python3 -m venv "$VENV_DIR"
fi

echo "Installing from $REQUIREMENTS..."
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$REQUIREMENTS"

LIZARD_BIN="$VENV_DIR/bin/lizard"
if [[ ! -x "$LIZARD_BIN" ]]; then
    echo "ERROR: lizard binary not found at $LIZARD_BIN after install." >&2
    exit 1
fi

LIZARD_VERSION=$("$LIZARD_BIN" --version 2>&1 | head -1)
echo ""
echo "✓ Installed: $LIZARD_VERSION"
echo "✓ Binary:    $LIZARD_BIN"
echo ""
echo "Complexity checking is ready."
