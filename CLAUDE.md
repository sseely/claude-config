# Claude Code — Global Instructions

## Verification

Before answering questions about code, APIs, or libraries, use tools first:

- **API/library behavior** → fetch the official docs (WebFetch) before answering
- **File content** → Read the file; don't assume what it contains
- **Recent facts** → WebSearch first; training data may be stale
- **Uncertain** → state the uncertainty explicitly; don't fill gaps with guesses

Confidence levels — declare these when the accuracy of a claim matters:

- **HIGH**: Verified against a Tier 1-2 source retrieved this run (see
  `rules/research-sources.md`).
- **MEDIUM**: Single source, or strong training knowledge — add a caveat
- **LOW**: Memory only, unverified — say so
- **UNKNOWN**: Cannot verify — admit it rather than fabricate

## Rules

All rules live in `~/.claude/rules/` and load automatically; filenames say
what each covers. The load-bearing five: **code-principles.md** (design +
hook-enforced complexity limits), **security.md**, **parallelism.md**
(orchestration), **model-routing.md** (model selection), **diagnosis.md**
(observed defects).

## Diagnosis

On an observed discrepancy (failing test, oracle mismatch, symptom vs. intent), enter diagnosis mode per `~/.claude/rules/diagnosis.md`: state the mechanism — cause, `file:line`, causal chain, what you ruled out — before any fix. Symptom gone ≠ done; not for greenfield.

## Complex Tasks

For multi-part tasks or more than ~2 pages of output:
1. Present an outline for review before executing
2. Complete one section at a time
3. Track progress in the mission brief's checkboxes; use TodoWrite only if the
   session exposes it

For features requiring 1-4 hours of autonomous work, use `/plan-mission` to generate a mission brief first.

<!-- Code review (2026-09-02): /claude-api cost-optimize (2.1.247) exists but is unreferenced. Revisit when a cost audit is actually run. -->

## Agents

Agents live in `~/.claude/agents/`. Invoke via the Agent tool with `subagent_type` matching the agent's `name`. Default to handling tasks directly for tasks under ~30 min; delegate when the task clearly falls within a specialist's domain. Agent descriptions are loaded automatically. Always announce which agent you are invoking and why before calling it. Use Workflow (via `Workflow` tool) for multi-step parallel orchestration with deterministic control flow. Prefer Agent tool for individual specialist delegation. Workflow is user-opt-in only — never invoke unless the user explicitly requests it or a skill instructs it. `subagent_type: "agent-team"` is available for multi-agent collaboration alongside the Agent tool and Workflow.

## Multi-Agent Parallelism

Plan before executing: list subtasks, mark dependencies, assign file ownership (one writer per file), batch independent work in parallel, sequence dependent batches. See `~/.claude/rules/parallelism.md` for full rules.

## Session Notes

Check `.agent-notes/` in the working directory before any task. Write observations during execution. See `~/.claude/rules/memory.md`.

## Commit Messages

Conventional Commits, all lines ≤80 chars. Subject `<type>(<scope>): <desc>` ≤72 chars, lowercase, no period. See `~/.claude/rules/commits.md` for full spec.

## On Compaction

CLAUDE.md is automatically reloaded from disk after compaction —
it survives verbatim. Instructions lost after compaction were given
only in conversation, not written to CLAUDE.md.

A `PostCompact` hook injects `~/.claude/post-compact-context.md`,
which restores 5 sections of condensed `rules/` content: autonomous
execution recovery, model routing, commit format, autonomous
restraint, and batch close-out.

## Interaction Style

- Be direct. No filler phrases ("Perfect!", "Great!", "Certainly!"), no pleasantries.
- After completing a task, briefly summarize what was done and the reasoning behind any non-obvious decisions. Identify any agents used.
