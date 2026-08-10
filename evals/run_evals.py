#!/usr/bin/env python3
"""Fleet TEVV eval harness (T11).

Loads case files under evals/cases/<agent>/*.json (schema: docs/fleet/tevv.md
sec. "Case specification"), invokes the target agent headlessly via the
`claude` CLI, grades deterministic-category cases (format, adherence)
against a per-case check function, and appends one JSON line per case-run
to evals/results.jsonl (append-only, git-committed; no database — FD-4).

Plain stdlib only: json, subprocess, argparse. No test framework, no
third-party deps (system python3 has no pyyaml, hence JSON case files
rather than YAML).

DETERMINISM WARNING: model output varies across runs of the same case.
Every deterministic check in CHECKS below asserts format conformance or
constraint adherence (valid JSON with an exact key set, word count, absence
of a code fence, bullet-line shape) -- never string-equality against a
golden response. `accuracy` and `refusal` cases are `judgment`-graded per
tevv.md and are recorded as outcome "ungraded", never a guessed pass/fail.

INVOCATION MECHANISM: each case is scored by running
    claude -p --system-prompt <agent body> --model <resolved model>
           --permission-mode plan --output-format json
           --strict-mcp-config --tools "" --setting-sources ""
           <case input>
`--tools ""` disables every tool for the invocation (the evaluated agent
cannot read, write, or execute anything -- a hard read-only-safe boundary,
stronger than relying on --permission-mode alone). `--strict-mcp-config`
and `--setting-sources ""` skip this repo's CLAUDE.md/hooks/MCP-server
loading, which otherwise gets attached to every headless call's system
prompt and inflates cost ~30-60x with no bearing on a text-only format/
adherence check (see .agent-notes for the measurement). The agent's own
markdown body (frontmatter stripped) becomes --system-prompt verbatim, so
the case is scored against that agent's actual instructions, not a proxy.

KNOWN CLI QUIRK: `--model haiku` (the alias) silently resolves to
claude-sonnet-5 rather than a haiku model or an error, on the CLI version
in use at authoring time (2026-08-09). MODEL_ALIAS_FIX below substitutes
the full canonical model name for "haiku" to route correctly; "sonnet" and
"opus" aliases resolve correctly and are left as-is.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from checks import CHECKS

REPO_ROOT = Path(__file__).resolve().parent.parent
CASES_DIR = Path(__file__).resolve().parent / "cases"
RESULTS_PATH = Path(__file__).resolve().parent / "results.jsonl"
AGENTS_DIR = REPO_ROOT / "agents"

DEFAULT_TIMEOUT_S = 120

# Frontmatter model alias -> resolved --model value. Only entries that
# diverge from a straight pass-through need to be listed here.
MODEL_ALIAS_FIX = {
    "haiku": "claude-haiku-4-5-20251001",
}
DEFAULT_MODEL = "sonnet"  # used when frontmatter has no `model:` (inherit)

REQUIRED_CASE_FIELDS = ("id", "agent", "category", "input", "pass_criterion", "grading")
VALID_CATEGORIES = {"format", "adherence", "accuracy", "refusal"}
VALID_GRADINGS = {"deterministic", "judgment"}


class CaseError(Exception):
    """A case file is malformed or violates the tevv.md schema."""


class AgentNotFoundError(Exception):
    """No agent markdown file matches a case's `agent` field."""


def load_case(path: Path) -> dict:
    """Load and validate one case file against tevv.md sec. 'Case
    specification'.

    Raises:
        CaseError: a required field is missing or holds an invalid value.
    """
    data = json.loads(path.read_text(encoding="utf-8"))
    missing = [f for f in REQUIRED_CASE_FIELDS if f not in data]
    if missing:
        raise CaseError(f"{path}: missing required field(s) {missing}")
    if data["category"] not in VALID_CATEGORIES:
        raise CaseError(f"{path}: invalid category {data['category']!r}")
    if data["grading"] not in VALID_GRADINGS:
        raise CaseError(f"{path}: invalid grading {data['grading']!r}")
    return data


def discover_cases(cases_dir: Path) -> list[dict]:
    """Load every case file under cases_dir, erroring on id collisions."""
    cases: list[dict] = []
    seen_ids: dict[str, Path] = {}
    for path in sorted(cases_dir.rglob("*.json")):
        case = load_case(path)
        if case["id"] in seen_ids:
            raise CaseError(
                f"duplicate case id {case['id']!r}: {path} and {seen_ids[case['id']]}"
            )
        seen_ids[case["id"]] = path
        cases.append(case)
    return cases


def parse_agent_frontmatter(md_path: Path) -> tuple[str | None, str | None, str]:
    """Return (name, model, body) for an agent markdown file.

    `body` is the file content after the closing `---`, with a leading
    blank line stripped. Frontmatter is parsed line-by-line (key: value);
    good enough for this repo's single-line `name:`/`model:` fields --
    no YAML parser needed (system python3 has no pyyaml).
    """
    text = md_path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None, None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, None, text
    frontmatter = text[3:end]
    body = text[end + 4 :].lstrip("\n")
    name = model = None
    for line in frontmatter.splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip().strip('"')
        if key == "name":
            name = value
        elif key == "model":
            model = value
    return name, model, body


def build_agent_index(agents_dir: Path) -> dict[str, tuple[str | None, str]]:
    """Map agent name -> (model, system-prompt body) for every agent .md
    file under agents_dir (recursive)."""
    index: dict[str, tuple[str | None, str]] = {}
    for path in agents_dir.rglob("*.md"):
        name, model, body = parse_agent_frontmatter(path)
        if name:
            index[name] = (model, body)
    return index


def resolve_model(frontmatter_model: str | None) -> str:
    """Apply the documented haiku-alias workaround and the inherit default."""
    if not frontmatter_model or frontmatter_model == "inherit":
        return DEFAULT_MODEL
    return MODEL_ALIAS_FIX.get(frontmatter_model, frontmatter_model)


def _build_claude_cmd(system_prompt: str, model: str, case_input: str) -> list[str]:
    return [
        "claude",
        "-p",
        "--system-prompt",
        system_prompt,
        "--model",
        model,
        "--permission-mode",
        "plan",
        "--output-format",
        "json",
        "--strict-mcp-config",
        "--tools",
        "",
        "--setting-sources",
        "",
        case_input,
    ]


def _run_claude_subprocess(cmd: list[str], timeout_s: int) -> tuple[dict | None, dict | None]:
    """Run cmd; return (failure_dict, completed_process). Exactly one is
    None: failure_dict is set for a timeout or missing binary, otherwise
    the CompletedProcess is returned for the caller to inspect."""
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s)
    except subprocess.TimeoutExpired:
        return (
            {
                "ok": False,
                "text": "",
                "duration_ms": timeout_s * 1000,
                "detail": f"claude invocation timed out after {timeout_s}s",
            },
            None,
        )
    except FileNotFoundError as exc:
        return (
            {"ok": False, "text": "", "duration_ms": 0, "detail": f"claude CLI not found: {exc}"},
            None,
        )
    return None, proc


def _payload_to_result(payload: dict) -> dict:
    """Turn a decoded claude JSON payload into the normalized result dict."""
    duration_ms = int(payload.get("duration_ms", 0))
    if payload.get("is_error"):
        return {
            "ok": False,
            "text": "",
            "duration_ms": duration_ms,
            "detail": f"claude reported is_error=true: {payload.get('result')!r}",
        }
    return {
        "ok": True,
        "text": payload.get("result", ""),
        "duration_ms": duration_ms,
        "detail": "",
    }


def _parse_claude_stdout(proc) -> dict:
    """Turn a completed `claude -p --output-format json` process into the
    normalized invoke_agent() result dict."""
    if proc.returncode != 0:
        return {
            "ok": False,
            "text": "",
            "duration_ms": 0,
            "detail": (
                f"claude exited {proc.returncode}; stderr: {proc.stderr.strip()[:2000]}"
            ),
        }
    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        return {
            "ok": False,
            "text": "",
            "duration_ms": 0,
            "detail": (
                f"could not parse claude stdout as JSON: {exc}; stdout: "
                f"{proc.stdout.strip()[:2000]}"
            ),
        }
    return _payload_to_result(payload)


def invoke_agent(
    system_prompt: str, model: str, case_input: str, timeout_s: int
) -> dict:
    """Run one headless `claude -p` invocation and return a normalized
    result dict: {"ok": bool, "text": str, "duration_ms": int, "detail": str}.

    `ok` is False for a subprocess timeout, a non-zero exit, unparseable
    JSON output, or an `is_error` response -- in every such case `detail`
    carries enough to diagnose without re-running.
    """
    cmd = _build_claude_cmd(system_prompt, model, case_input)
    failure, proc = _run_claude_subprocess(cmd, timeout_s)
    if failure is not None:
        return failure
    return _parse_claude_stdout(proc)


def next_run_id(results_path: Path) -> str:
    """YYYY-MM-DD-NN: NN increments per run started on the same UTC date,
    derived from existing run_ids in results.jsonl (no separate counter
    file -- the JSONL is the sole source of truth, per FD-4)."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    max_seq = 0
    if results_path.exists():
        for line in results_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                run_id = json.loads(line).get("run_id", "")
            except json.JSONDecodeError:
                continue
            if run_id.startswith(today + "-"):
                try:
                    max_seq = max(max_seq, int(run_id.rsplit("-", 1)[1]))
                except ValueError:
                    continue
    return f"{today}-{max_seq + 1:02d}"


def _base_record(case: dict, run_id: str) -> dict:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "run_id": run_id,
        "agent": case["agent"],
        "case_id": case["id"],
        "category": case["category"],
        "duration_ms": 0,
    }


def _score_deterministic_case(
    case: dict, agent_index: dict[str, tuple[str | None, str]], timeout_s: int
) -> tuple[str, str, int]:
    """Run a deterministic-grading case. Returns (outcome, detail,
    duration_ms)."""
    if case["agent"] not in agent_index:
        return (
            "error",
            f"no agent markdown file found with name {case['agent']!r} under agents/",
            0,
        )
    frontmatter_model, system_prompt = agent_index[case["agent"]]
    model = resolve_model(frontmatter_model)

    invocation = invoke_agent(system_prompt, model, case["input"], timeout_s)
    if not invocation["ok"]:
        return "error", invocation["detail"], invocation["duration_ms"]

    checker = CHECKS.get(case["id"])
    if checker is None:
        return (
            "error",
            f"no deterministic checker registered for case id {case['id']!r}",
            invocation["duration_ms"],
        )
    passed, detail = checker(invocation["text"])
    raw = invocation["text"].strip()[:300]
    full_detail = detail if not passed else f"{detail} | raw: {raw!r}"
    return ("pass" if passed else "fail"), full_detail, invocation["duration_ms"]


def run_case(
    case: dict, agent_index: dict[str, tuple[str | None, str]], run_id: str, timeout_s: int
) -> dict:
    """Execute one case end-to-end and return its results.jsonl record."""
    base_record = _base_record(case, run_id)

    if case["grading"] == "judgment":
        return {
            **base_record,
            "outcome": "ungraded",
            "detail": (
                "grading=judgment (accuracy/refusal category); no grader "
                "exists yet per tevv.md -- recorded as ungraded, not scored"
            ),
        }

    outcome, detail, duration_ms = _score_deterministic_case(case, agent_index, timeout_s)
    return {**base_record, "outcome": outcome, "detail": detail, "duration_ms": duration_ms}


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases-dir", type=Path, default=CASES_DIR)
    parser.add_argument("--results", type=Path, default=RESULTS_PATH)
    parser.add_argument("--agents-dir", type=Path, default=AGENTS_DIR)
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT_S)
    parser.add_argument(
        "--agent",
        action="append",
        default=None,
        help="Restrict the run to this agent name (repeatable).",
    )
    return parser


def _load_filtered_cases(args: argparse.Namespace) -> list[dict] | None:
    try:
        cases = discover_cases(args.cases_dir)
    except CaseError as exc:
        print(f"case load error: {exc}", file=sys.stderr)
        return None
    if args.agent:
        cases = [c for c in cases if c["agent"] in args.agent]
    if not cases:
        print("no cases matched", file=sys.stderr)
        return None
    return cases


def _execute_run(cases: list[dict], args: argparse.Namespace) -> None:
    agent_index = build_agent_index(args.agents_dir)
    run_id = next_run_id(args.results)
    with args.results.open("a", encoding="utf-8") as fh:
        for case in cases:
            record = run_case(case, agent_index, run_id, args.timeout)
            fh.write(json.dumps(record) + "\n")
            fh.flush()
            print(f"{record['agent']:>24} {record['case_id']:<45} {record['outcome']}")


def main() -> int:
    args = _build_arg_parser().parse_args()
    cases = _load_filtered_cases(args)
    if cases is None:
        return 1
    _execute_run(cases, args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
