#!/usr/bin/env python3
"""Exercise hooks/guard-bash.py against block/allow cases."""
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


def run(cmd):
    """Return (exit_code, stderr) from the hook for one command string."""
    proc = subprocess.run(
        [sys.executable, HOOK],
        input=json.dumps({"tool_input": {"command": cmd}}),
        capture_output=True, text=True,
    )
    return proc.returncode, proc.stderr.strip()


def main():
    failures = []
    for cmd in MUST_BLOCK:
        code, err = run(cmd)
        ok = code == 2
        print(f"  {'PASS' if ok else 'FAIL'}  block  {cmd!r:46} {err}")
        if not ok:
            failures.append(("expected block", cmd))
    print()
    for cmd in MUST_ALLOW:
        code, err = run(cmd)
        ok = code == 0
        print(f"  {'PASS' if ok else 'FAIL'}  allow  {cmd!r:46} {err}")
        if not ok:
            failures.append(("expected allow", cmd))
    print()
    if failures:
        for kind, cmd in failures:
            print(f"FAILURE: {kind}: {cmd!r}")
        sys.exit(1)
    print(f"all {len(MUST_BLOCK) + len(MUST_ALLOW)} cases passed")


if __name__ == "__main__":
    main()
