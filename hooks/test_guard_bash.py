#!/usr/bin/env python3
"""Exercise hooks/guard-bash.py against block/allow/ask/malformed cases."""
import json
import os
import subprocess
import sys

HOOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "guard-bash.py")

MUST_BLOCK = [
    "rm -rf /",
    "rm -rf /*",
    "rm -fr /",
    "rm -r --force /",
    "rm -rf ~",
    "rm -rf ~/",
    "rm -rf $HOME",
    "rm -rf ${HOME}",
    "rm -rf /usr",
    "rm -rf /etc/",
    "rm -rf /System",
    "rm -rf ~/*",
    "rm -rf /Users/scottseely",
    "rm -rf '/Users/scottseely'",
    "rm -Rf /var",
    "echo hi; rm -rf /",
    "cd /tmp && rm -rf /",
    "sudo apt install x",
    "sudo rm -rf /var",
    # F135: quoting/whitespace shapes not previously exercised.
    'rm -rf "$HOME"',
    "echo hi\nrm -rf /",
    "rm\t-rf\t/",
    # F012/D8: find and shell -c recursion.
    "find / -delete",
    r"find ~ -exec rm {} \;",
    'bash -c "rm -rf /"',
]

MUST_ALLOW = [
    "rm -rf /tmp/scratch",
    "rm -rf ./node_modules",
    "rm -rf ~/git/proj/dist",
    "rm -rf /Users/scottseely/.claude/cache",
    "rm -f /tmp/one.txt",
    "rm /tmp/x",
    "rm -rf build",
    "rm -rf dist target",
    "git status",
    "echo 'rm -rf /'",
    "grep -rn 'rm -rf /' .",
]

# D8: git clean -f*/--force and git reset --hard get a confirmation prompt,
# not a hard block.
MUST_ASK = [
    "git clean -fdx",
    "git reset --hard",
]

# F022: malformed/edge-case stdin must fail open — exit 0, no BLOCKED/ask.
MALFORMED_INPUTS = [
    "",
    '{"tool_input": {"command": "rm -rf /"',
    '{"tool_input":{"command":null}}',
    "{}",
]


def run(cmd: str) -> tuple[int, str, str]:
    """Return (exit_code, stdout, stderr) for one command string."""
    proc = subprocess.run(
        [sys.executable, HOOK],
        input=json.dumps({"tool_input": {"command": cmd}}),
        capture_output=True, text=True,
    )
    return proc.returncode, proc.stdout, proc.stderr.strip()


def run_raw(raw_input: str) -> tuple[int, str, str]:
    """Return (exit_code, stdout, stderr) for a raw, possibly malformed payload."""
    proc = subprocess.run(
        [sys.executable, HOOK],
        input=raw_input,
        capture_output=True, text=True,
    )
    return proc.returncode, proc.stdout, proc.stderr.strip()


def check_block(cmd: str, failures: list) -> None:
    """Assert `cmd` is hard-blocked (exit 2)."""
    code, _out, err = run(cmd)
    ok = code == 2
    print(f"  {'PASS' if ok else 'FAIL'}  block  {cmd!r:46} {err}")
    if not ok:
        failures.append(("expected block", cmd))


def check_allow(cmd: str, failures: list) -> None:
    """Assert `cmd` is allowed through (exit 0, no output)."""
    code, _out, err = run(cmd)
    ok = code == 0
    print(f"  {'PASS' if ok else 'FAIL'}  allow  {cmd!r:46} {err}")
    if not ok:
        failures.append(("expected allow", cmd))


def check_ask(cmd: str, failures: list) -> None:
    """Assert `cmd` gets a permissionDecision: ask JSON reply, exit 0."""
    code, out, err = run(cmd)
    decision = None
    try:
        hook_output = json.loads(out).get("hookSpecificOutput", {})
        decision = hook_output.get("permissionDecision")
    except Exception:
        pass
    ok = code == 0 and decision == "ask"
    print(f"  {'PASS' if ok else 'FAIL'}  ask    {cmd!r:46} {err or decision}")
    if not ok:
        failures.append(("expected ask", cmd))


def check_malformed(raw: str, failures: list) -> None:
    """Assert malformed stdin fails open: exit 0, no BLOCKED/ask output."""
    code, out, err = run_raw(raw)
    ok = code == 0 and "BLOCKED" not in err and not out.strip()
    label = raw[:40] or "<empty>"
    print(f"  {'PASS' if ok else 'FAIL'}  malformed {label!r:38} {err}")
    if not ok:
        failures.append(("expected fail-open", raw))


def main() -> None:
    failures: list = []
    for cmd in MUST_BLOCK:
        check_block(cmd, failures)
    print()
    for cmd in MUST_ALLOW:
        check_allow(cmd, failures)
    print()
    for cmd in MUST_ASK:
        check_ask(cmd, failures)
    print()
    for raw in MALFORMED_INPUTS:
        check_malformed(raw, failures)
    print()
    if failures:
        for kind, cmd in failures:
            print(f"FAILURE: {kind}: {cmd!r}")
        sys.exit(1)
    total = len(MUST_BLOCK) + len(MUST_ALLOW) + len(MUST_ASK) + len(MALFORMED_INPUTS)
    print(f"all {total} cases passed")


def test_all() -> None:
    """pytest entry point — runs the same main() used by direct execution."""
    try:
        main()
    except SystemExit as exc:
        assert exc.code in (None, 0), f"main() exited with code {exc.code}"


if __name__ == "__main__":
    main()
