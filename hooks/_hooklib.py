#!/usr/bin/env python3
"""Shared logging helpers for Python hook scripts.

Extracted from the byte-identical `log_error` previously duplicated in
`guard-bash.py` and `nudge-search-tool.py` (F033), plus `log_deny`, which
gives every hook a single place to record a deny/ask decision so on-call can
answer "how many times has X been blocked this month" from
`logs/hook-events.jsonl` (F093) instead of only from internal-exception
logs. Both functions are best-effort and must never raise — a wedged hook is
worse than a missing log line.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

LOG_DIR = Path(__file__).resolve().parent.parent / "logs"


def log_error(hook_name: str, exc: Exception) -> None:
    """Best-effort append of one error line to logs/<hook_name>.err."""
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).isoformat()
        with open(LOG_DIR / f"{hook_name}.err", "a") as f:
            f.write(f"{ts} {hook_name}: {exc!r}\n")
    except Exception:
        pass  # Logging must never itself raise.


def log_deny(hook_name: str, reason: str) -> None:
    """Best-effort append of one HookDeny row to logs/hook-events.jsonl."""
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        row = {
            "event": "HookDeny",
            "hook": hook_name,
            "reason": reason,
            "logged_at": datetime.now(timezone.utc).isoformat(),
        }
        with open(LOG_DIR / "hook-events.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(row, separators=(",", ":")) + "\n")
    except Exception:
        pass  # Logging must never itself raise.
