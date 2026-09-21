#!/usr/bin/env python3
"""Exercise scripts/check-references.py against F042/F060/F061 fixtures.

Fixtures are written directly under agents/ and rules-referencing paths
check-references.py's referencing_files()/discover_fleet() actually scan,
and removed in a `finally`, mirroring
hooks/test_check_frontmatter.py's cleanup pattern.
"""
import os
import re
import subprocess
import sys

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
CLAUDE_DIR = os.path.dirname(SCRIPTS_DIR)
SCRIPT = os.path.join(SCRIPTS_DIR, "check-references.py")

AGENT_FIXTURE_REL = "agents/zzz-test-check-references-fixture.md"
FORK_FIXTURE_REL = "agents/fork.md"

AGENT_FIXTURE = """---
name: zzz-test-check-references-fixture
description: Temporary fixture used by test_check_references.py.
---

# fixture

Uses `subagent_type: "fork"` and `subagent_type: "agent-team"` for
multi-agent work.

References a deleted hook: hooks/zzz-test-check-references-deleted.sh
An existing hook is fine: hooks/log-hook-event.sh

## Required Rules

- `made-up.md` — bare form of a nonexistent rule, must be flagged
- `rules/also-made-up.md` — full-path form of a nonexistent rule, flagged
- `security.md` — bare form of an existing rule, must NOT be flagged
- `rules/parallelism.md` — full-path form of an existing rule, not flagged

## Other Section

- `made-up.md` — outside Required Rules, must NOT be checked here
"""

FORK_FIXTURE = """---
name: fork
description: Temporary fixture used by test_check_references.py.
---

# fixture
"""


def run_scan() -> tuple[str, int]:
    proc = subprocess.run(
        [sys.executable, SCRIPT], cwd=CLAUDE_DIR,
        capture_output=True, text=True,
    )
    return proc.stdout, proc.returncode


def section_for(stdout: str, rel_path: str) -> str:
    """Return the finding lines printed under `rel_path:` in scan output."""
    pattern = re.compile(
        rf"^{re.escape(rel_path)}:\n((?:  line .*\n?)*)", re.MULTILINE
    )
    match = pattern.search(stdout)
    return match.group(1) if match else ""


def write_fixture(rel_path: str, content: str) -> None:
    full = os.path.join(CLAUDE_DIR, rel_path)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)


def cleanup() -> None:
    for rel_path in (AGENT_FIXTURE_REL, FORK_FIXTURE_REL):
        try:
            os.remove(os.path.join(CLAUDE_DIR, rel_path))
        except FileNotFoundError:
            pass


def check(label: str, condition: bool, failures: list[str]) -> None:
    if not condition:
        failures.append(label)


def _check_subagent_and_hook_findings(section: str, failures: list[str]) -> None:
    check(
        "subagent_type: fork not flagged (agents/fork.md exists)",
        "dangling subagent_type reference: 'fork'" not in section,
        failures,
    )
    check(
        "subagent_type: agent-team not flagged",
        "dangling subagent_type reference: 'agent-team'" not in section,
        failures,
    )
    check(
        "deleted .sh hook IS flagged",
        "dangling hook path reference: "
        "hooks/zzz-test-check-references-deleted.sh" in section,
        failures,
    )
    check(
        "existing .sh hook (log-hook-event.sh) NOT flagged",
        "hooks/log-hook-event.sh" not in section,
        failures,
    )


def _check_rule_name_findings(section: str, failures: list[str]) -> None:
    check(
        "bare made-up.md rule name IS flagged",
        "dangling rule reference: made-up.md" in section,
        failures,
    )
    check(
        "full-path also-made-up.md rule name IS flagged",
        "dangling rule reference: also-made-up.md" in section,
        failures,
    )
    check(
        "bare existing rule (security.md) NOT flagged",
        "dangling rule reference: security.md" not in section,
        failures,
    )
    check(
        "full-path existing rule (parallelism.md) NOT flagged",
        "dangling rule reference: parallelism.md" not in section,
        failures,
    )
    check(
        "bullet outside Required Rules section is not scanned",
        section.count("dangling rule reference: made-up.md") == 1,
        failures,
    )


def run_with_fork_backing_file(failures: list[str]) -> None:
    """F042/F060/F061: fixtures present, including a real agents/fork.md."""
    write_fixture(AGENT_FIXTURE_REL, AGENT_FIXTURE)
    write_fixture(FORK_FIXTURE_REL, FORK_FIXTURE)
    stdout, code = run_scan()
    check("script exits 0 with fixtures present", code == 0, failures)

    section = section_for(stdout, AGENT_FIXTURE_REL)
    _check_subagent_and_hook_findings(section, failures)
    _check_rule_name_findings(section, failures)


def run_without_fork_backing_file(failures: list[str]) -> None:
    """F042: 'fork' stays exempt even with no local agents/fork.md."""
    os.remove(os.path.join(CLAUDE_DIR, FORK_FIXTURE_REL))
    stdout, code = run_scan()
    check("script exits 0 with fork fixture removed", code == 0, failures)
    section = section_for(stdout, AGENT_FIXTURE_REL)
    check(
        "subagent_type: fork not flagged (no agents/fork.md)",
        "dangling subagent_type reference: 'fork'" not in section,
        failures,
    )


def run_live_repo_case(failures: list[str]) -> None:
    """Acceptance: the live repo's two known F042 false positives are gone."""
    stdout, code = run_scan()
    check("live-repo scan exits 0", code == 0, failures)
    check(
        "no dangling agent-team subagent_type in live repo",
        "dangling subagent_type reference: 'agent-team'" not in stdout,
        failures,
    )
    check(
        "no dangling fork subagent_type in live repo",
        "dangling subagent_type reference: 'fork'" not in stdout,
        failures,
    )


def main() -> int:
    failures: list[str] = []
    try:
        run_with_fork_backing_file(failures)
        run_without_fork_backing_file(failures)
    finally:
        cleanup()
    run_live_repo_case(failures)

    if failures:
        print(f"FAILED ({len(failures)}):")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("All check-references.py tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
