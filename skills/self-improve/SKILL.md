---
name: self-improve
description: >
  Strategic self-review of the ~/.claude configuration repo. Researches
  new Claude Code features and Anthropic best practices, audits skills,
  rules, agents, hooks, and settings for gaps and contradictions, then
  produces a prioritized improvement report and task file. Run this
  periodically (e.g., after major Anthropic releases) to keep the
  configuration current with the ecosystem.
disable-model-invocation: false
allowed-tools: Bash, Read, Grep, Glob, Agent, Write, Edit, WebFetch, WebSearch, TodoWrite
---

# Self-Improve

Strategic audit of the `~/.claude` configuration repo against the
current state of the Claude Code ecosystem. Produces an actionable,
prioritized improvement list and a task file ready for `/plan-mission`.

**Goal**: Keep the configuration at distinguished-engineer quality —
not just functional, but current with the toolchain, internally
consistent, and continuously improving.

---

## Phase 0 — Recall prior findings

Before doing any new work, check what's already known:

1. Search Mem0 for memories tagged `repo:claude-config` or
   `org` scope related to Claude Code configuration, agent
   design, or hook patterns.
2. Read `.agent-notes/` in the current working directory for
   any session observations from prior runs of this skill.
3. State what was found and how it affects scope. If a prior
   self-improve run produced findings that are already in
   `code-review-tasks.md`, skip re-deriving them.

---

## Phase 1 — Ecosystem research (parallel)

Launch two agents simultaneously. Both are read-only research.

### Agent A — What's new in the Claude ecosystem

Fetch and read the following. Extract **concrete, actionable findings**
only — not summaries:

1. `https://www.anthropic.com/blog` — scan for posts published in
   the last 90 days about Claude Code, agents, or model capabilities.
   Read the 3 most relevant fully.
2. `https://docs.anthropic.com/en/docs/claude-code/overview`
3. `https://docs.anthropic.com/en/docs/claude-code/hooks`
4. `https://docs.anthropic.com/en/docs/claude-code/settings`
5. `https://docs.anthropic.com/en/docs/claude-code/memory`
6. `https://docs.anthropic.com/en/docs/claude-code/mcp`
7. `https://docs.anthropic.com/en/docs/claude-code/sub-agents`

For each finding, record:
- What the feature/capability is
- Whether the current config uses it (grep `~/.claude` for evidence)
- Concrete recommendation if it's unused or underused

Organize output under: **New Features Unused**, **Hook Opportunities**,
**Model Routing Improvements**, **MCP Opportunities**, **Memory
System Insights**, **Agent Design Patterns**, **Cost Optimization**.

### Agent B — Model version and API surface changes

1. Fetch the Anthropic models page and the most recent model
   migration guide to identify:
   - Any deprecated API parameters (e.g., manual thinking budgets
     replaced by adaptive thinking)
   - New model-specific features (task budgets, effort levels, etc.)
   - Tokenizer changes affecting compaction thresholds
2. Search for "Claude Code advanced patterns 2025" and
   "Claude Code multi-agent best practices" — read the top 3 results.
3. Report: deprecated patterns in current config, new capabilities
   not yet leveraged, recommended model routing table.

Wait for both agents to complete before Phase 2.

---

## Phase 2 — Configuration audit (parallel)

Launch three agents simultaneously. All read-only.

### Agent C — Settings, hooks, and MCP

Read these files completely:

- `~/.claude/settings.json`
- `~/.claude/.claude/settings.json`
- `~/.claude/.claude/settings.local.json`
- `~/.claude/.mcp.json`
- `~/.claude/templates/autonomous-settings.json`
- `~/.claude/hooks/autonomous-toggle.sh`
- `~/.claude/hooks/notify-on-stop.sh`
- `~/.claude/hooks/project-init.sh`
- `~/.claude/hooks/quality-gate.sh`
- `~/.claude/hooks/record-turn-start.sh`
- `~/.claude/post-compact-context.md`

Evaluate:
1. **Hook events**: Which of PreToolUse, PostToolUse, Notification,
   SubagentStop, PreCompact, PostCompact, Elicitation, CwdChanged,
   InstructionsLoaded are missing? What would each enable?
2. **Permission noise**: Identify stale one-off permissions
   (absolute paths, literal command strings, echo variants).
   List each entry by approximate line number.
3. **Permission gaps**: Commands in `settings.local.json` or the
   autonomous template but absent from global `settings.json`.
4. **WebSearch syntax**: Is `"WebSearch"` vs `"WebSearch(*)"` 
   consistent? Which form does Claude Code actually require?
5. **MCP gaps**: What MCP servers would replace current `gh`, `curl`,
   or filesystem shell calls with structured, type-safe equivalents?
6. **Hook quality**: For each hook — `set -euo pipefail`? Platform
   guards? Idempotency? Error logging?
7. **Autonomous template completeness**: Missing permissions vs. what
   the global settings grant. Check especially MCP tools, package
   managers, and CLI tools.

### Agent D — Skills quality

Read ALL skill SKILL.md files under `~/.claude/skills/`.

For each skill, evaluate against these dimensions:

1. **Completeness** — What happens when prerequisites are missing,
   a tool fails, or external state is unexpected?
2. **Model routing** — Does the skill specify which model (Opus/
   Sonnet/Haiku) for which sub-step? Planning vs. execution vs.
   scoring have different cost/quality tradeoffs.
3. **Research integration** — Does the skill use WebSearch/WebFetch
   to check current best practices for the tech stack it encounters?
4. **Verification** — After doing work, does the skill verify
   output (run tests, check types, validate structure)?
5. **Agent prompt quality** — When spawning subagents, does the
   skill provide: context, task, write-set, read-set, architecture
   decisions, interface contracts, quality bar?
6. **Parallelism plan** — Are there sequential steps that could be
   batched?
7. **Resumability** — What's preserved if interrupted?
8. **Operational readiness** — For skills that produce or drive
   architecture or code changes, do they enforce observability
   requirements (SLIs, on-call story, alert thresholds), rollback
   classification, and blast radius documentation? Or do they
   produce functionally correct output that is operationally blind?

Report per-skill with **Strengths** / **Gaps** / **Priority** /
**Specific recommendation**. Then a cross-skill section for patterns
appearing across multiple skills.

### Agent E — Rules and CLAUDE.md

Read these files completely:

- `~/.claude/CLAUDE.md`
- All files under `~/.claude/rules/`
- `~/.claude/post-compact-context.md`

Sample these agent definitions for rule propagation:
- `~/.claude/agents/01-core-development/backend-developer.md`
- `~/.claude/agents/01-core-development/microservices-architect.md`
- `~/.claude/agents/01-core-development/api-designer.md`
- `~/.claude/agents/02-language-specialists/typescript-pro.md`
- `~/.claude/agents/04-quality-security/architect-reviewer.md`
- `~/.claude/agents/04-quality-security/code-reviewer.md`
- `~/.claude/agents/09-meta-orchestration/memory-curator.md`

Evaluate:
1. **Contradictions**: Pairs of rules or rule vs. agent that conflict
   (quote both sides).
2. **Agent isolation risk**: Rules that assume ambient context
   (CLAUDE.md, prior conversation) — these disappear in subagents.
3. **Coverage gaps**: Behaviors with no governing rule. Common
   missing categories: logging standards, error handling strategy,
   API design conventions, file/folder naming, pre-existing code
   policy, PR/branch workflow, SLO-first observability and on-call
   readiness, system-first blast radius analysis (data model → API
   contracts → service deps → files), ADR discipline (when an ADR
   is required vs optional), research source tiering.
4. **Rule quality issues**: Unclear thresholds, overly broad
   exceptions, aspirational statements that aren't actionable.
5. **CLAUDE.md structure**: Are the most critical rules front-loaded?
   Is anything buried that should be prominent?
6. **post-compact-context.md completeness**: What critical behavioral
   rules are NOT restored after compaction?

Wait for all three agents to complete before Phase 3.

---

## Phase 3 — Synthesize and deduplicate

Run a single dedup pass across all five agent outputs:

1. Group findings that describe the same root issue.
2. Keep the most specific instance (file:line + concrete fix).
3. Resolve genuine contradictions by re-reading the source — do not
   use agent summaries as the arbiter.
4. Score each finding 0-100 using this rubric (apply yourself, no
   need for a separate scoring agent for this skill):
   - **0**: False positive, pre-existing issue not worth surfacing
   - **25**: Might be real, unverified
   - **50**: Verified, but low-frequency or low-impact
   - **75**: Double-checked, will be hit in practice
   - **100**: Confirmed, happens frequently, direct evidence
5. Filter: drop score 0-24; classify 25-49 as Note or Suggestion;
   cap 50-74 at Suggestion; keep 75+ as-is.

---

## Phase 4 — Report

Produce a final report structured as:

**Critical** — must fix before next autonomous run  
**Warning** — should fix  
**Suggestion** — consider improving  
**Note** — low-confidence; suggested inline comment  
**Positive** — good practices worth noting  

For Critical/Warning/Suggestion: include approximate `file:line`,
confidence score, issue, and concrete fix.

For Notes: include the full comment text ready to paste.

**Verdict**: APPROVE / APPROVE WITH NITS / REQUEST CHANGES
(APPROVE if Critical=0; NITS if Critical=0 and Warning<3;
REQUEST CHANGES if Critical>0 or Warning≥3)

---

## Phase 5 — Task file

Write `~/.claude/code-review-tasks.md` (overwrite if it exists).

Format:

```markdown
# Self-Improvement Tasks — ~/.claude Configuration
<!-- Generated by /self-improve on [date].
     Review each item, remove any you don't want,
     then run: /plan-mission implement code-review-tasks.md -->

## Must fix (Critical)
- [ ] `file:line` — issue. Fix: recommendation

## Should fix (Warning)
- [ ] `file:line` — issue. Fix: recommendation

## Consider improving (Suggestion)
- [ ] `file:line` — issue. Fix: recommendation

## Inline comments to add (Notes)
- [ ] `file:line` — add comment:
  // Code review: <what>. Revisit if <condition>.
```

Omit empty sections. Do not include Positives in the task file.

---

## Phase 6 — Offer next step

After writing the task file, tell the user:

> Task file written to `~/.claude/code-review-tasks.md`.
> Run `/plan-mission implement the tasks in code-review-tasks.md`
> to generate a mission brief for autonomous execution.

If the total task count is fewer than 5, the changes are small enough
to implement directly — offer to do so without a mission brief.

---

## Rules

- Never modify any source file, hook, or agent during the review.
  All changes go through the task file, then user review, then
  `/plan-mission`.
- Every finding must be traceable to a specific source (file:line
  or URL).
- Do not re-derive findings already captured in `code-review-tasks.md`
  from a prior run unless you have evidence they've been addressed.
- Prefer findings that the next autonomous run would actually hit
  over theoretical concerns.
- Model routing for this skill: use Opus (adaptive thinking) for
  Phase 3 synthesis if there are >20 raw findings; Sonnet is
  sufficient for smaller sets.
