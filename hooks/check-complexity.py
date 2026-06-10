#!/usr/bin/env python3
"""
PostToolUse hook: check code complexity after Write/Edit/MultiEdit.
Fail-open: any exception exits 0 to never block writes due to hook bugs.
"""
import json
import os
import subprocess
import sys

HOOKS_DIR = os.path.dirname(os.path.abspath(__file__))
LIZARD_BIN = os.path.join(HOOKS_DIR, ".venv", "bin", "lizard")
SETUP_SCRIPT = os.path.join(HOOKS_DIR, "setup-complexity.sh")

SKIP_DIRS = frozenset([
    "node_modules", "__pycache__", ".git", "dist", "build", ".next",
    ".venv", "venv", "vendor", "target", "out", "obj",
    "tests", "test", "__tests__", "spec", "fixtures", "mocks",
])

CHECKABLE_EXTS = frozenset([
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".go", ".rs", ".java", ".cs",
    ".cpp", ".c", ".h", ".swift", ".kt", ".rb", ".php",
])

MAX_FILE_LINES = 500
MAX_FUNC_LINES = 30
MAX_CCN = 10
MAX_PARAMS = 5


def block(reason: str) -> None:
    print(json.dumps({"decision": "block", "reason": reason}))


def in_skip_dir(path: str) -> bool:
    parts = path.replace("\\", "/").split("/")
    return any(p in SKIP_DIRS for p in parts)


def lizard_available() -> bool:
    return os.path.isfile(LIZARD_BIN) and os.access(LIZARD_BIN, os.X_OK)


try:
    data = json.loads(sys.stdin.read())
    file_path = data.get("tool_input", {}).get("file_path", "")

    if not file_path or not os.path.isfile(file_path):
        sys.exit(0)

    # Skip files outside the current working directory (e.g. third-party repos)
    cwd = os.path.realpath(os.getcwd())
    if not os.path.realpath(file_path).startswith(cwd + os.sep):
        sys.exit(0)

    if os.path.splitext(file_path)[1].lower() not in CHECKABLE_EXTS:
        sys.exit(0)

    if in_skip_dir(file_path):
        sys.exit(0)

    # File-size check — no lizard required
    with open(file_path, encoding="utf-8", errors="ignore") as fh:
        file_line_count = sum(1 for _ in fh)
    if file_line_count > MAX_FILE_LINES:
        block(
            f"{os.path.basename(file_path)} has {file_line_count} lines "
            f"(max {MAX_FILE_LINES}). Split into smaller modules."
        )
        sys.exit(0)

    # Function-level checks via lizard
    if not lizard_available():
        block(
            "Complexity checking requires lizard, which is not installed.\n\n"
            f"Please ask the user for permission to run:\n  {SETUP_SCRIPT}\n\n"
            "This installs lizard into a local venv at ~/.claude/hooks/.venv "
            "and does not affect any project dependencies."
        )
        sys.exit(0)

    result = subprocess.run(
        [LIZARD_BIN, file_path,
         "-C", str(MAX_CCN),
         "-L", str(MAX_FUNC_LINES),
         "-a", str(MAX_PARAMS),
         "-w"],
        capture_output=True,
        text=True,
        timeout=15,
    )

    if result.returncode != 0:
        output = (result.stdout or result.stderr).strip()
        if output:
            block(
                f"Code complexity violations in {os.path.basename(file_path)}:\n\n"
                f"{output}\n\n"
                "Refactor before proceeding."
            )

except Exception:
    # Fail open — hook bugs must never block writes
    sys.exit(0)
