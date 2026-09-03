# Self-Improve Phase 1 — Agent A (Claude Code ecosystem) — 2026-09-02

## Sources fetched

| URL | Status | Chars | Coverage |
|---|---|---|---|
| https://code.claude.com/docs/en/changelog | 200 | ~36,000 (saved to file) | Fully read — 2.1.231 (Aug 12) through 2.1.258 (Sep 1, 2026), overlapping the 2026-08-01 prior-run boundary as instructed |
| https://code.claude.com/docs/en/hooks | 200 | ~10,000 | Fully read — complete hook-event reference |
| https://code.claude.com/docs/en/settings | 200 | ~28,000 | Fully read — precedence/scope page (the separate settings-reference key list is not in the Agent A URL table) |
| https://code.claude.com/docs/en/memory | 200 | ~11,000 | Fully read |
| https://code.claude.com/docs/en/sub-agents | 200 | ~5,000 | Fully read |
| https://code.claude.com/docs/en/mcp | 200 | ~6,500 | Fully read |
| https://code.claude.com/docs/en/overview | active, not fetched | — | Skipped this run — time-boxed to priority 1+2 pages per phase1-research-agents.md fetch order |
| https://code.claude.com/docs/en/skills | active, not fetched | — | Skipped |
| https://code.claude.com/docs/en/agent-teams | active, not fetched | — | Skipped (changelog 2.1.232 covers most of what changed here) |
| https://code.claude.com/docs/en/agent-view | active, not fetched | — | Skipped |
| https://code.claude.com/docs/en/routines | active, not fetched | — | Skipped |
| https://code.claude.com/docs/en/worktrees | active, not fetched | — | Skipped |
| https://code.claude.com/docs/en/tutorials | active, not fetched | — | Skipped |
| https://www.anthropic.com/blog | active, not fetched | — | Secondary/optional per its own row; skipped, no topic gap found that required it |

No fetch failures this run — every page fetched returned 200 and well over the 1000-char thin-content bar. The 8 unfetched active URLs are a coverage gap from time-boxing, not fetch-guard failures; flag for next run if Phase 4 finds a gap traceable to skills/agent-teams/agent-view/routines/worktrees.

---

## New Features Unused

- **Critical** — TodoWrite/TaskCreate/TaskCompleted/TaskUpdate/TaskList are **off by default** on Opus 4.8, Sonnet 5, Fable 5, Mythos 5, and newer (source: changelog 2.1.233, Aug 14 2026: "Todo/task-tracking tools ... are no longer available on Opus 4.8, Sonnet 5, Fable 5, Mythos 5, and newer models; set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` to bring them back"). Config evidence: `CLAUDE.md:44` ("Use TodoWrite to track progress") and `rules/autonomous-execution.md:174` ("Use TodoWrite for granular sub-steps within a task") both instruct use of the tool; `settings.json:128` pins `"model": "claude-fable-5-1[1m]"` and `rules/parallelism.md`'s whole model table routes to Sonnet 5/Opus 5/Fable 5 — every model this config uses. Grepped `settings.json`, `settings.local.json` for `CLAUDE_CODE_ENABLE_TODO_TOOLS`: not found. Confidence: 90. Fix: add `"env": {"CLAUDE_CODE_ENABLE_TODO_TOOLS": "1"}` to `settings.json`, or rewrite the two instructions to stop assuming TodoWrite exists.

- **Suggestion** — Built-in **"Concise" output style** (changelog 2.1.237, Aug 20 2026): "Claude leads with results and skips preamble and narration ... just as thoroughly." `rules/prompting-quality.md`'s "Scale-aware brevity constraints" section hand-writes the same effect per-prompt ("Return only the structured result — no preamble, no trailing summary"). Grepped config for `outputStyle`/`Concise`: not found. Confidence: 75. Fix: evaluate `outputStyle: "Concise"` in Opus-tier agent frontmatter as a native alternative/supplement to the hand-rolled brevity text, cutting per-prompt token overhead.

- **Suggestion** — Subagent `isolation: worktree` frontmatter (confirmed live on the sub-agents doc) is completely unused: `grep -rln "^isolation:" agents/` returns nothing. `rules/parallelism.md`'s file-ownership planning step exists specifically to avoid write conflicts between parallel agents — worktree isolation removes that need for agents that make speculative/exploratory edits. Confidence: 70. Fix: evaluate `isolation: worktree` for agents like `refactoring-specialist` or `legacy-modernizer` when spawned in parallel.

- **Note** — `background: true` and `maxTurns` subagent frontmatter fields (maxTurns added 2.1.246, marks output partial at the limit) are unused (`grep -rln "maxTurns\|^background:" agents/` empty). `maxTurns` would let bounded iterative agents fail gracefully instead of silently exhausting turns. Confidence: 60. Fix: consider adding `maxTurns` to agents used inside the `/fix` skill's 5-iteration loop as a belt-and-suspenders cap.

- **Note** — `Agent(worker, researcher)` tool-restriction syntax (whitelist which named subagents an agent may spawn) is unused (`grep -rn "^tools:.*Agent(" agents/` empty). Complements the global `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` cap in `rules/parallelism.md` with per-agent fan-out control. Confidence: 55. Fix: consider for autonomous-execution-heavy agents that should only ever spawn specific specialists.

- **Note** — `CLAUDE_CODE_NEW_INIT=1` enables an interactive multi-phase `/init` (explores codebase via subagent, asks follow-ups, proposes CLAUDE.md/skills/hooks for review before writing). `hooks/project-init.sh` does not reference it. Confidence: 70. Fix: low priority; worth trying next time a new project is bootstrapped.

---

## Hook Opportunities

Current wiring (`settings.json:129-234`): `SessionStart`, `UserPromptSubmit`, `PostCompact`, `PreCompact`, `PreToolUse` (Bash, Grep), `PostToolUse` (Write|Edit), `InstructionsLoaded`, `Stop`. The hooks doc (fully read) lists many event types not in this list: `SessionEnd`, `Setup`, `UserPromptExpansion`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied`, `PostToolBatch`, `StopFailure`, `PreModelSwitch`/`PostModelSwitch` (added 2.1.251), `FileChanged`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `WorktreeCreate`/`WorktreeRemove`, `SubagentStart`/`SubagentStop`, `TeammateIdle`, `TaskCreated`/`TaskCompleted`, `Notification` (now with granular `notification_type` values), `MessageDisplay`, `Elicitation`/`ElicitationResult`.

- **Suggestion** — `SubagentStop` (can block via exit 2) is unused. `rules/autonomous-execution.md`'s Quality Gates procedure relies on the orchestrator remembering to run gates after each batch. Confidence: 65. Fix: prototype a `SubagentStop` hook matched to mission-brief agent types that runs the batch's quality-gate commands and blocks with `additionalContext` on failure.

- **Suggestion** — `ConfigChange` (matcher includes `skills`; fires when a settings file or skill changes mid-session) is unused. This very skill (`self-improve`) edits `research-urls.md` and could edit `rules/` files mid-run. Confidence: 55. Fix: add a `ConfigChange` hook appending `[timestamp] config changed: <source>` to a log, alongside the existing `hooks/log-instructions-loaded.sh`.

- **Note** — `Notification` now carries `agent_needs_input`/`agent_completed`/`quota_auto_resume_*` types. `hooks/notify-on-stop.sh` only wires `Stop`, which won't fire for a background agent's completion. Confidence: 60. Fix: consider a `Notification` hook filtered to `agent_completed` for autonomous mission-brief runs using background agents.

- **Note** — `PreModelSwitch`/`PostModelSwitch` (added 2.1.251) could log/block model drift, relevant given `settings.json:128` pins a specific model and `settings.json:253-257` overrides Opus-5 effort. Confidence: 50. Fix: low priority; only worth wiring if model-switch drift is observed as a problem.

- **Note** — `PostToolUseFailure` (annotate via stderr after a tool fails) is unused; current `PostToolUse` (`settings.json:197-211`) only fires on success. Confidence: 50. No immediate action.

---

## Model Routing Improvements

(Primarily Agent B's territory; noting only what this run's config reads directly surfaced.)

- **Warning** — `settings.json:128` sets `"model": "claude-fable-5-1[1m]"`. Changelog 2.1.257 (Sep 1, 2026): "Added Claude Fable 5.1 (`claude-fable-5-1`), now the default Fable model — 1M context ..." (native 1M, same architecture description Anthropic used for plain Fable 5). This skill's own pre-seeded Agent B guidance (`skills/self-improve/references/phase1-research-agents.md:72-73`) states Fable 5 has no `[1m]` variant because it already runs 1M natively and calls `claude-fable-5[1m]` invalid. Fable 5.1 is described the same way, so `claude-fable-5-1[1m]` is very likely the same class of invalid suffix, not merely stale routing. Confidence: 55 (needs Agent B verification against the model-config doc directly — outside this agent's primary source set). Fix: if confirmed invalid, change `settings.json:128` to `"claude-fable-5-1"` (no suffix).

- **Note** — `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` (added 2.1.257, forces every subagent onto one model, overriding per-agent `model:` frontmatter) is correctly **absent** from settings — setting it would silently break `rules/parallelism.md`'s whole per-role model table (Haiku for scoring, Sonnet for implementation, etc.). Confidence: 70. This is a "config is better" note, not a gap — no fix needed.

---

## MCP Opportunities

- **Note** — No `.mcp.json` or custom MCP server definitions exist under `~/.claude` (active servers — serena, webstorm, claude-in-chrome, forge — are registered outside the files this agent's read-set covers). `headersHelper`, per-tool `_meta.anthropic/maxResultSizeChars`, and `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS` (2-minute auto-background threshold for long MCP tool calls, added 2.1.212) are all unset/unused. Confidence: 50. Fix: no action for this repo now; revisit if MCP server startup latency or long-running tool calls become an observed problem.

---

## Memory System Insights

- **Suggestion** — Built-in **auto memory** (`autoMemoryEnabled: true`, `settings.json:259`) writes to `~/.claude/projects/<project>/memory/MEMORY.md` (200-line/25KB cap, machine-local, git-repo-scoped) automatically and is entirely separate from the project-local `.agent-notes/` system `rules/memory.md` defines. Nothing in `rules/memory.md` reconciles the two. Confidence: 70. Fix: add one sentence to `rules/memory.md`: `.agent-notes/` is for cross-session task handoffs committed to the repo; built-in auto memory is a separate, uncommitted, machine-local store Claude manages itself — do not duplicate entries between them.

- **Note** — Subagent `memory: user|project|local` frontmatter (auto-grants Read/Write/Edit, loads a per-agent `MEMORY.md`) is **already adopted**: `agents/04-quality-security/code-reviewer.md` and `agents/04-quality-security/debugger.md` both set `memory:`, evidenced directly by populated `agent-memory/code-reviewer/` and `agent-memory/debugger/` directories. Confidence: 90 (observed directly). Config is aligned/ahead here — no fix needed for the feature itself, but per `gitStatus`, `agent-memory/` is currently **untracked** (`?? agent-memory/`), not gitignored. Fix: add `agent-memory/` to `.gitignore` since it is machine-local state, the same category as `.claude/agent-memory-local/`.

- **Note** — `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` (loads CLAUDE.md/rules from `--add-dir` directories) is unset; `settings.json:122-126`'s `additionalDirectories` (`/tmp`, `/private/tmp`, `/Users/scottseely`) do not load their own CLAUDE.md/rules even if present there. Confidence: 60. No action needed unless those directories are expected to carry instructions.

---

## Agent Design Patterns

- **Suggestion** — Subagent forking (`subagent_type: "fork"`) has been on by default since 2.1.232 (Aug 13): non-teammate `Agent`-tool spawns in interactive sessions now background by default, and a fork subagent inherits the full parent conversation + prompt cache (this session's own `Agent` tool description already documents "the fork inherits your full conversation context"). `skills/explore/SKILL.md:5` declares `context: fork` (a skill-level setting), but `rules/parallelism.md`'s "Mechanism — resume, do not re-spawn" section (lines ~198-207) only documents `SendMessage`-to-resume vs. a fresh `Agent` call — it never mentions `subagent_type: "fork"` as a third option for read-heavy research that needs full context inheritance at near-zero extra cost (shared prompt cache). Confidence: 60. Fix: add one line to `rules/parallelism.md` distinguishing `subagent_type: "fork"` (full context inheritance, cache-cheap) from a fresh `Agent` call, next to the existing resume-vs-respawn guidance.

- **Note** — Agent teams (`subagent_type: "agent-team"`) got a major build-out in 2.1.232 (per-member `team_model`, teammate `SendMessage` addressing, separated permissions) but remain unreferenced in `rules/` or `agents/` (`grep -rln "agent-team\|teammate"` matches only `research-urls.md` and one unrelated `internal-comms` example). `CLAUDE.md`'s Agents section says "Use Workflow ... for multi-step parallel orchestration" and "Prefer Agent tool for individual specialist delegation" but never places agent-teams (a third, distinct primitive: parallel teammates with live panes) relative to those two. Confidence: 65. Fix: if agent-teams is deliberately out of scope, no action; otherwise add one line to CLAUDE.md's Agents section naming it alongside Agent tool and Workflow.

---

## Cost Optimization

- **Suggestion** — `promptCacheTtl`/`subagentPromptCacheTtl` settings (added 2.1.243, Aug 25 — 1-hour main-conversation cache vs. default 5-minute subagent cache, independently) are unset (grepped, absent). This skill's own Phase 1 barrier spawns 4 parallel research agents per run (`phase1-research-agents.md`), and mission-brief batches run several sequential/parallel subagent calls within an hour — a longer subagent TTL could reduce prompt-cache misses across that pattern. Confidence: 55. Fix: evaluate `"subagentPromptCacheTtl": "1h"` in `settings.json`.

- **Note** — `experimental.cacheTtl` per-agent frontmatter (added 2.1.248) offers the same TTL control scoped to one agent definition. No agent sets it (grepped). Complements the setting above for specific repeatedly-invoked agents (e.g. `code-reviewer`, `debugger`, which already carry `memory:`). Confidence: 50.

- **Note** — `/claude-api cost-optimize` (added 2.1.247) profiles a project's Claude API spend and walks cost levers (caching, token hygiene, batch, effort, model choice) one measured change at a time. Not a config change — a discoverable runtime tool, unreferenced in `rules/` or `CLAUDE.md`. Confidence: 45. Fix: none required; mention as available for a future cost audit.

---

## Candidate URLs discovered

None. This run used only the URLs already listed under the Agent A table in `research-urls.md`; no open-ended discovery was performed (that is Agent X's job this run).

---

## Fetch-guard warnings

None. All 6 URLs fetched returned HTTP 200, on-domain, well over the 1000-char thin-content bar. The 8 active Agent A URLs not fetched this run (overview, skills, agent-teams, agent-view, routines, worktrees, tutorials, anthropic blog) are a **time-boxed coverage gap**, not fetch failures — they remain `active` with their existing `last-verified` dates in `research-urls.md` (not modified by this agent per its write-set).
