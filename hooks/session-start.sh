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
        # Pick whichever timeout wrapper this platform has (macOS ships
        # neither by default; Homebrew coreutils provides both names).
        # Fall back to running with no time limit if neither exists —
        # never fail this script just because timeout(1) is missing.
        if command -v timeout >/dev/null 2>&1; then
            TIMEOUT_BIN="timeout"
        elif command -v gtimeout >/dev/null 2>&1; then
            TIMEOUT_BIN="gtimeout"
        else
            TIMEOUT_BIN=""
            echo "  WARNING: no timeout/gtimeout found; installing with no time limit."
        fi
        run_with_timeout() {
            if [[ -n "$TIMEOUT_BIN" ]]; then
                "$TIMEOUT_BIN" 60 "$@"
            else
                "$@"
            fi
        }
        if command -v brew >/dev/null 2>&1; then
            if run_with_timeout brew install ast-grep; then
                :
            else
                install_status=$?
                if [[ -n "$TIMEOUT_BIN" && $install_status -eq 124 ]]; then
                    echo "  WARNING: ast-grep install timed out after 60s; continuing without it."
                else
                    echo "  WARNING: ast-grep install failed (exit $install_status); continuing without it."
                fi
            fi
        elif command -v cargo >/dev/null 2>&1; then
            if run_with_timeout cargo install ast-grep --locked; then
                :
            else
                install_status=$?
                if [[ -n "$TIMEOUT_BIN" && $install_status -eq 124 ]]; then
                    echo "  WARNING: ast-grep install timed out after 60s; continuing without it."
                else
                    echo "  WARNING: ast-grep install failed (exit $install_status); continuing without it."
                fi
            fi
        else
            echo "  WARNING: cannot auto-install ast-grep without sudo."
            echo "  Install manually: 'apt-get install ast-grep' (needs root),"
            echo "  'brew install ast-grep', or 'cargo install ast-grep --locked'."
        fi
    else
        echo "  sg: NOT FOUND (set CLAUDE_AUTO_INSTALL_TOOLS=true to auto-install)"
    fi
fi

# Auto-setup lizard venv if missing
if [[ ! -x "$LIZARD_BIN" ]]; then
    echo ""
    echo "Setting up lizard complexity checker..."
    trap 'echo "[session-start] error at line $LINENO — see ~/.claude/logs/session-start.err" >> ~/.claude/logs/session-start.err 2>/dev/null; exit 0' ERR
    bash "$HOOKS_DIR/setup-complexity.sh"
    trap - ERR
fi

# Privilege-elevation detector.
#
# on-call: a live settings.json byte-identical to settings.autonomous.json
# means this ordinary session is running with autonomous permissions. That
# state once persisted 8 days unnoticed, because the only signal was
# git-status noise. Mitigation: `hooks/autonomous-toggle.sh off .` in the
# project directory. Runbook: this comment.
#
# Deliberately cheap and non-fatal — `cmp` on two small files, every failure
# path swallowed. A broken session start is a worse outcome than a missed
# warning, so this must never block.
check_privilege_elevation() {
    local dir="${1:-.}"
    local live="$dir/.claude/settings.json"
    local auto="$dir/.claude/settings.autonomous.json"

    [[ -f "$live" && -f "$auto" ]] || return 0
    cmp -s "$live" "$auto" || return 0

    echo ""
    echo "  !!  WARNING: AUTONOMOUS PERMISSIONS ARE LIVE  !!"
    echo "  $live is byte-identical to the autonomous profile."
    echo "  This session has elevated permissions. To revert:"
    echo "      ~/.claude/hooks/autonomous-toggle.sh off $dir"
    echo ""
}
check_privilege_elevation "$(pwd)" 2>/dev/null || true
