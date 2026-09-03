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

Model routing table and Opus/Fable compensation: see `rules/model-routing.md`.

## Subagent spawn depth

As of v2.1.219 the default nested spawn depth is **3** (was 1): a subagent
may spawn a subagent, which may spawn another. This config fans out heavily,
so the default is now the thing to watch, not the thing to raise.

Cap it with `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` when a run must stay
predictable — autonomous mission execution, anything under a token budget, or
any task where you cannot enumerate in advance what the third level would do.
Set it to 1 to forbid nesting outright.

<!-- Code review (2026-09-02): no per-agent spawn whitelist (Agent(name,...) tool syntax unused). Revisit if an autonomous agent fans out to unexpected specialists. -->

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
- `subagent_type: "fork"` is the third option: it inherits the parent's full
  context and prompt cache, distinct from both a resume and a blank re-spawn

`ListAgents` enumerates what is reachable. Its rows also include your other
local Claude Code sessions and, while Remote Control is connected, sessions
on your other machines — those are independent sessions, governed by the
separate-worktrees rule above, not orchestration targets.
