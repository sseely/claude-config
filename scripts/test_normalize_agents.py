#!/usr/bin/env python3
"""Exercise scripts/normalize-agents.py against isolated fixture trees.

Follows hooks/test_guard_bash.py's shape: a main() printing PASS/FAIL per
case, sys.exit(1) on any failure, and a test_all() pytest entry point.

Every fixture lives under a throwaway tmp directory created per case —
this suite never reads or writes anything under the live agents/** tree.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT = REPO_ROOT / "scripts" / "normalize-agents.py"
VENV_PYTHON = REPO_ROOT / "hooks" / ".venv" / "bin" / "python"
PYTHON = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

FRONTMATTER = "---\nname: {name}\ndescription: test fixture.\n{extra}---\n"

DIAG_BULLET = "- `~/.claude/rules/diagnosis.md` — state the mechanism first"

F001_BODY = """
Some body text.

## Required Rules
- `~/.claude/rules/architecture.md` — blast radius, breaking-change taxonomy,
  rollback planning for releases
- `~/.claude/rules/retry-idempotency.md` — automated rollback triggers, retry
  policy for deployment steps
- `~/.claude/rules/observability.md` — deployment tracking, error rate,
  incident correlation
- `~/.claude/rules/security.md` — supply chain security, secret handling in
""" + DIAG_BULLET + """

Read the referenced rule file before relying on it — subagents do not auto-load rules/.
  pipelines

Read the referenced rule file before relying on it — subagents do not
auto-load rules/.
"""

F001_FIXED_BODY = """
Some body text.

## Required Rules
- `~/.claude/rules/architecture.md` — blast radius, breaking-change taxonomy,
  rollback planning for releases
- `~/.claude/rules/retry-idempotency.md` — automated rollback triggers, retry
  policy for deployment steps
- `~/.claude/rules/observability.md` — deployment tracking, error rate,
  incident correlation
- `~/.claude/rules/security.md` — supply chain security, secret handling in
  pipelines
""" + DIAG_BULLET + """

Read the referenced rule file before relying on it — subagents do not
auto-load rules/.
"""


def _write(root: Path, rel: str, text: str) -> Path:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    return path


def _run(root: Path) -> str:
    proc = subprocess.run(
        [PYTHON, str(SCRIPT), "--root", str(root)],
        capture_output=True, text=True, check=True,
    )
    return proc.stdout


def case_f001_splice_repair() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        path = _write(
            root, "agents/x/deployment-engineer.md",
            FRONTMATTER.format(name="deployment-engineer", extra="") + F001_BODY,
        )
        _run(root)
        got = path.read_text()
        fm = FRONTMATTER.format(name="deployment-engineer", extra="")
        want = fm + F001_FIXED_BODY
        closer_count = got.count("subagents do not")
        ok = got == want and closer_count == 1
        return ok, "" if ok else f"got:\n{got!r}\nwant:\n{want!r}"


def case_f002_mixed_tools() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        extra = "tools: Read, Write, Edit, Bash, webpack, vite, rollup\n"
        path = _write(
            root, "agents/x/build-engineer.md",
            FRONTMATTER.format(name="build-engineer", extra=extra) + "\nBody.\n",
        )
        _run(root)
        got = path.read_text()
        ok = (
            "tools: Read, Write, Edit, Bash\n" in got
            and "webpack" not in got
        )
        return ok, "" if ok else f"got:\n{got!r}"


def case_f002_safety_floor() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        extra = "tools: dotnet-cli, nuget, xunit, docker\n"
        fm = FRONTMATTER.format(name="dotnet-core-expert", extra=extra)
        original = fm + "\nBody.\n"
        path = _write(root, "agents/x/dotnet-core-expert.md", original)
        out = _run(root)
        got = path.read_text()
        ok = got == original and "dotnet-core-expert.md\tSKIPPED\t0" in out
        return ok, "" if ok else f"stdout:\n{out}\ngot:\n{got!r}"


def case_f085_output_style() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        extra = "model: opus\noutputStyle: Concise\n"
        path = _write(
            root, "agents/03-infrastructure/cloud-architect.md",
            FRONTMATTER.format(name="cloud-architect", extra=extra) + "\nBody.\n",
        )
        _run(root)
        got = path.read_text()
        ok = "outputStyle" not in got and "model: opus\n" in got
        return ok, "" if ok else f"got:\n{got!r}"


def case_f150_stray_sentence() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        body = (
            "\nSome checklist.\n\n"
            "For structural code pattern searches, use `ast-grep`, not Grep.\n\n"
            "## Required Rules\n- `~/.claude/rules/security.md` — x\n\n"
            "Read the referenced rule file before relying on it — subagents do not "
            "auto-load rules/.\n"
        )
        path = _write(
            root, "agents/05-data-ai/ai-engineer.md",
            FRONTMATTER.format(name="ai-engineer", extra="") + body,
        )
        _run(root)
        got = path.read_text()
        ok = "ast-grep" not in got
        return ok, "" if ok else f"got:\n{got!r}"


def case_f083_bare_diagnosis() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        body = (
            "\nBody.\n\n## Required Rules\n\n"
            "- `/Users/scottseely/.claude/rules/security.md`\n"
            "- `/Users/scottseely/.claude/rules/testing.md`\n"
            "- `diagnosis.md` — state the mechanism first\n\n"
            "Read the referenced rule file before relying on it — subagents do not "
            "auto-load rules/.\n"
        )
        path = _write(
            root, "agents/07-specialized-domains/blockchain-developer.md",
            FRONTMATTER.format(name="blockchain-developer", extra="") + body,
        )
        _run(root)
        got = path.read_text()
        full_path = "`/Users/scottseely/.claude/rules/diagnosis.md`"
        ok = full_path in got and "`diagnosis.md`" not in got
        return ok, "" if ok else f"got:\n{got!r}"


def case_f071_opus_compensation() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        extra = "model: opus\noutputStyle: Concise\n"
        fm = FRONTMATTER.format(name="graphql-architect", extra=extra)
        path = _write(
            root, "agents/01-core-development/graphql-architect.md",
            fm + "\nBody paragraph.\n",
        )
        _run(root)
        got = path.read_text()
        marker = "**Opus behavioral compensation**"
        ok = marker in got and got.index(marker) < got.index("Body paragraph.")
        return ok, "" if ok else f"got:\n{got!r}"


def case_idempotent_second_run() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write(
            root, "agents/x/deployment-engineer.md",
            FRONTMATTER.format(name="deployment-engineer", extra="") + F001_BODY,
        )
        extra = (
            "tools: Read, Write, Edit, Bash, webpack\n"
            "model: opus\noutputStyle: Concise\n"
        )
        _write(
            root, "agents/01-core-development/graphql-architect.md",
            FRONTMATTER.format(name="graphql-architect", extra=extra) + "\nBody.\n",
        )
        _run(root)
        second = _run(root)
        total_line = [ln for ln in second.splitlines() if ln.startswith("TOTAL")][0]
        changed = int(total_line.split("\t")[1])
        ok = changed == 0
        return ok, "" if ok else f"second run:\n{second}"


def case_already_correct() -> tuple[bool, str]:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        extra = "tools: Read, Grep, Glob, Bash\n"
        _write(
            root, "agents/x/clean-agent.md",
            FRONTMATTER.format(name="clean-agent", extra=extra) + "\nBody.\n",
        )
        out = _run(root)
        total_line = [ln for ln in out.splitlines() if ln.startswith("TOTAL")][0]
        changed, skipped = (int(x) for x in total_line.split("\t")[1:3])
        ok = changed == 0 and skipped == 0
        return ok, "" if ok else f"stdout:\n{out}"


CASES = [
    ("F001 splice repair", case_f001_splice_repair),
    ("F002 mixed real+fake tools", case_f002_mixed_tools),
    ("F002 safety-floor refusal", case_f002_safety_floor),
    ("F085 outputStyle removal", case_f085_output_style),
    ("F150 stray sentence removal", case_f150_stray_sentence),
    ("F083 bare diagnosis.md path", case_f083_bare_diagnosis),
    ("F071 Opus compensation block", case_f071_opus_compensation),
    ("idempotency (second run empty)", case_idempotent_second_run),
    ("already-correct file is a no-op", case_already_correct),
]


def main() -> None:
    failures = []
    for name, fn in CASES:
        ok, detail = fn()
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")
        if not ok:
            failures.append((name, detail))
    print()
    if failures:
        for name, detail in failures:
            print(f"FAILURE: {name}\n{detail}")
        sys.exit(1)
    print(f"all {len(CASES)} cases passed")


def test_all() -> None:
    """pytest entry point — runs the same main() used by direct execution."""
    try:
        main()
    except SystemExit as exc:
        assert exc.code in (None, 0), f"main() exited with code {exc.code}"


if __name__ == "__main__":
    main()
