#!/bin/bash
set -euo pipefail
# run.sh — prepare code-review eval cases for a manual grading pass.
#
# This does NOT invoke Claude. It pairs each fixture with its expectations and
# prints the review command to run, because the assertion these evals make
# ("did the review name this defect, at this severity") is not something an
# exit code can answer. Grading is a read.
#
# Usage:
#   ./run.sh          all cases
#   ./run.sh 01       cases whose name contains "01"

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CASE_DIR="$EVAL_DIR/cases"
FILTER="${1:-}"

[[ -d "$CASE_DIR" ]] || { echo "ERROR: no cases/ directory at $CASE_DIR" >&2; exit 1; }

shopt -s nullglob
fixtures=("$CASE_DIR"/*.fixture.*)
shopt -u nullglob
(( ${#fixtures[@]} )) || { echo "ERROR: no fixtures found in $CASE_DIR" >&2; exit 1; }

matched=0
for fixture in "${fixtures[@]}"; do
    base="$(basename "$fixture")"
    stem="${base%%.fixture.*}"

    [[ -n "$FILTER" && "$stem" != *"$FILTER"* ]] && continue
    matched=$((matched + 1))

    expected="$CASE_DIR/$stem.expected.md"
    if [[ ! -f "$expected" ]]; then
        echo "ERROR: $base has no matching $stem.expected.md" >&2
        exit 1
    fi

    echo "═══════════════════════════════════════════════════════════════"
    echo "CASE: $stem"
    echo "═══════════════════════════════════════════════════════════════"
    echo
    echo "── Fixture: ${fixture#"$EVAL_DIR"/} ($(wc -l < "$fixture" | tr -d ' ') lines)"
    echo
    nl -ba "$fixture" | sed 's/^/  /'
    echo
    echo "── Expected findings:"
    echo
    sed 's/^/  /' "$expected"
    echo
    echo "── To grade:"
    echo "   1. Baseline, in a session WITHOUT the skill:"
    echo "        \"Review $fixture and report any defects.\""
    echo "   2. With skill, in a FRESH session:"
    echo "        /code-review $fixture"
    echo "   3. Score both against the expectations above."
    echo "      Separate sessions are required — a baseline taken after"
    echo "      reading the expectations measures nothing."
    echo
done

if (( matched == 0 )); then
    echo "No cases matched filter '$FILTER'." >&2
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "$matched case(s). Record HIT / MISS / DOWNGRADE / NOISE per"
echo "expectation in the baseline-vs-with-skill table in README.md."
