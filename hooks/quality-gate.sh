#!/bin/bash
set -euo pipefail
# quality-gate.sh — Run project-specific quality checks.
#
# Usage: ~/.claude/hooks/quality-gate.sh [project-dir]
#
# Looks for quality gate commands in this order:
# 1. .claude-quality-gates file in project root (one command per line)
# 2. Common patterns based on what exists in the project
#
# Exit code 0 = all gates passed, non-zero = at least one failed.
# Outputs a structured log to stdout.

# Resolved from this script's own location (not $PWD) so the ~/.claude
# fleet self-check gates below always target the real ~/.claude tree, even
# when this script is invoked against a different $PROJECT_DIR.
CLAUDE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

# Fail-closed: unexpected script errors count as gate failures, not silent passes.
trap 'echo "QUALITY GATE ERROR: unexpected script failure"; exit 1' ERR

GATES_FILE=".claude-quality-gates"
FAILED=0
TOTAL=0
RESULTS=""

run_gate() {
    local name="$1"
    local cmd="$2"
    TOTAL=$((TOTAL + 1))
    echo "--- Gate: $name ---"
    echo "  Command: $cmd"
    if bash -c "$cmd" 2>&1; then
        echo "  Result: PASS"
        RESULTS="$(printf '%s\n| %s | PASS |' "$RESULTS" "$name")"
        LAST_GATE_PASSED=1
    else
        echo "  Result: FAIL"
        RESULTS="$(printf '%s\n| %s | FAIL |' "$RESULTS" "$name")"
        FAILED=$((FAILED + 1))
        LAST_GATE_PASSED=0
    fi
    echo ""
}

# Strategy 1: explicit gates file
if [[ -f "$GATES_FILE" ]]; then
    echo "Using gates from $GATES_FILE"
    echo ""
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        [[ -z "$line" || "$line" =~ ^# ]] && continue
        # Line format: "name: command" or just "command"
        if [[ "$line" =~ ^([^:]+):(.+)$ ]]; then
            run_gate "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
        else
            run_gate "$line" "$line"
        fi
    done < "$GATES_FILE"
else
    # Strategy 2: auto-detect based on project files
    echo "No $GATES_FILE found, auto-detecting gates..."
    echo ""

    # Node.js projects
    if [[ -f "package.json" ]]; then
        # Detect package manager
        if [[ -f "pnpm-lock.yaml" ]]; then
            PM="pnpm"
        elif [[ -f "yarn.lock" ]]; then
            PM="yarn"
        else
            PM="npm"
        fi
        if grep -q '"lint"' package.json 2>/dev/null; then
            run_gate "lint" "$PM run lint"
        fi
        if grep -q '"test"' package.json 2>/dev/null; then
            run_gate "test" "$PM run test"
        fi
        if grep -q '"typecheck"' package.json 2>/dev/null; then
            run_gate "typecheck" "$PM run typecheck"
        fi
    fi

    # Python projects
    if [[ -f "pyproject.toml" || -f "setup.py" || -f "requirements.txt" ]]; then
        if command -v ruff &>/dev/null; then
            run_gate "ruff" "ruff check ."
        elif command -v flake8 &>/dev/null; then
            run_gate "flake8" "flake8 ."
        fi
        if command -v pytest &>/dev/null; then
            run_gate "pytest" "pytest"
        fi
        if command -v mypy &>/dev/null && [[ -f "pyproject.toml" ]]; then
            if grep -q '\[tool.mypy\]' pyproject.toml 2>/dev/null; then
                run_gate "mypy" "mypy ."
            fi
        fi
    fi

    # Go projects
    if [[ -f "go.mod" ]]; then
        run_gate "go-vet" "go vet ./..."
        run_gate "go-test" "go test ./..."
    fi

    # Rust projects
    if [[ -f "Cargo.toml" ]]; then
        run_gate "cargo-check" "cargo check"
        run_gate "cargo-test" "cargo test"
        run_gate "cargo-clippy" "cargo clippy -- -D warnings"
    fi

    # .NET projects
    if compgen -G "*.sln" >/dev/null 2>&1 || compgen -G "*.csproj" >/dev/null 2>&1; then
        run_gate "dotnet-build" "dotnet build --no-restore"
        run_gate "dotnet-test" "dotnet test --no-build"
    fi
fi

# ~/.claude fleet self-check gates.
# Anchored on this script's own location (not $PROJECT_DIR/cwd) so they
# always check the real ~/.claude tree, matching code-review-tasks.md's
# `[ "$(cat ~/.claude/rules/*.md | wc -l)" -le 2020 ]` check regardless of
# which project directory quality-gate.sh was invoked against.
if [[ -d "$CLAUDE_DIR/rules" ]]; then
    RULES_LINES="$(cat "$CLAUDE_DIR"/rules/*.md | wc -l | tr -d ' ')"
    export RULES_LINES CLAUDE_DIR
    run_gate "rules-line-cap" '[ "$(cat "$CLAUDE_DIR"/rules/*.md | wc -l)" -le 2020 ]'

    # Gate: every agents/**/*.md and skills/*/SKILL.md must pass
    # check-frontmatter.py (invoked exactly as the PostToolUse hook is).
    frontmatter_gate() {
        local total=0 fails=0 out file abs
        while IFS= read -r -d '' file; do
            total=$((total + 1))
            abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"
            out="$(printf '{"tool_name":"Edit","tool_input":{"file_path":"%s"}}' "$abs" \
                | "$CLAUDE_DIR/hooks/.venv/bin/python" "$CLAUDE_DIR/hooks/check-frontmatter.py")"
            if [[ -n "$out" ]]; then
                fails=$((fails + 1))
                echo "  BLOCK: $file"
                echo "    $out"
            fi
        done < <(
            find "$CLAUDE_DIR/agents" -type f -name '*.md' -print0
            find "$CLAUDE_DIR/skills" -mindepth 2 -maxdepth 2 -type f -name 'SKILL.md' -print0
        )
        echo "$((total - fails))/$total" > "$FRONTMATTER_TMP"
        echo "frontmatter: $((total - fails))/$total passed"
        [[ $fails -eq 0 ]]
    }
    FRONTMATTER_TMP="$(mktemp)"
    export FRONTMATTER_TMP
    export -f frontmatter_gate
    run_gate "frontmatter" "frontmatter_gate"
    FRONTMATTER_RESULT="$(cat "$FRONTMATTER_TMP" 2>/dev/null || echo "0/0")"
    rm -f "$FRONTMATTER_TMP"

    # Gate: the hook test suites, run directly, must both exit 0.
    run_gate "hook-tests" \
        "\"$CLAUDE_DIR/hooks/.venv/bin/python\" \"$CLAUDE_DIR/hooks/test_check_frontmatter.py\" && \"$CLAUDE_DIR/hooks/.venv/bin/python\" \"$CLAUDE_DIR/hooks/test_guard_bash.py\""
    HOOK_TESTS_PASSED=$LAST_GATE_PASSED

    # Gate: record today's fleet signals (rules budget, frontmatter parse
    # rate, hook-test status) so MEASURE 2.4 has a live value each run.
    fleet_signals_gate() {
        local fs_file="$CLAUDE_DIR/.agent-notes/fleet-signals.md"
        local hook_status="fail"
        [[ "$HOOK_TESTS_PASSED" == "1" ]] && hook_status="pass"
        mkdir -p "$CLAUDE_DIR/.agent-notes"
        if [[ ! -f "$fs_file" ]]; then
            {
                echo "| Date | Rules Lines | Frontmatter Pass/Total | Hook Tests Pass |"
                echo "|------|------------|------------------------|------------------|"
            } > "$fs_file"
        fi
        echo "| $(date +%Y-%m-%d) | $RULES_LINES | $FRONTMATTER_RESULT | $hook_status |" >> "$fs_file"
        echo "logged fleet signal to $fs_file"
    }
    export HOOK_TESTS_PASSED FRONTMATTER_RESULT
    export -f fleet_signals_gate
    run_gate "fleet-signals-log" "fleet_signals_gate"
fi

# Summary
echo "================================"
echo "Quality Gate Summary: $((TOTAL - FAILED))/$TOTAL passed"
if [[ -n "$RESULTS" ]]; then
    echo ""
    echo "| Gate | Result |"
    echo "|------|--------|"
    printf '%s\n' "$RESULTS"
fi
echo "================================"

if [[ $FAILED -gt 0 ]]; then
    echo "QUALITY GATES FAILED ($FAILED failures)"
    exit 1
else
    echo "ALL QUALITY GATES PASSED"
    exit 0
fi
