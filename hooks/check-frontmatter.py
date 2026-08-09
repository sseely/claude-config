#!/usr/bin/env python3
"""
PostToolUse hook: validate agent/skill YAML frontmatter after Write/Edit.
Fail-open: any exception exits 0 to never block writes due to hook bugs.

Mirrors hooks/check-complexity.py (FD-3, plans/fleet-governance/decisions.md):
PostToolUse on Write|Edit, blocks via {"decision":"block","reason":...} then
exit 0, fail-open on any unhandled exception.

This hook fires on EVERY Write/Edit in EVERY project on this machine, not
only ~/.claude. It therefore bails in microseconds — pure string checks, no
file open, no subprocess — on any path that is not agents/**/*.md or
skills/*/SKILL.md under THIS ~/.claude tree (identified via this script's
own location, not via $HOME, so it is correct even if ~/.claude is a
symlink target or the invoking shell's HOME differs).

Dependency note (FD-3): this hook runs under system python3 (stdlib only)
and shells out to hooks/.venv/bin/python for PyYAML, exactly as
check-complexity.py shells out to hooks/.venv/bin/lizard rather than
importing it.

See docs/fleet/schema/agent.frontmatter.schema.json and
skill.frontmatter.schema.json (T2) for the schemas enforced here, and FD-1
(plans/fleet-governance/decisions.md) for the cross-surface tool-key rule:
'tools'/'disallowedTools' are agent-only; 'allowed-tools' is skill-only and
is a permission pre-approval, not a capability restriction.
"""
import json
import os
import re
import subprocess
import sys

HOOKS_DIR = os.path.dirname(os.path.abspath(__file__))
CLAUDE_DIR = os.path.dirname(HOOKS_DIR)
VENV_PYTHON = os.path.join(HOOKS_DIR, ".venv", "bin", "python")
SETUP_SCRIPT = os.path.join(HOOKS_DIR, "setup-complexity.sh")

AGENT_SCHEMA_PATH = os.path.join(
    CLAUDE_DIR, "docs", "fleet", "schema", "agent.frontmatter.schema.json"
)
SKILL_SCHEMA_PATH = os.path.join(
    CLAUDE_DIR, "docs", "fleet", "schema", "skill.frontmatter.schema.json"
)

FD1_NOTE = (
    "cross-surface rule FD-1 (plans/fleet-governance/decisions.md): "
    "tools/disallowedTools are agent-only fields; allowed-tools is "
    "skill-only and is a permission pre-approval, not a capability "
    "restriction."
)

YAML_PARSE_SNIPPET = (
    "import sys, json, yaml\n"
    "try:\n"
    "    data = yaml.safe_load(sys.stdin.read())\n"
    "    sys.stdout.write(json.dumps({'ok': True, 'data': data}))\n"
    "except Exception as exc:\n"
    "    sys.stdout.write(json.dumps("
    "{'ok': False, 'error': f'{type(exc).__name__}: {exc}'}))\n"
)


def block(reason: str) -> None:
    print(json.dumps({"decision": "block", "reason": reason}))


def classify_surface(file_path: str):
    """("agent"|"skill"|None, rel_path). Pure string check — no I/O."""
    if not file_path.endswith(".md"):
        return None, None
    abs_path = os.path.abspath(file_path)
    prefix = CLAUDE_DIR + os.sep
    if not abs_path.startswith(prefix):
        return None, None
    parts = abs_path[len(prefix):].split(os.sep)
    if len(parts) >= 2 and parts[0] == "agents":
        return "agent", "/".join(parts)
    if len(parts) == 3 and parts[0] == "skills" and parts[2] == "SKILL.md":
        return "skill", "/".join(parts)
    return None, None


def extract_frontmatter(text: str):
    """Text between the leading '---' delimiters, or None if absent."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return "\n".join(lines[1:i])
    return None


def parse_yaml(text: str):
    """Shell out to hooks/.venv/bin/python (has PyYAML). (ok, data_or_err)."""
    result = subprocess.run(
        [VENV_PYTHON, "-c", YAML_PARSE_SNIPPET],
        input=text, capture_output=True, text=True, timeout=10,
    )
    if not result.stdout.strip():
        return False, (result.stderr or "yaml parser produced no output").strip()
    payload = json.loads(result.stdout)
    if payload.get("ok"):
        return True, payload.get("data")
    return False, payload.get("error", "unknown YAML error")


def load_schema(surface: str):
    path = AGENT_SCHEMA_PATH if surface == "agent" else SKILL_SCHEMA_PATH
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _base_type_ok(value, t) -> bool:
    if t == "string":
        return isinstance(value, str)
    if t == "boolean":
        return isinstance(value, bool)
    if t == "array":
        return isinstance(value, list)
    return True


def _array_items_ok(value, subschema) -> bool:
    items = subschema.get("items")
    if not items:
        return True
    return all(type_matches(item, items) for item in value)


def _enum_ok(value, subschema) -> bool:
    return "enum" not in subschema or value in subschema["enum"]


def _pattern_ok(value, subschema) -> bool:
    pattern = subschema.get("pattern")
    if pattern is None:
        return True
    return isinstance(value, str) and re.match(pattern, value) is not None


def type_matches(value, subschema) -> bool:
    """Check `value` against one (non-anyOf) JSON Schema fragment."""
    t = subschema.get("type")
    if not _base_type_ok(value, t):
        return False
    if t == "array" and not _array_items_ok(value, subschema):
        return False
    return _enum_ok(value, subschema) and _pattern_ok(value, subschema)


def matches_property_schema(value, subschema) -> bool:
    if "anyOf" in subschema:
        return any(type_matches(value, s) for s in subschema["anyOf"])
    return type_matches(value, subschema)


def fd1_violations(data: dict, surface: str):
    """Explicit FD-1 cross-surface check (schema also encodes this)."""
    fields = set()
    if surface == "agent" and "allowed-tools" in data:
        fields.add("allowed-tools")
    if surface == "skill":
        fields.update({"tools", "disallowedTools"} & data.keys())
    if not fields:
        return set(), []
    field_list = ", ".join(sorted(fields))
    reason = (
        f"forbidden field(s) [{field_list}] on {surface} frontmatter — "
        f"{FD1_NOTE}"
    )
    return fields, [reason]


def validate(data, schema: dict, surface: str):
    """Return a list of human-readable violation strings, empty if valid."""
    if not isinstance(data, dict):
        return [f"frontmatter must be a YAML mapping, got {type(data).__name__}"]

    exempt_fields, violations = fd1_violations(data, surface)

    for key in schema.get("required", []):
        if key not in data:
            violations.append(f"missing required field '{key}'")

    properties = schema.get("properties", {})
    for key, value in data.items():
        if key in exempt_fields:
            continue  # already reported above with a precise, cited reason
        if key not in properties:
            violations.append(
                f"unknown/forbidden field '{key}' (additionalProperties: false)"
            )
            continue
        if not matches_property_schema(value, properties[key]):
            violations.append(f"field '{key}' has invalid type/value: {value!r}")

    return violations


try:
    payload = json.loads(sys.stdin.read())
    raw_path = payload.get("tool_input", {}).get("file_path", "")

    surface, rel_path = classify_surface(raw_path)
    if surface is None:
        sys.exit(0)

    abs_path = os.path.abspath(raw_path)
    if not os.path.isfile(abs_path):
        sys.exit(0)

    with open(abs_path, encoding="utf-8") as fh:
        text = fh.read()

    frontmatter_text = extract_frontmatter(text)
    if frontmatter_text is None:
        block(
            f"{rel_path}: no YAML frontmatter block found (expected leading "
            "'---' ... '---' delimiters)."
        )
        sys.exit(0)

    if not (os.path.isfile(VENV_PYTHON) and os.access(VENV_PYTHON, os.X_OK)):
        block(
            "Frontmatter validation requires PyYAML in the shared hooks "
            "venv, which is not installed.\n\n"
            f"Please ask the user for permission to run:\n  {SETUP_SCRIPT}\n\n"
            "This installs into ~/.claude/hooks/.venv and does not affect "
            "any project dependencies."
        )
        sys.exit(0)

    ok, result = parse_yaml(frontmatter_text)
    if not ok:
        block(f"{rel_path}: unparseable YAML frontmatter — {result}")
        sys.exit(0)

    schema = load_schema(surface)
    violations = validate(result, schema, surface)
    if violations:
        detail = "\n".join(f"  - {v}" for v in violations)
        block(
            f"Frontmatter validation failed for {rel_path} "
            f"({surface} schema):\n{detail}"
        )

except Exception as exc:
    # Fail open — hook bugs must never block writes. Log why so a silent
    # bug doesn't go unnoticed forever.
    print(
        f"check-frontmatter.py: unhandled {type(exc).__name__}: {exc}",
        file=sys.stderr,
    )
    sys.exit(0)
