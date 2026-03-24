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

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

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
    else
        echo "  Result: FAIL"
        RESULTS="$(printf '%s\n| %s | FAIL |' "$RESULTS" "$name")"
        FAILED=$((FAILED + 1))
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
        if grep -q '"lint"' package.json 2>/dev/null; then
            run_gate "lint" "npm run lint"
        fi
        if grep -q '"test"' package.json 2>/dev/null; then
            run_gate "test" "npm run test"
        fi
        if grep -q '"typecheck"' package.json 2>/dev/null; then
            run_gate "typecheck" "npm run typecheck"
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
