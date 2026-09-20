#!/usr/bin/env python3
"""Idempotent fixer for six fleet-wide agent-frontmatter defect classes.

Per decisions.md#D1, this single script fixes:
  F001 - duplicated "Required Rules" closer sentence + orphaned continuation
  F002 - non-tool entries in `tools:` frontmatter
  F085 - inert `outputStyle:` frontmatter key
  F150 - stray disconnected ast-grep sentence
  F083 - bare `diagnosis.md` citation missing its rules/ path prefix
  F071 - missing Opus behavioral-compensation block on Opus-routed agents

Parser choice: mirrors scripts/gen-fleet-inventory.py's re-exec pattern
(gen-fleet-inventory.py:27-40) — the system python3 has no PyYAML, so
this module must not `import yaml` until it has confirmed, by
interpreter identity (not a failed import), that it is running under
hooks/.venv/bin/python.

Every fix is a no-op on an already-fixed file: running the script twice
in a row produces an empty change summary on the second run.

This script only ever scans and (optionally) writes agents/**/*.md. It
is never invoked against the live fleet by this task — see
plans/code-review-tasks-2026-09-20/batch-1a/T1-normalize-agents.md.

Usage:
    hooks/.venv/bin/python scripts/normalize-agents.py [--root PATH] [--check]
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VENV_PYTHON = REPO_ROOT / "hooks" / ".venv" / "bin" / "python"
_REEXEC_MARKER = "_NORMALIZE_AGENTS_REEXEC"


def _reexec_into_venv_python_if_needed() -> None:
    """Re-exec into hooks/.venv/bin/python if it isn't already running.

    Never imports yaml to make this decision — compares `sys.prefix`
    against the venv directory instead, so a missing PyYAML under the
    system interpreter never surfaces as an ImportError in the first
    place (see gen-fleet-inventory.py:45-62 for the identical pattern
    and the reasoning behind it).
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

# --- Constants -----------------------------------------------------------

FLOOR_TOOLS = frozenset({"Read", "Grep", "Glob", "Bash"})

# Verified 2026-09-20 against https://code.claude.com/docs/en/sub-agents
# ("Available Tools for Subagents"). `mcp__`-prefixed entries are accepted
# unconditionally regardless of this set (see is_allowed_tool).
TOOL_ALLOWLIST = frozenset(
    {
        "Read", "Grep", "Glob", "Bash", "PowerShell", "Edit", "Write",
        "NotebookEdit", "WebFetch", "WebSearch", "TodoWrite", "Skill",
        "ToolSearch", "EnterWorktree", "ExitWorktree", "Monitor",
        "TaskStop", "SendMessage", "Artifact", "SubagentHandback",
        "Agent", "TaskCreate", "TaskGet", "TaskList", "TaskUpdate",
        "CronCreate", "CronDelete", "CronList", "ListAgents",
    }
)

F150_SENTENCE = "For structural code pattern searches, use `ast-grep`, not Grep."

F071_FILES = frozenset(
    {
        "agents/01-core-development/graphql-architect.md",
        "agents/02-language-specialists/java-architect.md",
        "agents/04-quality-security/ad-security-reviewer.md",
        "agents/04-quality-security/powershell-security-hardening.md",
        "agents/03-infrastructure/cloud-architect.md",
        "agents/05-data-ai/llm-architect.md",
    }
)

# Header every Opus-compensation block starts with, whatever bullets follow.
# Detection keys on this line only, so a block refreshed by hand from the
# current rules/model-routing.md text is recognized and left alone.
F071_HEADER = "**Opus behavioral compensation**"

# Inserted verbatim when a file has no block at all; mirrors the current
# two-section text in rules/model-routing.md.
F071_BLOCK = (
    "**Opus behavioral compensation** (per `rules/model-routing.md`):\n"
    "\n"
    "**Scope discipline:**\n"
    "- Do NOT infer unstated requirements — implement the simplest interpretation\n"
    "- Do NOT over-engineer — no speculative abstractions or extension points\n"
    "- Do NOT spawn subagents unless the task explicitly requires it\n"
    "- If scope is ambiguous, implement the minimal interpretation and note it;\n"
    "  do not silently expand\n"
    "\n"
    "**Output shape:**\n"
    "- A spec, ported source, or enumerated requirement list is NOT ambiguous\n"
    "  scope — implement all of it; the above is not license to trim it\n"
    "- End the prompt per `prompting-quality.md`'s brevity section: \"Return\n"
    "  only the structured result — no preamble, no trailing summary.\"\n"
)

INCOMPLETE_LAST_WORDS = frozenset(
    {
        "a", "an", "the", "in", "of", "to", "for", "and", "or", "with",
        "on", "by", "from", "as", "at", "into", "onto", "upon", "over",
        "under", "about", "that", "which", "is", "are", "be",
    }
)

REQUIRED_RULES_RE = re.compile(r"^## Required Rules\s*$", re.MULTILINE)
NEXT_HEADING_RE = re.compile(r"^## ", re.MULTILINE)
ONE_LINE_CLOSER = (
    "Read the referenced rule file before relying on it — subagents do "
    "not auto-load rules/."
)
TWO_LINE_FIRST = (
    "Read the referenced rule file before relying on it — subagents do not"
)
TWO_LINE_SECOND = "auto-load rules/."
FRONTMATTER_RE = re.compile(r"\A---\n(.*?\n)---\n", re.DOTALL)
TOOLS_LINE_RE = re.compile(r"^tools:[ \t]*(.*)$", re.MULTILINE)
BARE_DIAGNOSIS_RE = re.compile(r"`diagnosis\.md`")
FULL_RULE_PATH_RE = re.compile(r"`([^`]*rules/)[\w-]+\.md`")
OUTPUT_STYLE_RE = re.compile(r"^outputStyle:.*\n", re.MULTILINE)


@dataclass
class FileResult:
    rel_path: str
    fix_codes: list[str] = field(default_factory=list)
    lines_changed: int = 0
    skipped: bool = False


# --- F001: Required Rules closer dedup + orphan reattachment -------------


def find_required_rules_span(text: str) -> tuple[int, int] | None:
    m = REQUIRED_RULES_RE.search(text)
    if not m:
        return None
    start = m.end()
    nxt = NEXT_HEADING_RE.search(text, start)
    end = nxt.start() if nxt else len(text)
    return start, end


def _find_closer_line_spans(lines: list[str]) -> list[tuple[int, int]]:
    spans = []
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if stripped == ONE_LINE_CLOSER:
            spans.append((i, i))
            i += 1
            continue
        if (
            stripped == TWO_LINE_FIRST
            and i + 1 < len(lines)
            and lines[i + 1].strip() == TWO_LINE_SECOND
        ):
            spans.append((i, i + 1))
            i += 2
            continue
        i += 1
    return spans


def _is_orphan_line(line: str) -> bool:
    stripped = line.strip()
    return bool(stripped) and not stripped.startswith("- ")


def _is_incomplete_bullet(line: str) -> bool:
    if not line.lstrip().startswith("- "):
        return False
    text = line.rstrip()
    if text.endswith("."):
        return False
    words = re.findall(r"[A-Za-z']+", text)
    return bool(words) and words[-1].lower() in INCOMPLETE_LAST_WORDS


def _find_reattach_target(lines: list[str], before_idx: int) -> int | None:
    for i in range(before_idx - 1, -1, -1):
        if _is_incomplete_bullet(lines[i]):
            return i
    return None


def _dedup_closers(section: str) -> tuple[str, int]:
    lines = section.split("\n")
    spans = _find_closer_line_spans(lines)
    if len(spans) <= 1:
        return section, 0
    remove_idxs: set[int] = set()
    orphan_targets: dict[int, list[str]] = {}
    for start, end in spans[:-1]:
        remove_idxs.update(range(start, end + 1))
        orphan_idx = end + 1
        if orphan_idx < len(lines) and _is_orphan_line(lines[orphan_idx]):
            remove_idxs.add(orphan_idx)
            target = _find_reattach_target(lines, start)
            if target is not None:
                orphan_targets.setdefault(target, []).append(lines[orphan_idx])
        # collapse the now-redundant blank line directly before this
        # duplicate closer (the surviving closer keeps its own blank line)
        if start - 1 >= 0 and lines[start - 1].strip() == "":
            remove_idxs.add(start - 1)
    new_lines = []
    for i, line in enumerate(lines):
        if i in remove_idxs:
            continue
        new_lines.append(line)
        new_lines.extend(orphan_targets.get(i, []))
    return "\n".join(new_lines), len(remove_idxs)


def fix_f001(text: str) -> tuple[str, int]:
    span = find_required_rules_span(text)
    if span is None:
        return text, 0
    start, end = span
    new_section, changed = _dedup_closers(text[start:end])
    if not changed:
        return text, 0
    return text[:start] + new_section + text[end:], changed


# --- F002: non-tool `tools:` entries --------------------------------------


def is_allowed_tool(name: str) -> bool:
    return name in TOOL_ALLOWLIST or name.startswith("mcp__")


def resolve_tools_list(tools_value: object) -> list[str]:
    if isinstance(tools_value, list):
        return [str(t).strip() for t in tools_value]
    if isinstance(tools_value, str):
        return [t.strip() for t in tools_value.split(",") if t.strip()]
    return []


def _rewrite_tools_block(fm_text: str, kept: set[str]) -> str:
    lines = fm_text.split("\n")
    out = []
    in_block = False
    for line in lines:
        if re.match(r"^tools:\s*$", line):
            in_block = True
            out.append(line)
            continue
        if in_block:
            m = re.match(r"^(\s*-\s*)([^\s#]+.*)$", line)
            if m:
                name = m.group(2).strip().strip("'\"")
                if name in kept:
                    out.append(line)
                continue
            in_block = False
        out.append(line)
    return "\n".join(out)


def _rewrite_tools_line(fm_text: str, raw: object, kept: list[str]) -> str:
    if isinstance(raw, str):
        new_value = ", ".join(kept)
        return TOOLS_LINE_RE.sub(lambda m: f"tools: {new_value}", fm_text, count=1)
    return _rewrite_tools_block(fm_text, set(kept))


def fix_f002(fm_text: str, fm_dict: dict) -> tuple[str, str | None]:
    """Return (new_fm_text, status) with status in {None, "fixed", "skipped"}."""
    if "tools" not in fm_dict:
        return fm_text, None
    raw = fm_dict["tools"]
    names = resolve_tools_list(raw)
    kept = [n for n in names if is_allowed_tool(n)]
    removed = [n for n in names if not is_allowed_tool(n)]
    if not removed:
        return fm_text, None
    if not (FLOOR_TOOLS & set(kept)):
        return fm_text, "skipped"
    return _rewrite_tools_line(fm_text, raw, kept), "fixed"


# --- F085 / F150 / F083 / F071 --------------------------------------------


def fix_f085(fm_text: str) -> tuple[str, int]:
    new_text, n = OUTPUT_STYLE_RE.subn("", fm_text)
    return new_text, n


def fix_f150(text: str) -> tuple[str, int]:
    lines = text.split("\n")
    out = []
    changed = 0
    for line in lines:
        if line.strip() == F150_SENTENCE:
            changed += 1
            continue
        out.append(line)
    return "\n".join(out), changed


def fix_f083(text: str) -> tuple[str, int]:
    span = find_required_rules_span(text)
    if span is None:
        return text, 0
    start, end = span
    section = text[start:end]
    if "`diagnosis.md`" not in section:
        return text, 0
    m = FULL_RULE_PATH_RE.search(section)
    if not m:
        return text, 0
    prefix = m.group(1)
    new_section, n = BARE_DIAGNOSIS_RE.subn(f"`{prefix}diagnosis.md`", section)
    if n == 0:
        return text, 0
    return text[:start] + new_section + text[end:], n


def fix_f071(text: str, rel_path: str) -> tuple[str, int]:
    if rel_path not in F071_FILES:
        return text, 0
    if F071_HEADER in text:
        return text, 0
    m = FRONTMATTER_RE.match(text)
    if not m:
        return text, 0
    insert_at = m.end()
    new_text = text[:insert_at] + "\n" + F071_BLOCK + "\n" + text[insert_at:]
    return new_text, 1


# --- Orchestration ---------------------------------------------------------


def _apply_frontmatter_fixes(text: str) -> tuple[str, str | None, list[str], int]:
    """Apply F002 and F085 (both operate on parsed frontmatter). Returns
    (new_text, f002_status, codes, lines_changed)."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return text, None, [], 0
    fm_text = m.group(1)
    fm_dict = yaml.safe_load(fm_text) or {}
    codes: list[str] = []
    lines_changed = 0

    new_fm_text, f002_status = fix_f002(fm_text, fm_dict)
    if f002_status == "fixed":
        fm_text = new_fm_text
        codes.append("F002")
        lines_changed += 1

    new_fm_text, n = fix_f085(fm_text)
    if n:
        fm_text = new_fm_text
        codes.append("F085")
        lines_changed += n

    new_text = text[: m.start(1)] + fm_text + text[m.end(1) :]
    return new_text, f002_status, codes, lines_changed


def _apply_body_fixes(text: str, rel_path: str) -> tuple[str, list[str], int]:
    """Apply the four body-level fixes (F001, F150, F083, F071) in order."""
    codes: list[str] = []
    lines_changed = 0
    for code, fixer in (
        ("F001", fix_f001),
        ("F150", fix_f150),
        ("F083", fix_f083),
        ("F071", lambda t: fix_f071(t, rel_path)),
    ):
        text, n = fixer(text)
        if n:
            codes.append(code)
            lines_changed += n
    return text, codes, lines_changed


def process_file(path: Path, root: Path) -> FileResult:
    rel_path = str(path.relative_to(root))
    original = path.read_text()

    text, f002_status, fm_codes, fm_lines = _apply_frontmatter_fixes(original)
    if f002_status == "skipped":
        return FileResult(rel_path, ["SKIPPED"], 0, skipped=True)

    text, body_codes, body_lines = _apply_body_fixes(text, rel_path)
    codes = fm_codes + body_codes
    lines_changed = fm_lines + body_lines

    if text != original:
        path.write_text(text)
        return FileResult(rel_path, codes, lines_changed)
    return FileResult(rel_path, [], 0)


def print_summary(results: list[FileResult]) -> None:
    changed = 0
    skipped = 0
    clean = 0
    for r in results:
        if r.skipped:
            skipped += 1
            print(f"{r.rel_path}\tSKIPPED\t0")
        elif r.fix_codes:
            changed += 1
            print(f"{r.rel_path}\t{','.join(r.fix_codes)}\t{r.lines_changed}")
        else:
            clean += 1
    print(f"TOTAL\t{changed}\t{skipped}\t{clean}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=str(REPO_ROOT), help="repo root to scan")
    args = parser.parse_args(argv)
    root = Path(args.root).resolve()
    files = sorted((root / "agents").rglob("*.md"))
    results = [process_file(f, root) for f in files]
    print_summary(results)
    return 0


if __name__ == "__main__":
    sys.exit(main())
