# Phase 2 Audit — Agent D: Settings, Hooks, MCP

Read-only audit of `~/.claude` config. Scope: settings.json (global), nested
.claude/settings.json + settings.local.json, .mcp.json, autonomous template,
all hook scripts, post-compact-context.md.

Key environment facts established during audit:
- `claude mcp list` shows playwright **Connected**, serena **Pending approval**.
- playwright MCP server is defined in `~/.claude.json` (user CLI scope), **NOT**
  in the repo `.mcp.json`. The repo `.mcp.json` only defines serena.
- mem0 is fully removed from `.mcp.json` and global settings.json (still
  referenced in nested `.claude/settings.json` — see F-3).

Severity legend: Critical / Warning / Suggestion / Note.

---

## 1. Hook events — present vs missing

Configured in global `settings.json`: SessionStart, UserPromptSubmit,
PostCompact, PreCompact, PreToolUse(Bash), PostToolUse(Write|Edit|MultiEdit),
InstructionsLoaded, Stop.

### F-1 — `SubagentStop` hook missing (Suggestion)
- **Where:** settings.json hooks block (no SubagentStop key; would sit ~line 226).
- **Issue:** The config delegates heavily to subagents (parallelism.md,
  Agent(*) permissioned). There is a `Stop` hook (notify-on-stop.sh) for the
  main turn but nothing fires when a subagent finishes. For long parallel
  batches you get no per-agent completion signal, and no place to run a
  per-subagent quality gate.
- **Fix:** Add a `SubagentStop` hook that appends a structured line to
  `~/.claude/logs/subagent-stops.log` (agent id + duration) and optionally
  chimes only for runs >60s. Mirror the notify-on-stop.sh pattern but guard
  against notification spam (parallel agents finishing together).

### F-2 — `Notification` hook missing (Suggestion)
- **Where:** settings.json hooks block.
- **Issue:** No `Notification` hook. Claude Code fires Notification events on
  permission prompts and idle-input waits. With heavy autonomous use, capturing
  these would let you detect "stuck waiting for approval" states (relevant to
  autonomous-execution.md STOP conditions).
- **Fix:** Add a `Notification` hook logging to
  `~/.claude/logs/notifications.log`; optionally forward permission-required
  events to the macOS notifier so autonomous stalls are visible.

### Events intentionally/acceptably absent (Note)
- `Elicitation` and `CwdChanged` are newer/optional; no existing rule requires
  them. `CwdChanged` could re-run project-init.sh on directory switches (today
  it only runs on UserPromptSubmit), which would be a minor improvement but is
  not a gap worth fixing now. Note only.

### F-3 — `PostToolUse` doesn't gate Bash, only file writes (Suggestion)
- **Where:** settings.json:204-214 — matcher is `Write|Edit|MultiEdit`.
- **Issue:** check-complexity.py runs after writes (good), but there is no
  PostToolUse coverage of Bash output. Not strictly a missing-event gap, noted
  for completeness; no action required unless you want post-command linting.

---

## 2. Permission noise / stale one-off permissions (global settings.json)

### F-4 — `echo` literal-string PreCompact hook, not a real check (Warning)
- **Where:** settings.json:183-192 (PreCompact `echo '-- COMPACTING...'`).
- **Issue:** The PreCompact hook just echoes a reminder string; it performs no
  verification. It cannot "verify open TODOs are committed" as the text claims —
  this is decorative output, easy to mistake for an actual gate.
- **Fix:** Either replace with a real check
  (`git -C "$PWD" status --porcelain | grep -q . && echo "WARNING: uncommitted
  changes before compaction"`) or reword the string to "reminder only" so it is
  not mistaken for a gate.

### F-5 — Stale literal one-off Bash permissions (Suggestion)
Each of these is a single-purpose literal that has broader coverage elsewhere or
is a narrow echo/version variant; consolidate to reduce the 125-entry allowlist:
- settings.json:54 `Bash(npm --version)` — covered by adding `Bash(npm:*)`
  (note: global currently lists granular `npm install/run/test/ci` but no bare
  `npm:*`; consider one `Bash(npm:*)`).
- settings.json:57 `Bash(pnpm --version)` — same; subsumed by `Bash(pnpm:*)`.
- settings.json:88 `Bash(~/.claude/hooks/setup-complexity.sh)` (no `:*`) — exact
  string match only; harmless but inconsistent with the `:*` siblings.
- settings.json:89 `Bash(python3 ~/.claude/hooks/check-complexity.py)` — this is
  invoked by the hook runner, not by Claude; a manual-invocation permission is
  rarely needed. Candidate for removal.
- settings.json:85 `Bash(xargs kill:*)` — very narrow; verify it is still used.
- **Fix:** Collapse version-probe entries into the corresponding `tool:*` rule
  and drop hook-internal invocation entries that the hook runner executes
  directly (hooks do not go through the permission system).

### F-6 — Two near-duplicate curl allow rules (Suggestion)
- **Where:** settings.json:93-94 (`curl -s https://raw.githubusercontent.com/**`
  and `curl -sS https://api.github.com/repos/**`).
- **Issue:** Two literal curl variants differing only by flag/host. These are GH
  API/raw fetches that an MCP server would replace (see §5). Until then they are
  fine but represent the kind of host-pinned literal that accretes.
- **Fix:** Keep for now; revisit after adding a GitHub MCP server, then remove.

---

## 3. Permission gaps — local/template commands absent from global

### F-7 — `go` and `dotnet` permissioned in template/nested but absent globally (Warning)
- **Where:** autonomous-settings.json:11-12 (`go *`, `dotnet *`); nested
  .claude/settings.json:17-18 (`go *`, `dotnet *`). Global settings.json has
  cargo (65) but **no** `go` or `dotnet` allow entry.
- **Issue:** project-init.sh detects Go and C#/.NET projects and the csharp/jdtls
  LSP plugins are enabled, but the global allowlist never permits `go`/`dotnet`.
  In a Go or .NET repo every build/test command prompts.
- **Fix:** Add `Bash(go:*)` and `Bash(dotnet:*)` to global settings.json allow
  list (matching the cargo precedent).

### F-8 — `psql` permissioned in template/nested but not global (Suggestion)
- **Where:** autonomous-settings.json:13 (`psql *`), nested:13. Not in global.
- **Issue:** Neon/Postgres skills exist (testing-setup, auth-setup reference
  Neon). DB work prompts in interactive sessions.
- **Fix:** Add `Bash(psql:*)` to global allow if you do Postgres work outside
  autonomous mode; otherwise leave template-only by design (note the choice).

### F-9 — `yarn` only in nested settings, not global or template (Note)
- **Where:** nested .claude/settings.json:7 (`yarn *`).
- **Issue:** quality-gate.sh detects yarn.lock and runs `yarn run ...`, but yarn
  is not permissioned globally or in the autonomous template — a yarn project in
  autonomous mode would stall on the gate command.
- **Fix:** Add `Bash(yarn:*)` to autonomous-settings.json (and global if you
  intend to support yarn projects).

---

## 4. WebSearch syntax consistency

### F-10 — `WebSearch` vs `WebFetch(*)` / `WebSearch(*)` inconsistency (Suggestion)
- **Where:** global settings.json:110-111 `"WebFetch"`, `"WebSearch"` (no
  parens); nested .claude/settings.json:44-45 `"WebFetch(*)"`, `"WebSearch"`;
  autonomous-settings.json:44-45 `"WebFetch(*)"`, `"WebSearch"`.
- **Finding:** Claude Code accepts both the bare tool name (`WebFetch`,
  `WebSearch`) and the parenthesized rule form (`WebFetch(*)`). For tools that
  take no rule content the bare name is the canonical/idiomatic form; `(*)` is
  accepted and equivalent. So **all three files currently work**, but they are
  stylistically inconsistent: WebFetch is bare in global and `(*)` in the other
  two; WebSearch is bare in all three.
- **Fix:** Standardize on the bare form for both — `"WebFetch"` and
  `"WebSearch"` — across all three files (matches global settings.json). No
  functional change; removes the appearance that `(*)` is required.

---

## 5. MCP gaps — structured servers to replace shell calls

### F-11 — playwright MCP defined in `~/.claude.json`, not repo `.mcp.json` (Warning)
- **Where:** repo `.mcp.json` defines only serena. playwright is permissioned in
  global settings.json:127-131 and is live (`claude mcp list` → Connected) but
  its server definition lives in user-scope `~/.claude.json`
  (`mcpServers.playwright = npx @playwright/mcp@latest`).
- **Issue:** The prior agent's flag was half-right: the permissions are NOT dead
  (the server is connected), but the server is invisible to anyone auditing the
  repo and is not version-controlled with the rest of `~/.claude`. If the config
  repo is cloned to a new machine, playwright permissions reference a server that
  isn't defined in-repo.
- **Fix:** Add the playwright server block to repo `.mcp.json` so the definition
  travels with the versioned config:
  `"playwright": { "command": "npx", "args": ["@playwright/mcp@latest"] }`.
  Then the settings.json playwright permissions are self-consistent in-repo.

### F-12 — No GitHub MCP server; gh/curl shelled instead (Suggestion)
- **Where:** global settings.json:45-49 (`gh api`, `gh repo`, `gh run`, etc.),
  93-94 (curl to api.github.com / raw.githubusercontent.com).
- **Issue:** PR review skills (review-pr, changelog-generator) and the curl
  GH-API allow rules do structured GitHub work through unstructured shell. A
  GitHub MCP server (e.g. `github-mcp-server`) would give typed PR/issue/run
  access and let you drop the two curl literals (F-6).
- **Fix:** Add a GitHub MCP server to `.mcp.json`; migrate review-pr/changelog
  flows; then remove the api.github.com curl allow rule.

### F-13 — No filesystem MCP; relies on broad Read/Write/Edit globs (Note)
- **Where:** Read/Write/Edit scoped to `~/git`, `~/.claude`, `~/church` plus
  additionalDirectories.
- **Finding:** A filesystem MCP server is **not** needed here — native
  Read/Write/Edit with path-scoped permissions is the idiomatic approach and is
  finer-grained than a filesystem MCP would be. No action. (Recorded because the
  task asked to consider it.)

---

## 6. Hook quality review

| Hook | set -euo pipefail | platform guard | idempotent | error logging |
|------|-------------------|----------------|------------|---------------|
| autonomous-toggle.sh | yes (l.2) | n/a | yes (cmp guard l.43) | exits w/ msgs, no log file |
| notify-on-stop.sh | yes (l.2) | yes (darwin/notify-send l.25-28) | yes (read-only) | none (best-effort) |
| project-init.sh | yes (l.5) | n/a | yes (all guarded) | yes (trap→logs/project-init.err l.8) |
| quality-gate.sh | yes (l.2) | n/a | yes (read-only) | trap fail-closed l.18 |
| record-turn-start.sh | yes (l.2) | n/a | yes | none (trivial) |
| session-start.sh | yes (l.2) | partial — see F-15 | yes | none |
| check-complexity.py | n/a (py) | yes (path/skip logic) | yes | fail-open (l.104) |
| setup-complexity.sh | yes (l.2) | n/a | yes (venv reuse) | exits on error |

### F-14 — `set -euo pipefail` + `async:true` risk in record-turn-start/session-start (Suggestion)
- **Where:** record-turn-start.sh:2, session-start.sh:2; both wired as
  `async:true` (settings.json:152,162,221).
- **Issue:** With `set -e`, any single failing command aborts the hook. For
  async logging hooks (record-turn-start writes the timestamp; InstructionsLoaded
  log) a transient failure (e.g. read-only `~/.claude/.runtime`) kills the hook
  silently with no fallback. record-turn-start.sh has no trap, so a failed
  `date`/`mkdir` leaves notify-on-stop.sh reading a stale/missing start file
  (it does handle that case, l.15-17, so impact is low).
- **Fix:** Low priority. Add `|| true` to the terminal write in
  record-turn-start.sh, or a `trap '... exit 0' ERR` as project-init.sh does, so
  the recorder degrades gracefully.

### F-15 — session-start.sh contains `sudo apt-get` despite PreToolUse sudo block (Warning)
- **Where:** session-start.sh:33 (`sudo apt-get install -y ast-grep`).
- **Issue:** Two problems. (1) The global PreToolUse hook (settings.json:199)
  blocks any Bash command starting with `sudo ` — but hooks run their own
  commands outside that interception, so this `sudo` would actually execute,
  contradicting the stated "sudo requires project opt-in" policy. (2) It only
  runs when `CLAUDE_AUTO_INSTALL_TOOLS=true`, so it is gated, but a non-interactive
  SessionStart hook invoking sudo can hang waiting for a password prompt.
- **Fix:** Remove the `sudo apt-get` branch (or replace with a printed
  instruction to install manually). Tool auto-install in a SessionStart hook
  should never escalate privileges; print guidance instead.

### F-16 — notify-on-stop.sh has no error logging on notifier failure (Note)
- **Where:** notify-on-stop.sh:25-29.
- **Issue:** If `osascript`/`notify-send` fails, the failure is swallowed (and
  with `set -e` the script aborts at that line, but it is the last block so no
  harm). Acceptable for a best-effort chime. Note only.

---

## 7. Autonomous template completeness vs global settings

autonomous-settings.json is the fallback permission set copied in by
autonomous-toggle.sh. Compared against global settings.json allow list:

### F-17 — Template missing several CLI tools present globally (Warning)
Tools permissioned in global settings.json but **absent** from
autonomous-settings.json (so an autonomous run in such a project stalls):
- `pip3 install` (global:21) / `pip` (global:69) — template has only
  `pip install *` (l.18) and `uv pip install` (l.17); bare `pip:*` missing.
- `pytest` (global:70) — **missing** from template. A Python project's test
  gate (`pytest`) would prompt in autonomous mode. **High impact** given
  testing.md mandates pytest gates.
- `pnpm test/run/typecheck/lint` granular forms — template uses `pnpm *:*`
  (l.15) which covers them, OK.
- `cargo` — template has `cargo *:*` (l.14), OK.
- `volta install` (global:64) — missing from template (low impact).
- `mkdocs build` (global:73) — missing (low impact).
- `ollama`/`docker model` (global:77,81-82) — missing (low impact, model-routing
  only).
- `claude mcp` (global:84) — missing (low impact).
- **Fix:** Add to autonomous-settings.json at minimum: `Bash(pytest:*)`,
  `Bash(pip:*)`, `Bash(yarn:*)` (F-9), `Bash(go:*)` and `Bash(dotnet:*)` are
  already present in the template (l.11-12) — note they are present in template
  but missing GLOBALLY per F-7, the inverse gap.

### F-18 — Template missing serena MCP write tools? No — present (Note)
- autonomous-settings.json:46-55 includes all serena navigation + edit tools and
  playwright (56-60). MCP coverage matches global. No gap. Note only.

### F-19 — Template lacks `Bash(test *:*)` and `command -v` parity (Suggestion)
- **Where:** global has `Bash(command -v:*)` (l.83); template has it (l.36) OK.
  Nested settings has `Bash(test *:*)` (l.37) but template does not. Minor:
  autonomous scripts using `test`/`[` builtins are unaffected (shell builtin,
  not a permissioned external), so impact is negligible.
- **Fix:** None required; recorded for completeness.

---

## Priority summary (action order)

1. **F-7** (Warning): add `Bash(go:*)`, `Bash(dotnet:*)` to global settings.
2. **F-17** (Warning): add `Bash(pytest:*)`, `Bash(pip:*)`, `Bash(yarn:*)` to
   autonomous template — pytest gap breaks Python autonomous test gates.
3. **F-15** (Warning): remove `sudo apt-get` from session-start.sh.
4. **F-11** (Warning): add playwright server block to repo `.mcp.json`.
5. **F-4** (Warning): make PreCompact hook a real git check or reword.
6. **F-1/F-2** (Suggestion): add SubagentStop + Notification logging hooks.
7. **F-10** (Suggestion): standardize WebFetch/WebSearch to bare form.
8. **F-12** (Suggestion): add GitHub MCP server; later drop curl GH literals.
9. **F-5/F-6** (Suggestion): collapse version-probe + hook-internal + curl
   literals to shrink the allowlist.
