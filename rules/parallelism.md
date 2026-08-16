# Multi-Agent Parallelism

Multi-agent orchestration costs ~15× more tokens than single-agent dispatch.
Justify multi-agent when: (1) parallel bottleneck demonstrated,
(2) domain/compliance isolation required, (3) cognitive boundary needed.
Default to single-agent; split only when a specific bottleneck is demonstrated.

Before executing any task that involves multiple agents or multiple independent workstreams, always produce an execution plan and present it for review before proceeding:

**Exception — autonomous mode:** When a mission brief is active (`plans/` directory referenced
at session start), skip the user review presentation step. Log the execution plan to
`decision-journal.md` instead and proceed immediately.

1. **List the subtasks** — what needs to happen
2. **Mark dependencies** — which subtasks require output from another before they can start
3. **Assign file ownership** — for each subtask, list the files it will write; if two agents would write the same file, collapse them into one agent with combined instructions
4. **Batch independent work** — invoke all dependency-free subtasks with non-overlapping write sets as parallel agent calls in a single response
5. **Sequence dependent work** — only after a batch completes, start the next dependent batch

**Trigger this planning step when:**
- More than one file, module, or component needs the same type of work (analysis, refactoring, test writing)
- A feature spans multiple domains (e.g., backend + frontend + tests)
- A task has a research phase and an implementation phase that can be split

**File ownership rules:**
- Each file may only be written by one agent at a time
- If two planned agents would write the same file, collapse them into a single agent with the combined instructions
- Related changes across multiple files that must stay consistent (e.g., an interface change + all its call sites) are assigned to one agent as a logical unit
- Read-only access is unrestricted — multiple agents may read the same file concurrently
- If the plan produces a write conflict that can't be resolved by collapsing, that's a signal the subtasks aren't actually independent and should be a single agent
- Cross-session messaging does not relax any of the above. Two sessions on the same repo still need separate worktrees; messaging reports what landed, it does not arbitrate writes

**Agent prompt structure** (ordered procedure — assemble sections in this
order; this is a sequential build sequence, not a parallel checklist, so
the ≤6-constraint budget in `prompting-quality.md` does not apply):

Subagents start with a blank slate — no conversation history, no
CLAUDE.md, no awareness of prior decisions. Every agent prompt
must be self-contained:

0. **Prior observations** — If `.agent-notes/` contains findings that bear on
   *this* task's write-set, inject those verbatim here. Do not rely on the
   agent to discover them; the orchestrator's job is to pre-load this context.
   Pass only what bears on the write-set — irrelevant observations are
   distractors, and distractor leakage is a leading measured cause of
   orchestration failure. When in doubt whether a note applies, leave it out.
1. **Context** — what the project is, what stack it uses, and
   what conventions to follow (test framework, naming, patterns)
2. **Task** — what to build or change, with enough detail that
   the agent doesn't need to guess
3. **Write-set** — which files to create or modify (explicitly)
4. **Read-set** — which files to read for context before starting
   (e.g., "read `src/api/subscribe.js` for the existing pattern")
5. **Architecture decisions** — any pre-made decisions relevant
   to this task (e.g., "use KV not D1", "use vitest not jest").
   Treat all decisions listed here as locked. If you discover a
   conflicting constraint, stop and log it to the decision journal —
   do not silently override the upstream decision.
   Subagents do not auto-load `rules/`. If an agent's Required Rules
   list names a rule file, the agent must Read that file before relying
   on it — the one-line gloss is a pointer, not the authoritative text.
6. **Interface contracts** — types, function signatures, or data
   shapes this task must produce or consume. If subagent output is
   consumed by a downstream agent, specify a JSON schema.
   If output is human-facing, prose is appropriate.
   This governs shape, not size — target subagent return payloads at
   1k–2k tokens regardless of shape; verbose returns dilute the
   orchestrator's context.
7. **Quality bar** — "run `npm test` before finishing; all tests
   must pass"
8. **Boundaries** — three tiers: *Always do* (non-negotiables), *Ask first*
   (actions requiring approval), *Never do* (hard stops). Omit if all three
   tiers are empty.
9. **Commit format** — One commit per completed task, per
   `~/.claude/rules/commits.md`. Body explains why if >3 files change.

Omit sections that don't apply, but never omit context, task, or
write-set. If the agent lacks enough information to do the work
without guessing, the prompt is too thin.

**Within a multi-agent task** (after deciding to use parallel execution):
**Default rule:** If subtasks don't share write targets and don't depend on each other's output, run them in parallel. Don't serialize work that can be parallelized.

## Model Selection

Match model to task complexity and cost:

| Role | Model alias | Effort | Context | When |
|------|-------------|--------|---------|------|
| Planning / architecture / implementation (heavy) | `opus` (`claude-opus-5`) | `high` default; `xhigh` for deep multi-path decisions | 1M tokens | Phase 3 decisions, mission decomposition, threat modeling; also viable for high-value implementation and routine agentic work now that Opus 5 is cheaper |
| Long-horizon autonomous execution | `fable` (`claude-fable-5`) | `high` default; `xhigh` for agentic runs | 1M | Mission-brief execution, autonomous sessions, multi-hour/multi-day work |
| Implementation | `sonnet` (`claude-sonnet-5`) | `high` default; `xhigh` for hard tasks; lower to `medium` if token-sensitive | 1M tokens | Feature work, bug fixes, refactoring, code generation |
| Scoring / dedup / validation | `haiku` (`claude-haiku-4-5-20251001`) | n/a | 200k tokens | Confidence scoring, dedup passes, format checking, simple grep tasks |

<!-- Code review (2026-08-01, corrected 2026-08-08 against Table 8): PerspectiveGap (arXiv:2606.08878, preprint) scores claude-opus-4-8 at 13.9% on orchestration-prompt composition. Not worst-in-family — claude-haiku-4-5 is 5.7%. Table 8 does test two Claude 5 models and both roughly double Opus 4.8: claude-fable-5 31.4%, claude-sonnet-5 25.7%; claude-opus-4-7 is 19.1%. Opus 5 itself is untested, which is what `opus` resolves to on v2.1.219+. Rule retained deliberately; the Fable row above is independently supported by this data. Revisit if Opus 5 orchestration data appears. -->

> **Haiku context limit:** 200k tokens vs 1M for Sonnet/Opus. Do not pass >50 files to a Haiku agent in a single prompt.

> **Version gate:** `opus` resolves to Opus 5 only on Claude Code v2.1.219+;
> earlier versions resolve to Opus 4.8. Confirm `claude --version` before
> relying on Opus-5-era routing economics below.

Note: Haiku 4.5 supports fixed-budget extended thinking (`budget_tokens`) but not adaptive thinking; the `effort` parameter returns 400 on Haiku — do not set it.

> **Effort:** Set via `effort:` frontmatter in agent/skill files, `--effort` flag, or `/effort` command.
> Extended thinking (`budget_tokens`) is **removed on `claude-opus-4-8` and Sonnet 5 (400)**; deprecated on Opus 4.6 / Sonnet 4.6.
> Use `type: "adaptive"` with the effort parameter; `budget_tokens` is a legacy pattern.
> `opusplan` is a valid Claude Code alias: uses `opus` in plan mode, `sonnet` in execution.

Default to Sonnet for implementation agents unless the task requires deep
multi-path reasoning. Use Haiku aggressively for any agent whose job is to
evaluate, score, or format — not to create.

> **Sonnet 5** reaches near-Opus-4.8 quality on coding and agentic work at
> ~60% of Opus cost, strengthening the default-to-Sonnet rule above.

> **Opus 5** is roughly Fable-class capability at roughly half Opus 4.8's
> cost, so Opus now covers implementation and routine agentic work too — not
> just the deepest multi-path decisions. Fable still owns the long-horizon
> autonomous row.

**Opus behavioral compensation:**

When routing a task to Opus, add these constraints to the prompt to counteract
known Opus tendencies (validated in production):

- Do NOT infer unstated requirements — implement the simplest interpretation
- Do NOT over-engineer — no speculative abstractions or extension points
- Do NOT spawn subagents unless the task explicitly requires it
- If scope is ambiguous, implement the minimal interpretation and note the
  ambiguity; do not silently expand
- A spec, source being ported, or enumerated requirement list is NOT
  ambiguous scope — implement all of it; the above is not license to trim it

**Fable behavioral compensation:**

When routing to Fable (`claude-fable-5`), invert the Opus constraints — Fable's
design is the opposite:

- Describe the outcome, not the steps — Fable derives the approach; over-
  prescriptive prompts/skills reduce output quality
- Encourage subagents — prefer async sub-agents that keep context over
  spawn-and-block
- Require progress claims be audited against tool results (suppresses fabricated
  status on long runs); state boundaries explicitly (assessment vs. action)
- Give it a memory surface (a `.md` scratchpad, one lesson per file)
- Turns run minutes at higher effort — plan async check-ins; sweep effort
  including low/medium for routine work
- Thinking is always-on: omit the `thinking` param (`{type:"disabled"}` and
  `budget_tokens` both 400)

Fable 5 auto-falls back to Opus 4.8 when its cybersecurity/biology safety
classifiers trigger. Autonomous runs on security-adjacent repos (e.g. the
security/PowerShell-hardening agents) will see frequent silent reroutes — expect
Opus behavior mid-run and don't mistake it for a routing bug.

**Anti-patterns to avoid:**

| Anti-pattern | Why it hurts | Fix |
|---|---|---|
| Opus for trivial edits | 5–10× cost with no quality gain | Use Sonnet; reserve Opus for multi-path architectural decisions |
| Max thinking for routine tasks | 2–4× token multiplier | Adaptive thinking only when 3+ significantly different approaches exist (see `extended-thinking.md`) |
| Haiku for code generation | Under-powered; produces more errors requiring fix loops | Sonnet minimum for any task that writes or modifies code |
| Sonnet for simple scoring/grep | Wasted cost | Haiku for pass/fail checks, dedup, format validation |
| Tool list >8 per agent | Decision paralysis; wasted token selection | Scope to 3–5 tools per agent; delegate to narrower specialists. See the MCP carve-out below. |

### MCP carve-out on the >8 tool limit

A **cohesive MCP tool group** counts as one capability against the >8 limit,
not as N tools. A group qualifies when its tools come from a single MCP
server, serve one capability the agent genuinely needs, and would be selected
as a set rather than weighed against each other — which is what makes them
cheap to reason over. Serena's navigation tools qualify; so do the forge MCP
tools on `forge-app-developer`.

This is a carve-out, not a blanket exemption for anything prefixed `mcp__`.
Two unrelated MCP servers on one agent are two capabilities, and the limit
applies normally to the tools outside any qualifying group.

## Subagent spawn depth

As of v2.1.219 the default nested spawn depth is **3** (was 1): a subagent
may spawn a subagent, which may spawn another. This config fans out heavily,
so the default is now the thing to watch, not the thing to raise.

Cap it with `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` when a run must stay
predictable — autonomous mission execution, anything under a token budget, or
any task where you cannot enumerate in advance what the third level would do.
Set it to 1 to forbid nesting outright.

## Resumption — terse follow-ups

A subagent that receives a short follow-up ("continue", "now the tests", a
bare filename) should treat the brevity as **intentional, not ambiguous**. The
orchestrator has the full context and is naming the delta; the prior prompt
still governs everything it does not contradict.

Resume the task under the original context. Do not restate the plan, re-derive
the write-set, or ask what was meant — if the follow-up genuinely conflicts
with a locked decision, that is the one case to stop and say so.

**Mechanism — resume, do not re-spawn.** `SendMessage` addressed to a
subagent's name continues that agent *with its context intact*. A fresh
`Agent` call starts blank and re-pays the entire prompt-structure cost
above — read-set, contracts, prior observations, all of it. So:

- Name every subagent you may need to follow up with; the name is the address
- Continue with `SendMessage`, not a second `Agent` call
- Names survive completion — a send resumes the agent from its transcript
- Re-spawn only when you genuinely want a blank slate

`ListAgents` enumerates what is reachable. Its rows also include your other
local Claude Code sessions and, while Remote Control is connected, sessions
on your other machines — those are independent sessions, governed by the
separate-worktrees rule above, not orchestration targets.
