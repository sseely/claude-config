# Self-improve Phase 2 — Agent D (settings, hooks, MCP) — 2026-10-08

Audited working-tree state. Docs verified this run via WebFetch (Tier 1):
code.claude.com/docs/en/hooks, /settings-reference, /permissions, /settings.
Deduped against code-review-tasks.md (F-ids cited where a finding extends one) and
the 2026-09-02 / phase1-A notes. Format: severity | file:line | what | fix | conf.

## 0. Spec / meta findings

- **Warning | skills/self-improve/references/phase2-audit-agents.md:14-26 | Agent D file list is stale.**
  Missing: hooks/session-start.sh, log-hook-event.sh, log-instructions-loaded.sh,
  nudge-search-tool.py, guard-bash.py, check-complexity.py, check-frontmatter.py,
  _hooklib.py, _hooklib.sh, setup-complexity.sh, complexity-ignore, requirements.txt;
  ~/.claude/.claude/settings.autonomous.json and settings.pre-autonomous.json.
  Also lists only 5 of ~19 hook scripts. Fix: replace the list with a glob
  (`hooks/*.sh`, `hooks/*.py` excluding `test_*`, `.claude/settings*.json`, `.mcp.json`,
  `.claude/.mcp.json`) so it cannot go stale. Conf 95.
- **Warning | phase2-audit-agents.md:29-31 | Dimension 1's event list is stale/narrow.**
  Docs list 33 events (Setup, SessionEnd, UserPromptExpansion, StopFailure, PermissionRequest,
  PostToolBatch, SubagentStart, TaskCreated/Completed, TeammateIdle, FileChanged, DirectoryAdded,
  WorktreeCreate/Remove, PreModelSwitch/PostModelSwitch, MessageDisplay, ElicitationResult ...).
  The spec's 9 names omit most of them, and also omits PostModelSwitch/PermissionDenied which are
  already wired. Fix: phrase dimension 1 as "diff wired events against the docs' event list". Conf 90.
- **Note | working-tree diff (settings.json, templates/autonomous-settings.json) looks intentional.**
  Matches F011/F084 "human-applied 2026-09-20" fixes (malformed `Bash(x *:*)` -> `Bash(x:*)`,
  `Read(**)` -> `Read(./**)`, `additionalDirectories` /Users/scottseely dropped, `Agent(*)`,
  `python3/node/npx/npm run/pnpm run/chmod` allows dropped) plus a new generated `autoMode` block
  and `model: claude-fable-5-1[1m]` -> `opus`. The `.claude/settings*.json` copies already contain
  the post-fix content (semantic JSON diff vs template: identical), so the diff is the template
  catching up. Unusual signs: uncommitted for ~18 days; template lost its trailing newline
  (`tail -c` shows `}` with no `\n`), suggesting a programmatic rewrite; the `model` change is not
  in any task. Fix: commit with a stated reason (`chore(config): apply F011/F084 permission fixes`)
  and note the Fable->Opus default change explicitly. Conf 80 (intent), 95 (facts).

## 1. Hook events

- **Critical | settings.json:154-162 + post-compact-context.md | PostCompact `cat` likely injects nothing.**
  Docs: "For most events, Claude Code writes stdout to the debug log ... The exceptions are
  UserPromptSubmit, UserPromptExpansion, SessionStart, and PostModelSwitch" where plain stdout becomes
  context. PostCompact is not on the list, and its page says it exists to "react to the new compacted
  state"; `systemMessage`/`continue` are discarded. So CLAUDE.md "A PostCompact hook injects
  post-compact-context.md" (and the 5 restored sections: autonomous recovery, routing, commit format,
  restraint, close-out) is probably not restored after compaction. Fix: register the same `cat` under
  `SessionStart` with `"matcher": "compact"` (SessionStart matchers: startup|resume|clear|compact|fork;
  its stdout is context). Keep the existing unconditional SessionStart hook for startup. Verify once
  with `claude --debug` after a `/compact`. Conf 75 (PostCompact stdout not named explicitly; general
  rule is explicit).
- **Warning | settings.json:164-172 | PreCompact `echo '-- COMPACTING ...'` is a no-op** (stdout -> debug log
  only; systemMessage discarded). Fix: delete, or make it useful: exit 2 when `git status --porcelain`
  in a mission repo has uncommitted task state is too aggressive; a better use is writing a handoff note.
  Conf 80.
- **Warning | settings.json:118-126 | ConfigChange runs session-start.sh, whose output is discarded.**
  ConfigChange plain stdout -> debug log; docs say JSON `systemMessage` discarded too. So the
  tool-availability banner and the privilege-elevation warning never reach anyone on that event, and the
  script (potentially including the lizard venv `pip install`) re-runs on every config edit. Matcher
  values are `user_settings|project_settings|local_settings|policy_settings|skills`. Fix: remove this
  entry; if a change-audit trail is wanted, wire a tiny `log-hook-event.sh ConfigChange` (async) instead.
  Conf 80.
- **Suggestion | not wired but high value**: `SubagentStart` (additionalContext is injected into the
  subagent's first turn — directly addresses parallelism.md's "subagents start blank": auto-inject
  `.agent-notes/` pointers and the rules-to-read list); `StopFailure` (notify-on-stop.sh:3 already
  acknowledges the gap; matcher takes `|` lists); `SessionEnd` (rotate/prune logs, see §6);
  `Notification` matchers `permission_prompt|idle_prompt` for a push when a headless/long run is waiting
  (Notification can't block; exit ignored); `PermissionRequest` (not needed); `CwdChanged`/`Elicitation`
  from the spec: no current use-case — do not wire (code-principles: no speculative knobs).
  PreModelSwitch/StopFailure/PostToolBatch already recommended in phase1-A; not re-scored. Conf 70.
- **Note** All 13 wired event names are valid per the docs (incl. PermissionDenied, PostToolUseFailure,
  PostModelSwitch). Stop has no matcher support (none used — correct).

## 2. Permission noise (settings.json allow list, lines 10-108)

- **Clean**: no absolute-path/literal/echo one-offs remain after the 09-20 pass; `Bash(x *:*)` forms are gone.
- **Suggestion | settings.json:30,76-92 | Project/tool-specific entries that rarely fire**: `forge lint *` (:30),
  `volta install` , `ollama list/show`, `docker model:*`, `docker search/pull/info`, `gzip`, `mkdocs build`,
  `npm --version`/`pnpm --version`/`npm info`. Candidates for settings.local.json per project. Also `Bash(forge lint *)`
  is the only entry using the space form; mixed style works (docs: `:*` == trailing ` *`) but is inconsistent.
  Conf 50 (value is low; harmless).
- **Warning | settings.json:98,101,104 | `Grep(~/git/**)`, `Grep(~/.claude/**)`, `Grep(~/church/**)` are dead rules.**
  Permissions doc: "Claude Code checks file permissions against Edit(path) and Read(path) rules only"; rules for
  Write/NotebookEdit/Glob (and by extension other non-Read/Edit tools) are accepted but never consulted. Grep
  access is governed by the matching `Read(...)` rules (already present on the adjacent lines). Fix: delete the
  three `Grep(...)` lines. Conf 70 (the doc sentence names Glob/Write/NotebookEdit/MultiEdit, not Grep explicitly).
- **Note | `~/church/**`** exists on disk (ls verified) — not stale.

## 3. Permission gaps / over-breadth

- **Warning | settings.json:93 | `Bash(~/.claude/hooks/autonomous-toggle.sh on:*)` is pre-approved.**
  `on` copies a profile granting `Bash(git:*)`, `python3:*`, `docker:*`, `Read/Write/Edit(./**)` and more.
  A prompt-injected session can escalate itself without a prompt. `off` is safe to pre-approve; `on` should
  stay a prompt. Fix: delete :93 (keep :94). Conf 72.
- **Warning | hooks/quality-gate.sh:50-62 + settings.json:90 (`Bash(~/.claude/hooks/quality-gate.sh:*)`)**
  The script `bash -c`'s every line of the target repo's `.claude-quality-gates`. With the script
  pre-approved, any cloned repo's gates file executes arbitrary shell with no prompt. Fix: remove the
  blanket allow in global settings (leave it in the autonomous template where the profile is opt-in), or
  restrict to repos you own via a trusted-path check inside the script. Conf 70.
- **Warning | settings.json:41,52,53,78,85 | Allow prefixes that are effectively arbitrary execution or
  irreversible remote writes**: `git push:*` (force-push; guard-bash deliberately skips it, F134),
  `git config:*` (`core.hooksPath`/`core.fsmonitor` -> code exec), `gh api:*` (any verb, e.g. `-X DELETE`),
  `gh repo:*` (`gh repo delete --yes`), `docker run:*` (host mounts), `uv:*` (`uv run` any code), `cp/mv:*`
  (overwrite dotfiles), `cargo:*`/`go:*`/`dotnet:*`/`pip:*` (build scripts / install hooks). Docs also state
  `Bash(git push *)` style rules are bypassed by `git -C . push`, so allow-prefix sets are not boundaries.
  Fix: narrow to read/benign subcommands (`gh api` GET only is not expressible — drop it and use `gh pr/issue/run view`;
  `git push` -> keep but add `ask`-side guard for `--force*`/`-f` in guard-bash; `git config` -> `git config --get *`;
  `gh repo view/clone` instead of `gh repo:*`). Interaction with autoMode noted (auto-mode classifier reviews
  non-matching actions) so impact depends on how often you run in default vs auto mode. Conf 60.
- **Warning | settings.json:99 | `Edit(~/.claude/**)` pre-approved** lets any session rewrite hooks/guard-bash.py,
  settings.json permissions and rules with no prompt. Likely deliberate for /self-improve, so Note-level unless
  sessions in untrusted repos are common. Fix (optional): scope to `Edit(~/.claude/{rules,skills,agents,docs}/**)`
  and let hooks/ and settings*.json prompt. Conf 55.
- **Warning | hooks/nudge-search-tool.py:240-246 | `permissionDecision: "allow"` auto-approves every Grep it nudges.**
  Docs: allow "skips the permission prompt" (deny/ask rules still apply). The F090 fix swapped `defer` for `allow`
  to make additionalContext deliver, but now a symbol-shaped Grep outside the working dir/additional dirs
  (normally a prompt) is silently approved. Prefer no `permissionDecision` at all: exit 0 with
  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"..."}}` — context is documented for
  PreToolUse alongside the tool result, and the normal permission flow continues. Verify delivery in debug log.
  Conf 78 (decision semantics verified; omission of permissionDecision plus additionalContext not explicitly confirmed).
- **Note | live ~/.claude/.claude/settings.json is byte-identical to settings.autonomous.json** (diff verified; both
  4982 B). Because this repo is `~/.claude`, every session here runs the autonomous profile as *project* settings
  (higher precedence than user settings), `.claude/` is gitignored so it is invisible to git-status. session-start.sh's
  detector fires at startup but SessionStart output is only seen in a transcript if someone reads it. Extends F088/F011.
  Fix: `hooks/autonomous-toggle.sh off ~/.claude` (restores settings.pre-autonomous.json, which still contains the
  stale PreCompact text "re-read plans/fleet-governance/README.md" and lacks the guard hooks — regenerate it from
  current global hooks first) or delete the project-level files if autonomous mode is never wanted in this repo. Conf 85.

## 4. WebSearch / WebFetch syntax

- **Verified, no issue.** Bare `"WebFetch"` and `"WebSearch"` are the documented tool-level forms (docs: bare
  `WebFetch` applies to every URL; `WebFetch(domain:*)` is a different, sandbox-affecting form). `WebSearch(*)` is
  not required. All four files (global, template, .claude/settings*.json) use the bare form consistently. Conf 90.
- **Suggestion | settings.json:105-106 / template**: bare `WebFetch` allow lets any URL be fetched with no prompt
  (exfiltration channel under prompt injection). Consider `WebFetch(domain:code.claude.com)`,
  `docs.anthropic.com`, `github.com`, `raw.githubusercontent.com`, `registry.npmjs.org` and let the rest prompt. Conf 55.

## 5. MCP gaps

- **Note | ~/.claude/.mcp.json:1-14** forge (http) + github (Copilot MCP, Bearer `${GITHUB_MCP_PAT}`, toolsets
  repos,actions,pull_requests,issues) are both disabled by `.claude/settings.local.json`
  (`disabledMcpjsonServers: [forge, github]`) — consistent, valid key, no secret in file. Conf 85.
- **Suggestion | gh/curl replacement**: github MCP is the structured replacement for `gh api:*`/`gh repo:*`/`gh run:*`
  (typed, per-tool permissions, so you can allow `mcp__github__get_*` and leave writes on prompt — the allow-glob
  syntax `mcp__github__get_*` is documented). Enabling it per project (settings.local.json) while dropping
  `gh api:*` closes the §3 over-breadth finding. Conf 60 (needs a PAT scoped read-only).
- **Suggestion | ~/.claude/.claude/.mcp.json:1-12** runs serena with `--project /Users/scottseely/.claude/.claude`
  (a settings dir, not a code project) and hard-coded `/Users/scottseely/git/serena`; rules/lsp.md says serena is
  registered at user scope, so this project-level entry is redundant or conflicting (two serena instances).
  Fix: delete or confirm with `claude mcp list`. Conf 50.
- **Suggestion | hooks/project-init.sh:24-42** auto-writes an `.mcp.json` into every git repo you touch with a
  hard-coded serena path (`${SERENA_HOME:-$HOME/git/serena}`) — see §6.
- **Note** `ENABLE_TOOL_SEARCH` / `CLAUDE_CODE_ENABLE_TODO_TOOLS` env keys, and `subagentPromptCacheTtl`, `tui`,
  `agentPushNotifEnabled`, `autoMemoryEnabled`: settings-reference lists them in its key index (all "any file")
  except the two env vars, which are on /env-vars (not fetched; UNKNOWN). Closes F112 for the four settings keys.
  `attribution.commit/pr` valid. `fallbackModel` is documented as an array, max 3 (templates use 2) — valid.

## 6. Hook quality (per hook)

| hook | set flags | platform guard | idempotent | error logging | tests |
|---|---|---|---|---|---|
| autonomous-toggle.sh | -euo pipefail | none (cmp/cp portable) | on: NO (see below) | stderr | none |
| notify-on-stop.sh | -euo pipefail | darwin/notify-send | yes | stderr + jsonl | none |
| project-init.sh | -euo pipefail + ERR trap exit 0 | none | yes | .err file | none |
| quality-gate.sh | -euo pipefail + ERR trap | none | yes (mkdir lock) | stdout | via gate |
| record-turn-start.sh | -euo pipefail + ERR trap | none | yes | .err file | none |
| session-start.sh | -euo pipefail, ERR trap only in one block | brew/cargo | mostly | .err | none |
| log-hook-event.sh / log-instructions-loaded.sh | -uo (intentional) | stat BSD/GNU | append-only | swallowed | none |
| guard-bash.py / check-complexity.py / check-frontmatter.py | fail-open | n/a | yes | .err / deny rows | yes (3 suites) |
| nudge-search-tool.py, _hooklib.py/.sh | fail-open | n/a | yes | .err | **none** |

Findings:
- **Warning | hooks/autonomous-toggle.sh:48-56 | `on` is not idempotent when the source changed.** If settings.json is
  already an *older* autonomous profile (template was edited — exactly the current uncommitted diff), `cmp` at :43
  fails, then :52 copies that old autonomous profile over `settings.pre-autonomous.json`, destroying the real
  pre-autonomous backup; a later `off` restores the elevated profile and deletes the backup (:95). Fix: before :52,
  skip the backup if `$BACKUP_FILE` exists and `$SETTINGS_FILE` equals any known autonomous source
  (`cmp -s` against both PROJECT_AUTONOMOUS and GLOBAL_TEMPLATE), or never overwrite an existing backup. Add a test. Conf 78.
- **Warning | hooks/quality-gate.sh:57 | gates-file parser mis-splits bare commands containing `:`.**
  `^([^:]+):(.+)$` turns `npm run test:unit` into name `npm run test`, command `unit`; `docker run x:latest`,
  `pytest -k a:b` likewise. The documented "or just command" form is therefore broken for the most common
  script names. Fix: require `": "` (colon+space) as the separator (`^([^:]+): (.+)$`) and document it; add a
  case. Conf 82.
- **Warning | hooks/record-turn-start.sh:10 + notify-on-stop.sh:21 | single global timestamp file shared by all sessions.**
  Concurrent sessions/subagent-heavy runs overwrite `.runtime/claude-turn-start`, so a long turn in session A is
  timed from session B's last prompt (spurious no-chime or wrong duration). Fix: key by `session_id` from the
  payload (`.runtime/turn-start.$SESSION_ID`); both hooks already read the payload. Conf 70.
- **Warning | hooks/_hooklib.sh:22-42 + logs/ | log rotation renames but never deletes.** `logs/` is 75 MB:
  six rotated `hook-events.jsonl.*` (10-11.8 MB each, rotating every 1-5 days) plus instructions-loaded.jsonl
  (2.5 MB, never rotated yet). The docstring says "bounded by size and age" but nothing prunes. Fix: in
  hook_rotate_log, delete rotated siblings older than N days (`find "$dir" -name "$base.*" -mtime +14 -delete`), or run
  that from a `SessionEnd` hook. Conf 85.
- **Warning | hooks/_hooklib.sh:55-78 | redaction misses the bulk of the payload.** Only `tool_input.command` and
  `error` are truncated. SubagentStop rows (3,076 of 3,322 rows; 9.7 of 10.2 MB) carry `background_tasks[]` with full
  shell `command`/`description` strings (one sampled row ~3 KB), `transcript_path`, `last_assistant_message` — all
  unredacted and persisted for weeks (F040 extension). Fix: for SubagentStop log an allow-list of fields
  (`session_id, agent_id, agent_type, cwd, stop_hook_active, logged_at`) instead of the raw payload; this also cuts
  volume ~10x and solves the rotation churn. Conf 85.
- **Warning | hooks/session-start.sh:80-88 | blocking network install at SessionStart with no timeout.** If the lizard
  venv is missing, `setup-complexity.sh` does `pip install --upgrade pip` + `-r requirements.txt` synchronously;
  command-hook default timeout is 600 s, offline = stuck session start. Fix: wrap with `timeout 60`/`gtimeout`
  (the pattern is already 20 lines up at :29-47), or print the hint and let check-complexity.py's existing
  "ask user to run setup" path handle it. Conf 60.
- **Suggestion | hooks/project-init.sh:24-42,80-88 | silently mutates every git repo on first prompt**: creates
  `.agent-notes/`, `.mcp.json` (hard-coded serena path), `.serena/project.yml`, and edits/creates `.gitignore`
  — in repos you do not own (dirties `git status`, risks an accidental commit of `.mcp.json`). It also runs the
  language-detection `find ... *.csproj` on every prompt even after setup (cheap but pointless). Fix: early
  `exit 0` once `.serena/project.yml` exists; gate on an allow-list of repo roots (e.g. `~/git/**`), and stop
  writing `.mcp.json` since serena is user-scope. Conf 65.
- **Suggestion | hooks/guard-bash.py:40-45,156-161 | thin coverage**: `~/.claude`, `~/git`, `~/Documents` are not in
  PROTECTED (`rm -rf ~/.claude` passes); `check_sudo` only matches a segment that *starts* with `sudo `
  (`env FOO=1 sudo ...`, `time sudo` slip through despite STRIP_PREFIXES); `$(...)`, backticks, `xargs rm`, `eval`
  are not descended. Documented as best-effort (F134); add `~/.claude` and `~/git` (non-recursive-only? no — they are
  recursive-delete targets) and apply `_strip_prefixes` in check_sudo. Conf 65.
- **Suggestion | no tests for nudge-search-tool.py (9 KB, pure functions, trivially testable), _hooklib.py/.sh,
  autonomous-toggle.sh, session-start.sh, notify-on-stop.sh, record-turn-start.sh** (quality-gate.sh:178-182 runs only
  three suites). Highest value first: autonomous-toggle.sh (backup bug above), nudge `should_nudge`/`lang_from_*`. Conf 90.
- **Suggestion | hooks/complexity-ignore:14-23 | machine-specific absolute paths** for plantuml-ts files, one
  uncommented (`.../class-notes.ts`, no rationale), in a global file that applies to all projects. Add a comment
  line for class-notes.ts or move project-local entries into a per-repo mechanism. Conf 55.
- **Suggestion | hooks/check-complexity.py:157-208 | `head_baseline`/`head_line_count` duplicate the same 10-line
  git-toplevel + `git show` block** (SRP/DRY; F031 flagged length). Extract `_git_show_head(path)`. Conf 60.
- **Note | log-hook-event.sh:16-19** on-call text still describes Fable->Opus reroutes via PostModelSwitch; the
  default model is now `opus` (settings.json:116), so "fallback" rows are only meaningful when a session overrides to Fable.
  Update when the model-default decision settles. Conf 60.
- **Note | `hooks/.pytest_cache`, `.venv`, `__pycache__`** present; `__pycache__` ignored (.gitignore:33); confirm `.venv` and
  `.pytest_cache` are ignored too (`git check-ignore` printed only the `__pycache__` match). Conf 55.

## 7. Autonomous template completeness (templates/autonomous-settings.json vs settings.json)

- Hooks: template wires all 12 global hook events **except `ConfigChange`** (which §1 recommends removing anyway) —
  no drift. Serena allow list: all 11 per-tool names present (global uses `mcp__serena__*`); fine, but a single
  `mcp__serena__*` would future-proof new Serena tools. Conf 70.
- **Warning | template allow list vs rules/lsp.md "Subagent note"**: `Bash(ast-grep:*)` and `Bash(lizard:*)` are in global
  settings but missing from the template, yet lsp.md tells subagents to use ast-grep for structural search and
  run the typecheck command afterwards. Autonomous runs will prompt/stall on ast-grep. Fix: add `Bash(ast-grep:*)`,
  `Bash(lizard:*)`. Also missing vs what quality-gate.sh/rules expect from the agent directly: `yarn`, `ruff`, `mypy`, `tsc`
  (`npx tsc` added), `git -C` (covered by `git:*`). Conf 72.
- **Warning | template allow list is broader than global in the dangerous direction**: `Bash(git:*)`, `docker:*`,
  `docker-compose:*`, `python3:*`, `node:*`, `psql:*`, `chmod:*`, `gh:*`, `claude -p:*`, `curl -s https://raw.githubusercontent.com/**`
  all unscoped while Read/Write/Edit/Glob/Grep are now `./**`. `git:*` includes `git push --force` and `git config`;
  `python3:*`/`node:*` defeat the `./**` file scoping (any code can read/write anywhere). Fix: if unattended
  scoping is the point of F011, replace `python3:*`/`node:*` by the specific verified invocations already added
  (`python3 scripts/*`, `python3 hooks/*`) and drop `psql:*`/`chmod:*`/`docker:*` unless a brief needs them (generate
  per-mission via /plan-mission, as autonomous-toggle.sh:29 already prefers). Also `Glob(./**)`/`Grep(./**)` are
  dead rules (§2). Conf 68.
- **Suggestion | template `fallbackModel: ["opus","sonnet"]`** — project-level key replaces the whole chain from user
  settings (docs: arrays do not merge); fine here, but with `model: opus` as default the first entry is the primary
  itself. Fable missions would want `["opus"]`. Conf 50.
- **Warning | settings.json:295-299 | `modelSettings` key `"claude-opus-5"` may not match the `opus` alias**
  (model-routing.md: alias resolves to `claude-opus-5-5` on v2.1.280+). Docs: `modelSettings` is "keyed by model name";
  if the key is an exact id, the `medium` effort override is not applied to Opus 5.5 and `effortLevel: high` applies.
  Fix: `/effort` check or rename the key to the resolved id (`claude-opus-5-5`). Conf 55 (key-matching rule not
  documented in what I could read).
- **Suggestion | settings.json:303-338 `autoMode`** (new, uncommitted): user-scope is the right location (docs: not
  honored from shared project settings), but content is single-project (knowvah/plantuml-ts "only trusted repo",
  repo visibility PUBLIC, soft_deny `npm run visual:upload`) — in the global file this makes the classifier treat
  every other repo including ~/.claude as untrusted. Extends F091. `$defaults` sentinel could not be confirmed in the docs
  excerpt (index-only). Fix: keep generic text global; move plantuml-ts context to that repo's
  `.claude/settings.local.json`? (autoMode is user/managed only — so use a per-project `--settings` file or accept the
  global scope but add `~/.claude` and `~/git/**` as trusted repos). Conf 60.

## Prior-art check

Already tracked, not re-reported: F011, F084, F088, F089, F090 (re-opened above only for the new allow side-effect),
F091, F109, F112, F129, F134, F187, F188, F212, F030 (PostModelSwitch is now present in the working tree), F019
(requirements are now pinned). Event-coverage gaps overlap phase1-A.
