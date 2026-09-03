# Phase 2 — Agent D: Settings, Hooks, MCP Audit
Run: 2026-09-02. Claude Code v2.1.259. Prior run: 2026-08-01 (merged
chore/code-review-tasks-2026-08).

## 1. Hook events

Authoritative list fetched from https://code.claude.com/docs/en/hooks
(confidence: HIGH, verified this run). 32 events exist; `phase2-audit-agents.md:27-28`
lists only 9 and is stale — missing 23, including several directly relevant here.

Currently wired (any of the 4 settings files): SessionStart, UserPromptSubmit,
PreCompact, PostCompact, PreToolUse, PostToolUse, InstructionsLoaded, Stop.

Missing events with concrete value here:
- **ConfigChange** (`~/.claude/settings.json`, new key) — "runs for each
  settings-file change it detects" (docs, confirmed HIGH). Directly replaces
  the passive/async SessionStart privilege check — see §9. Fix: add a
  synchronous `ConfigChange` hook running `hooks/session-start.sh`'s
  `check_privilege_elevation` logic. [human-applied]
- **PermissionDenied** — no hook logs denied Bash/tool calls anywhere; would
  let `fewer-permission-prompts` and this audit see real friction instead of
  guessing from transcripts. Suggestion.
- **PostToolUseFailure** — no hook captures tool failures; `logging.md`/
  `error-handling.md` want failures logged, none of the 4 Python hooks or
  4 settings files reference this event. Suggestion.
- **SubagentStart/SubagentStop** — nothing tracks subagent spawn depth
  against `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (`rules/parallelism.md`).
  Suggestion.
- **StopFailure** — distinguishes a clean Stop from an API-error-terminated
  turn; `notify-on-stop.sh` currently chimes the same way for both. Note.

## 2. Permission noise (settings.json)

One-off/stale entries in `~/.claude/settings.json:9-121` `permissions.allow`
(uncommitted diff per `git status`, confirmed via `git diff` not re-shown
here — matches orchestrator's prior observation):
- `settings.json:117` `Bash(awk -F: 'length\($0\)-length\($1\)-1 > 80 ...')`
  — one-off literal awk one-liner (~80-char-line checker), not a reusable
  grant. Confidence 95. [human-applied] Remove; if the check is needed
  again, keep it in a script under `hooks/` or `scripts/` and grant that
  path instead.
- `settings.json:118` `Bash(echo "--- drum refs above \(exit $?\) ---")`
  — exact-literal echo grant (confirmed literal-not-wildcard match against
  fetched settings docs example `Bash(npm run lint)`). Confidence 95.
  [human-applied]
- `settings.json:119` `Bash(echo "=== rc=$? ===")` — same class. Confidence
  95. [human-applied]
- `settings.json:120` `Bash(./sync-fork.sh dot-output *)` — relative-path
  script grant; only valid when cwd is the specific repo containing
  `sync-fork.sh`, useless (and misleading — implies a capability that
  silently no-ops elsewhere) in every other project. Confidence 85.
  [human-applied] Move to that repo's own `.claude/settings.json`.
- `settings.json:98` `Bash(~/.claude/hooks/setup-complexity.sh)` — no
  trailing `:*`, so this is an exact-argument-less grant; fine as-is, not
  noise, confirming the repo does understand the exact-vs-wildcard
  distinction elsewhere. Not a finding — included to calibrate confidence
  on the three above.

Recurrence: this is the same finding class the prior run raised and the
harness auto-mode classifier blocked (permission-file edits). It has
recurred once already since (three new one-off grants added by hand in 24
days). Systemic fix, not a one-off cleanup: [human-applied] add a
`PreToolUse`/`ConfigChange`-adjacent guard, or a periodic lint, that flags
any `Bash(echo "...")` or `Bash(./*)` literal grant added to
`~/.claude/settings.json` — see §9 mechanism, same class of "silent because
async" gap.

## 3. Permission gaps

`.claude/settings.local.json` carries no `permissions` key (only
`disabledMcpjsonServers`), so there is nothing to diff there.

`templates/autonomous-settings.json` grants many commands absent from
global `~/.claude/settings.json`, all consistent with autonomous mode being
intentionally broader (`Write(**)`/`Edit(**)`/`Read(**)`/`Glob(**)` vs.
global's directory-scoped grants; `Bash(psql *:*)`,
`Bash(docker-compose *:*)`, `Bash(uv pip install:*)`,
`Bash(curl -s https://raw.githubusercontent.com/**:*)`). Not flagged as
gaps — global intentionally stays narrower for interactive safety per
`rules/security.md`. Note only: `curl` has zero grants anywhere in global
`settings.json`; the one CLI HTTP client this repo's `code-principles.md`
tolerates as a fetch fallback is ungranted outside autonomous mode, which
is consistent, not a gap.

`mcp__playwright__*` (5 grants, `templates/autonomous-settings.json:59-63`)
present with **no playwright MCP server in `.mcp.json` or
`.claude/.mcp.json`** (grepped both, confirmed absent) and **no longer
present in `.claude/settings.autonomous.json`** (grepped, absent — prior
run's note that it was in two files is now stale, it's in one).
`webapp-testing/SKILL.md` references playwright but as the CLI/npx tool,
not confirmed as this MCP form. Confidence 80 this is a dangling grant.
Warning. Fix: either add a playwright MCP entry to `.mcp.json` (or a
project-local one that mission briefs generate) or drop the 5 grants from
the template. [human-applied]

## 4. WebSearch/WebFetch syntax

Consistent — grepped every `*.json` under `~/.claude` for `"WebSearch` and
`"WebFetch`: only the bare form appears, in `settings.json:111-112` and
`templates/autonomous-settings.json:46-47`. No `"WebSearch(*)"` variant
exists anywhere in the repo. Not a finding. Confidence: HIGH on the grep
(exhaustive), MEDIUM on "which form Claude Code requires" — the fetched
settings/hooks docs did not state this explicitly this run; bare form is
what every example in fetched docs used for named (non-Bash-style) tools.

## 5. MCP gaps

- `gh api:*`, `gh repo:*`, `gh workflow list:*`, `gh auth:*`, `gh run:*`
  (`settings.json:55-59`) — shell `gh` calls with no structured GitHub MCP
  server configured anywhere (`.mcp.json` has only `forge`;
  `.claude/.mcp.json` has only `serena`). A GitHub MCP server would give
  typed PR/issue/workflow objects instead of parsing `gh` JSON output by
  hand. Confidence: MEDIUM (no WebSearch run this pass to confirm current
  official server status/name — flagging the gap, not a specific server).
- `curl` (autonomous template only) — an MCP fetch server isn't a
  structured win over `WebFetch`, which the repo already grants; no gap.
- Local filesystem shell calls (`find`, `grep`, `cat`, `ls`) are already
  superseded in-session by Serena's `find_file`/`search_for_pattern`
  (`mcp__serena__*` wildcard-granted, `settings.json:116`) — no gap, this
  is the intended path per `rules/lsp.md`.

## 6. Hook quality — see §8 table for the full matrix. Highlights:

- `hooks/guard-bash.py` and `hooks/nudge-search-tool.py` fail-open on
  *any* exception with a bare `except: return`/`pass` and no error log —
  by design (documented: "must not wedge the session"), but this means a
  hook bug that silently stops guarding `rm -rf` is undetectable except by
  reading logs that don't exist. Contrast with `project-init.sh` and
  `setup-complexity.sh`, which both write to `logs/*.err` on failure.
  Confidence 85. Suggestion: add a best-effort
  `except Exception as e: log_to(...); return` — logging must not itself
  risk blocking, so keep it inside its own try/except with a hard-coded
  fallback of "do nothing further."
- `hooks/log-instructions-loaded.sh` uses `set -uo pipefail` (no `-e`) —
  intentional per its own comment ("never blocks"), not an oversight, but
  it is the only hook script that deviates from the `set -euo pipefail`
  convention `code-principles.md`/this audit's brief expects. Note.

## 7. Autonomous template completeness

Hooks present in `~/.claude/settings.json` (user/global) but **absent from
all three** of `.claude/settings.json`, `.claude/settings.autonomous.json`,
`templates/autonomous-settings.json`:
- `PreToolUse` → `guard-bash.py` (Bash matcher), `nudge-search-tool.py`
  (Grep matcher)
- `PostToolUse` → `check-frontmatter.py` (the second hook in the
  `Write|Edit` group; `check-complexity.py` IS present in all four)
- `InstructionsLoaded` → not present at all in the other three

**Correction to the orchestrator's framing of this as unmitigated risk:**
per the fetched settings docs ("Lists merge instead of overriding" —
confirmed HIGH, `settings` doc, hooks are a list key and not one of the 4
named exceptions), Claude Code combines hook arrays across
user/project/local scope rather than letting a project file replace the
user file's hooks. So on *this* machine, under *this* user account, an
autonomous session in any project still gets `guard-bash.py` merged in
from `~/.claude/settings.json` — the omission is not an active
`rm -rf`-guard gap here. It IS a real gap for **portability**: the
autonomous template is designed to be copied into other repos
(`autonomous-toggle.sh:31-40` sources from `$PROJECT_AUTONOMOUS` or
`$GLOBAL_TEMPLATE`) which may run under a different user, a CI runner, or
a sandboxed container (see `sandbox` skill) with no
`~/.claude/settings.json` to merge from. Confidence 85. Warning, not
Critical (downgraded from what the merge behavior would otherwise imply).
Fix: add explicit `PreToolUse`/`guard-bash.py` and
`PostToolUse`/`check-frontmatter.py` wiring to
`templates/autonomous-settings.json` so the safety net travels with the
profile instead of depending on an ambient user file. [human-applied]

## 8. Hook inventory

| File | Wired (event/matcher) | set -euo | Platform guard | Idempotent | Error logging | Tests |
|---|---|---|---|---|---|---|
| `session-start.sh` | SessionStart, all 4 settings files, `async:true` | yes (`:2`) | yes (darwin/linux branches for brew/cargo install) | yes (checks before install) | yes, `.err` file via trap | none |
| `record-turn-start.sh` | UserPromptSubmit, all 4, `async:true` | yes | n/a (portable) | yes (overwrites) | none (trivial, low risk) | none |
| `project-init.sh` | UserPromptSubmit, all 4, `async:true` | yes | n/a | yes (`-f`/`-d` checks throughout) | yes, `.err` via trap | none |
| `notify-on-stop.sh` | Stop, all 4, `async:true` | yes | yes (darwin `osascript` / linux `notify-send`) | yes | yes (stderr on osascript/notify-send failure) | none |
| `guard-bash.py` | PreToolUse/Bash — **only in `~/.claude/settings.json`**, absent from other 3 (see §7) | n/a (Python; fail-open `try/except: return`) | n/a | yes (stateless) | **no** (§6) | `test_guard_bash.py`, runs green as standalone script only (§ below) |
| `nudge-search-tool.py` | PreToolUse/Grep — **only in `~/.claude/settings.json`** | n/a, fail-open | n/a | yes | **no** | none |
| `check-complexity.py` | PostToolUse/Write\|Edit — all 4 files | n/a, fail-open (documented) | n/a | yes (git-baseline ratchet, documented design) | fail-open by design | none found |
| `check-frontmatter.py` | PostToolUse/Write\|Edit — **only in `~/.claude/settings.json`** | n/a, fail-open | n/a | yes | fail-open by design | `test_check_frontmatter.py`, green standalone only |
| `log-instructions-loaded.sh` | **DEAD** — see below | `set -uo pipefail` (no `-e`, intentional) | n/a | yes (append-only) | swallows errors by design (`\|\| exit 0`) | none |
| `quality-gate.sh` | not an event hook — Bash-permission-only CLI utility (`Bash(~/.claude/hooks/quality-gate.sh:*)` in `settings.json:97`), invoked manually/by mission briefs | yes | n/a | yes (read-only checks) | yes (trap ERR, fail-closed) | none |
| `autonomous-toggle.sh` | not an event hook — Bash-permission-only CLI (`settings.json:99-100`) | yes | n/a | yes (guards: "already in autonomous mode", backup-before-overwrite, never deletes without a backup) | yes (explicit ERROR messages on restore failure, `:2`) | none |
| `setup-complexity.sh` | not an event hook — invoked by `session-start.sh` and by permission grant `settings.json:98` | yes | n/a (relies on portable python3/venv) | yes (upgrades existing venv) | yes (ERROR to stderr) | none |

**DEAD hook finding (Critical):** `settings.json:212-221` wires
`InstructionsLoaded` to an inline command —
`echo "[$(date ...)] InstructionsLoaded" >> ~/.claude/logs/instructions-loaded.log`
— not to `hooks/log-instructions-loaded.sh`. `log-instructions-loaded.sh`
is never invoked by any of the 4 settings files (grepped all 4 for its
filename — zero matches outside its own file). Its own docstring
(`log-instructions-loaded.sh:5-17`) states its purpose: log
`session_id, cwd, hook_event_name, file_path, load_reason` per event so
`paths:` frontmatter scoping can be proven to fire (or proven silently
not to) — citing runbook
`plans/code-review-tasks-2026-08/batch-2b/T13-paths-pilot.md`. The inline
echo that actually runs captures only a bare timestamp with no
`file_path`/`load_reason`, so it **cannot** fulfill that stated purpose:
there is currently no evidence anywhere on disk of which files trigger
`InstructionsLoaded` or why. Confidence 95 (grepped exhaustively, read
both the wired command and the unwired script). Fix: replace
`settings.json:217`'s command with
`~/.claude/hooks/log-instructions-loaded.sh`. [human-applied]

**Test suite finding (Warning):** the task's canonical check —
`hooks/.venv/bin/python -m pytest hooks/ -q` — was run and does **not**
work: `hooks/.venv/bin/python: No module named pytest` (`requirements.txt`
only lists `lizard`, `pyyaml`). Even with system `python3` (which has
pytest 8.3.4 installed), `pytest hooks/` collects **0 items** for both
`test_check_frontmatter.py` and `test_guard_bash.py` — neither file
defines `def test_*` functions; both use a custom `main()`/`check_case()`
runner under `if __name__ == "__main__":`. Run directly
(`python3 test_check_frontmatter.py`, `python3 test_guard_bash.py`), both
pass: 7/7 and 30/30 cases green, exit 0. So the tests are real and
currently passing, but (a) named `test_*.py` in a way that implies pytest
compatibility it doesn't have, misleading anyone who runs the standard
invocation into believing "no tests exist" rather than "0 collected,
check manually", and (b) not wired into any hook or CI step — nothing
runs them automatically after a hook edit. Confidence 100 (ran both
invocations, captured exit codes and output). Fix: either rename to
`smoke_check_frontmatter.py`/`smoke_guard_bash.py` to stop implying pytest
discovery, or add thin `def test_*` wrapper functions calling the existing
`check_case` logic and add `pytest` to `requirements.txt`.

## 9. Autonomous-profile exposure — verdict

**Byte-identical files:** `.claude/settings.json` and
`.claude/settings.autonomous.json` are still byte-identical (2429 B, mtime
2026-08-09 17:43:46, `cmp` confirmed) — the state has now persisted **24
days**, up from the prior run's 8-day observation. Confirmed HIGH.

**Root cause of the silent check (mechanism, not guess):**
`hooks/session-start.sh:100-115` defines `check_privilege_elevation`,
which correctly detects this exact condition (`cmp -s "$live" "$auto"` —
verified the boolean logic is right: identical files fall through to the
warning, non-identical/missing files `return 0` and skip it). The function
is called and its `echo` warnings go to stdout. The reason the warning
never reaches the model: `settings.json:130-139` wires `SessionStart` with
`"async": true`. Per the hooks doc fetched this run (HIGH confidence,
direct quote): *"With `async: true`, even SessionStart output is
discarded from Claude's context... this applies universally across all
hook events"* and SessionStart's normal stdout-to-context exception
applies **only when synchronous**. So the mechanism is: the check runs,
detects the condition correctly, prints the warning to stdout — and that
stdout is thrown away before the model ever sees it, every session, by
design of `async: true`. This is not a bug in the check's logic; it is a
wiring choice that silences a correctly-firing safety check.

**Verdict:** Critical. The check is not broken, but it is functionally
inert — 24 days of unnoticed autonomous exposure is the direct,
demonstrated cost. Two independent fixes, either sufficient alone:
1. [human-applied] Drop `"async": true` from the `SessionStart` hook entry
   at `settings.json:136` (loses the background-install non-blocking
   benefit for the ast-grep/lizard setup paths — those already guard
   themselves with `CLAUDE_AUTO_INSTALL_TOOLS` opt-in and a `trap ... exit
   0`, so making the whole hook synchronous mainly costs a few hundred ms
   of `command -v` checks per session start, not correctness).
2. [human-applied] Add a synchronous `ConfigChange` hook (see §1) running
   the same `check_privilege_elevation` check — fires exactly when
   `.claude/settings.json` is written to match the autonomous file, rather
   than only at the start of whatever session happens to run next, which
   is a strictly earlier and more reliable trigger than SessionStart async
   or sync.

Recommend both: (1) makes the existing check actually reach the model;
(2) closes the gap where nobody starts a *new* session for days after the
toggle flips.
