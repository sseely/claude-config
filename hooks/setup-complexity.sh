#!/bin/bash
# Sets up the complexity-checker venv (lizard, PyYAML, pytest — pinned in
# requirements.txt) used by check-complexity.py.
#
# Usage:
#   setup-complexity.sh                    venv + pinned deps only (default)
#   setup-complexity.sh --with-shellcheck  also installs shellcheck via
#                                           Homebrew (`brew install
#                                           shellcheck`), for linting the
#                                           .sh hooks. Skipped with a message
#                                           if `brew` is not on PATH. Opt-in
#                                           only — never run automatically.
set -euo pipefail

WITH_SHELLCHECK=false
for arg in "$@"; do
    case "$arg" in
        --with-shellcheck)
            WITH_SHELLCHECK=true
            ;;
        *)
            echo "ERROR: unknown argument: $arg" >&2
            exit 1
            ;;
    esac
done

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

if [[ "$WITH_SHELLCHECK" == true ]]; then
    echo ""
    if command -v brew &>/dev/null; then
        echo "Installing shellcheck via Homebrew..."
        brew install shellcheck
    else
        echo "Skipping shellcheck install: brew not found on PATH."
    fi
fi
