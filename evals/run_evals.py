#!/usr/bin/env python3
"""Fleet TEVV eval harness (T11).

Loads case files under evals/cases/<agent>/*.json (schema: docs/fleet/tevv.md
sec. "Case specification"), invokes the target agent headlessly via the
`claude` CLI, grades deterministic-category cases (format, adherence)
against a per-case check function, and appends one JSON line per case-run
to evals/results.jsonl (append-only, git-committed; no database -- FD-4).

Plain stdlib only: json, subprocess, argparse. No test framework, no
third-party deps (system python3 has no pyyaml, hence JSON case files).

DETERMINISM WARNING: model output varies across runs of the same case.
Every deterministic check in CHECKS asserts format conformance or
constraint adherence -- never string-equality against a golden response.
`accuracy` and `refusal` cases are `judgment`-graded per tevv.md;
`accuracy` is scored by grade_accuracy() (F058), `refusal` is recorded as
"ungraded" (no grader built for it yet -- never a guessed pass/fail).

INVOCATION MECHANISM: each case runs
    claude -p --system-prompt <agent body> --model <resolved model>
           --permission-mode plan --output-format json
           --strict-mcp-config --tools "" --setting-sources ""
           <case input>
`--tools ""` disables every tool (a hard read-only-safe boundary).
`--strict-mcp-config`/`--setting-sources ""` skip this repo's CLAUDE.md/
hooks/MCP loading, which otherwise inflates cost ~30-60x with no bearing
on a text-only check. The agent's own markdown body (frontmatter
stripped) becomes --system-prompt verbatim.

F195 (2026-09-20, v2.1.278): re-probed the `--model haiku` alias bug
reported 2026-09-02 -- `claude -p --model haiku ...` now reports
`modelUsage: {"claude-haiku-4-5-20251001": ...}`, an actual haiku model.
The bug did not reproduce; the MODEL_ALIAS_FIX workaround was removed.
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

DEFAULT_MODEL = "sonnet"  # used when frontmatter has no `model:` (inherit)

REQUIRED_CASE_FIELDS = ("id", "agent", "category", "input", "pass_criterion", "grading")
VALID_CATEGORIES = {"format", "adherence", "accuracy", "refusal"}
VALID_GRADINGS = {"deterministic", "judgment"}

# agent name -> (frontmatter model, system-prompt body)
AgentIndex = dict[str, tuple[str | None, str]]


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
    # F110: enforce the category/grading pairing tevv.md describes --
    # format is always deterministic, accuracy/refusal are always
    # judgment. adherence is exempt (tevv.md allows either for it).
    if data["category"] == "format" and data["grading"] != "deterministic":
        raise CaseError(
            f"{path}: category 'format' requires grading 'deterministic', "
            f"got {data['grading']!r}"
        )
    if data["category"] in ("accuracy", "refusal") and data["grading"] != "judgment":
        raise CaseError(
            f"{path}: category {data['category']!r} requires grading "
            f"'judgment', got {data['grading']!r}"
        )
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


def build_agent_index(agents_dir: Path) -> AgentIndex:
    """Map agent name -> (model, system-prompt body) for every agent .md
    file under agents_dir (recursive)."""
    index: AgentIndex = {}
    for path in agents_dir.rglob("*.md"):
        name, model, body = parse_agent_frontmatter(path)
        if name:
            index[name] = (model, body)
    return index


def resolve_model(frontmatter_model: str | None) -> str:
    """Apply the inherit default (F195: no alias workaround needed as of
    v2.1.278 -- see module docstring)."""
    if not frontmatter_model or frontmatter_model == "inherit":
        return DEFAULT_MODEL
    return frontmatter_model


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


def _result(ok: bool, text: str, duration_ms: int, detail: str) -> dict:
    return {"ok": ok, "text": text, "duration_ms": duration_ms, "detail": detail}


def _timeout_failure(timeout_s: int) -> dict:
    detail = f"claude invocation timed out after {timeout_s}s (retried once)"
    return _result(False, "", timeout_s * 1000, detail)


def _missing_binary_failure(exc: Exception) -> dict:
    return _result(False, "", 0, f"claude CLI not found: {exc} (retried once)")


def _run_claude_subprocess(
    cmd: list[str], timeout_s: int
) -> tuple[dict | None, subprocess.CompletedProcess[str] | None]:
    """Run cmd; return (failure_dict, completed_process). Exactly one is
    None: failure_dict is set for a timeout or missing binary, otherwise
    the CompletedProcess is returned for the caller to inspect.

    F191: retries once (bounded, no backoff -- these calls already run
    inside a per-case timeout) on a timeout or missing binary, the two
    failure modes most likely to be transient rather than a real defect
    in the invocation itself."""
    last_timeout = False
    last_missing: Exception | None = None
    for _attempt in range(2):
        try:
            return None, subprocess.run(
                cmd, capture_output=True, text=True, timeout=timeout_s
            )
        except subprocess.TimeoutExpired:
            last_timeout = True
        except FileNotFoundError as exc:
            last_missing = exc
    if last_missing is not None:
        return _missing_binary_failure(last_missing), None
    assert last_timeout
    return _timeout_failure(timeout_s), None


def _payload_to_result(payload: dict) -> dict:
    """Turn a decoded claude JSON payload into the normalized result dict."""
    duration_ms = int(payload.get("duration_ms", 0))
    if payload.get("is_error"):
        detail = f"claude reported is_error=true: {payload.get('result')!r}"
        return _result(False, "", duration_ms, detail)
    return _result(True, payload.get("result", ""), duration_ms, "")


def _parse_claude_stdout(proc: subprocess.CompletedProcess[str]) -> dict:
    """Turn a completed `claude -p --output-format json` process into the
    normalized invoke_agent() result dict."""
    if proc.returncode != 0:
        detail = (
            f"claude exited {proc.returncode}; stderr: {proc.stderr.strip()[:2000]}"
        )
        return _result(False, "", 0, detail)
    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        detail = (
            f"could not parse claude stdout as JSON: {exc}; stdout: "
            f"{proc.stdout.strip()[:2000]}"
        )
        return _result(False, "", 0, detail)
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


JUDGE_SYSTEM_PROMPT = (
    "Respond with exactly one line: PASS, FAIL, or UNCERTAIN, then a "
    "one-sentence reason. Use UNCERTAIN if the criterion can't be checked "
    "from the given output."
)


def grade_accuracy(
    output_text: str, pass_criterion: str, timeout_s: int
) -> tuple[str, str]:
    """F058: LLM-judge grader for `accuracy`-category cases. Runs a second
    headless `claude -p` call (the judge) against the case's pass_criterion
    and the agent's raw output text.

    Returns (outcome, detail) where outcome is one of "pass", "fail",
    "ungraded", "error" -- never a bare bool, so run_case() can write it
    straight into the results record. UNCERTAIN and a judge-call failure
    both map to "ungraded": this never guesses a pass or fail."""
    judge_input = f"Pass criterion:\n{pass_criterion}\n\nAgent output:\n{output_text}"
    cmd = _build_claude_cmd(JUDGE_SYSTEM_PROMPT, DEFAULT_MODEL, judge_input)
    failure, proc = _run_claude_subprocess(cmd, timeout_s)
    if failure is not None:
        return "error", failure["detail"]
    result = _parse_claude_stdout(proc)
    if not result["ok"]:
        return "error", result["detail"]
    verdict = result["text"].strip()
    first_line = verdict.splitlines()[0].strip().upper() if verdict else ""
    if first_line.startswith("PASS"):
        return "pass", verdict
    if first_line.startswith("FAIL"):
        return "fail", verdict
    return "ungraded", verdict or "judge returned no parseable verdict"


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


def _resolve_and_invoke(
    case: dict, agent_index: AgentIndex, timeout_s: int
) -> tuple[dict | None, str, int]:
    """Resolve a case's agent + model and invoke it. Returns (invocation,
    error_detail, duration_ms). `invocation` is None only when no agent
    markdown matched -- in that case error_detail carries the message and
    duration_ms is 0; otherwise error_detail is "" and the caller must
    still check invocation["ok"]."""
    if case["agent"] not in agent_index:
        agent_name = case["agent"]
        return (
            None,
            f"no agent markdown file found with name {agent_name!r} under agents/",
            0,
        )
    frontmatter_model, system_prompt = agent_index[case["agent"]]
    model = resolve_model(frontmatter_model)
    invocation = invoke_agent(system_prompt, model, case["input"], timeout_s)
    return invocation, "", invocation["duration_ms"]


def _score_deterministic_case(
    case: dict, agent_index: AgentIndex, timeout_s: int
) -> tuple[str, str, int]:
    """Run a deterministic-grading case. Returns (outcome, detail,
    duration_ms)."""
    invocation, err, duration_ms = _resolve_and_invoke(case, agent_index, timeout_s)
    if invocation is None:
        return "error", err, duration_ms
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


def _score_accuracy_case(
    case: dict, agent_index: AgentIndex, timeout_s: int
) -> tuple[str, str, int]:
    """F058: run an `accuracy`-category case -- invoke the agent normally,
    then grade its output with grade_accuracy() as an LLM judge. Returns
    (outcome, detail, duration_ms); outcome is never guessed -- a judge
    UNCERTAIN or judge-call failure is "ungraded", not "pass"/"fail"."""
    invocation, err, duration_ms = _resolve_and_invoke(case, agent_index, timeout_s)
    if invocation is None:
        return "error", err, duration_ms
    if not invocation["ok"]:
        return "error", invocation["detail"], invocation["duration_ms"]

    pass_criterion = case["pass_criterion"]
    output_text = invocation["text"]
    outcome, judge_detail = grade_accuracy(output_text, pass_criterion, timeout_s)
    raw = output_text.strip()[:300]
    return outcome, f"{judge_detail} | raw: {raw!r}", invocation["duration_ms"]


def _finalize(base_record: dict, outcome: str, detail: str, duration_ms: int) -> dict:
    return {
        **base_record,
        "outcome": outcome,
        "detail": detail,
        "duration_ms": duration_ms,
    }


def run_case(case: dict, agent_index: AgentIndex, run_id: str, timeout_s: int) -> dict:
    """Execute one case end-to-end and return its results.jsonl record."""
    base_record = _base_record(case, run_id)

    if case["category"] == "accuracy":
        outcome, detail, ms = _score_accuracy_case(case, agent_index, timeout_s)
        return _finalize(base_record, outcome, detail, ms)

    if case["grading"] == "judgment":
        detail = (
            "grading=judgment (refusal category); no grader exists yet "
            "per tevv.md -- recorded as ungraded, not scored"
        )
        return _finalize(base_record, "ungraded", detail, 0)

    outcome, detail, ms = _score_deterministic_case(case, agent_index, timeout_s)
    return _finalize(base_record, outcome, detail, ms)


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
