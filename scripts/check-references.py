#!/usr/bin/env python3
"""Report-only scan for dangling references to agents, skills, and hooks.

Scans CLAUDE.md, rules/*.md, agents/**/*.md, skills/*/SKILL.md, and
settings.json for references to agents/*.md, skills/*/SKILL.md, or
hooks/*.py files that no longer exist on disk. This is the search step
of the retirement procedure in docs/fleet/lifecycle.md — run it BEFORE
deleting a fleet file, and again AFTER, to confirm nothing was left
dangling.

Per decision FD-8, deleting a file is `rm`, not a Write/Edit tool call,
so no PostToolUse hook can intercept it — a hook would give false
assurance that deletions are checked when they structurally cannot be.
This script is therefore report-only and NEVER wired into settings.json
as a hook. It always exits 0, on every code path, including when
dangling references are found. Do not add a nonzero exit path here and
do not add a PreToolUse/PostToolUse hook around `rm` or this script —
both would misrepresent what a hook can observe.

Design note — avoiding false-positive explosion:
Agent, skill, and hook names are sometimes common English words (an
agent literally named "claude", a skill named "explore", a rule that
says "plan the work"). Matching those as bare words against prose would
flag nearly every paragraph in CLAUDE.md and rules/*.md. Instead this
script ONLY matches identifiers used in machine-meaningful positions:
  - explicit path forms: agents/<path>.md, skills/<name>/SKILL.md,
    hooks/<name>.py
  - explicit invocation form: subagent_type: "<name>"
Prose mentions of an agent/skill by name with no path or invocation
marker (e.g. "the Explore agent finds files") are intentionally NOT
matched. This trades recall for precision: it will miss a reference
that exists only in prose, but it will not bury real findings under
words like "claude" or "plan" flagged as dangling.

Excluded on purpose: `Skill(<name>:*)` permission entries in
settings.json. Claude Code ships built-in skills (e.g. `update-config`,
`init`, `security-review`, `run`, `loop`, `schedule`) that are not
backed by a skills/*/SKILL.md file in this repo at all — they have no
on-disk form here to check against. Flagging every Skill() permission
that isn't a local skills/ subdirectory would misreport those built-ins
as dangling, which is exactly the false-positive class this script
exists to avoid. Only path-form and subagent_type references are
checked, because both are fully grounded in files this repo controls.
"""
import re
import sys
from collections.abc import Callable
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (agent_paths, agent_names, skill_names, hook_names, docs_paths, rule_names)
Fleet = tuple[set[str], set[str], set[str], set[str], set[str], set[str]]
# (regex, valid_ids, id_from_match, label_from_id)
PatternCheck = tuple[
    "re.Pattern[str]", set[str],
    Callable[["re.Match[str]"], str], Callable[[str], str],
]

# Built-in subagent_type values with no backing agents/*.md file in this
# repo (Claude Code ships these; see F042). Union into agent_names so a
# reference like `subagent_type: "fork"` isn't reported as dangling.
BUILTIN_SUBAGENT_TYPES = frozenset(
    {"agent-team", "fork", "general-purpose", "Explore", "Plan", "claude"}
)

FRONTMATTER_NAME_RE = re.compile(r"^name:\s*(.+?)\s*$", re.MULTILINE)
AGENT_PATH_RE = re.compile(r"agents/([\w./-]+\.md)")
SKILL_PATH_RE = re.compile(r"skills/([\w-]+)/SKILL\.md")
HOOK_PATH_RE = re.compile(r"hooks/([\w.-]+\.(?:py|sh))")
DOCS_PATH_RE = re.compile(r"docs/([\w./-]+\.md)")
SUBAGENT_TYPE_RE = re.compile(
    r"subagent_type[\"']?\s*[:=]\s*[\"']([a-zA-Z0-9_-]+)[\"']"
)
REQUIRED_RULES_HEADING_RE = re.compile(r"^## Required Rules\s*$", re.MULTILINE)
NEXT_HEADING_RE = re.compile(r"^## ", re.MULTILINE)
RULE_NAME_RE = re.compile(r"^- `(?:.*?/)?([\w-]+\.md)`", re.MULTILINE)


def frontmatter_name(text: str) -> str | None:
    """Extract the `name:` value from a YAML frontmatter block.

    Avoids a yaml import (system python3 has no pyyaml installed) by
    parsing only the first `---`-delimited block with a plain regex.
    """
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    block = text[:end] if end != -1 else text[:500]
    match = FRONTMATTER_NAME_RE.search(block)
    return match.group(1) if match else None


def _discover_agents() -> tuple[set[str], set[str]]:
    """Return (agent_paths, agent_names) for every agents/**/*.md file."""
    agent_paths = set()
    agent_names = set()
    for path in (ROOT / "agents").rglob("*.md"):
        rel = path.relative_to(ROOT).as_posix()
        agent_paths.add(rel)
        name = frontmatter_name(path.read_text(errors="replace"))
        if name:
            agent_names.add(name)
    return agent_paths, agent_names


def _discover_skills() -> set[str]:
    return {path.parent.name for path in (ROOT / "skills").glob("*/SKILL.md")}


def _discover_hooks() -> set[str]:
    hook_names = set()
    hooks_dir = ROOT / "hooks"
    if hooks_dir.is_dir():
        for pattern in ("*.py", "*.sh"):
            for path in hooks_dir.glob(pattern):
                hook_names.add(path.name)
    return hook_names


def _discover_names_in_dir(
    dirname: str, glob: str, as_rel_path: bool
) -> set[str]:
    """Collect either relative-path or basename identifiers from a dir."""
    names = set()
    directory = ROOT / dirname
    if directory.is_dir():
        for path in directory.glob(glob):
            if as_rel_path:
                names.add(path.relative_to(ROOT).as_posix())
            else:
                names.add(path.name)
    return names


def discover_fleet() -> Fleet:
    """Build the sets of identifiers that genuinely exist on disk."""
    agent_paths, agent_names = _discover_agents()
    skill_names = _discover_skills()
    hook_names = _discover_hooks()
    docs_paths = _discover_names_in_dir("docs", "**/*.md", as_rel_path=True)
    rule_names = _discover_names_in_dir("rules", "*.md", as_rel_path=False)

    return (
        agent_paths, agent_names, skill_names, hook_names, docs_paths,
        rule_names,
    )


def referencing_files() -> list[Path]:
    files = []
    claude_md = ROOT / "CLAUDE.md"
    if claude_md.is_file():
        files.append(claude_md)
    files.extend(sorted((ROOT / "rules").glob("*.md")))
    files.extend(sorted((ROOT / "agents").rglob("*.md")))
    files.extend(sorted((ROOT / "skills").glob("*/SKILL.md")))
    settings = ROOT / "settings.json"
    if settings.is_file():
        files.append(settings)
    return files


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def _check_pattern(
    text: str,
    pattern: "re.Pattern[str]",
    valid_ids: set[str],
    id_from_match: Callable[["re.Match[str]"], str],
    label_from_id: Callable[[str], str],
) -> list[tuple[int, str]]:
    """Find all pattern matches whose derived identifier isn't in valid_ids."""
    findings = []
    for match in pattern.finditer(text):
        identifier = id_from_match(match)
        if identifier not in valid_ids:
            findings.append(
                (line_number(text, match.start()), label_from_id(identifier))
            )
    return findings


def _pattern_checks(
    agent_paths: set[str],
    agent_names: set[str],
    skill_names: set[str],
    hook_names: set[str],
) -> list[PatternCheck]:
    """(regex, valid_ids, id_from_match, label_from_id) for each check."""
    return [
        (AGENT_PATH_RE, agent_paths,
         lambda m: "agents/" + m.group(1),
         lambda rel: f"dangling agent path reference: {rel}"),
        (SKILL_PATH_RE, skill_names,
         lambda m: m.group(1),
         lambda n: f"dangling skill path reference: skills/{n}/SKILL.md"),
        (HOOK_PATH_RE, hook_names,
         lambda m: m.group(1),
         lambda n: f"dangling hook path reference: hooks/{n}"),
        (SUBAGENT_TYPE_RE, agent_names | BUILTIN_SUBAGENT_TYPES,
         lambda m: m.group(1),
         lambda n: f"dangling subagent_type reference: {n!r}"),
    ]


def _docs_pattern_check(docs_paths: set[str]) -> PatternCheck:
    """(regex, valid_ids, id_from_match, label_from_id) for docs refs.

    Scoped by scan_file() to rules/*.md callers only: agent and skill
    prompts legitimately describe generic docs/...md paths for the target
    projects this repo builds, which are not references into this repo.
    """
    return (
        DOCS_PATH_RE, docs_paths,
        lambda m: "docs/" + m.group(1),
        lambda rel: f"dangling docs path reference: {rel}",
    )


def _required_rules_section(text: str) -> tuple[str, int] | None:
    """Return (section_text, start_offset) for the '## Required Rules'
    heading through the next '## ' heading or EOF, or None if absent.
    """
    heading = REQUIRED_RULES_HEADING_RE.search(text)
    if not heading:
        return None
    start = heading.end()
    next_heading = NEXT_HEADING_RE.search(text, start)
    end = next_heading.start() if next_heading else len(text)
    return text[start:end], start


def _check_rule_names(text: str, rule_names: set[str]) -> list[tuple[int, str]]:
    """Find dangling rule-name references under '## Required Rules'."""
    section = _required_rules_section(text)
    if section is None:
        return []
    section_text, offset = section
    findings = []
    for match in RULE_NAME_RE.finditer(section_text):
        name = match.group(1)
        if name not in rule_names:
            findings.append(
                (line_number(text, offset + match.start()),
                 f"dangling rule reference: {name}")
            )
    return findings


def scan_file(path: Path, fleet: Fleet) -> list[tuple[int, str]]:
    """Return a list of (line, message) dangling-reference findings."""
    (agent_paths, agent_names, skill_names, hook_names, docs_paths,
     rule_names) = fleet
    text = path.read_text(errors="replace")
    rel = path.relative_to(ROOT).as_posix()
    checks = _pattern_checks(agent_paths, agent_names, skill_names, hook_names)
    if rel.startswith("rules/"):
        checks = checks + [_docs_pattern_check(docs_paths)]
    findings = []
    for pattern, valid_ids, id_from_match, label_from_id in checks:
        findings.extend(
            _check_pattern(text, pattern, valid_ids, id_from_match,
                            label_from_id)
        )
    if rel.startswith("agents/"):
        findings.extend(_check_rule_names(text, rule_names))
    return sorted(set(findings))


def main() -> int:
    # (agent_paths, agent_names, skill_names, hook_names, docs_paths,
    #  rule_names)
    fleet = discover_fleet()

    any_findings = False
    for path in referencing_files():
        rel = path.relative_to(ROOT).as_posix()
        findings = scan_file(path, fleet)
        if not findings:
            continue
        any_findings = True
        print(f"{rel}:")
        for line, message in findings:
            print(f"  line {line}: {message}")

    if not any_findings:
        pass  # empty stdout == no dangling references, per contract

    return 0  # always 0 — report-only per FD-8, never a gate


if __name__ == "__main__":
    sys.exit(main())
