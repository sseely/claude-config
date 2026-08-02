# Self-Improve Phase 1 — Agent A Findings (2026-08-01)

Installed Claude Code: 2.1.220. Supersedes the 2026-07-24 copy of this file.

## URLs fetched this run
- **Fully read (200, rich content)**: changelog, hooks, settings, agent-teams,
  routines, sub-agents, agent-view, memory, skills
- **Skipped (priority 3, time budget)**: overview, mcp, tutorials, worktrees —
  all four are already tracked as `active` in `research-urls.md` from the
  2026-07-24 promotion, so re-fetching was low-value this run.
- **Failed / thin**: none.

## Resolved since the 2026-07-24 audit (verified this run, not re-flagged)
- **`MultiEdit` tool references removed from all agent files.**
  `grep -rl "MultiEdit" agents/` → 0 matches (was 44 files on 2026-07-24).
  Confirmed by recent commits in `git log` ("drop MultiEdit" across
  category dirs). The background-subagent tool-resolution risk flagged
  last run is closed.
- **`~/.claude/agents/explore.md` and `plan.md` now exist**, overriding the
  built-in Explore/Plan subagents' model inheritance. The 2026-07-24
  cost-leak finding (exploration billing at session default model instead
  of Haiku) is closed.
- **`settings.json` `model` is now `"opus"`**, not `"fable"` as in the
  2026-07-24 snapshot — see Model Routing Improvements below for why this
  now matters differently (Opus 5 version gate).

Several other 2026-07-24 findings remain open and are repeated below with
fresh grep evidence rather than re-derived from scratch.

---

## New Features Unused

- Feature: Path-scoped rules (`paths:` YAML frontmatter in `.claude/rules/*.md`) — loads a rule only when Claude touches matching files, instead of every session.
- Config status: UNUSED — `grep -rln "^paths:" rules/` → empty across all rule files. **REPEAT finding**, open since at least the 2026-06-20 audit, confirmed unresolved across three subsequent audits including this one.
- Recommendation: `api-design.md` → scope to `src/api/**`; `logging.md`/`error-handling.md`/`observability.md` → scope to source globs; `naming-conventions.md` → scope to source + test globs. Rules like `commits.md`, `pr-workflow.md`, `diagnosis.md`, `parallelism.md` are session-wide by nature and should stay unscoped. `prompting-quality.md` already documents this exact recommendation ("Domain-specific rules should use `paths:` frontmatter") — the rule file is telling the config to do this and it hasn't been done.
- Confidence: 75

- Feature: Nested subagent spawn depth default raised 1 → 3 layers (v2.1.219); override via `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`.
- Config status: UNUSED (no override) — `grep -n "CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH" settings.json` → no match. The default behavioral change is live in this config with no explicit review.
- Recommendation: Add a line to `rules/parallelism.md` noting the new 3-layer default so agent authors know nested delegation (e.g. a reviewer agent dispatching per-finding verifiers) is now possible without extra config, and that it increases the effective token/cost multiplier of a single Agent-tool call.
- Confidence: 75

- Feature: `isolation: worktree` subagent frontmatter/call field — runs a subagent in an isolated git worktree, auto-cleaned if no changes made.
- Config status: UNUSED — `grep -rn "isolation: worktree\|isolation:worktree" agents/ rules/ skills/` → no matches outside `research-urls.md`'s own tracking table.
- Recommendation: `rules/autonomous-execution.md`'s parallel-batch model relies on write-set discipline alone to avoid cross-file conflicts. For batches with any risk of accidental overlap, prefer `isolation: "worktree"` on the Agent tool call over trusting write-set bookkeeping.
- Confidence: 60

- Feature: `fallbackModel` setting — ordered fallback list tried when the primary model is overloaded/unavailable.
- Config status: UNUSED — `grep -n "fallbackModel" settings.json` → no match.
- Recommendation: With `"model": "opus"` as the sole session model, an Opus outage/overload stalls interactive sessions with no automatic degrade path. Add `"fallbackModel": ["sonnet"]` to `settings.json`.
- Confidence: 60

## Hook Opportunities

- Feature: New/still-unwired hook events — `SessionEnd`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `PostToolBatch`, `PermissionRequest`, `PermissionDenied`, `WorktreeCreate`/`WorktreeRemove`, `TeammateIdle`, `ConfigChange`, `StopFailure`, `PostToolUseFailure`.
- Config status: UNUSED — `settings.json` hooks block wires only `SessionStart`, `UserPromptSubmit` (x2), `PreCompact`, `PostCompact`, `PreToolUse` (Bash), `PostToolUse` (Write|Edit), `InstructionsLoaded`, `Stop`. **REPEAT finding** across at least 3 prior audits (`self-improve-2026-07-01-R2.md` Finding 4.1, `self-improve-phase1-A.md` 2026-07-24 copy) — unactioned.
- Recommendation: Highest-value single addition given `rules/autonomous-execution.md`'s quality-gate discipline: a `TaskCompleted` hook that blocks marking a mission-brief task complete without evidence a quality-gate command ran (exit 2 to reject + feedback). This mechanically enforces a rule currently enforced only by the model self-policing its own TodoWrite/README.md checkbox updates.
- Confidence: 70

- Feature: Subagent-frontmatter `hooks:` field — defines hooks scoped to only that agent's run (fires on `SubagentStop` etc. when the agent is dispatched as a subagent).
- Config status: UNUSED — `grep -rln "^hooks:" agents/` → empty across all 128 agent files.
- Recommendation: `code-reviewer.md` and `debugger.md` both carry `memory: user` for cross-session learning already — a scoped `PostToolUse` hook on `debugger.md` that re-runs the failing test after each edit would tighten the loop `skills/fix/SKILL.md` currently drives manually.
- Confidence: 50

- Feature: Hook `if` field — scopes a hook to a specific permission-rule pattern (e.g. `"if": "Bash(rm *)"`) instead of the hook body doing its own filtering.
- Config status: UNUSED — `grep -rn '"if"' . --include="*.json"` → no match anywhere in the repo. The current `PreToolUse` hook (`settings.json:190-200`) matches every `Bash` call and does inline Python regex to filter for `rm -rf /` and `sudo`.
- Recommendation: Split into two hooks with `"if": "Bash(rm *)"` and `"if": "Bash(sudo *)"` so each only fires for commands that could match, instead of spawning a Python subprocess on every Bash call.
- Confidence: 55

## Model Routing Improvements

- Feature: Claude Opus 5 (`claude-opus-5`) became the default Opus model at v2.1.219, with 1M context and new fast-mode pricing. `rules/parallelism.md` documents a version gate: `"opus"` alias resolves to Opus 5 only on Claude Code v2.1.219+.
- Config status: USED — `settings.json:141` sets `"model": "opus"`; installed version 2.1.220 clears the documented gate.
- Recommendation: None needed — confirms the routing-economics assumptions in `rules/parallelism.md` (Opus 5 ≈ Fable-class capability at ~half Opus 4.8 cost) are now live for this config's main-thread model, not aspirational.
- Confidence: 85

- Feature: `effortLevel` persisted setting (`low`/`medium`/`high`/`xhigh`).
- Config status: USED — `settings.json:252` sets `"effortLevel": "high"`, matching `rules/extended-thinking.md`'s stated default.
- Recommendation: None — correctly configured.
- Confidence: 90

## MCP Opportunities

- Feature: Subagent-frontmatter `mcpServers:` field — lets an individual agent declare an MCP server inline, scoping its tool schema to only that agent's context instead of the whole session.
- Config status: UNUSED — `grep -rln "^mcpServers:" agents/` → empty across all 128 agent files. Meanwhile `serena` is declared in project-scoped `.mcp.json` (`/Users/scottseely/.claude/.mcp.json`), so its tool descriptions load into every session's context, even though `rules/lsp.md` states Serena is for subagents only ("Subagents use Serena MCP tools — not the LSP tool").
- Recommendation: **REPEAT finding** from 2026-07-24 (MCP Opportunities item 1), unactioned. Move the `serena` MCP definition from `.mcp.json` into `mcpServers:` frontmatter on the agents that actually use it (per `rules/lsp.md`'s subagent list), so its schema stops consuming main-session context budget.
- Confidence: 65

- Feature: Duplicate/stray `.claude/.mcp.json` with a `--project` path of `/Users/scottseely/.claude/.claude` (double `.claude` segment), distinct from the root `.mcp.json`'s correct `/Users/scottseely/.claude`.
- Config status: Present but likely misconfigured — `cat .mcp.json .claude/.mcp.json` shows the two files point Serena at two different, inconsistent project roots.
- Recommendation: Verify whether `.claude/.mcp.json` is a stray duplicate; if so, delete it. A Serena instance pointed at a non-existent project path could silently return empty symbol-lookup results to any agent that picks it up.
- Confidence: 60

- Feature: Official MCP plugin marketplace ships ready-to-enable servers (`github`, `playwright`, `gitlab`, `linear`, `terraform`, `context7`, `greptile`, `firebase`, etc.) alongside the LSP plugins already enabled.
- Config status: PARTIAL — `enabledPlugins` in `settings.json:235-243` enables only LSP plugins + `claude-code-setup`; `ls plugins/marketplaces/claude-plugins-official/external_plugins/` confirms `github`/`playwright` are present in the marketplace but not enabled.
- Recommendation: `skills/webapp-testing/SKILL.md` drives Playwright via hand-rolled `sync_playwright()` Python scripts rather than the `playwright` MCP plugin already sitting in the marketplace. Evaluate enabling `playwright@claude-plugins-official` for that skill.
- Confidence: 45

## Memory System Insights

- Feature: Subagent persistent memory (`memory: user` frontmatter field).
- Config status: PARTIAL, unchanged since 2026-07-24 — `grep -rln "^memory:" agents/` → only `code-reviewer.md` and `debugger.md` (2 of 128); `ls ~/.claude/agent-memory/` confirms both have populated directories and are working as intended.
- Recommendation: Broader rollout still open — `security-auditor` and `architect-reviewer` were suggested previously and remain un-adopted. Both do repeat-invocation work (recurring false-positive patterns, prior architectural decisions) that would benefit from cross-session memory the way debugger.md already does.
- Confidence: 45

- Feature: `MEMORY.md` 200-line/25KB read budget with Claude Code now warning/erroring when a write pushes the file near or over the limit (v2.1.210+).
- Config status: Unaudited this run — did not check actual line/byte counts of `~/.claude/projects/*/memory/MEMORY.md` files (out of this task's write-set; would require a dedicated read-only pass).
- Recommendation: Flag for a follow-up audit: `wc -l`/`wc -c` every project `MEMORY.md` to confirm none are silently truncating content past the load limit.
- Confidence: 35

## Agent Design Patterns

- Feature: Background-by-default subagents (v2.1.198) strip the built-in tool list to `Read, Grep, Glob, Bash, PowerShell, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill, ToolSearch, EnterWorktree, ExitWorktree, Monitor, TaskStop, SendMessage, Artifact` — any other tool named in an agent's `tools:` frontmatter is dropped when that agent runs backgrounded, which is now the default.
- Config status: Partially audited — the one known casualty (`MultiEdit`, 44 agents) was already fixed this cycle (see Resolved section above). Did not cross-check all 128 agents' full `tools:` lines against the background-safe allowlist for other non-background-safe tool names this run.
- Recommendation: Follow-up audit: grep every `agents/*/*.md` `tools:` line for tools outside the documented background-safe set (e.g. any custom/plugin tool names) to catch a repeat of the MultiEdit issue before it ships.
- Confidence: 40

## Cost Optimization

- Feature: Concurrent/per-session subagent spawn caps (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` default 20, `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION` default 200).
- Config status: UNUSED (defaults) — `grep -n "CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS\|CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION" settings.json` → no match.
- Recommendation: Defaults are generous relative to this repo's typical batch sizes (3-5 teammates per `rules/parallelism.md`). No action needed; confirmed-fine default.
- Confidence: 40

- Feature: `autoMode` classifier-based permissions (replaces static allow/deny lists with live command classification).
- Config status: UNUSED — no `autoMode` block in `settings.json`, which instead hand-maintains a ~50-entry `permissions.allow` array. **REPEAT finding**, open since at least 2026-07-24, despite MEMORY.md explicitly recording "User prefers broad pre-approved permission rules over repetitive per-call prompts" — auto mode is a closer structural fit to that stated preference than continued list maintenance.
- Recommendation: Worth a deliberate trial (`"autoMode": {"allow": ["$defaults", ...]}`) rather than further manual list growth.
- Confidence: 55

## Fetch Warnings

None. All 9 URLs fetched this run returned 200 with substantial content
(smallest rendered response ~2.5KB, most 15-90KB raw before summarization).

## Candidate URLs Discovered

None. All feature areas surfaced this run (agent-teams, routines, worktrees,
overview, mcp, tutorials, skills, sub-agents, agent-view) are already
present in `skills/self-improve/research-urls.md`, several marked
`PROMOTED 2026-07-24` / `active`. No new documentation pages outside the
existing fetch list were discovered.
