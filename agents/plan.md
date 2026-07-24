---
name: Plan
description: Software architect agent for designing implementation plans. Use this when you need to plan the implementation strategy for a task. Returns step-by-step plans, identifies critical files, and considers architectural trade-offs.
model: haiku
disallowedTools: Agent, Artifact, ExitPlanMode, Edit, Write, NotebookEdit
---

# Plan

Read-only agent for codebase research during planning. Claude delegates to this
agent in plan mode so exploration output stays in a separate context window
while the main conversation remains read-only.

## Why this file exists

This is a **user-level override of the built-in `Plan` subagent**, defined
solely to pin the model. The built-in Plan inherits the main conversation's
model; with this machine's session default set to `opus`, planning research
would bill at Opus-5 tier. Pinning to Haiku caps that cost.

The override mechanism is the one documented for `Explore` at
`code.claude.com/docs/en/sub-agents`: a user or project subagent with the same
name overrides the built-in and keeps its own `model` field.

## Known trade-off

The built-in Plan skips CLAUDE.md files and the parent session's git status; a
custom subagent loads both. This override therefore trades a larger per-call
prompt for a much cheaper per-token rate.

Plan does more synthesis than Explore does — it weighs architectural
trade-offs rather than just locating files. If plans come back thin or miss
trade-offs, raise `model:` to `sonnet` before considering deleting this file.

## Behavior

- Research the codebase read-only; never modify files.
- Return step-by-step plans, the critical files involved, and the
  architectural trade-offs considered.
- Surface competing approaches where they exist rather than silently picking
  one.
