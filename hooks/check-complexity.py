#!/usr/bin/env python3
"""
PostToolUse hook: check code complexity after Write/Edit.
Fail-open: any exception exits 0 to never block writes due to hook bugs.

POLICY (changed 2026-08-09): block on violations this edit INTRODUCED or
WORSENED, not on every violation present in the file.

The previous policy — fail if lizard reports anything at all in a touched
file — meant that one oversized legacy function froze the entire file against
every future edit, however small and however unrelated. Measured cost in a
single porting project over two days: four legitimate changes blocked
(a one-line import consolidation in `graph-layout.ts`; a two-line dispatch arm
in `index.ts`; a rule-compliance fix removing `Math.random()` from a render
path; and an entire planned mission whose write-set was three such files).

Lizard's own escape hatch does not cover this. `#lizard forgive` sets a flag on
the reader CONTEXT, and `end_of_function` clears it — so any nested closure
inside a large function consumes it before that function ends. Empirically:
the marker works on small functions and fails on exactly the large ones that
need it (swept across ten positions in a 136-NLOC/71-CCN function, plus the
function-scoped `#lizard forgives(nloc,cyclomatic_complexity)` form; none
suppressed it).

So the ratchet is now directional rather than absolute:

  - a NEW function over a limit            -> blocked
  - an existing function pushed FURTHER over -> blocked
  - an existing function left as-is or improved -> allowed
  - a file already over the line cap, not made longer -> allowed

Baseline is the file at git HEAD. Consequences worth knowing:
  - An untracked/new file has no baseline, so every violation counts as new.
    That is intended: new code meets the bar.
  - A renamed function reads as new. Conservative, and correct — a rename is
    an opportunity to bring it under the cap.
  - If git cannot produce a baseline (not a repo, file unknown to HEAD), the
    check falls back to the old strict behaviour rather than silently passing.
"""
import fnmatch
import json
import os
import re
import subprocess
import sys

HOOKS_DIR = os.path.dirname(os.path.abspath(__file__))
LIZARD_BIN = os.path.join(HOOKS_DIR, ".venv", "bin", "lizard")
SETUP_SCRIPT = os.path.join(HOOKS_DIR, "setup-complexity.sh")
# Roots/globs for vendored or reference code we port but do not own (the
# PlantUML fork, the graphviz C source, etc.). One path-prefix or glob per
# line; `~` and `$VARS` expand; `#` comments. Quality limits don't apply here.
IGNORE_FILE = os.path.join(HOOKS_DIR, "complexity-ignore")

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
# Gate on NLOC (lines of *code*) rather than lizard's raw `length` (line span).
# NLOC excludes the JSDoc/comment header, blank lines, and any inter-function
# comments or interfaces that lizard otherwise attributes to the preceding
# function's span — so documenting a function never pushes it over the limit.
MAX_FUNC_NLOC = 30
MAX_CCN = 10
MAX_PARAMS = 5

# `/path/file.ts:93: warning: name has 136 NLOC, 71 CCN, 1059 token, 3 PARAM, 183 length, 0 ND`
WARNING_RE = re.compile(
    r"^(?P<path>.+?):(?P<line>\d+): warning: (?P<name>.+?) has "
    r"(?P<nloc>\d+) NLOC, (?P<ccn>\d+) CCN, \d+ token, (?P<param>\d+) PARAM"
)
METRICS = ("nloc", "ccn", "param")


def block(reason: str) -> None:
    print(json.dumps({"decision": "block", "reason": reason}))


def in_skip_dir(path: str) -> bool:
    parts = path.replace("\\", "/").split("/")
    return any(p in SKIP_DIRS for p in parts)


def lizard_available() -> bool:
    return os.path.isfile(LIZARD_BIN) and os.access(LIZARD_BIN, os.X_OK)


def is_unowned(file_path: str) -> bool:
    """True if file_path is under a vendored/reference root listed in IGNORE_FILE."""
    try:
        with open(IGNORE_FILE, encoding="utf-8") as fh:
            lines = fh.readlines()
    except FileNotFoundError:
        return False
    target = os.path.realpath(file_path)
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        pat = os.path.realpath(os.path.expanduser(os.path.expandvars(line)))
        if target == pat or target.startswith(pat.rstrip("/") + os.sep) or fnmatch.fnmatch(target, pat):
            return True
    return False


def run_lizard(path: str):
    """(returncode, raw_output, {name: {metric: value}}) for one file."""
    result = subprocess.run(
        [LIZARD_BIN, path,
         "-T", f"nloc={MAX_FUNC_NLOC}",
         "-C", str(MAX_CCN),
         "-a", str(MAX_PARAMS),
         "-w"],
        capture_output=True,
        text=True,
        timeout=15,
    )
    output = (result.stdout or result.stderr or "").strip()
    found = {}
    for raw_line in output.splitlines():
        m = WARNING_RE.match(raw_line.strip())
        if not m:
            continue
        name = m.group("name")
        vals = {k: int(m.group(k)) for k in METRICS}
        prev = found.get(name)
        # Same name twice (overload / nested): keep the worst reading.
        if prev is None:
            found[name] = {"metrics": vals, "line": raw_line.strip()}
        else:
            for k in METRICS:
                prev["metrics"][k] = max(prev["metrics"][k], vals[k])
    return result.returncode, output, found


def head_baseline(file_path: str):
    """Violations in this file at git HEAD, or None if no baseline exists."""
    directory = os.path.dirname(os.path.abspath(file_path))
    try:
        top = subprocess.run(
            ["git", "-C", directory, "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, timeout=10,
        )
        if top.returncode != 0:
            return None
        root = top.stdout.strip()
        rel = os.path.relpath(os.path.abspath(file_path), root)
        show = subprocess.run(
            ["git", "-C", root, "show", f"HEAD:{rel}"],
            capture_output=True, text=True, timeout=10,
        )
        if show.returncode != 0:
            return None  # new/untracked file — everything in it is new
        ext = os.path.splitext(file_path)[1]
        tmp = os.path.join(
            HOOKS_DIR, f".baseline-{os.getpid()}{ext}"
        )
        try:
            with open(tmp, "w", encoding="utf-8") as fh:
                fh.write(show.stdout)
            _, _, found = run_lizard(tmp)
            return found
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)
    except Exception:
        return None


def head_line_count(file_path: str):
    directory = os.path.dirname(os.path.abspath(file_path))
    try:
        top = subprocess.run(
            ["git", "-C", directory, "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, timeout=10,
        )
        if top.returncode != 0:
            return None
        root = top.stdout.strip()
        rel = os.path.relpath(os.path.abspath(file_path), root)
        show = subprocess.run(
            ["git", "-C", root, "show", f"HEAD:{rel}"],
            capture_output=True, text=True, timeout=10,
        )
        if show.returncode != 0:
            return None
        return show.stdout.count("\n") + (0 if show.stdout.endswith("\n") else 1)
    except Exception:
        return None


try:
    data = json.loads(sys.stdin.read())
    file_path = data.get("tool_input", {}).get("file_path", "")

    if not file_path or not os.path.isfile(file_path):
        sys.exit(0)

    # Skip files outside the current working directory (e.g. third-party repos)
    cwd = os.path.realpath(os.getcwd())
    if not os.path.realpath(file_path).startswith(cwd + os.sep):
        sys.exit(0)

    # Skip vendored/reference code we port but do not own. Unlike the cwd check
    # above, this holds even when we cd into the vendored repo to work on it.
    if is_unowned(file_path):
        sys.exit(0)

    if os.path.splitext(file_path)[1].lower() not in CHECKABLE_EXTS:
        sys.exit(0)

    if in_skip_dir(file_path):
        sys.exit(0)

    # File-size check — no lizard required. Directional: an already-oversized
    # file may still be edited, as long as the edit does not make it longer.
    with open(file_path, encoding="utf-8", errors="ignore") as fh:
        file_line_count = sum(1 for _ in fh)
    if file_line_count > MAX_FILE_LINES:
        before = head_line_count(file_path)
        if before is None or file_line_count > before:
            grew = "" if before is None else f" (was {before})"
            block(
                f"{os.path.basename(file_path)} has {file_line_count} lines"
                f"{grew} (max {MAX_FILE_LINES}). Split into smaller modules."
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

    returncode, output, current = run_lizard(file_path)

    if returncode != 0 and output:
        baseline = head_baseline(file_path)

        if baseline is None:
            # No baseline to compare against (new file, or not a git repo):
            # fall back to the strict behaviour rather than pass silently.
            block(
                f"Code complexity violations in {os.path.basename(file_path)}:\n\n"
                f"{output}\n\n"
                "Refactor before proceeding."
            )
            sys.exit(0)

        introduced = []
        for name, info in current.items():
            was = baseline.get(name)
            if was is None:
                introduced.append((info["line"], "new function"))
                continue
            worse = [
                f"{k.upper()} {was['metrics'][k]} -> {info['metrics'][k]}"
                for k in METRICS
                if info["metrics"][k] > was["metrics"][k]
            ]
            if worse:
                introduced.append((info["line"], "worsened: " + ", ".join(worse)))

        if introduced:
            detail = "\n".join(f"{line}\n    ({why})" for line, why in introduced)
            carried = len(current) - len(introduced)
            note = (
                f"\n\n{carried} pre-existing violation(s) in this file are "
                "allowed through — only what this edit introduced or worsened "
                "is blocking."
            ) if carried else ""
            block(
                "Code complexity violations INTRODUCED in "
                f"{os.path.basename(file_path)}:\n\n{detail}{note}\n\n"
                "Refactor before proceeding."
            )

except Exception as exc:
    # Fail open — hook bugs must never block writes. Log why so a silent
    # bug doesn't go unnoticed forever.
    print(
        f"check-complexity.py: unhandled {type(exc).__name__}: {exc}",
        file=sys.stderr,
    )
    sys.exit(0)
