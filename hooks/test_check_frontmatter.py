#!/usr/bin/env python3
"""Exercise hooks/check-frontmatter.py against block/allow cases."""
import json
import os
import shutil
import subprocess
import sys

HOOKS_DIR = os.path.dirname(os.path.abspath(__file__))
CLAUDE_DIR = os.path.dirname(HOOKS_DIR)
HOOK = os.path.join(HOOKS_DIR, "check-frontmatter.py")

VALID_AGENT = """---
name: test-fixture-agent
description: Temporary fixture used by test_check_frontmatter.py.
model: sonnet
disallowedTools: Bash, WebFetch
---

# fixture
"""

VALID_SKILL = """---
name: test-fixture-skill
description: Temporary fixture used by test_check_frontmatter.py.
allowed-tools: Bash, Read
---

fixture
"""

BAD_YAML_AGENT = """---
name: [unterminated
description: broken
---

# fixture
"""

FD1_AGENT = """---
name: test-fixture-agent-fd1
description: Agent incorrectly carrying a skill-only key.
allowed-tools: Bash
---

# fixture
"""

FD1_SKILL = """---
name: test-fixture-skill-fd1
description: Skill incorrectly carrying an agent-only key.
tools: Bash
---

fixture
"""

# (name, path (abs), content or None, expect_block, reason substrings)
CASES = [
    (
        "valid agent passes silently",
        os.path.join(CLAUDE_DIR, "agents", ".frontmatter-test-valid.md"),
        VALID_AGENT,
        False,
        (),
    ),
    (
        "valid skill passes silently",
        os.path.join(
            CLAUDE_DIR, "skills", ".frontmatter-test-valid", "SKILL.md"
        ),
        VALID_SKILL,
        False,
        (),
    ),
    (
        "unparseable YAML blocks naming the parse error",
        os.path.join(CLAUDE_DIR, "agents", ".frontmatter-test-badyaml.md"),
        BAD_YAML_AGENT,
        True,
        ("unparseable", "YAML"),
    ),
    (
        "agent with allowed-tools blocks citing FD-1",
        os.path.join(CLAUDE_DIR, "agents", ".frontmatter-test-fd1.md"),
        FD1_AGENT,
        True,
        ("FD-1", "allowed-tools"),
    ),
    (
        "skill with tools blocks citing FD-1",
        os.path.join(
            CLAUDE_DIR, "skills", ".frontmatter-test-fd1-skill", "SKILL.md"
        ),
        FD1_SKILL,
        True,
        ("FD-1", "tools"),
    ),
    (
        "ordinary .ts path outside ~/.claude exits 0 with no output",
        "/tmp/check-frontmatter-outside.ts",
        "not markdown",
        False,
        (),
    ),
    (
        "path outside ~/.claude matching agents/*.md shape is ignored",
        "/tmp/check-frontmatter-outside-project/src/agents/foo.md",
        VALID_AGENT,
        False,
        (),
    ),
]

CLEANUP_DIRS = [
    os.path.join(CLAUDE_DIR, "skills", ".frontmatter-test-valid"),
    os.path.join(CLAUDE_DIR, "skills", ".frontmatter-test-fd1-skill"),
    "/tmp/check-frontmatter-outside-project",
]


def run(file_path, content):
    """Write `content` to file_path (if any), then invoke the hook on it.

    Returns (parsed_stdout_json_or_None, stderr, returncode).
    """
    if content is not None:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as fh:
            fh.write(content)
    proc = subprocess.run(
        [sys.executable, HOOK],
        input=json.dumps({"tool_input": {"file_path": file_path}}),
        capture_output=True, text=True,
    )
    out = proc.stdout.strip()
    parsed = json.loads(out) if out else None
    return parsed, proc.stderr.strip(), proc.returncode


def cleanup():
    for _, path, content, _, _ in CASES:
        if content is not None:
            try:
                os.remove(path)
            except FileNotFoundError:
                pass
    for d in CLEANUP_DIRS:
        shutil.rmtree(d, ignore_errors=True)


def check_case(name, path, content, expect_block, substrings):
    result, err, code = run(path, content)
    blocked = result is not None and result.get("decision") == "block"
    if blocked != expect_block:
        return False, result, err, code
    if not expect_block:
        return (result is None and code == 0), result, err, code
    reason = result.get("reason", "")
    return all(s in reason for s in substrings), result, err, code


def main():
    failures = []
    try:
        for name, path, content, expect_block, substrings in CASES:
            ok, result, err, code = check_case(
                name, path, content, expect_block, substrings
            )
            print(f"  {'PASS' if ok else 'FAIL'}  {name}")
            if not ok:
                failures.append((name, result, err, code))
    finally:
        cleanup()

    print()
    if failures:
        for name, result, err, code in failures:
            print(f"FAILURE: {name}: result={result!r} err={err!r} code={code}")
        sys.exit(1)
    print(f"all {len(CASES)} cases passed")


if __name__ == "__main__":
    main()
