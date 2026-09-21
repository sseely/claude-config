# Multi-Agent Parallelism

Multi-agent orchestration costs ~15× more tokens than single-agent dispatch.
Justify multi-agent when: (1) parallel bottleneck demonstrated,
(2) domain/compliance isolation required, (3) cognitive boundary needed.
Default to single-agent; split only when a specific bottleneck is demonstrated.

Before executing any task involving multiple agents or independent
workstreams, produce an execution plan and present it for review:

**Exception — autonomous mode:** when a mission brief is active
(`plans/` referenced at session start), skip the review step; log the
plan to `decision-journal.md` and proceed immediately.

1. **List the subtasks** — what needs to happen
2. **Mark dependencies** — which subtasks need another's output first
3. **Assign file ownership** — list the files each subtask will write; if
   two agents would write the same file, collapse them into one agent
4. **Batch independent work** — invoke dependency-free subtasks with
   non-overlapping write sets as parallel agent calls in one response
5. **Sequence dependent work** — only after a batch completes, start the
   next dependent batch

**Trigger this planning step when:** more than one file/module needs the
same type of work; a feature spans multiple domains (backend + frontend
+ tests); or a task splits into a research phase and an implementation
phase.

**File ownership rules:**
- Each file may only be written by one agent at a time
- If two planned agents would write the same file, collapse them into a
  single agent with the combined instructions
- Related changes across multiple files that must stay consistent (e.g.,
  an interface change + all its call sites) are one agent, one unit
- Read-only access is unrestricted — multiple agents may read the same
  file concurrently
- A write conflict that can't be resolved by collapsing signals the
  subtasks aren't actually independent — make it a single agent
- Cross-session messaging does not relax any of the above. Two sessions
  on the same repo still need separate worktrees; messaging reports what
  landed, it does not arbitrate writes

**Agent prompt structure:** subagents start blank — no conversation
history, no CLAUDE.md. Assemble a self-contained prompt with, in order:
prior observations from `.agent-notes/` that bear on the write-set,
context, task, write-set, read-set, architecture decisions (locked;
subagents don't auto-load `rules/` — name the file and let them read it),
interface contracts, quality bar, boundaries (always/ask-first/never),
and commit format. Never omit context, task, or write-set. Full
per-section guidance: `docs/reference/agent-prompt-template.md`.

**Default rule:** If subtasks don't share write targets and don't depend
on each other's output, run them in parallel. Don't serialize work that
can be parallelized.

Model routing table and Opus/Fable compensation: see `rules/model-routing.md`.

## Subagent spawn depth

As of v2.1.219 the default nested spawn depth is **3** (was 1): a
subagent may spawn a subagent, which may spawn another — the default is
now the thing to watch, not the thing to raise.

Cap it with `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` when a run must stay
predictable — autonomous execution, a token budget, or any task where
you can't enumerate the third level in advance. Set it to 1 to forbid
nesting outright.

## Resumption — terse follow-ups

A subagent that receives a short follow-up ("continue", "now the tests",
a bare filename) should treat the brevity as **intentional, not
ambiguous**. The orchestrator has the full context and is naming the
delta; the prior prompt still governs everything it doesn't contradict.
Resume under the original context — don't restate the plan or ask what
was meant, unless the follow-up genuinely conflicts with a locked
decision.

**Mechanism — resume, do not re-spawn.** `SendMessage` addressed to a
subagent's name continues that agent *with its context intact*; a fresh
`Agent` call starts blank and re-pays the entire prompt-structure cost.
So: name every subagent you may follow up with, continue with
`SendMessage` (names survive completion), and re-spawn only when you
genuinely want a blank slate. `subagent_type: "fork"` is a third option:
it inherits the parent's full context and prompt cache.

`ListAgents` enumerates what is reachable, including your other local
Claude Code sessions and, while Remote Control is connected, sessions on
other machines — those are independent sessions, governed by the
separate-worktrees rule above, not orchestration targets.
