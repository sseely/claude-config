# Self-Improve Phase 1 — Agent A Findings (2026-07-24)

Supersedes the 2026-06-20 run (same file). Deltas from that run noted
inline where relevant.

**Pages read fully:** changelog, hooks, settings, sub-agents (persisted,
re-read in full), memory, overview, tutorials (common-workflows),
agent-teams, agent-view, routines, worktrees, skills (persisted, re-read
in full). **Summarized only (fetch succeeded, not re-read line-by-line):**
mcp — summary covered server config basics and "what you can do with MCP";
moderate confidence only on MCP frontmatter specifics not already known.

No FETCH GUARD warnings: all 13 URLs returned 200 with well over 1000
chars (several >50KB, two required persisted-file reads due to size).

No new candidate URLs appended to research-urls.md — all 13 target URLs
were already tracked (active or candidate) from the prior run.

---

## New Features Unused

- **Path-scoped rules (`paths:` frontmatter in `.claude/rules/*.md`)**:
  confirmed absent — `grep -rln "^paths:" rules/` → empty across all 24
  rule files. (Flagged as unverified in the 2026-06-20 run; now confirmed.)
  Every rule loads unconditionally every session. Recommend scoping
  domain-specific rules (api-design.md → `src/api/**`, logging.md /
  error-handling.md → code globs) to cut baseline context.
- **Skill `background: false` on `context: fork`** (new field, v2.1.218,
  since last run): `skills/explore/SKILL.md` uses `context: fork` with no
  `background` field, so as of v2.1.218 it now runs as a background
  subagent by default (previously always blocked the turn). Verify this
  matches the desired UX for `/explore` — add `background: false` if the
  user expects to watch it work synchronously.
- **Subagent `hooks` frontmatter field**: still absent (`grep -rln
  "^hooks:" agents/` → empty). code-reviewer.md/debugger.md — both now
  have `memory: user` (see Memory section) — could add a `PostToolUse`
  hook to auto-run lint/tests after their own edits, scoped only to that
  agent's run.
- **Subagent `mcpServers` field** for inline/scoped MCP: still absent.
  See MCP Opportunities.
- **Routine `/fire` semantics changed (v2.1.214, since last run)**: a
  routine's saved prompt is now delivered as an *assigned task*, not an
  untrusted background notification (previously refusable). Routines
  remain candidate-not-adopted; noting only because the trust model
  changed materially.
- **Skill stacking now supports up to 6 skills** (`/write-tests
  /fix-issue 123`, v2.1.199) — no current skill design relies on
  stacking; informational only.

## Hook Opportunities

Delta from 2026-06-20: `TaskCreated`/`TaskCompleted` are new hook events
(not in the June inventory) — added below. `PostToolBatch`,
`SubagentStart`/`Stop`, `StopFailure`, `PostToolUseFailure`, `ConfigChange`
were already flagged last run and remain unconfigured (confirmed still
absent via current `settings.json` hooks keys: SessionStart,
UserPromptSubmit, PostCompact, PreCompact, PreToolUse, PostToolUse,
InstructionsLoaded, Stop — unchanged from June).

- **`TaskCreated`/`TaskCompleted` hooks** (new event pair, exit 2 to
  block + give feedback): not configured. `rules/autonomous-execution.md`
  requires marking TodoWrite/mission-brief tasks `[x]` "only when fully
  accomplished" as a purely self-enforced convention. A `TaskCompleted`
  hook could mechanically block marking a task complete without a
  preceding test/gate run, enforcing the rule instead of trusting the
  model to self-police.
- **`ConfigChange` hook**: still absent (repeat finding from June, still
  unresolved). Directly relevant now: this very audit session edits
  `settings.json` and `research-urls.md`; a `ConfigChange` hook would log
  every settings mutation for an audit trail.
- **`PermissionDenied` hook**: not configured. Given the user's known
  preference for broad pre-approved permissions (MEMORY.md), a
  `PermissionDenied` logger would surface recurring friction points more
  precisely than transcript scanning (which `/fewer-permission-prompts`
  currently relies on).

## Model Routing Improvements

- **Explore/Plan built-in subagents now inherit the main model instead of
  always running on Haiku (v2.1.198, since last run's audit window)**,
  capped at Opus on the Claude API. `settings.json` sets `"model":
  "fable"` as the session default. No user/project subagent named
  `Explore` or `Plan` exists to override this (`find agents -iname
  "explore.md" -o -iname "plan.md"` → empty; `grep -rln "^name:
  Explore$\|^name: Plan$" agents/` → empty). Every codebase
  search/plan-mode research now runs on the expensive default model
  instead of Haiku. **Actionable, higher priority than most items here**:
  create `~/.claude/agents/explore.md` and `plan.md` with `model: haiku`
  to restore low-cost exploration, per `rules/parallelism.md`'s own
  routing table ("Scoring/dedup/validation → Haiku").
- **`effort:` field on subagents** — now on 5 agents (compliance-auditor,
  platform-engineer, devops-engineer, architect-reviewer,
  devops-incident-responder), up from 3 in the June run. Still absent on
  code-reviewer.md and debugger.md, both of which now carry `memory:
  user` and do deep root-cause work per `rules/diagnosis.md`. Consider
  `effort: high` on debugger.md given its explicit root-cause mandate.

## MCP Opportunities

- **Serena MCP server is project-scoped in `.mcp.json`, not
  subagent-scoped**: `~/.claude/.mcp.json` defines `serena` at project
  level (confirmed by direct read), so its tool descriptions load into
  the *main* orchestrator's context every session even though
  `rules/lsp.md` states Serena is for subagents only ("Subagents use
  Serena MCP tools — not the LSP tool"; the orchestrator itself uses the
  native LSP plugin). This was flagged for Playwright in the June run
  (item #2, MCP); it applies equally to Serena and was not caught then.
  **Actionable**: move the Serena definition into each relevant agent's
  `mcpServers:` frontmatter (inline definition, connects only when that
  subagent runs) instead of `.mcp.json`, keeping Serena's tool schema out
  of the main session's context budget.
- Playwright MCP wiring question from the June run (settings.json
  permission rules reference `mcp__playwright__*` but no `.mcp.json`
  entry) was not re-verified this run — carry forward for the next audit
  pass; check whether it resolved via a plugin or global
  `~/.claude.json` entry.

## Memory System Insights

- **Subagent persistent memory (`memory: user`) is now adopted** on
  code-reviewer.md and debugger.md, with populated directories at
  `~/.claude/agent-memory/code-reviewer/` and `.../debugger/` (confirmed
  via `ls`). This resolves the June run's Memory-Insights item #3
  ("barely used, 2/126") for these two agents — working as intended, no
  further action needed on them specifically. Broader rollout to
  security-auditor/architect-reviewer (suggested in June) still open.
- **`MEMORY.md` frontmatter `modified` timestamp (v2.1.214, since last
  run)**: the orchestrator's own auto-memory index at
  `~/.claude/projects/-Users-scottseely--claude/memory/MEMORY.md` has no
  YAML frontmatter, so this feature never activates for it (per docs,
  Claude Code "never adds frontmatter to a file that has none"). Low
  priority — informational only.
- The June run's item #4 (path-scoping domain rules for context savings)
  is now confirmed rather than flagged-for-verification — see New
  Features Unused above.

## Agent Design Patterns

- **`MultiEdit` tool referenced in 44 agent definitions** under
  `~/.claude/agents/` (devops-engineer.md, platform-engineer.md,
  database-administrator.md, cloud-architect.md, terraform-engineer.md,
  and 39 more). The current `sub-agents` doc's background-subagent
  built-in tool allowlist lists `Edit`, not `MultiEdit`, and **subagents
  run in the background by default as of v2.1.198**. If `MultiEdit` is no
  longer a resolvable tool name, these 44 agents risk silently losing
  edit capability (or the zero-tools failure mode documented in the
  v2.1.208 changelog entry) whenever dispatched in the background.
  **Confidence: MEDIUM** — inferred from the documented tool list, not a
  direct tool-registry check. Recommend a quick smoke test: dispatch one
  affected agent (e.g., `devops-engineer`) and confirm it can still edit
  files; if not, bulk-rename `MultiEdit` → `Edit` across the 44 files.
- Fictional tool names in agent frontmatter (docker/terraform/kubectl/
  figma/prometheus, flagged in June as item #1) not re-verified this run
  — carry forward.

## Cost Optimization

- **Auto mode (`autoMode` settings block, `permissionMode: auto`) still
  not configured** anywhere in `settings.json`, despite MEMORY.md
  recording "User prefers broad pre-approved permission rules over
  repetitive per-call prompts." Auto mode replaces static allow/deny
  lists with a classifier that evaluates commands live — a closer fit to
  the stated preference than continuing to hand-maintain the large
  `permissions.allow` array currently in `settings.json`. Worth a
  deliberate trial (`autoMode.allow: ["$defaults", ...]`) rather than
  further list maintenance.
- **Explore/Plan model-inheritance change is also a direct cost issue**
  (see Model Routing above): every exploration now bills at the
  session's default model (fable) instead of Haiku until an override
  agent is added. This is new since the June run and likely the
  highest-leverage single fix in this report.
- Subagent concurrency defaults (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`
  default 20, `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION` default 200)
  checked and untouched — no evidence this needs tuning; confirmed-fine
  default, not an action item.

---

## Warnings

None. All 13 URLs fetched successfully with substantial content this run.
The June run's warning about `anthropic.com/blog` being thin does not
apply here — that URL was not in this run's target list.
