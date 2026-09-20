#!/bin/bash
set -uo pipefail
# fm-check.sh FILE [FILE...] — CLI wrapper around hooks/check-frontmatter.py.
#
# hooks/check-frontmatter.py is a PostToolUse hook: it always exits 0, and
# signals a violation only by printing a {"decision":"block",...} line. No
# quality gate can branch on that directly. This wrapper feeds each given
# file through the hook using its normal stdin JSON form, prints every
# violation it reports, and exits 1 if any file was blocked. Every later
# batch's quality bar calls this script instead of invoking the hook
# directly.
#
# Usage: scripts/fm-check.sh FILE [FILE...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
HOOK="$CLAUDE_DIR/hooks/check-frontmatter.py"

if [ "$#" -eq 0 ]; then
    echo "usage: fm-check.sh FILE [FILE...]" >&2
    exit 1
fi

status=0
for f in "$@"; do
    if [ ! -f "$f" ]; then
        echo "fm-check.sh: no such file: $f" >&2
        status=1
        continue
    fi
    abs="$(realpath "$f")"
    out="$(printf '{"tool_input":{"file_path":"%s"}}' "$abs" | python3 "$HOOK")"
    if [ -n "$out" ]; then
        echo "$out"
        status=1
    fi
done

exit "$status"
