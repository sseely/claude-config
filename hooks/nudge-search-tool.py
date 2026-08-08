#!/usr/bin/env python3
"""
PreToolUse hook: nudge toward LSP/Serena/ast-grep on symbol-shaped Greps.

Never blocks and never auto-approves — emits `permissionDecision: defer`
with `additionalContext`, so the normal permission flow is untouched and
Claude simply sees a reminder before deciding.

Fail-open: any exception exits 0 silently rather than disrupting a search.

Rationale: rules/lsp.md ranks LSP > ast-grep > Grep for code search, but
that ordering loses to habit under context pressure. A bare identifier is
the one Grep shape that is almost always better served by find-references
or find_symbol, so it is the only shape this hook reacts to.

The advice is language-specific because the correct fallback differs by
language in this environment: PHP, Go, and Ruby have no LSP plugin
installed, so "use LSP" is wrong there and the nudge routes to Serena or
ast-grep instead. Language identifiers were verified against ast-grep
0.45.0 (`--lang` rejects `powershell`); LSP names are the enabled plugins
in settings.json.
"""
import fnmatch
import json
import os
import re
import sys

# A bare identifier — no regex metacharacters, no whitespace. This is the
# signature of "I am looking for a symbol", which is exactly what LSP and
# Serena resolve semantically and Grep resolves only by coincidence.
IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

# Below this, matches are too generic for a symbol lookup to beat text search.
MIN_IDENTIFIER_LEN = 3

# lang key -> (ast-grep --lang value or None, installed LSP plugin or None).
# A None LSP means no plugin is enabled for that language: do not suggest LSP.
LANG_INFO = {
    "ts": ("ts", "typescript-lsp"),
    "tsx": ("tsx", "typescript-lsp"),
    "js": ("js", "typescript-lsp"),
    "jsx": ("jsx", "typescript-lsp"),
    "python": ("python", "pyright-lsp"),
    "rust": ("rust", "rust-analyzer-lsp"),
    "c": ("c", "clangd-lsp"),
    "cpp": ("cpp", "clangd-lsp"),
    "java": ("java", "jdtls-lsp"),
    "csharp": ("csharp", "csharp-lsp"),
    "php": ("php", None),
    "go": ("go", None),
    "ruby": ("ruby", None),
    "powershell": (None, None),
}

SUFFIX_TO_LANG = {
    "ts": "ts", "mts": "ts", "cts": "ts", "tsx": "tsx",
    "js": "js", "mjs": "js", "cjs": "js", "jsx": "jsx",
    "py": "python", "pyi": "python",
    "rs": "rust",
    "c": "c", "h": "c",
    "cpp": "cpp", "cc": "cpp", "cxx": "cpp", "hpp": "cpp",
    "java": "java",
    "cs": "csharp",
    "php": "php",
    "go": "go",
    "rb": "ruby",
    "ps1": "powershell", "psm1": "powershell", "psd1": "powershell",
}

# Grep's own --type values, which do not always match file suffixes.
TYPE_TO_LANG = {
    "ts": "ts", "tsx": "tsx", "js": "js", "jsx": "jsx",
    "py": "python", "python": "python",
    "rust": "rust", "rs": "rust",
    "c": "c", "cpp": "cpp", "cxx": "cpp",
    "java": "java", "cs": "csharp", "csharp": "csharp",
    "php": "php", "go": "go", "rb": "ruby", "ruby": "ruby",
    "ps1": "powershell",
}

# Project markers, checked against the session cwd when the Grep call itself
# carries no language signal. Ordered: the first match wins, so a TypeScript
# config outranks the package.json that usually sits beside it.
MARKERS = (
    ("go.mod", "go"),
    ("Cargo.toml", "rust"),
    ("pom.xml", "java"),
    ("build.gradle", "java"),
    ("build.gradle.kts", "java"),
    ("*.csproj", "csharp"),
    ("*.sln", "csharp"),
    ("composer.json", "php"),
    ("Gemfile", "ruby"),
    ("tsconfig.json", "ts"),
    ("pyproject.toml", "python"),
    ("setup.py", "python"),
    ("requirements.txt", "python"),
    ("CMakeLists.txt", "cpp"),
    ("package.json", "js"),
)

# Greps explicitly scoped to prose or config are legitimate per rules/lsp.md
# ("string literal in comments, docs, or config files") — stay silent there.
NON_CODE_SUFFIXES = frozenset([
    "md", "mdx", "txt", "rst", "json", "jsonc", "yaml", "yml",
    "toml", "ini", "cfg", "conf", "csv", "tsv", "lock", "log",
])

NON_CODE_TYPES = frozenset([
    "md", "markdown", "txt", "json", "yaml", "toml", "csv", "log",
])


def is_symbol_like(pattern):
    """True when the pattern is a bare identifier long enough to be a symbol."""
    return (
        isinstance(pattern, str)
        and len(pattern) >= MIN_IDENTIFIER_LEN
        and bool(IDENTIFIER_RE.match(pattern))
    )


def glob_suffixes(glob):
    """Extension tokens in a glob — handles '*.md' and '**/*.{md,txt}'."""
    if not isinstance(glob, str):
        return []
    return [s.lower() for s in re.findall(r"\.([A-Za-z0-9]+)", glob)]


def targets_non_code(tool_input):
    """True when the search is explicitly scoped to prose or config files."""
    file_type = tool_input.get("type")
    if isinstance(file_type, str) and file_type.lower() in NON_CODE_TYPES:
        return True
    suffixes = glob_suffixes(tool_input.get("glob"))
    return bool(suffixes) and all(s in NON_CODE_SUFFIXES for s in suffixes)


def lang_from_input(tool_input):
    """Language implied by the Grep call's own type/glob arguments."""
    file_type = tool_input.get("type")
    if isinstance(file_type, str):
        hit = TYPE_TO_LANG.get(file_type.lower())
        if hit:
            return hit
    for suffix in glob_suffixes(tool_input.get("glob")):
        hit = SUFFIX_TO_LANG.get(suffix)
        if hit:
            return hit
    return None


def lang_from_cwd(cwd):
    """Language implied by project marker files in the session directory."""
    if not isinstance(cwd, str) or not os.path.isdir(cwd):
        return None
    try:
        entries = os.listdir(cwd)
    except OSError:
        return None
    for marker, lang in MARKERS:
        if any(fnmatch.fnmatch(name, marker) for name in entries):
            return lang
    return None


def tool_hint(lang):
    """The language-appropriate first and second choice, as a sentence."""
    if lang is None:
        return (
            "Prefer LSP find-references / go-to-definition, Serena's "
            "find_symbol or find_referencing_symbols in a subagent, or "
            "`ast-grep -p '<pattern>' --lang <lang>` when the shape matters."
        )
    astgrep_lang, lsp = LANG_INFO.get(lang, (None, None))
    if lsp:
        first = (
            f"LSP find-references / go-to-definition ({lsp} is installed), "
            "or Serena's find_symbol / find_referencing_symbols in a subagent"
        )
    else:
        first = (
            f"Serena's find_symbol / find_referencing_symbols — no LSP plugin "
            f"is installed for {lang}, so the LSP tool will not help here"
        )
    if astgrep_lang:
        second = f" For structural shape, use `ast-grep -p '<pattern>' --lang {astgrep_lang}`."
    else:
        second = f" ast-grep does not support {lang}; Grep is the correct fallback."
    return first + "." + second


def build_nudge(lang):
    """Assemble the reminder injected into Claude's context."""
    return (
        "Symbol-shaped Grep detected (the pattern is a bare identifier"
        + (f", {lang} context" if lang else "")
        + "). Per rules/lsp.md, a known symbol name is better served by "
        + tool_hint(lang)
        + " Use Grep only if the symbol name is unknown, the target is not "
        "code, or this is initial discovery."
    )


def should_nudge(event):
    """Gate the nudge on tool name, pattern shape, and search scope."""
    if event.get("tool_name") != "Grep":
        return False
    tool_input = event.get("tool_input") or {}
    if not isinstance(tool_input, dict):
        return False
    if not is_symbol_like(tool_input.get("pattern")):
        return False
    return not targets_non_code(tool_input)


def main():
    try:
        event = json.load(sys.stdin)
    except Exception:
        return  # Fail open: a malformed event must never disrupt a search.

    try:
        if not should_nudge(event):
            return
        tool_input = event.get("tool_input") or {}
        lang = lang_from_input(tool_input) or lang_from_cwd(event.get("cwd"))
        json.dump({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "defer",
                "additionalContext": build_nudge(lang),
            }
        }, sys.stdout)
    except Exception:
        return


if __name__ == "__main__":
    main()
    sys.exit(0)
