#!/usr/bin/env python3
"""Generate docs/fleet/inventory.md by measuring fleet frontmatter.

Replaces hand-counting (which was wrong the day it shipped — see
decision FD-7) with a script that parses every agent and skill
frontmatter file and tiers each entry on three independent axes:

  1. Tool capability — write/exec-capable, inherits-all, or read-only.
  2. Model pinning — the `model` value, or "unset" (session-inherited).
  3. Permission blast radius — skills' `allowed-tools` pre-approval
     scope. This is NOT a capability signal; see FD-1 in
     docs/fleet/schema/*.frontmatter.schema.json.

Parser choice: this file re-execs into hooks/.venv/bin/python (which
ships PyYAML 6.0.3) instead of hand-rolling a YAML parser. Production
frontmatter uses folded plain scalars split across lines (e.g.
ai-risk-auditor.md's `tools:` list), block sequences, and quoted
scalars with escapes (explore.md's description) — shapes a real
parser handles correctly and a hand-rolled one would silently
mis-parse. The system `python3` has no PyYAML, so this module MUST
NOT import yaml until it has confirmed — by interpreter identity, not
by a failed import — that it is running under the venv interpreter.

Usage:
    python3 scripts/gen-fleet-inventory.py            # write inventory.md
    python3 scripts/gen-fleet-inventory.py --check    # verify, no write
"""
from __future__ import annotations

import argparse
import difflib
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

REPO_ROOT = Path(__file__).resolve().parent.parent
VENV_PYTHON = REPO_ROOT / "hooks" / ".venv" / "bin" / "python"
OUTPUT_PATH = REPO_ROOT / "docs" / "fleet" / "inventory.md"
GENERATOR_COMMAND = "python3 scripts/gen-fleet-inventory.py"
_REEXEC_MARKER = "_FLEET_INVENTORY_REEXEC"


def _reexec_into_venv_python_if_needed() -> None:
    """Re-exec into hooks/.venv/bin/python if it isn't already running.

    Never imports yaml to make this decision — compares `sys.prefix`
    against the venv directory instead, so a missing PyYAML under the
    system interpreter never surfaces as an ImportError in the first
    place. `sys.executable` is not a reliable signal here: `python -m
    venv` typically symlinks the venv's binary to the base
    interpreter, so both interpreters report the same realpath even
    though only the venv one has PyYAML on its `sys.path`.
    """
    if os.environ.get(_REEXEC_MARKER):
        return
    venv_dir = VENV_PYTHON.parent.parent.resolve()
    already_venv = Path(sys.prefix).resolve() == venv_dir
    if VENV_PYTHON.exists() and not already_venv:
        os.environ[_REEXEC_MARKER] = "1"
        os.execv(str(VENV_PYTHON), [str(VENV_PYTHON), __file__, *sys.argv[1:]])


_reexec_into_venv_python_if_needed()

import yaml  # noqa: E402  (only reached once running under venv python)  # type: ignore[import-untyped]

# --- Frontmatter parsing -----------------------------------------------

FRONTMATTER_DELIM = "---\n"
WRITE_EXEC_TOOLS = frozenset({"Write", "Edit", "Bash"})

TIER_WRITE_EXEC = "write/exec-capable"
TIER_INHERITS_ALL = "inherits-all"
TIER_READ_ONLY = "read-only"

UNSET_MODEL = "unset"

BLAST_NONE = "none"
BLAST_NARROW = "narrow (1-3)"
BLAST_MODERATE = "moderate (4-7)"
BLAST_BROAD = "broad (8+)"


def load_frontmatter(path: Path, yaml_load: Callable[[str], Any]) -> dict[str, Any]:
    """Extract and parse the YAML frontmatter block from a fleet file.

    Raises ValueError if the file has no frontmatter delimiters, so a
    malformed file fails the run loudly instead of being silently
    skipped (the acceptance bar requires every frontmatter to parse).
    """
    text = path.read_text(encoding="utf-8")
    if not text.startswith(FRONTMATTER_DELIM):
        raise ValueError(f"{path}: does not start with '---' frontmatter delimiter")
    end = text.find("\n---", len(FRONTMATTER_DELIM))
    if end == -1:
        raise ValueError(f"{path}: no closing '---' frontmatter delimiter")
    raw = text[len(FRONTMATTER_DELIM) : end]
    data = yaml_load(raw)
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: frontmatter did not parse to a mapping")
    return data


def normalize_tool_field(value: Any) -> list[str]:
    """Normalize a tools-like field to a list of tool names.

    Production frontmatter stores tools/disallowedTools/allowed-tools
    as either a YAML block list or a single comma-separated string
    (both documented in docs/fleet/schema/*.frontmatter.schema.json).
    """
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value]
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    raise TypeError(f"unexpected frontmatter value type: {type(value)!r}")


def resolve_model(frontmatter: dict[str, Any]) -> str:
    """Return the pinned model, or UNSET_MODEL if the key is absent.

    An absent `model` key is NOT a safe default — it means the entry
    runs at whatever model the invoking session happens to be on.
    """
    model = frontmatter.get("model")
    return str(model) if model else UNSET_MODEL


def classify_agent_capability(
    tools_key_present: bool, tools: list[str], disallowed: list[str]
) -> str:
    """Tier an agent's tool capability per FD-1.

    No `tools` key means the agent inherits every tool available in
    the session — the highest capability tier, tracked separately
    from (not folded into) explicit write/exec-capable agents.
    """
    if not tools_key_present:
        return TIER_INHERITS_ALL
    effective = set(tools) - set(disallowed)
    return TIER_WRITE_EXEC if effective & WRITE_EXEC_TOOLS else TIER_READ_ONLY


def classify_blast_radius(allowed_tool_count: int) -> str:
    """Bucket a skill's allowed-tools pre-approval scope."""
    if allowed_tool_count == 0:
        return BLAST_NONE
    if allowed_tool_count <= 3:
        return BLAST_NARROW
    if allowed_tool_count <= 7:
        return BLAST_MODERATE
    return BLAST_BROAD


# --- Entry models --------------------------------------------------------


@dataclass(frozen=True)
class AgentEntry:
    """One measured agent frontmatter file."""

    rel_path: str
    name: str
    model: str
    capability_tier: str
    tool_count: int | None  # None means inherits-all (unbounded)


@dataclass(frozen=True)
class SkillEntry:
    """One measured skill frontmatter file."""

    rel_path: str
    name: str
    model: str
    blast_tier: str
    allowed_tool_count: int


def build_agent_entry(
    path: Path, repo_root: Path, yaml_load: Callable[[str], Any]
) -> AgentEntry:
    """Parse one agent frontmatter file into an AgentEntry."""
    frontmatter = load_frontmatter(path, yaml_load)
    tools_key_present = "tools" in frontmatter
    tools = normalize_tool_field(frontmatter.get("tools"))
    disallowed = normalize_tool_field(frontmatter.get("disallowedTools"))
    tier = classify_agent_capability(tools_key_present, tools, disallowed)
    return AgentEntry(
        rel_path=path.relative_to(repo_root).as_posix(),
        name=str(frontmatter.get("name", path.stem)),
        model=resolve_model(frontmatter),
        capability_tier=tier,
        tool_count=len(tools) if tools_key_present else None,
    )


def build_skill_entry(
    path: Path, repo_root: Path, yaml_load: Callable[[str], Any]
) -> SkillEntry:
    """Parse one skill frontmatter file into a SkillEntry."""
    frontmatter = load_frontmatter(path, yaml_load)
    allowed = normalize_tool_field(frontmatter.get("allowed-tools"))
    rel_path = path.relative_to(repo_root).as_posix()
    default_name = path.parent.name
    return SkillEntry(
        rel_path=rel_path,
        name=str(frontmatter.get("name", default_name)),
        model=resolve_model(frontmatter),
        blast_tier=classify_blast_radius(len(allowed)),
        allowed_tool_count=len(allowed),
    )


# --- Discovery ------------------------------------------------------------


def discover_agent_paths(repo_root: Path) -> list[Path]:
    """Find every agent frontmatter file, at any depth under agents/.

    The fleet has two layouts: agents/NN-category/name.md (the norm)
    and a handful of files loose at agents/ root — rglob catches both.
    """
    return sorted((repo_root / "agents").rglob("*.md"))


def discover_skill_paths(repo_root: Path) -> list[Path]:
    """Find every skill frontmatter file: skills/*/SKILL.md."""
    return sorted((repo_root / "skills").rglob("SKILL.md"))


# --- Rendering --------------------------------------------------------


def _count_by(values: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return counts


def _render_count_table(
    header: str, counts: dict[str, int], order: list[str] | None = None
) -> str:
    keys = order if order is not None else sorted(counts, key=lambda k: (-counts[k], k))
    lines = [f"| {header} | Count |", "|---|---|"]
    for key in keys:
        if key in counts:
            lines.append(f"| {key} | {counts[key]} |")
    return "\n".join(lines)


def _render_agent_summary(agents: list[AgentEntry]) -> str:
    capability_counts = _count_by([a.capability_tier for a in agents])
    model_counts = _count_by([a.model for a in agents])
    capability_order = [TIER_WRITE_EXEC, TIER_INHERITS_ALL, TIER_READ_ONLY]
    model_order = sorted(
        model_counts, key=lambda k: (k == UNSET_MODEL, -model_counts[k], k)
    )
    return "\n\n".join(
        [
            f"### Agents: {len(agents)} total\n\n"
            "Tool capability (Write/Edit/Bash in the effective tool set, "
            "after `disallowedTools` resolves against `tools`):\n\n"
            + _render_count_table(
                "Tool capability tier", capability_counts, capability_order
            ),
            "Model pinning (an absent `model` key means the entry runs at "
            "whatever model the invoking session is on — this is not a "
            "safe or low-risk default, it is unbounded):\n\n"
            + _render_count_table("Model", model_counts, model_order),
        ]
    )


def _render_skill_summary(skills: list[SkillEntry]) -> str:
    model_counts = _count_by([s.model for s in skills])
    blast_counts = _count_by([s.blast_tier for s in skills])
    blast_order = [BLAST_NONE, BLAST_NARROW, BLAST_MODERATE, BLAST_BROAD]
    return "\n\n".join(
        [
            f"### Skills: {len(skills)} total\n\n"
            "Model pinning (same unset semantics as agents above):\n\n"
            + _render_count_table(
                "Model",
                model_counts,
                [UNSET_MODEL, *[k for k in model_counts if k != UNSET_MODEL]],
            ),
            "Permission blast radius (`allowed-tools` pre-approves tools "
            "for the invoking turn only — it is a blast-radius signal, "
            "never a capability restriction; see FD-1):\n\n"
            + _render_count_table("Blast radius", blast_counts, blast_order),
        ]
    )


def _render_agent_table(agents: list[AgentEntry]) -> str:
    lines = [
        "| Path | Name | Model | Capability tier | Tool count |",
        "|---|---|---|---|---|",
    ]
    for a in agents:
        tool_count = "all (inherited)" if a.tool_count is None else str(a.tool_count)
        lines.append(
            f"| `{a.rel_path}` | {a.name} | {a.model} | {a.capability_tier} | {tool_count} |"
        )
    return "\n".join(lines)


def _render_skill_table(skills: list[SkillEntry]) -> str:
    lines = [
        "| Path | Name | Model | Blast radius | Allowed-tools count |",
        "|---|---|---|---|---|",
    ]
    for s in skills:
        lines.append(
            f"| `{s.rel_path}` | {s.name} | {s.model} | {s.blast_tier} | {s.allowed_tool_count} |"
        )
    return "\n".join(lines)


def _render_intro(generator_command: str) -> str:
    banner = (
        f"<!-- GENERATED FILE — generated by `{generator_command}`. "
        "Do not hand-edit; run the same command to regenerate, or "
        "`--check` to verify this file is current. -->"
    )
    return (
        "# Fleet Inventory\n\n"
        f"{banner}\n\n"
        "Measured tiering of every agent and skill frontmatter file in "
        "this repo, on three independent axes: tool capability, model "
        "pinning, and (skills only) permission blast radius. Field "
        "semantics are authoritative in `docs/fleet/schema/*.frontmatter"
        ".schema.json` — this document is a derived view, not a second "
        "source of truth."
    )


def render_markdown(
    agents: list[AgentEntry], skills: list[SkillEntry], generator_command: str
) -> str:
    """Render the full inventory document. Deterministic — no timestamps."""
    body = "\n\n".join(
        [
            _render_intro(generator_command),
            "## Summary",
            _render_agent_summary(agents),
            _render_skill_summary(skills),
            "## Agents",
            _render_agent_table(agents),
            "## Skills",
            _render_skill_table(skills),
        ]
    )
    return body + "\n"


# --- CLI -----------------------------------------------------------------


def _collect_entries() -> tuple[list[AgentEntry], list[SkillEntry]]:
    """Parse every agent and skill frontmatter file into sorted entries."""
    agents = [
        build_agent_entry(p, REPO_ROOT, yaml.safe_load)
        for p in discover_agent_paths(REPO_ROOT)
    ]
    agents.sort(key=lambda entry: entry.rel_path)

    skills = [
        build_skill_entry(p, REPO_ROOT, yaml.safe_load)
        for p in discover_skill_paths(REPO_ROOT)
    ]
    skills.sort(key=lambda entry: entry.rel_path)

    return agents, skills


def _run_check(content: str) -> int:
    """Compare freshly generated content against the committed file."""
    if not OUTPUT_PATH.exists():
        print(
            f"{OUTPUT_PATH} does not exist — run: {GENERATOR_COMMAND}", file=sys.stderr
        )
        return 1

    existing = OUTPUT_PATH.read_text(encoding="utf-8")
    if existing == content:
        return 0

    diff = difflib.unified_diff(
        existing.splitlines(keepends=True),
        content.splitlines(keepends=True),
        fromfile="docs/fleet/inventory.md (committed)",
        tofile="docs/fleet/inventory.md (regenerated)",
    )
    sys.stderr.writelines(diff)
    print(f"\ninventory.md is stale — run: {GENERATOR_COMMAND}", file=sys.stderr)
    return 1


def main(argv: list[str]) -> int:
    """Entry point: generate or check docs/fleet/inventory.md."""
    parser = argparse.ArgumentParser(description="Generate the fleet inventory doc.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify the committed inventory is current; write nothing",
    )
    args = parser.parse_args(argv)

    agents, skills = _collect_entries()
    content = render_markdown(agents, skills, GENERATOR_COMMAND)

    if args.check:
        return _run_check(content)

    OUTPUT_PATH.write_text(content, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
