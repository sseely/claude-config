#!/usr/bin/env python3
"""Exercise hooks/check-complexity.py against block/allow/fail-open cases.

Mirrors hooks/test_guard_bash.py's PASS/FAIL-per-case main() + test_all()
pytest-entry shape. Covers F021's required cases (new-function-over-limit
blocks, unchanged/worsened pre-existing violations, complexity-ignore
exemption, lizard-missing fail-open, malformed stdin) plus F194's untested
risk paths (SKIP_DIRS is directory-segment-only, is_unowned's three path
strategies, an NLOC cross-check against a hand-counted fixture) and D6's
dual output contract / F093's deny-logging.
"""
import contextlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from collections.abc import Iterator
from pathlib import Path

HOOKS_DIR = os.path.dirname(os.path.abspath(__file__))
HOOK = os.path.join(HOOKS_DIR, "check-complexity.py")
HOOKLIB = os.path.join(HOOKS_DIR, "_hooklib.py")
REAL_LIZARD = os.path.join(HOOKS_DIR, ".venv", "bin", "lizard")
LOG_FILE = os.path.join(os.path.dirname(HOOKS_DIR), "logs", "hook-events.jsonl")

# Real hooks/complexity-ignore entries used to exercise is_unowned()'s exact
# and prefix strategies against actual filesystem paths (F194) — no entry in
# the real file currently contains a glob wildcard, so the glob strategy is
# exercised separately against a synthetic copy (see check_ignore_glob_match).
IGNORE_EXACT_MATCH = os.path.expanduser(
    "~/git/knowvah/plantuml-ts/src/core/math/AsciiMath.ts"
)
IGNORE_PREFIX_MATCH = os.path.expanduser("~/git/plantuml/LICENSE")
IGNORE_CWD = os.path.expanduser("~/git")

Failures = list[tuple[str, str]]


def run_hook(
    payload: str, cwd: str, hook_path: str = HOOK
) -> tuple[int, str, str]:
    """Invoke a check-complexity.py copy with `payload` on stdin from `cwd`."""
    proc = subprocess.run(
        [sys.executable, hook_path],
        input=payload,
        capture_output=True,
        text=True,
        cwd=cwd,
    )
    return proc.returncode, proc.stdout, proc.stderr.strip()


def hook_input(file_path: str) -> str:
    return json.dumps({"tool_input": {"file_path": file_path}})


@contextlib.contextmanager
def real_tempdir() -> Iterator[str]:
    """A temp dir with symlinks resolved (macOS: /tmp, /var are symlinks).

    head_baseline() computes `git rev-parse --show-toplevel` (which git
    resolves to the real path) against `os.path.abspath(file_path)` (which
    it does not resolve) — on an unresolved macOS temp path the two
    disagree and relpath() produces a path git can't find at HEAD, so every
    fixture would misreport as "no baseline" regardless of what's actually
    committed. Real-pathing the root once here keeps that pre-existing
    quirk out of the unchanged/worsened test fixtures without touching
    hook behavior.
    """
    with tempfile.TemporaryDirectory() as tmp:
        yield os.path.realpath(tmp)


def big_function_src(name: str, statements: int) -> str:
    """A function with `statements` body lines — well over the 30 NLOC cap."""
    body = "\n".join(f"    v{i} = {i}" for i in range(statements))
    return f"def {name}(a):\n{body}\n    return a\n"


def init_git_repo(root: str) -> None:
    """Initialize a throwaway git repo so head_baseline() has a HEAD to diff."""
    subprocess.run(["git", "init", "-q"], cwd=root, check=True)
    subprocess.run(
        ["git", "config", "user.email", "t@example.com"], cwd=root, check=True
    )
    subprocess.run(["git", "config", "user.name", "T"], cwd=root, check=True)


def commit_all(root: str, message: str) -> None:
    subprocess.run(["git", "add", "-A"], cwd=root, check=True)
    subprocess.run(["git", "commit", "-q", "-m", message], cwd=root, check=True)


def report(ok: bool, label: str, failures: Failures, detail: str = "") -> None:
    print(f"  {'PASS' if ok else 'FAIL'}  {label:44} {detail}")
    if not ok:
        failures.append((label, detail))


def check_new_function_over_limit_blocks(failures: Failures) -> None:
    with real_tempdir() as tmp:
        init_git_repo(tmp)
        Path(tmp, "README.md").write_text("seed\n")
        commit_all(tmp, "seed")
        target = os.path.join(tmp, "big.py")
        Path(target).write_text(big_function_src("oversized_probe_fn", 40))
        code, out, _err = run_hook(hook_input(target), cwd=tmp)
        ok = (
            code == 0
            and '"decision":"block"' in out.replace(" ", "")
            and "oversized_probe_fn" in out
        )
        report(ok, "new-function-over-limit-blocks", failures)


def check_unchanged_violation_allowed(failures: Failures) -> None:
    with real_tempdir() as tmp:
        init_git_repo(tmp)
        target = os.path.join(tmp, "big.py")
        Path(target).write_text(big_function_src("legacy_violation_fn", 40))
        commit_all(tmp, "seed with pre-existing violation")
        code, out, _err = run_hook(hook_input(target), cwd=tmp)
        ok = code == 0 and out.strip() == ""
        report(ok, "unchanged-pre-existing-allowed", failures)


def check_worsened_violation_blocks(failures: Failures) -> None:
    with real_tempdir() as tmp:
        init_git_repo(tmp)
        target = os.path.join(tmp, "big.py")
        Path(target).write_text(big_function_src("legacy_violation_fn", 40))
        commit_all(tmp, "seed with pre-existing violation")
        Path(target).write_text(big_function_src("legacy_violation_fn", 60))
        code, out, _err = run_hook(hook_input(target), cwd=tmp)
        ok = code == 0 and "worsened" in out and "INTRODUCED" in out
        report(ok, "worsened-pre-existing-blocks", failures)


def check_ignore_exact_match(failures: Failures) -> None:
    if not os.path.isfile(IGNORE_EXACT_MATCH):
        report(False, "is_unowned-exact-match", failures, "fixture path missing")
        return
    code, out, _err = run_hook(hook_input(IGNORE_EXACT_MATCH), cwd=IGNORE_CWD)
    ok = code == 0 and out.strip() == ""
    report(ok, "is_unowned-exact-match", failures)


def check_ignore_prefix_match(failures: Failures) -> None:
    if not os.path.isfile(IGNORE_PREFIX_MATCH):
        report(False, "is_unowned-prefix-match", failures, "fixture path missing")
        return
    code, out, _err = run_hook(hook_input(IGNORE_PREFIX_MATCH), cwd=IGNORE_CWD)
    ok = code == 0 and out.strip() == ""
    report(ok, "is_unowned-prefix-match", failures)


def check_ignore_glob_match(failures: Failures) -> None:
    """fnmatch strategy: no real complexity-ignore entry has a wildcard today,
    so this exercises the same is_unowned() code against a copied hooks/ dir
    whose complexity-ignore does — see the module docstring."""
    with real_tempdir() as tmp:
        hooks_copy = os.path.join(tmp, "hooks")
        os.makedirs(hooks_copy)
        shutil.copy(HOOK, hooks_copy)
        shutil.copy(HOOKLIB, hooks_copy)
        owned_dir = os.path.realpath(os.path.join(tmp, "owned"))
        os.makedirs(owned_dir)
        Path(hooks_copy, "complexity-ignore").write_text(f"{owned_dir}/*.py\n")
        target = os.path.join(owned_dir, "glob_target.py")
        Path(target).write_text("def f(a):\n    return a\n")
        code, out, _err = run_hook(
            hook_input(target),
            cwd=tmp,
            hook_path=os.path.join(hooks_copy, "check-complexity.py"),
        )
        ok = code == 0 and out.strip() == ""
        report(ok, "is_unowned-fnmatch-glob-match", failures)


def check_lizard_missing_fails_open(failures: Failures) -> None:
    with real_tempdir() as tmp:
        hooks_copy = os.path.join(tmp, "hooks")
        os.makedirs(hooks_copy)
        shutil.copy(HOOK, hooks_copy)
        shutil.copy(HOOKLIB, hooks_copy)
        target = os.path.join(tmp, "plain.py")
        Path(target).write_text("def f(a):\n    return a\n")
        code, out, _err = run_hook(
            hook_input(target),
            cwd=tmp,
            hook_path=os.path.join(hooks_copy, "check-complexity.py"),
        )
        ok = (
            code == 0
            and "lizard" in out
            and "not installed" in out
            and "setup-complexity.sh" in out
        )
        report(ok, "lizard-missing-fails-open", failures)


def check_malformed_stdin_exits_clean(failures: Failures) -> None:
    for raw, label in (
        ("", "empty-stdin"),
        ("{}", "empty-object"),
        ('{"tool_input":{}}', "empty-tool-input"),
    ):
        code, out, _err = run_hook(raw, cwd=HOOKS_DIR)
        ok = code == 0 and out.strip() == ""
        report(ok, f"malformed-stdin-{label}", failures)


def check_dual_output_contract(failures: Failures) -> None:
    with real_tempdir() as tmp:
        init_git_repo(tmp)
        Path(tmp, "README.md").write_text("seed\n")
        commit_all(tmp, "seed")
        target = os.path.join(tmp, "big.py")
        Path(target).write_text(big_function_src("contract_probe_fn", 40))
        code, out, _err = run_hook(hook_input(target), cwd=tmp)
        try:
            payload = json.loads(out)
            reason = payload["reason"]
            ok = (
                code == 0
                and payload["decision"] == "block"
                and payload["systemMessage"] == reason
                and payload["hookSpecificOutput"]["hookEventName"] == "PostToolUse"
                and payload["hookSpecificOutput"]["additionalContext"] == reason
            )
        except (json.JSONDecodeError, KeyError):
            ok = False
        report(ok, "dual-output-contract-D6", failures)


def check_deny_logged(failures: Failures) -> None:
    def matching_rows() -> int:
        if not os.path.isfile(LOG_FILE):
            return 0
        count = 0
        with open(LOG_FILE, encoding="utf-8") as fh:
            for line in fh:
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if row.get("event") == "HookDeny" and row.get("hook") == (
                    "check-complexity"
                ):
                    count += 1
        return count

    before = matching_rows()
    with real_tempdir() as tmp:
        init_git_repo(tmp)
        Path(tmp, "README.md").write_text("seed\n")
        commit_all(tmp, "seed")
        target = os.path.join(tmp, "big.py")
        Path(target).write_text(big_function_src("deny_log_probe_fn", 40))
        run_hook(hook_input(target), cwd=tmp)
    after = matching_rows()
    report(after > before, "deny-logged-to-hook-events-F093", failures)


def check_colocated_test_file_uses_production_limits(failures: Failures) -> None:
    """F194: SKIP_DIRS matches directory segments only — a `foo.test.ts`
    living under a non-tests/ directory is still checked at full strictness.
    This documents current behavior; it is explicitly not a fix."""
    with real_tempdir() as tmp:
        init_git_repo(tmp)
        Path(tmp, "README.md").write_text("seed\n")
        commit_all(tmp, "seed")
        src_api = os.path.join(tmp, "src", "api")
        os.makedirs(src_api)
        target = os.path.join(src_api, "foo.test.ts")
        body = "\n".join(f"  const v{i} = {i};" for i in range(40))
        Path(target).write_text(
            f"function skipDirsProbeFn(a: number) {{\n{body}\n  return a;\n}}\n"
        )
        code, out, _err = run_hook(hook_input(target), cwd=tmp)
        ok = code == 0 and "skipDirsProbeFn" in out
        report(ok, "colocated-test-file-checked-F194", failures)


def check_nloc_cross_check(failures: Failures) -> None:
    """A trivial 5-line function's lizard NLOC must equal the hand count —
    catches a future lizard-version regression (F194)."""
    with real_tempdir() as tmp:
        fixture = os.path.join(tmp, "nloc_fixture.py")
        Path(fixture).write_text(
            "def five_stmt(a):\n"
            "    b = a + 1\n"
            "    c = b + 1\n"
            "    d = c + 1\n"
            "    return d\n"
        )
        result = subprocess.run(
            [REAL_LIZARD, fixture, "-T", "nloc=1"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        reported = None
        for line in result.stdout.splitlines():
            if "five_stmt@" in line:
                reported = int(line.split()[0])
                break
        ok = reported == 5
        report(ok, "nloc-cross-check-hand-counted", failures, f"lizard={reported}")


def check_end_to_end_probe(failures: Failures) -> None:
    """Full invocation of the real hook against a real repo-tracked probe
    file, asserting the offending function's name reaches stdout."""
    probe = os.path.join(HOOKS_DIR, ".probe-test-complexity.py")
    try:
        Path(probe).write_text(big_function_src("end_to_end_probe_fn", 40))
        code, out, _err = run_hook(hook_input(probe), cwd=HOOKS_DIR)
        ok = code == 0 and "end_to_end_probe_fn" in out
        report(ok, "end-to-end-probe-file", failures)
    finally:
        if os.path.exists(probe):
            os.remove(probe)


def main() -> None:
    failures: Failures = []
    checks = (
        check_new_function_over_limit_blocks,
        check_unchanged_violation_allowed,
        check_worsened_violation_blocks,
        check_ignore_exact_match,
        check_ignore_prefix_match,
        check_ignore_glob_match,
        check_lizard_missing_fails_open,
        check_malformed_stdin_exits_clean,
        check_dual_output_contract,
        check_deny_logged,
        check_colocated_test_file_uses_production_limits,
        check_nloc_cross_check,
        check_end_to_end_probe,
    )
    for check in checks:
        check(failures)
    print()
    if failures:
        for label, detail in failures:
            print(f"FAILURE: {label}: {detail}")
        sys.exit(1)
    print(f"all {len(checks)} case groups passed")


def test_all() -> None:
    """pytest entry point — runs the same main() used by direct execution."""
    try:
        main()
    except SystemExit as exc:
        assert exc.code in (None, 0), f"main() exited with code {exc.code}"


if __name__ == "__main__":
    main()
