# _hooklib.sh — shared shell helpers for hook scripts (sourced, not run).
#
# Extracted from the ~15-20 duplicated lines in log-hook-event.sh and
# log-instructions-loaded.sh (F033): stdin-read-with-timeout, JSONL append
# with a python3-then-printf fallback. hook_append_jsonl also redacts long
# values so a leaked credential in a denied command doesn't persist in
# plaintext forever (F040), and hook_rotate_log bounds the log files by size
# and age so they stay queryable instead of growing unbounded (F040).
#
# Every function here is best-effort: it must never itself cause a hook to
# exit non-zero or hang.

# Read the hook's stdin payload (bounded by a 5s timeout so a stuck writer
# cannot stall the session) into the caller's $HOOK_PAYLOAD variable.
hook_read_payload() {
    HOOK_PAYLOAD=""
    if ! IFS= read -r -t 5 -d '' HOOK_PAYLOAD; then
        :  # -d '' returns non-zero at EOF even on success; keep what we got.
    fi
}

# hook_rotate_log <file> [max_bytes=10485760] [max_age_days=30]
# Renames <file> to "<file>.<timestamp>" once it exceeds either bound.
# Silent no-op when the file doesn't exist; failures are swallowed.
hook_rotate_log() {
    local file="$1"
    local max_bytes="${2:-10485760}"
    local max_age_days="${3:-30}"
    [[ -f "$file" ]] || return 0

    local size mtime age_days
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
    mtime=$(stat -f%m "$file" 2>/dev/null || stat -c%Y "$file" 2>/dev/null || echo "")
    age_days=0
    if [[ -n "$mtime" ]]; then
        age_days=$(( ($(date +%s) - mtime) / 86400 ))
    fi

    if [[ "$size" -gt "$max_bytes" || "$age_days" -gt "$max_age_days" ]]; then
        mv "$file" "$file.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
    fi
}

# hook_append_jsonl <event_name> <payload> <path>
# Best-effort append of one JSONL row tagged with event_name and logged_at.
# Any tool_input.command or error value over 200 chars is truncated with a
# redaction marker before writing. Falls back to a raw printf/append when
# python3 is unavailable or the payload fails to parse as JSON.
hook_append_jsonl() {
    local event_name="$1"
    local payload="$2"
    local path="$3"

    if command -v python3 >/dev/null 2>&1; then
        python3 -c '
import json, sys, datetime

def redact(value, limit=200):
    if isinstance(value, str) and len(value) > limit:
        return f"{value[:limit]}...<{len(value) - limit} more chars redacted>"
    return value

event_name, raw, path = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    event = json.loads(raw)
    if not isinstance(event, dict):
        event = {"raw": raw}
except Exception:
    event = {"raw": raw}
tool_input = event.get("tool_input")
if isinstance(tool_input, dict) and "command" in tool_input:
    tool_input["command"] = redact(tool_input["command"])
if "error" in event:
    event["error"] = redact(event["error"])
event["event"] = event_name
event["logged_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
with open(path, "a", encoding="utf-8") as fh:
    fh.write(json.dumps(event, separators=(",", ":")) + "\n")
' "$event_name" "$payload" "$path" 2>/dev/null \
            || printf '{"event":"%s","raw":%s}\n' "$event_name" "$payload" >> "$path" 2>/dev/null
    else
        printf '%s\n' "$payload" >> "$path" 2>/dev/null
    fi
}
