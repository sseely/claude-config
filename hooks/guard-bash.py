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
"""
import json
import os
import re
import sys

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


def normalize_target(token):
    """Strip quotes, expand ~ and $HOME, drop trailing slashes."""
    t = token.strip().strip("'\"")
    t = t.replace("${HOME}", "~").replace("$HOME", "~")
    if t == "~" or t.startswith("~/"):
        t = os.path.expanduser(t)
    t = re.sub(r"/+$", "", t)
    return t


def is_dangerous_target(token):
    """True when a recursive delete of this target would be catastrophic."""
    raw = token.strip().strip("'\"")
    if ROOT_GLOB.match(raw):
        return True
    target = normalize_target(token)
    if target in PROTECTED:
        return True
    # The user's own home directory, however it was written.
    return target == os.path.expanduser("~")


def flag_is_recursive(token):
    """True when a flag token requests recursion (-r, -R, -rf, --recursive)."""
    if token.startswith("--"):
        return token == "--recursive"
    return "r" in token[1:] or "R" in token[1:]


def split_rm_args(tokens):
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


def parse_rm(segment):
    """Return (is_recursive, targets) for an `rm` segment, else (False, [])."""
    tokens = segment.strip().split()
    while tokens and tokens[0] in ("sudo", "command", "env", "time"):
        tokens.pop(0)
    if not tokens or os.path.basename(tokens[0]) != "rm":
        return False, []
    return split_rm_args(tokens[1:])


def check_rm(cmd):
    """Reason string when the command recursively deletes a protected root."""
    for segment in SEGMENT_SPLIT.split(cmd):
        recursive, targets = parse_rm(segment)
        if not recursive:
            continue
        for target in targets:
            if is_dangerous_target(target):
                return f"recursive delete of protected path {target!r} is not allowed"
    return None


def check_sudo(cmd):
    """Reason string when the command escalates privileges."""
    for segment in SEGMENT_SPLIT.split(cmd):
        if segment.strip().startswith("sudo "):
            return "sudo requires project opt-in"
    return None


def main():
    try:
        cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
    except Exception:
        return  # Fail open: a malformed event must not wedge the session.
    if not isinstance(cmd, str):
        return
    for reason in (check_rm(cmd), check_sudo(cmd)):
        if reason:
            print(f"BLOCKED: {reason}", file=sys.stderr)
            sys.exit(2)


if __name__ == "__main__":
    main()
    sys.exit(0)
