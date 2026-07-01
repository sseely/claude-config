# Self-Improve Phase 1 — Agent A Findings (Claude Code ecosystem)

Date: 2026-06-20
Scope: read-only audit of `~/.claude/` against current Claude Code docs.

**Pages read fully:** code.claude.com/docs/en/hooks, /settings, /sub-agents
(persisted 66.8KB), /memory, /overview. **Skimmed (persisted, partial):**
/mcp (51KB persisted, read preview only). **Thin:** anthropic.com/blog (see
Warnings).

Evidence convention: `file:line` where a grep hit exists; "absent" where a
config-wide grep returned 0.

---

## New Features Unused

### 1. New hook events with no config usage
The hooks reference now documents 31+ events. The config uses only 7
(SessionStart, UserPromptSubmit, PreCompact, PostCompact, PreToolUse,
PostToolUse, InstructionsLoaded, Stop — settings.json:145-237). Unused events
that map directly to existing rules:

- **PostToolBatch** (absent) — fires after a full batch of parallel tool calls
  resolves, before the next model call; can block (exit 2) and inject
  `additionalContext`. Directly serves `parallelism.md` (validate parallel
  agent write-sets) and `autonomous-execution.md` quality gates between batches.
  Recommendation: add a PostToolBatch hook that checks `git diff --name-only`
  against declared write-sets during autonomous runs.
- **SubagentStop** (only documented, not wired — skills/self-improve/SKILL.md:369
  lists it as a known event; no hook configured). `autonomous-execution.md`
  mandates per-task quality gates; a SubagentStop hook could run the typecheck/
  test gate automatically when an implementation subagent finishes.
- **SubagentStart** (absent) — could inject `.agent-notes/` observations into
  each subagent automatically (parallelism.md step 0 currently relies on the
  orchestrator pre-loading notes by hand).
- **StopFailure** (absent) — fires on API errors (rate_limit, overloaded,
  billing_error). `logging.md`/`observability.md` want failure capture; a
  StopFailure logging hook would record these without manual effort.
- **PostToolUseFailure** (absent) — fires after a tool call fails, can inject
  `additionalContext` (alternative suggestions). Pairs with
  `error-handling.md`.

### 2. `effort:` frontmatter adopted in only 3 of 126 agents
`parallelism.md:88` documents effort via frontmatter, but only 3/126 agent
files set `^effort:` (grep). The model table (parallelism.md:79-80) prescribes
`high`/`xhigh` per role, yet planning/architecture agents (architect-reviewer,
Plan-style agents) carry no effort field. Recommendation: set `effort: high`
on architecture/security/planning agents; leave implementation agents at
inherit.

### 3. Subagent persistent memory (`memory:` frontmatter) barely used
Only 2/126 agents set `^memory:` (grep). Docs (sub-agents persisted output
lines 465-507) describe `memory: user|project|local` giving an agent a
cross-session knowledge directory at `~/.claude/agent-memory/<name>/`. The dir
already exists (`~/.claude/agent-memory` present, empty). High-value
candidates: code-reviewer, debugger, security-auditor, architect-reviewer —
agents that benefit from accumulating codebase patterns. This is the
agent-scoped complement to the `.agent-notes/` system in `memory.md`.

### 4. Forked subagents (`/fork`, fork subagent type)
Config references `context: fork` once (skills/explore/SKILL.md:5) but the
fork-as-cheap-side-task pattern (sub-agents persisted lines 861-913) is not
referenced in `parallelism.md`. A fork inherits the full conversation +
prompt cache, so it is cheaper than a fresh subagent for side tasks needing
existing context (draft tests, try-N-approaches). Recommendation: add a note
to `parallelism.md` on when to prefer `/fork` over a named subagent (when the
subagent would need heavy re-briefing).

### 5. `isolation: worktree` for subagents
Absent in all agent frontmatter (grep `isolation:` = 0). Docs (sub-agents
persisted line 284) allow `isolation: worktree` to give a subagent an isolated
repo copy auto-cleaned if no changes are made. Useful for autonomous
mission-brief batches where parallel agents must not collide on the working
tree. `parallelism.md` file-ownership rules could be enforced structurally
this way rather than by convention.

### 6. Nested subagents (depth ≤5)
Docs (persisted lines 784-794): a subagent can now spawn its own subagents
(v2.1.172+). `parallelism.md` assumes a flat orchestrator→worker model. The
self-improve skill's reviewer-dispatches-verifier-per-finding pattern could
now run nested instead of returning to the orchestrator. Not urgent; note for
future orchestration design.

### 7. `--agent` / `agent` setting (run whole session as a subagent)
Absent. The `agent` settings key and `initialPrompt` frontmatter let a whole
session adopt an agent's system prompt + tools + model. Could back a
"`claude --agent code-reviewer`" review workflow without a skill wrapper.

---

## Hook Opportunities

1. **HTTP hooks + `allowedHttpHookUrls`/`httpHookAllowedEnvVars`** (settings
   keys, absent) — for sending observability events to a local endpoint per
   `observability.md`. Currently all hooks are `command` type.
2. **`prompt`/`agent` hook types** (absent) — a `prompt`-type hook runs a fast
   model to make a yes/no decision (e.g., "is this Bash command destructive?").
   The current PreToolUse guard (settings.json:199) is a hardcoded Python regex
   for `rm -rf /` and `sudo`. A `prompt` hook could generalize the destructive-
   command check. Keep the regex as the fast deterministic path; add prompt
   hook only if false negatives appear.
3. **`if` field on tool hooks** (absent) — PreToolUse/PostToolUse hooks accept
   an `if: "Bash(git *)"` permission-rule filter so the script only runs for
   matching commands, avoiding a Python spawn on every Bash call
   (settings.json:193-202 runs python3 unconditionally). Recommendation: gate
   the rm/sudo guard with `if` or convert to a lighter matcher.
4. **`statusMessage` on long hooks** (absent) — quality-gate.sh and
   check-complexity.py give no spinner feedback; add `statusMessage`.
5. **`terminalSequence` JSON output (v2.1.141+)** — notify-on-stop.sh
   (settings.json:231) could emit OSC notify sequences via `terminalSequence`
   instead of relying on a shell script's own escape handling; more portable.
6. **`ConfigChange` hook** (absent) — could validate edits to settings.json or
   rules/ during a session (matcher values: user_settings, project_settings,
   skills). Fitness-function style guard per `architecture.md`.

---

## Model Routing Improvements

1. **`fallbackModel` setting unused** (settings.json has no fallbackModel) —
   docs: fallback model(s) tried when primary is overloaded (cap 3). For
   long autonomous runs (`autonomous-execution.md`), an Opus→Sonnet fallback
   prevents a hard stop on overload. Recommendation: `"fallbackModel":
   ["sonnet"]`.
2. **`availableModels` / `enforceAvailableModels`** (absent) — could constrain
   subagents to the cost-appropriate set per `parallelism.md` model table
   (Haiku for scoring, Sonnet for impl, Opus for planning). Optional.
3. **`opusplan` alias in use (4 agents)** — valid per parallelism.md, good.
   106/126 agents are `sonnet`, 13 `haiku`, 3 `opus`, 4 `opusplan` (grep). This
   distribution matches the rule's "default to Sonnet" guidance — no change
   needed, but the 3 plain-`opus` agents should be reviewed against the
   "Opus only for multi-path architecture" anti-pattern (parallelism.md).
4. **`CLAUDE_CODE_SUBAGENT_MODEL` env var** (absent from settings env) —
   overrides all subagent models globally; useful for a "cheap pass" toggle
   during token-sensitive runs. Optional.
5. **`effortLevel` setting** (absent) — persists effort across sessions. Rules
   default to `high` on Opus 4.8; setting `effortLevel` would make that
   explicit rather than relying on the model default.

---

## MCP Opportunities

1. **Only one MCP server configured** (`.mcp.json` = serena only). settings.json
   permissions reference `mcp__playwright__*` (lines 127-131) but playwright is
   NOT in `.mcp.json` — it loads from a plugin or global `~/.claude.json`. Worth
   confirming playwright is actually wired; the permission rules are dead if
   the server never loads.
2. **Subagent-scoped `mcpServers` frontmatter** (absent in all agents) — docs
   (sub-agents persisted lines 376-410): defining an MCP server inline in a
   subagent keeps its tool descriptions out of the main conversation's context.
   The Playwright tools (heavy descriptions) could be scoped to a browser-test
   subagent instead of being globally permissioned. Direct context-budget win
   per `prompting-quality.md`.
3. **`enableAllProjectMcpServers` / `enabledMcpjsonServers`** (absent) — governs
   auto-approval of `.mcp.json` servers; relevant if more servers are added.
4. **MCP candidate servers** already queued in research-urls.md candidates
   (semgrep, ast-grep, modelcontextprotocol registry). The tool-offloading
   theme in Discovery Queries (lines 202-253) is well-aligned; Agent A confirms
   no static-analysis MCP server is wired yet — `lsp.md` mentions ast-grep CLI
   but there is no MCP integration.

---

## Memory System Insights

1. **Two parallel memory systems, partial overlap.** The config uses a custom
   `.agent-notes/` convention (`memory.md`) AND has `autoMemoryEnabled: true`
   (settings.json:255). Claude Code's native auto memory writes to
   `~/.claude/projects/<project>/memory/MEMORY.md` — which is exactly the path
   referenced in the user's global MEMORY.md context. So native auto memory IS
   active and `.agent-notes/` is a hand-rolled second system. Recommendation:
   document the division of labor (auto memory = Claude's discovered learnings;
   `.agent-notes/` = session-scoped task observations) in `memory.md` to avoid
   the two drifting or duplicating.
2. **`claudeMdExcludes` unused** (absent) — not needed for a single-repo `.claude`
   but worth knowing for monorepo projects.
3. **`autoMemoryDirectory` default** — fine as-is; the agent-memory dir exists.
4. **CLAUDE.md size**: docs target <200 lines per file; the global CLAUDE.md +
   16 rules files are large. `prompting-quality.md:instruction bloat` already
   caps custom instructions at 4KB — the rules/ files are loaded via the
   `.claude/rules/` mechanism (loaded every session at CLAUDE.md priority per
   memory docs). Consider `paths:` frontmatter on rules that are domain-specific
   (e.g., api-design.md, logging.md) so they load only when relevant files are
   open — direct context saving. **No rule file currently uses `paths:`
   frontmatter** (would need verification by Agent B/C, flagged here).
5. **`InstructionsLoaded` hook already wired** (settings.json:215) for audit
   logging — good, matches the docs' recommended debugging use.

---

## Agent Design Patterns

1. **Fictional tool names in agent frontmatter.** 11 agent files list tools like
   `docker`, `terraform`, `kubectl`, `figma`, `prometheus` in `tools:` (grep).
   These are not real Claude Code tool names — the valid set is Read/Write/Edit/
   Bash/Glob/Grep/Agent/Skill/MCP tools. Claude Code silently ignores unknown
   tool names, so these agents likely just inherit defaults. Recommendation:
   audit and replace with real tool names (most should be `Bash` + the CLI
   used via Bash). This is a correctness bug, not cosmetic.
2. **`color:` frontmatter unused** (0/126) — cosmetic; helps identify running
   agents in the UI. Low priority.
3. **`skills:` preload unused** (0/126) — docs: preloading a skill injects its
   full content into the subagent at startup. High-value for agents that should
   follow a specific convention skill (e.g., a payments agent preloading the
   payments-setup skill). Pairs with the existing skills library.
4. **Agent count vs. tool-list rule.** `parallelism.md` anti-pattern table caps
   tools at ~8 per agent. Several library agents list 6+ Serena tools PLUS
   domain tools; since Serena's ~10 navigation tools count as one capability
   per the rule's exception, this is compliant, but the fictional tools (point
   1) inflate the apparent count.
5. **`maxTurns` unused** (absent) — bounding runaway subagents in autonomous
   mode would harden `autonomous-execution.md`'s consecutive-fix stop rule.

---

## Cost Optimization

1. **Scope Playwright MCP to a subagent** (see MCP #2) — removes heavy tool
   descriptions from every main-session context. Largest single context win.
2. **`paths:`-scope domain rules** (see Memory #4) — api-design.md, logging.md,
   observability.md, retry-idempotency.md don't need to load on every session
   (e.g., a docs-only or plantuml session). Path-scoping them cuts per-session
   token load.
3. **Forks reuse the parent prompt cache** (sub-agents persisted line 907) —
   prefer `/fork` over fresh subagents for same-context side tasks; cheaper.
4. **`prompt`-type hooks default to the fast model** — cheaper than spawning a
   full subagent for yes/no guards.
5. **Haiku context cap** already respected in parallelism.md (200k, ≤50 files).
6. **`autoCompactEnabled` (default true)** — fine; PreCompact/PostCompact hooks
   already present preserve the recovery sequence (settings.json:173-192).

---

## Warnings (unreachable/thin sources)

- **Research source thin: https://www.anthropic.com/blog** — fetch returned
  newsroom items but NO Claude Code / Agent SDK / hooks / MCP engineering posts
  in the visible content (only model announcements: Opus 4.8, Fable 5/Mythos 5,
  and non-technical posts: Claude Corps, Partner Network). The page is a press
  newsroom, not the engineering blog. The 3 "most relevant" posts requested do
  not exist on this page as Claude Code deep-dives. Recommendation: replace the
  Agent A blog target with the engineering blog if one exists, or rely on
  code.claude.com/docs/en/changelog (already a candidate URL, line 81) for
  feature tracking. Status for research-urls.md line 34: should decay to
  `unknown`/re-evaluate — it is reachable but thin for this agent's purpose.
- All code.claude.com/docs pages fetched returned 200 and well over the 1000-
  char bar (several >50KB). No other unreachable sources.

---

## Suggested research-urls.md updates (already applied)

Appended 5 new doc pages to **Candidate URLs** (Suggested by: Agent A,
2026-06-20): /agent-teams, /agent-view, /routines, /worktrees, /skills.
Not promoted to active (one passing fetch required first per the registry's
promotion rule).
