"""Deterministic checkers for evals/run_evals.py (T11).

Each checker takes an agent's raw text output and returns
(passed: bool, detail: str). Registered by case id in CHECKS -- translating
a case's prose `pass_criterion` (docs/fleet/tevv.md) into a mechanical check
is T11's job, not something inferred generically at runtime.

Every check here asserts format conformance or constraint adherence (valid
JSON with an exact key set, word count, absence of a code fence, bullet-line
shape) -- never string-equality against a golden response, per tevv.md's
determinism warning: model output varies across runs of the same case.

Stdlib only: json, re.
"""

from __future__ import annotations

import json
import re
from typing import Callable


def _check_json_object(
    text: str, required_keys: dict[str, Callable[[object], bool]]
) -> tuple[bool, str]:
    stripped = text.strip()
    if "```" in stripped:
        return False, f"output contains a markdown code fence: {stripped[:300]!r}"
    try:
        data = json.loads(stripped)
    except json.JSONDecodeError as exc:
        return False, f"not valid JSON ({exc}); raw output: {stripped[:300]!r}"
    if not isinstance(data, dict):
        return False, f"expected a JSON object, got {type(data).__name__}: {stripped[:300]!r}"
    got_keys = set(data.keys())
    want_keys = set(required_keys.keys())
    if got_keys != want_keys:
        return False, f"expected exactly keys {sorted(want_keys)}, got {sorted(got_keys)}"
    for key, validator in required_keys.items():
        if not validator(data[key]):
            return False, f"key {key!r} failed validation; value: {data[key]!r}"
    return True, "ok"


def check_explore_json(text: str) -> tuple[bool, str]:
    """Case: explore-format-json-search-result."""
    return _check_json_object(
        text,
        {
            "query": lambda v: isinstance(v, str) and v != "",
            "matches": lambda v: isinstance(v, list)
            and len(v) >= 1
            and all(isinstance(m, str) for m in v),
        },
    )


def check_plan_json(text: str) -> tuple[bool, str]:
    """Case: plan-format-json-plan."""
    return _check_json_object(
        text,
        {
            "steps": lambda v: isinstance(v, list)
            and len(v) >= 2
            and all(isinstance(s, str) for s in v),
            "risks": lambda v: isinstance(v, list)
            and len(v) >= 1
            and all(isinstance(r, str) for r in v),
        },
    )


def check_api_designer_json(text: str) -> tuple[bool, str]:
    """Case: api-designer-format-json-endpoint."""
    valid_methods = {"GET", "POST", "PUT", "PATCH", "DELETE"}
    return _check_json_object(
        text,
        {
            "path": lambda v: isinstance(v, str) and v.startswith("/"),
            "method": lambda v: isinstance(v, str) and v in valid_methods,
            "statusCodes": lambda v: isinstance(v, list)
            and len(v) >= 1
            and all(isinstance(c, int) and not isinstance(c, bool) for c in v),
        },
    )


def check_ad_security_bullets(text: str) -> tuple[bool, str]:
    """Case: ad-security-reviewer-adherence-bullet-format."""
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    if not lines:
        return False, "output is empty"

    def is_bullet(line: str) -> bool:
        line = re.sub(r"^[-*]\s*", "", line)
        return line.count("|") == 3

    bullets = [line for line in lines if is_bullet(line)]
    if not bullets:
        return False, f"no bullet line matches 'A | B | C | D' shape; output: {text[:300]!r}"
    if not is_bullet(lines[0]):
        return False, f"first non-blank line is not a bullet (prose precedes it): {lines[0]!r}"
    if not is_bullet(lines[-1]):
        return False, f"last non-blank line is not a bullet (trailing summary): {lines[-1]!r}"
    return True, f"ok: {len(bullets)} bullet line(s)"


def check_angular_word_limit(text: str) -> tuple[bool, str]:
    """Case: angular-architect-adherence-word-limit."""
    if "```" in text:
        return False, f"output contains a markdown code fence: {text.strip()[:300]!r}"
    word_count = len(text.split())
    if word_count >= 50:
        return False, f"word count {word_count} >= 50; output: {text.strip()[:300]!r}"
    return True, f"ok: {word_count} words"


CHECKS: dict[str, Callable[[str], tuple[bool, str]]] = {
    "explore-format-json-search-result": check_explore_json,
    "plan-format-json-plan": check_plan_json,
    "ad-security-reviewer-adherence-bullet-format": check_ad_security_bullets,
    "angular-architect-adherence-word-limit": check_angular_word_limit,
    "api-designer-format-json-endpoint": check_api_designer_json,
}
