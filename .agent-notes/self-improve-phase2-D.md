# Self-Improve Phase 2 — Agent D — Config Audit (2026-08-01)

Scope: read-only audit of ~/.claude settings/hooks/MCP config, Claude Code v2.1.220.
Cross-checked against `plans/config-hardening-2026-07/README.md` (a prior
self-improve mission on this exact repo, completed 2026-07-24, 29/29 tasks,
26 commits) to avoid re-litigating settled decisions without new rationale.
This file replaces a stale 2026-07-24 copy whose line numbers no longer
match current disk state (settings.json has since grown to 257 lines with
new forge/lizard/echo entries).

---

## 1. Hook events — wired vs. not

Wired in `~/.claude/settings.json` hooks block: PreToolUse (190-200,
rm-rf/sudo guard), PostToolUse (201-211, complexity check), PreCompact
(180-189), PostCompact (170-179), InstructionsLoaded (212-222), SessionStart
(143-153), Stop (223-233). All present, all reference existing scripts.

**Not wired:** Notification, SubagentStop, Elicitation, CwdChanged.

Note: `plans/config-hardening-2026-07/README.md:26` records prior decision
**S9**: "wire Notification/SubagentStop/CwdChanged hooks — no concrete
trigger; deliberately dropped" (confirmed still out of scope at README:102).
Findings below reopen SubagentStop/Notification with a more specific
rationale than the prior "no concrete trigger" — flagged as Suggestion, not
Warning, out of respect for the standing decision; a maintainer should
decide whether the new rationale clears the bar.

- `settings.json` (no SubagentStop hook) — Suggestion — severity: none of
  autonomous-execution.md's mandatory per-task checks ("Verify no files
  were modified outside the declared write-set... compare `git diff
  --name-only` against the batch's file list") are automated; today they
  depend on the orchestrator remembering. A SubagentStop hook running `git
  diff --name-only` against a write-set file and printing a warning would
  make that rule self-enforcing instead of advisory. Fix: add a
  `SubagentStop` hook entry invoking a small script that diffs changed
  files against the current task's declared write-set (new script,
  e.g. `hooks/verify-write-set.sh`). Confidence 60.
- `settings.json` (no Notification hook) — Suggestion — an autonomous run
  blocked on a permission prompt currently gets no alert until `Stop`
  fires — the user has no signal Claude is *stuck* vs. *thinking*. Fix:
  add a `Notification` hook reusing `notify-on-stop.sh`'s osascript/
  notify-send pattern with a distinct message ("Claude needs input").
  Confidence 55.
- Elicitation — not wired, **no concrete use, do not wire**: `.mcp.json`
  defines only `serena` (list_dir/find_symbol/etc.), which never issues
  elicitation requests. Confidence 80.
- CwdChanged — not wired, **no concrete use, do not wire**:
  `project-init.sh` already re-runs on every `UserPromptSubmit` (line
  78-92 of settings.json) and is fully idempotent (file-exists guards at
  project-init.sh:18,25,72,81-87), so a cwd change is already covered on
  the next prompt with no added latency worth trading for a second hook
  point. Confidence 70.

---

## 2. Permission noise (global `~/.claude/settings.json`)

- `settings.json:126` — Warning — `"Bash(echo \"forge lint exit=$?\")"` is
  a literal single-command string with an un-expanded shell variable baked
  into the pattern (permission patterns are matched literally, not
  shell-evaluated) — it can only ever match that exact text again, i.e. a
  debugging leftover with no reuse value. Fix: delete the line. Confidence 92.
- `settings.json:125,127` — Warning — `"Bash(forge lint *)"` and
  `"Bash(lizard src/shared/scrubSvg.ts)"` are hyper-specific, one-off
  commands tied to a different project (Foundry/Solidity `forge`, and a
  literal file path `src/shared/scrubSvg.ts` that does not exist in this
  repo). These do not belong in global scope — confirmed added today
  (commit `c987da5 chore(config): allow forge/lizard commands...`, plus
  further uncommitted edits to this same file per current `git status`)
  rather than being long-stale, but the classification is the same either
  way. Fix: remove from global; if still needed, add to that project's own
  `.claude/settings.local.json`. Confidence 90.
- `settings.json:104-108` — Warning — `Edit/Write/Read/Glob/Grep(~/church/**)`
  is a personal, unrelated-project absolute-path grant living in global
  config alongside the two legitimate general-purpose grants (`~/git/**`,
  `~/.claude/**`). Fix: move to a `.claude/settings.local.json` inside the
  church project; remove from global. Confidence 85.
- `settings.json:136-138` (`additionalDirectories`) — Suggestion — three
  project-specific absolute paths (`phil-elevator/public/guides`,
  `temp/github-study-guide`, `plantuml-js/.claude`) live in the global
  `additionalDirectories` list. Lower risk than the Bash entries above
  (grants file access only, not command execution), but still project-
  specific state in a file meant to be project-agnostic. Fix: move to
  each project's own `.claude/settings.local.json`. Confidence 55.

**Assessment of the three flagged-by-the-brief entries:** `forge lint *`,
the `echo` variant, and `lizard src/shared/scrubSvg.ts` are exactly the
one-off noise this check exists to catch — none belong at global scope.

---

## 3. Permission gaps (present in local/template, absent from global)

- `settings.json` has no `curl` permission at all vs.
  `templates/autonomous-settings.json:39` /
  `.claude/settings.local.json` — Warning — but see item 5: this curl grant
  is scoped to `raw.githubusercontent.com`, which the already-global bare
  `WebFetch` grant (settings.json:109) can already reach without shell-out.
  Fix: prefer consolidating on `WebFetch` and drop the redundant `curl`
  permission from the template/local files rather than adding it to
  global. Confidence 60.
- `settings.json:47-51` has only `gh api/repo/workflow list/auth/run` vs.
  `templates/autonomous-settings.json:21` / `settings.local.json`'s broad
  `Bash(gh *:*)` — **Critical/Warning** — this is a practical gap: this
  same CLAUDE.md's own PR workflow instructs `gh pr create`, and the
  `review-pr` skill and `pr-workflow.md` both depend on `gh pr`/`gh api`
  operations the global list doesn't cover — every `gh pr create` in a
  normal interactive session prompts for approval. Fix: add
  `"Bash(gh pr:*)"`, `"Bash(gh issue:*)"`, `"Bash(gh release:*)"` to
  global `settings.json`. Confidence 85.
- `settings.json` lacks `Bash(docker-compose *:*)` and `Bash(psql *:*)`,
  present at `templates/autonomous-settings.json:10,12` — Warning — global
  only has `docker compose:*` (space form); the hyphenated legacy binary
  and Postgres CLI are ungated in global but pre-approved in
  local/autonomous/template. Fix: add both to global. Confidence 85.
- `mcp__playwright__browser_navigate/snapshot/click/take_screenshot/
  evaluate` present at `settings.local.json:59-63`,
  `.claude/settings.autonomous.json:59-63`,
  `templates/autonomous-settings.json:59-63` — absent from global
  `settings.json` entirely — Warning — see item 5: these are currently
  dead grants everywhere (no playwright MCP server is configured in
  `.mcp.json`), so "add to global" is not the right fix until the server
  itself exists. Confidence 70.

---

## 4. WebSearch / WebFetch syntax — consistent, no defect

Grepped all five requested files plus global:
`settings.json:109-110`, `.claude/settings.json:46-47`,
`.claude/settings.local.json:45-46`, `.claude/settings.autonomous.json:46-47`,
`.claude/settings.pre-autonomous.json:44-45`,
`templates/autonomous-settings.json:46-47` — **all six use the bare form**
`"WebFetch"` / `"WebSearch"`, no `(*)` suffix anywhere.

Per Claude Code's permission-rule model (confirmed via WebSearch
cross-referencing code.claude.com/docs/en/permissions, direct WebFetch of
the exact WebSearch/WebFetch rule table was inconclusive so this is
MEDIUM confidence): a bare tool name matches every use of that tool;
`WebSearch` has no specifier syntax at all, `WebFetch` optionally supports
`WebFetch(domain:...)` to narrow scope but the bare form is valid and
simply grants unrestricted use. **No inconsistency and no required-syntax
violation** — bare form is correct and uniform across every file audited.
Confidence 80.

---

## 5. MCP gaps

- `.mcp.json:2-13` defines only `serena` (code navigation:
  list_dir/find_symbol/find_referencing_symbols/etc., scoped to
  `--project /Users/scottseely/.claude`). No GitHub, filesystem, or
  playwright MCP server is configured anywhere in this repo.
- **Serena disabled-but-still-granted, verified precisely:**
  `.claude/settings.local.json:37-39` sets
  `"disabledMcpjsonServers": ["serena"]`. Correction to the premise as
  given: `settings.local.json` itself lists **zero** `mcp__serena__*`
  permissions (its 34-entry allow list is all Bash git/npm/python) — so it
  does not itself "still list serena permissions." The real inconsistency
  is one layer up: `.claude/settings.json:48-58` (11 entries) and global
  `settings.json:114-124` (11 entries) both still grant `mcp__serena__*`
  tools, and because `.mcp.json` defines no server besides serena, the
  local-level disable makes all 22 of those grants dead/no-op for this
  project. Fix: either drop `disabledMcpjsonServers` from
  `settings.local.json` (re-enabling serena, which `project-init.sh`
  auto-provisions a `.serena/project.yml` for and expects to work), or
  strip the redundant `mcp__serena__*` grants from `.claude/settings.json`
  since they can't be exercised while local disables the server. Confidence 85.
- Playwright permissions (5 tools) appear in `settings.local.json`,
  `.claude/settings.autonomous.json`, and
  `templates/autonomous-settings.json`, but no playwright server is
  registered in `.mcp.json` — Warning — these are orphaned permission
  entries right now. Fix: register a playwright MCP server in `.mcp.json`
  if browser-driven testing (the `webapp-testing` skill implies this is
  wanted) is actually in use, otherwise strip the dead entries from all
  three files. Confidence 75.
- GitHub MCP server — Suggestion, LOW-MEDIUM confidence (not doc-verified
  this session) — would replace `gh api`/`gh pr`/`gh issue` shell calls
  (heavily used per `pr-workflow.md` and the `review-pr` skill, which
  parses `gh api repos/.../pulls/123/comments` output) with structured
  JSON tool calls instead of CLI text parsing. Confidence 45 — recommend
  verifying the server's existence/name before adding.

---

## 6. Hook quality (one line each)

- `hooks/autonomous-toggle.sh` — `set -euo pipefail` ✓ (line 2); no
  platform guard needed (pure file ops); idempotent ✓ (cmp guard, line 43,
  prevents re-backing-up an already-autonomous state); error handling via
  `exit 1` + echo, adequate for a manual/on-demand script. No defect.
- `hooks/notify-on-stop.sh` — ✓ line 2; platform guard ✓ (line 25,
  darwin/notify-send branch); error logging ✓ (lines 27, 30, failed
  notification calls logged to stderr). No defect.
- `hooks/project-init.sh` — ✓ line 5; idempotent ✓ (file-exists guards at
  lines 18, 25, 72, 81-87); error logging ✓ (ERR trap, line 8, fail-safe
  exit 0 so setup errors never block the prompt). No defect.
- `hooks/quality-gate.sh` — ✓ line 2; error logging ✓ (ERR trap, line 18,
  explicitly documented fail-closed at line 17). No defect.
- `hooks/record-turn-start.sh` — ✓ line 2; trivial, no defect.
- `hooks/session-start.sh` — ✓ line 2; idempotent ✓ (command -v/binary
  checks before install, lines 25, 81); **gap** at line 84 —
  `bash "$HOOKS_DIR/setup-complexity.sh"` has no error trap or logging,
  unlike every other hook in this repo (`project-init.sh:8`,
  `quality-gate.sh:18` both wrap with ERR traps). A failure here is a
  SessionStart hook, so it fires silently with no record. Fix: wrap with
  `|| echo "[session-start] setup-complexity.sh failed (exit $?)" >>
  ~/.claude/logs/session-start.err 2>/dev/null`. Confidence 70. Suggestion.
- `hooks/check-complexity.py` — fail-open exception handler ✓
  (lines 136-143, logs unhandled exceptions to stderr, always exits 0).
  No defect.
- `hooks/setup-complexity.sh` — ✓ line 2; self-contained python3 guard
  (line 11); idempotent ✓ (venv-exists check, line 20); explicit error
  checks + exit 1 (lines 12-14, 32-35). No defect.

---

## 7. Autonomous template completeness (`templates/autonomous-settings.json` vs. global `settings.json`)

- **Missing `"Agent(*)"`** — global has it at `settings.json:111`; the
  template has no `Agent` or `Skill` entry at all — **Critical** —
  autonomous-execution.md's batch-execution procedure explicitly requires
  "Launch parallel agents per `parallelism.md` rules" every batch. Without
  `Agent(*)` pre-granted, the very first subagent dispatch in an
  autonomous run stalls on a permission prompt with no human present to
  answer it — this directly defeats the premise of autonomous mode. Fix:
  add `"Agent(*)"` to `templates/autonomous-settings.json` permissions.
  Confidence 88.
- **Missing `"Bash(~/.claude/hooks/setup-complexity.sh)"`** — global has
  it at `settings.json:90`; template lacks it, even though the template
  wires the same `check-complexity.py` PostToolUse hook
  (template line 114-123) that, per `check-complexity.py:107-114`, emits a
  block asking the agent to "ask the user for permission to run" that
  exact script when lizard isn't installed yet. A fresh machine running an
  autonomous mission hits a human-approval wall on its first Write/Edit.
  Fix: add the permission to the template. Confidence 85.
- **Missing `"Bash(pip3 install:*)"`** — global has it (`settings.json:23`);
  template only has `"Bash(pip install *:*)"` (line 19), a different
  literal prefix that will not match a `pip3 install ...` invocation
  (common on macOS). Fix: add `"Bash(pip3 install:*)"` to the template.
  Confidence 65.
- Missing `Bash(volta install:*)` (global `settings.json:66`) — Suggestion,
  low priority, niche JS toolchain manager. Confidence 40.
- Missing `Skill(update-config:*)` / `Skill(plan-mission:*)` (global
  `settings.json:112-113`) — Suggestion, low priority since a mission
  brief is normally pre-generated by `/plan-mission` before autonomous
  execution starts, so skill invocation mid-mission is uncommon.
  Confidence 40.

Note: `.claude/settings.autonomous.json:116` still matches
`"Write|Edit|MultiEdit"` while the template (line 116) and global
(`settings.json:203`) both use `"Write|Edit"`. Per this repo's own recent
commits ("drop MultiEdit" across agent folders, e.g. `81cfe7a`), `MultiEdit`
has been retired project-wide — the deployed `.claude/settings.autonomous.json`
is the stale one here, not the template. Harmless (matches a tool that no
longer fires) but signals settings.autonomous.json has drifted from the
template it's supposed to mirror. Confidence 75.

---

## 8. SPECIFIC CHECK — autonomous toggle state — CONFIRMED, CRITICAL, SCOPED

**Verified via `diff` (not just size/date comparison):**
`diff .claude/settings.json .claude/settings.autonomous.json` → **zero
output, exit 0** — byte-identical. `diff .claude/settings.json
.claude/settings.pre-autonomous.json` shows pre-autonomous.json is the
genuinely different, narrower, hook-free "normal" state (58 lines vs. 137;
no `hooks` key at all; no `fallbackModel`; scoped `Read(*)/Write(*)` instead
of unrestricted `Read(**)/Write(**)`; no `mcp__playwright__*`).

**Toggle mechanic** (`hooks/autonomous-toggle.sh`): `on` backs up the
current `settings.json` to `settings.pre-autonomous.json` (line 52) *then*
overwrites `settings.json` (line 56). `off` restores by `mv`-ing
`settings.pre-autonomous.json` back over `settings.json` (line 71) — an
`mv`, which **deletes** the backup file on success. **The backup file
`.claude/settings.pre-autonomous.json` still exists on disk** — proof `off`
has never run since the last `on`.

**Timeline, reconstructed from git history (ground truth, not inferred):**
- `plans/config-hardening-2026-07/README.md` documents a mission that used
  autonomous permissions, completing at commit `3fba52a` on
  **2026-07-24 16:47** (29/29 tasks, 26 commits) — this is almost
  certainly when/why `.claude/settings.json` was set to the autonomous
  state (mtime Jul 24 15:36, just before the mission's work began).
- The mission's own "Known issues / follow-ups" section does **not**
  mention toggling back off after completion — this was missed, not
  declined.
- The branch then had **zero commits for 8 days** (2026-07-24 16:47 →
  2026-08-01 19:07).
- **Today**, two new commits landed (`73837bd`, `c987da5`) plus further
  *uncommitted* edits to `settings.json`, `CLAUDE.md`, and rule files —
  i.e., **normal interactive work is happening in this repo right now**,
  under merged global + still-autonomous project permissions. This audit
  agent's own invocation has cwd `/Users/scottseely/.claude`, the exact
  directory affected.

**Concrete risk (scoped correctly, not overstated):** this affects only
sessions whose working directory is inside `/Users/scottseely/.claude`
itself (the config repo, opened as a project) — not every Claude Code
session everywhere. But that scope is exactly where today's interactive
config-editing work (the work that produced the `forge lint`/`lizard`
noise in item 2) is happening. In that scope, the effective permission set
is global `settings.json` **unioned with** the autonomous project overlay:
`Read(**)/Write(**)/Edit(**)/Glob(**)/Grep(**)` (unrestricted filesystem,
not scoped to `~/git`, `~/.claude`, `~/church` the way global intends),
`Bash(git *:*)`, `Bash(docker *:*)`, `Bash(gh *:*)`, `fallbackModel`
opus→sonnet, and all `mcp__playwright__*` entries — all pre-approved with
no per-command confirmation, for what should be guarded interactive work.
The `PreToolUse` sudo/rm-rf-root guard (global `settings.json:190-200`)
is unaffected — that hook lives in the always-applied global scope, so it
still fires regardless of the project-level toggle state. Severity is
"broad silent file/command access," not "safety-net bypass."

**Exact fix:**
```
~/.claude/hooks/autonomous-toggle.sh off /Users/scottseely/.claude
```
This restores `.claude/settings.pre-autonomous.json` over
`.claude/settings.json` and removes the backup file (confirming the
restore). Verify afterward with
`diff .claude/settings.json .claude/settings.pre-autonomous.json` (should
be identical) and `test -f .claude/settings.pre-autonomous.json` (should
now fail — file consumed by the `mv`).

Confidence: 95 (byte-identical diff + backup-file existence proof + full
git-history reconstruction, not a single-signal guess).
