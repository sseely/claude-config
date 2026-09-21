#!/usr/bin/env python3
"""
PreToolUse hook: block catastrophic Bash commands.

Replaces the inline `python3 -c` blob previously embedded in settings.json.
Same two guards, same blocking contract (exit 2 + stderr), but the rm check
no longer fires on every absolute path.

The old pattern was `rm\\s+-rf\\s+/`, which matched `rm -rf /tmp/scratch` as
readily as `rm -rf /` — so it blocked ordinary cleanup while missing `rm -fr /`
and `rm -r --force /` entirely. This version parses flags and targets, then
blocks only when a recursive delete is aimed at a protected root.

Fail-open on malformed input: a hook that cannot read its event must not
wedge the session. It fails *closed* on anything it does parse as dangerous.

D8 additions: `iter_segments` recurses into `bash -c`/`sh -c`/`zsh -c` string
arguments so a wrapped `rm -rf /` cannot bypass `check_rm`; `check_find`
denies `find <protected> -delete`/`-exec rm`; `check_git_ask` asks (does not
block) on `git clean -f*`/`git reset --hard` — verified against the live
Claude Code hooks docs (code.claude.com/docs/en/hooks, fetched 2026-09-20):
PreToolUse hookSpecificOutput.permissionDecision accepts allow/deny/ask/defer,
and "ask" is documented as "prompts the user to confirm". Every deny/ask is
logged via `log_deny` (hooks/_hooklib.py) so on-call can query denies from
logs/hook-events.jsonl instead of only from internal-exception logs (F093).
"""
import json
import os
import re
import shlex
import sys
from collections.abc import Iterator

from _hooklib import log_deny, log_error

SEGMENT_SPLIT = re.compile(r"[;&|]+|\n")

# Recursive delete of any of these wipes a system or an entire account.
# Compared after expanding ~ / $HOME and stripping quotes and trailing slashes.
PROTECTED = frozenset([
    "/", "", "/bin", "/boot", "/dev", "/etc", "/home", "/lib", "/lib64",
    "/opt", "/proc", "/root", "/sbin", "/srv", "/sys", "/usr", "/var",
    "/System", "/Library", "/Applications", "/Users", "/Volumes",
    "/private", "/private/var", "/private/etc", "/private/tmp", "/tmp",
])

# Bare globs that expand to "everything here": rm -rf /* , rm -rf ~/*
ROOT_GLOB = re.compile(r"^(?:/|~|\$HOME|\$\{HOME\})/?\*+$")

# Leading tokens that don't change what command actually runs.
STRIP_PREFIXES = ("sudo", "command", "env", "time")

# Shells whose `-c "..."` string argument is itself a command to re-check.
SHELL_C_PROGS = frozenset(["bash", "sh", "zsh"])


def normalize_target(token: str) -> str:
    """Strip quotes, expand ~ and $HOME, drop trailing slashes."""
    t = token.strip().strip("'\"")
    t = t.replace("${HOME}", "~").replace("$HOME", "~")
    if t == "~" or t.startswith("~/"):
        t = os.path.expanduser(t)
    t = re.sub(r"/+$", "", t)
    return t


def is_dangerous_target(token: str) -> bool:
    """True when a recursive delete of this target would be catastrophic."""
    raw = token.strip().strip("'\"")
    if ROOT_GLOB.match(raw):
        return True
    target = normalize_target(token)
    if target in PROTECTED:
        return True
    # The user's own home directory, however it was written.
    return target == os.path.expanduser("~")


def flag_is_recursive(token: str) -> bool:
    """True when a flag token requests recursion (-r, -R, -rf, --recursive)."""
    if token.startswith("--"):
        return token == "--recursive"
    return "r" in token[1:] or "R" in token[1:]


def split_rm_args(tokens: list[str]) -> tuple[bool, list[str]]:
    """Partition rm's argument tokens into (is_recursive, targets)."""
    recursive, targets = False, []
    for token in tokens:
        if token == "--":
            continue
        if token.startswith("-") and len(token) > 1:
            recursive = recursive or flag_is_recursive(token)
        else:
            targets.append(token)
    return recursive, targets


def _strip_prefixes(tokens: list[str]) -> list[str]:
    """Drop leading sudo/command/env/time tokens in place; return tokens."""
    while tokens and tokens[0] in STRIP_PREFIXES:
        tokens.pop(0)
    return tokens


def parse_rm(segment: str) -> tuple[bool, list[str]]:
    """Return (is_recursive, targets) for an `rm` segment, else (False, [])."""
    tokens = _strip_prefixes(segment.strip().split())
    if not tokens or os.path.basename(tokens[0]) != "rm":
        return False, []
    return split_rm_args(tokens[1:])


def _shell_c_arg(segment: str) -> str | None:
    """Inner command string for `[sudo/…] bash -c "..."`, else None."""
    try:
        tokens = shlex.split(segment)
    except ValueError:
        return None
    tokens = _strip_prefixes(tokens)
    if (
        len(tokens) >= 3
        and os.path.basename(tokens[0]) in SHELL_C_PROGS
        and tokens[1] == "-c"
    ):
        return tokens[2]
    return None


def iter_segments(cmd: str, depth: int = 0) -> Iterator[str]:
    """Yield each segment of cmd, recursing into shell -c string arguments.

    Depth-capped at 5 to bound recursion on adversarial nesting.
    """
    if depth > 5:
        return
    for segment in SEGMENT_SPLIT.split(cmd):
        yield segment
        inner = _shell_c_arg(segment)
        if inner is not None:
            yield from iter_segments(inner, depth + 1)


def check_rm(cmd: str) -> str | None:
    """Reason string when the command recursively deletes a protected root."""
    for segment in iter_segments(cmd):
        recursive, targets = parse_rm(segment)
        if not recursive:
            continue
        for target in targets:
            if is_dangerous_target(target):
                return f"recursive delete of protected path {target!r} is not allowed"
    return None


def check_sudo(cmd: str) -> str | None:
    """Reason string when the command escalates privileges."""
    for segment in iter_segments(cmd):
        if segment.strip().startswith("sudo "):
            return "sudo requires project opt-in"
    return None


def _find_targets_dangerous(tokens: list[str]) -> str | None:
    """First dangerous positional target in a `find` token list, else None."""
    for target in tokens[1:]:
        if target.startswith("-"):
            break
        if is_dangerous_target(target):
            return target
    return None


def _find_has_delete(tokens: list[str]) -> bool:
    """True when tokens contain `-delete` or `-exec rm ...`."""
    if "-delete" in tokens:
        return True
    for i, tok in enumerate(tokens):
        following = tokens[i + 1] if i + 1 < len(tokens) else ""
        if tok == "-exec" and os.path.basename(following) == "rm":
            return True
    return False


def check_find(cmd: str) -> str | None:
    """Reason when `find` deletes a protected path via -delete/-exec rm."""
    for segment in iter_segments(cmd):
        tokens = _strip_prefixes(segment.strip().split())
        if not tokens or os.path.basename(tokens[0]) != "find":
            continue
        if not _find_has_delete(tokens):
            continue
        target = _find_targets_dangerous(tokens)
        if target:
            return (
                f"find -delete/-exec rm targeting protected path "
                f"{target!r} is not allowed"
            )
    return None


def _git_clean_forced(tokens: list[str]) -> bool:
    """True when a `git clean` token list carries --force or -f*."""
    return any(
        t == "--force"
        or (t.startswith("-") and not t.startswith("--") and "f" in t[1:])
        for t in tokens[2:]
    )


def check_git_ask(cmd: str) -> str | None:
    """Reason when git clean -f*/--force or git reset --hard appears.

    Per D8 this is a confirmation prompt, not a hard block.
    """
    for segment in iter_segments(cmd):
        tokens = _strip_prefixes(segment.strip().split())
        if len(tokens) < 2 or os.path.basename(tokens[0]) != "git":
            continue
        if tokens[1] == "clean" and _git_clean_forced(tokens):
            return "git clean with --force/-f* deletes untracked files irreversibly"
        if tokens[1] == "reset" and "--hard" in tokens[2:]:
            return "git reset --hard discards uncommitted changes irreversibly"
    return None


def _read_command() -> str | None:
    """Parse tool_input.command from stdin JSON; None on any failure."""
    try:
        cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
    except Exception as e:
        log_error("guard-bash", e)
        return None
    return cmd if isinstance(cmd, str) else None


def main() -> None:
    cmd = _read_command()
    if cmd is None:
        return  # Fail open: malformed/non-string input must not wedge the session.

    # F134 (documented, out of scope): git push --force, chmod -R 777 /, and
    # curl | sh are consciously not covered — D8 names only find/git
    # clean/git reset --hard for this task.
    for reason in (check_rm(cmd), check_sudo(cmd), check_find(cmd)):
        if reason:
            log_deny("guard-bash", reason)
            print(f"BLOCKED: {reason}", file=sys.stderr)
            sys.exit(2)

    ask_reason = check_git_ask(cmd)
    if ask_reason:
        log_deny("guard-bash", ask_reason)
        json.dump({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "ask",
                "permissionDecisionReason": ask_reason,
            }
        }, sys.stdout)


if __name__ == "__main__":
    main()
    sys.exit(0)
