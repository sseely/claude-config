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

MISSING_NAME_AGENT = """---
description: Agent fixture missing the required name field.
---

# fixture
"""

UNKNOWN_FIELD_AGENT = """---
name: test-fixture-agent-unknown-field
description: Agent fixture carrying an undeclared key.
bogus_field: nope
---

# fixture
"""

BAD_MODEL_AGENT = """---
name: test-fixture-agent-bad-model
description: Agent fixture with an invalid model value.
model: gpt-4-turbo
---

# fixture
"""

NO_DELIMITERS_AGENT = "# fixture with no YAML frontmatter block at all\n"

NESTED_SKILL_FD1 = """---
name: test-fixture-nested-skill-fd1
description: Nested (4-segment) skill incorrectly carrying an agent-only key.
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
    (
        "agent missing required 'name' field blocks",
        os.path.join(CLAUDE_DIR, "agents", ".frontmatter-test-missing-name.md"),
        MISSING_NAME_AGENT,
        True,
        ("missing required field 'name'",),
    ),
    (
        "agent with an undeclared key blocks",
        os.path.join(CLAUDE_DIR, "agents", ".frontmatter-test-unknown-field.md"),
        UNKNOWN_FIELD_AGENT,
        True,
        ("unknown/forbidden field 'bogus_field'",),
    ),
    (
        "agent with an invalid model value blocks",
        os.path.join(CLAUDE_DIR, "agents", ".frontmatter-test-bad-model.md"),
        BAD_MODEL_AGENT,
        True,
        ("field 'model' has invalid type/value",),
    ),
    (
        "agent .md with no '---' delimiters at all blocks",
        os.path.join(CLAUDE_DIR, "agents", ".frontmatter-test-no-delimiters.md"),
        NO_DELIMITERS_AGENT,
        True,
        ("no YAML frontmatter block found",),
    ),
    (
        "F035 regression: 4-segment nested skill path is validated, not bypassed",
        os.path.join(
            CLAUDE_DIR,
            "skills",
            ".frontmatter-test-nested",
            "subdir",
            "SKILL.md",
        ),
        NESTED_SKILL_FD1,
        True,
        ("FD-1", "tools"),
    ),
]

CLEANUP_DIRS = [
    os.path.join(CLAUDE_DIR, "skills", ".frontmatter-test-valid"),
    os.path.join(CLAUDE_DIR, "skills", ".frontmatter-test-fd1-skill"),
    os.path.join(CLAUDE_DIR, "skills", ".frontmatter-test-nested"),
    "/tmp/check-frontmatter-outside-project",
]

# F022: malformed-stdin fail-open cases. Raw stdin piped directly (no _run()
# file-write wrapper) — each must exit 0 with empty stdout.
MALFORMED_STDIN_CASES = [
    ("empty stdin", ""),
    ("truncated JSON", '{"tool_input":'),
    ("null file_path", '{"tool_input":{"file_path":null}}'),
    ("empty object", "{}"),
]


def run(
    file_path: str, content: str | None
) -> tuple[dict[str, object] | None, str, int]:
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


def run_raw_stdin(raw: str) -> tuple[str, str, int]:
    """F022: pipe `raw` directly to the hook's stdin (no file-write wrapper).

    Returns (stdout, stderr, returncode).
    """
    proc = subprocess.run(
        [sys.executable, HOOK], input=raw, capture_output=True, text=True,
    )
    return proc.stdout.strip(), proc.stderr.strip(), proc.returncode


def _run_hook_via_system_python(
    fixture_path: str,
) -> tuple[dict[str, object] | None, str, int]:
    """Invoke the hook via the literal `python3` command — exactly as
    settings.json's PostToolUse entry does — rather than `run()`'s
    `sys.executable`. When this test file itself runs under
    `hooks/.venv/bin/python` (the quality bar's invocation), `sys.executable`
    *is* the interpreter the missing-venv branch renames away.
    """
    os.makedirs(os.path.dirname(fixture_path), exist_ok=True)
    with open(fixture_path, "w", encoding="utf-8") as fh:
        fh.write(VALID_AGENT)
    proc = subprocess.run(
        ["python3", HOOK],
        input=json.dumps({"tool_input": {"file_path": fixture_path}}),
        capture_output=True, text=True,
    )
    out = proc.stdout.strip()
    result = json.loads(out) if out else None
    return result, proc.stderr.strip(), proc.returncode


def check_missing_venv() -> tuple[bool, str]:
    """F136 missing-venv branch: rename hooks/.venv aside, run a valid-agent
    fixture, and assert the block reason cites PyYAML and setup-complexity.sh.
    Restores hooks/.venv in `finally`, even if an assertion above fails.
    """
    venv_path = os.path.join(HOOKS_DIR, ".venv")
    backup_path = os.path.join(HOOKS_DIR, ".venv.testbak")
    fixture_path = os.path.join(
        CLAUDE_DIR, "agents", ".frontmatter-test-missing-venv.md"
    )
    ok = False
    detail = ""
    try:
        os.rename(venv_path, backup_path)
        result, err, code = _run_hook_via_system_python(fixture_path)
        reason = result.get("reason", "") if result else ""
        blocked = result is not None and result.get("decision") == "block"
        ok = blocked and "PyYAML" in reason and "setup-complexity.sh" in reason
        detail = f"result={result!r} err={err!r} code={code}"
    finally:
        try:
            os.remove(fixture_path)
        except FileNotFoundError:
            pass
        if os.path.isdir(backup_path):
            os.rename(backup_path, venv_path)
    return ok, detail


def cleanup() -> None:
    for _, path, content, _, _ in CASES:
        if content is not None:
            try:
                os.remove(path)
            except FileNotFoundError:
                pass
    for d in CLEANUP_DIRS:
        shutil.rmtree(d, ignore_errors=True)


def check_case(
    name: str,
    path: str,
    content: str | None,
    expect_block: bool,
    substrings: tuple[str, ...],
) -> tuple[bool, dict[str, object] | None, str, int]:
    result, err, code = run(path, content)
    blocked = result is not None and result.get("decision") == "block"
    if blocked != expect_block:
        return False, result, err, code
    if not expect_block:
        return (result is None and code == 0), result, err, code
    reason = result.get("reason", "")
    return all(s in reason for s in substrings), result, err, code


def _run_cases(failures: list[tuple[str, object, str, int | None]]) -> None:
    for name, path, content, expect_block, substrings in CASES:
        ok, result, err, code = check_case(
            name, path, content, expect_block, substrings
        )
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")
        if not ok:
            failures.append((name, result, err, code))


def _run_malformed_stdin_cases(
    failures: list[tuple[str, object, str, int | None]],
) -> None:
    for name, raw in MALFORMED_STDIN_CASES:
        out, err, code = run_raw_stdin(raw)
        ok = out == "" and code == 0
        print(f"  {'PASS' if ok else 'FAIL'}  F022 malformed stdin: {name}")
        if not ok:
            failures.append((f"F022 malformed stdin: {name}", out, err, code))


def main() -> None:
    failures: list[tuple[str, object, str, int | None]] = []
    total = len(CASES) + len(MALFORMED_STDIN_CASES) + 1
    try:
        _run_cases(failures)
        _run_malformed_stdin_cases(failures)

        venv_ok, venv_detail = check_missing_venv()
        label = "missing-venv branch blocks citing PyYAML/setup-complexity.sh"
        print(f"  {'PASS' if venv_ok else 'FAIL'}  F136 {label}")
        if not venv_ok:
            failures.append((f"F136 {label}", venv_detail, "", None))
    finally:
        cleanup()

    print()
    if failures:
        for name, result, err, code in failures:
            print(f"FAILURE: {name}: result={result!r} err={err!r} code={code}")
        sys.exit(1)
    print(f"all {total} cases passed")


def test_all() -> None:
    """pytest entry point — runs the same main() used by direct execution."""
    try:
        main()
    except SystemExit as exc:
        assert exc.code in (None, 0), f"main() exited with code {exc.code}"


if __name__ == "__main__":
    main()
