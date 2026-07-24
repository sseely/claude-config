# Self-Improve Phase 2 — Agent D Findings (2026-07-24)

Scope: settings.json (global), .claude/settings.json + settings.local.json
(nested project-local for ~/.claude), .mcp.json, templates/autonomous-settings.json,
hooks/*, post-compact-context.md. Read-only audit.

Note: this file previously held a phase-2-D audit dated ~2026-06-20. Several
of its findings are now fixed in the current file state (e.g. `go:*`/
`dotnet:*` are now in global `settings.json:66-67`; `session-start.sh` no
longer contains a `sudo apt-get` branch; WebFetch is bare-form everywhere).
This is a full re-audit against current disk state, overwriting that file.

## 1. Hook events not wired

Wired: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PreCompact,
PostCompact, InstructionsLoaded, Stop.
Missing: Notification, SubagentStop, Elicitation, CwdChanged.

- **settings.json (no `Notification` block)** — Severity: Warning. A blocked
  permission prompt does not fire `Stop` (the turn hasn't ended, it's paused
  waiting on the user); `notify-on-stop.sh` never fires for it, so a stalled
  autonomous/background run gives no audible signal that it's waiting on
  approval — exactly the failure mode this audit's brief calls out. Fix: add
  a `Notification` hook that runs
  `osascript -e 'display notification ... sound name "Sosumi"'` (a different
  sound than Stop's "Glass" so the user can distinguish "finished" from
  "blocked, needs you").
- **settings.json (no `SubagentStop` block)** — Severity: Suggestion. Given
  heavy Agent-tool/background-agent use (`parallelism.md`'s 15x cost warning;
  this very audit is running as 4+ parallel agents), nothing currently
  records when a subagent finishes or how long it ran. Fix: append a JSONL
  line (agent name, ISO timestamp) to
  `~/.claude/logs/subagent-completions.log` on `SubagentStop`, giving the
  decision-journal/cost-tracking discipline in `parallelism.md` something to
  audit against instead of nothing.
- **settings.json (no `CwdChanged` block)** — Severity: Suggestion.
  `project-init.sh` only runs on `UserPromptSubmit`, checked against
  whatever `pwd` is at that moment. The `EnterWorktree`/`ExitWorktree` tools
  change the effective project directory mid-session; until the next prompt,
  a new worktree has no `.agent-notes/`, `.mcp.json`, or
  `.serena/project.yml`. Fix: wire `CwdChanged` →
  `~/.claude/hooks/project-init.sh` so worktree entry provisions
  immediately instead of waiting for the next prompt.
- **Elicitation — no concrete trigger found.** The only configured MCP
  server (`serena`, per `.mcp.json:3-12`) does not use elicitation. Not
  recommending wiring this — no current use case justifies it.

## 2. Permission noise (stale one-off entries, global settings.json)

- `settings.json:18` — `Bash(openssl rand:*)`: narrow one-off; local/template
  both grant the general `Bash(openssl *:*)`. Fix: replace with
  `Bash(openssl:*)` to match sibling settings files.
- `settings.json:19` — `Bash(node -e:*)`: single command-string variant.
- `settings.json:88` — `Bash(node --input-type=module:*)`: near-duplicate of
  the line above, looks like a one-off from a specific inline-ESM task.
  Fix: drop; a broader `Bash(node:*)` covers this without a second bespoke
  entry.
- `settings.json:87` — `Bash(xargs kill:*)`: single-purpose leftover from a
  process-cleanup task. Fix: remove; re-add only if a recurring need
  appears.
- `settings.json:91` — `Bash(python3 ~/.claude/hooks/check-complexity.py)`:
  literal, no-args permission to manually run a hook that's already
  auto-invoked via `PostToolUse` (`settings.json:202-211`). Stale
  development/testing leftover. Fix: remove unless manual reruns are a real
  workflow.
- `settings.json:95` — `Bash(curl -s https://raw.githubusercontent.com/**:*)`:
  scoped one-off; `WebFetch` is already unconditionally allowed
  (`settings.json:112`) and is the tool `code-principles.md` says to prefer
  over raw `curl`. Fix: remove; use WebFetch instead.
- `settings.json:96` — `Bash(curl -sS https://api.github.com/repos/**:*)`:
  scoped one-off, redundant with `Bash(gh api:*)` (`settings.json:45`), the
  structured equivalent for the same host. Fix: remove.
- `settings.json:117` — `Edit(~/.claude/skills/code-review/**)`: fully
  subsumed by `Edit(~/.claude/**)` at `settings.json:102`. Fix: remove as
  dead duplicate.

## 3. Permission gaps (present in local/template, missing from global)

- **`Bash(cp *:*)` / `Bash(mv *:*)`** — present in
  `.claude/settings.local.json:26-27` and
  `templates/autonomous-settings.json:27-28`; **absent from global
  `settings.json` entirely.** Basic file copy/move is trusted enough to be
  in every other settings file in this repo but prompts every time in a
  normal interactive global session. Fix: add `Bash(cp *:*)` /
  `Bash(mv *:*)` to `settings.json`'s `permissions.allow`.
- **`Bash(psql *:*)`** — present in `settings.local.json:16` and
  `templates/autonomous-settings.json:12`; absent from global
  `settings.json`. Given how many skills in this config target a
  Cloudflare Workers + Neon Postgres stack (`payments-setup`, `auth-setup`,
  `testing-setup`, `compliance-setup`, `analytics-setup`), lacking `psql`
  in the global permission set forces a prompt on essentially every project
  this config is built for. Fix: add `Bash(psql *:*)`.
- **`Bash(yarn *:*)`** — present in `settings.local.json:7` only (not even
  in the autonomous template); global has zero yarn permissions despite
  full npm/pnpm coverage. Fix: add `Bash(yarn *:*)` to `settings.json` for
  parity with npm/pnpm.
- **`Bash(docker-compose *:*)`** (hyphenated v1 binary) — present in
  `settings.local.json:12` and `templates/autonomous-settings.json:10`;
  global only has `Bash(docker compose:*)` (v2 subcommand form,
  `settings.json:76`). Fix: add `Bash(docker-compose *:*)` for projects
  still on the standalone binary.
- **`Bash(sort *:*)` / `Bash(bash -n *:*)`** — present in
  `settings.local.json:32,22`; absent from global. Lower impact than above
  but same category. Fix: add if noticed causing prompts.
- **Note (not a gap, opposite direction):** `settings.local.json:39-43`
  grants unscoped `Read(*)/Write(*)/Edit(*)/Glob(*)/Grep(*)` for the
  `~/.claude` project context — broader than global's directory-scoped
  equivalents (`settings.json:97-111`, limited to `~/git/**`,
  `~/.claude/**`, `~/church/**`). Worth a deliberate look: is unrestricted
  filesystem access intended when working *inside* the config repo, or
  should it be scoped the same way global is? Fix if unintended: narrow to
  `Read(~/.claude/**)` etc. matching global's pattern.
- **Note:** `settings.local.json:37-39` sets
  `"disabledMcpjsonServers": ["serena"]` — this makes every
  `mcp__serena__*` permission grant in that same file (lines 46-56) dead/
  unreachable in this project context. Not clearly a bug (may be an
  intentional local override), but flagging since it silently defeats 11
  permission entries; confirm intentional or remove the disable.

## 4. WebSearch/WebFetch syntax

Verified via grep across all three settings files:
`settings.json:112-113`, `.claude/settings.json:44-45`,
`templates/autonomous-settings.json:46-47` — all three use the bare form
(`"WebFetch"`, `"WebSearch"`), no `(*)` suffix anywhere. Consistent.
`settings.local.json` has no WebFetch/WebSearch entries (doesn't need any).

Commit `65ec9a8` ("normalize WebFetch to bare form in nested settings")
held — no regression found. WebSearch was already bare-form everywhere and
matches WebFetch's convention. **Confidence: MEDIUM** — this session did
not re-fetch Claude Code's permission-syntax docs to confirm bare form is
the only valid syntax for these two tools (some other tools support
`Tool(scope:...)` forms); the internal-consistency finding is HIGH
confidence, the claim about which syntax Claude Code requires carries over
from the prior audit's fix rather than being independently re-verified
here.

## 5. MCP gaps

Only one MCP server is configured in the repo's `.mcp.json`: `serena`
(`.mcp.json:3-12`, code navigation/refactoring). No MCP server backs any of
the `gh`, `curl`, or filesystem shell usage in this repo's tracked config.

- **`gh api/repo/workflow/run/auth`** (`settings.json:45-49`, broadened to
  `Bash(gh *:*)` in local/template) is used purely as raw CLI + text
  parsing. A GitHub MCP server would give structured, typed responses
  (PR/issue/run objects) instead of parsing `gh` CLI stdout, and would let
  permission scoping happen at the operation level instead of "any `gh`
  subcommand". **Suggestion, not verified against the
  `claude-plugins-official` marketplace this session** — check
  `Bash(claude mcp:*)` output (already permitted at `settings.json:86`,
  though missing from the autonomous template, see §7) for an available
  GitHub MCP server before adding a new dependency.
- **`curl` to `raw.githubusercontent.com` / `api.github.com`**
  (`settings.json:95-96`) — no MCP server needed; both are already better
  served by the built-in `WebFetch` tool (already unconditionally allowed,
  §2). This is a "remove the permission, use the existing tool" fix, not an
  MCP gap.
- **Filesystem (`ls`, `find`, `cat`, `grep`, `wc`, `diff`)** — no MCP gap;
  these are already superseded by the native Read/Glob/Grep/Write/Edit
  tools per `lsp.md`'s stated priority order. No action needed.
- **Note:** if a `playwright` MCP server is defined in user-scope
  `~/.claude.json` (outside this repo), it would explain why
  `templates/autonomous-settings.json:58-62` permissions `mcp__playwright__*`
  tools despite the repo's own `.mcp.json` only declaring `serena` — not
  independently re-verified this session (would require reading
  `~/.claude.json`, outside the file list given for this audit). If true,
  flag as a portability gap: the config repo's checked-in `.mcp.json`
  doesn't fully describe what a fresh clone needs.

## 6. Hook quality

All 7 scripts (`autonomous-toggle.sh`, `notify-on-stop.sh`,
`project-init.sh`, `quality-gate.sh`, `record-turn-start.sh`,
`session-start.sh`, `setup-complexity.sh`) **do** start with
`set -euo pipefail` — verified by grep, no exceptions. No platform-guard
gaps found for scripts that need one (only `notify-on-stop.sh` branches on
OS, and it does so correctly, `notify-on-stop.sh:25-28`).

- **`hooks/notify-on-stop.sh:26-28`** — Severity: Warning. The `osascript`/
  `notify-send` call is not wrapped; if it fails (e.g., notification
  permission revoked, PATH missing `osascript`), the script exits non-zero
  with zero logging — silent failure in a fire-and-forget async hook, which
  `error-handling.md`/`logging.md` both flag as a real risk. Fix:
  `osascript ... || echo "[notify-on-stop] failed" >> ~/.claude/logs/hook-errors.log`.
- **`hooks/check-complexity.py:136-138`** — Severity: Note (fail-open is
  intentional per the file's own docstring). The bare
  `except Exception: sys.exit(0)` swallows the exception with no record of
  what happened, so a genuine bug (e.g. `lizard` subprocess timeout,
  malformed JSON) is invisible forever, not just non-blocking. Fix while
  preserving fail-open behavior:
  `except Exception as e: print(f"[check-complexity] {e}", file=sys.stderr); sys.exit(0)`
  — stderr from a hook doesn't block the tool call, only stdout with
  `"decision":"block"` does.
- **`hooks/session-start.sh:29-37`** — Severity: Note. The
  `CLAUDE_AUTO_INSTALL_TOOLS=true` path runs `brew install ast-grep` or
  `cargo install ast-grep --locked` with no timeout, inside an `async: true`
  `SessionStart` hook. A hung `brew`/`cargo` (network stall, lock
  contention) hangs silently with no error surfaced back to the session.
  Fix: wrap with
  `timeout 120 brew install ast-grep || echo "[session-start] ast-grep install timed out/failed" >> ~/.claude/logs/session-start.err`.
  (Note: this script no longer contains a `sudo` branch — that was fixed
  since the prior audit; only a printed instruction mentioning
  `apt-get install ast-grep` remains, which is inert text, not an
  executed command.)
- **Good patterns worth noting (no fix needed):**
  `hooks/project-init.sh:8` uses an `ERR` trap that logs to
  `~/.claude/logs/project-init.err` and always exits 0 (fail-safe, matches
  `error-handling.md`); `hooks/quality-gate.sh:18` uses an `ERR` trap that
  fails *closed* (correct, since this hook's job is to report failure);
  `hooks/autonomous-toggle.sh:43` is properly idempotent (`cmp -s` guard
  before overwriting).

## 7. Autonomous template completeness (global grants, template lacks)

Cross-referenced `settings.json`'s full allow-list against
`templates/autonomous-settings.json`. These are permissions an autonomous
run (no human present) would stall on if it needed them:

- **`mcp__serena__find_referencing_symbols`** — Severity: **Critical**.
  Present in global (`settings.json:126`) but **missing** from
  `templates/autonomous-settings.json:48-57` (which has the other 10
  Serena tools, including the write-capable `rename_symbol` and
  `safe_delete_symbol`). An autonomous agent renaming or deleting a symbol
  — exactly what `rename_symbol`/`safe_delete_symbol` are for — would
  normally check references first via `find_referencing_symbols`; that
  call would hit a permission prompt with no human present to answer it.
  This is the single most concrete instance of the stall failure-mode this
  audit was asked to hunt for. Fix: add
  `"mcp__serena__find_referencing_symbols"` to the template's permission
  list (verified via direct grep diff, not just visual read).
- **`Bash(uv:*)`** (`settings.json:74`, bare/general) vs template's
  `Bash(uv run:*)` + `Bash(uv pip install:*)` only
  (`templates/autonomous-settings.json:17-18`) — Severity: Critical. An
  autonomous run doing `uv sync`, `uv add`, `uv venv`, `uv lock`, or
  `uv tool install` (all common in Python project setup/dependency work)
  would stall. Fix: replace the two narrow entries with `Bash(uv:*)`.
- **`Bash(pip3 install:*)`** (`settings.json:21`) — missing from template
  (which only has `Bash(pip install *:*)`,
  `templates/autonomous-settings.json:19`). These are different literal
  command prefixes for permission matching; on a macOS/Homebrew setup
  where only `pip3` resolves (this environment is darwin), a
  `pip3 install X` call in an autonomous run stalls. Fix: add
  `Bash(pip3 install:*)` to the template.
- **`Bash(volta install:*)`** (`settings.json:64`) — entirely absent from
  the template. A Node-version-pinning step (`volta install node@20`) in
  an autonomous setup task stalls. Fix: add.
- **`Bash(mkdocs build:*)`** (`settings.json:75`) — absent from template.
  Any autonomous docs-build task stalls. Fix: add.
- **`Bash(ollama list:*)` / `Bash(ollama show:*)`** (`settings.json:83-84`)
  — absent from template. Local-model-related autonomous work stalls.
  Fix: add both.
- **`Bash(claude mcp:*)`** (`settings.json:86`) — absent from template. An
  autonomous task that needs to inspect/manage MCP server config (e.g.
  diagnosing an unavailable tool) stalls. Fix: add.

No gaps found in the reverse-critical direction for core package managers
already covered broadly by the template (`npm *:*`, `pnpm *:*`,
`git *:*`, `docker *:*`, `gh *:*`, `cargo *:*`, `go *:*`, `dotnet *:*` in
template are all *broader* than global's enumerated subsets, so those are
fine). `python:*`/`python3:*` are fully covered by global's bare forms
(`settings.json:20,73`) and by template's `python3 *:*`
(`templates/autonomous-settings.json:11`) — no gap. `command -v:*` is
present in both global (`settings.json:85`) and template
(`templates/autonomous-settings.json:38`) — no gap (corrects an
overclaim I initially drafted before re-verifying line-by-line).
