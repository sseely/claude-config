# Agent prompt structure — reference

Lookup material for `rules/parallelism.md`. This is the full per-section
guidance for assembling a subagent prompt; the rule file only names the
ten sections in prose and points here for detail.

Subagents start with a blank slate — no conversation history, no
CLAUDE.md, no awareness of prior decisions. Every agent prompt must be
self-contained. Assemble sections in this order — it is a sequential
build sequence, not a parallel checklist, so the ≤6-constraint budget in
`prompting-quality.md` does not apply to this list.

0. **Prior observations** — If `.agent-notes/` contains findings that bear
   on *this* task's write-set, inject those verbatim here. Do not rely on
   the agent to discover them; the orchestrator's job is to pre-load this
   context. Pass only what bears on the write-set — irrelevant
   observations are distractors, and distractor leakage is a leading
   measured cause of orchestration failure. When in doubt, leave it out.
1. **Context** — what the project is, what stack it uses, and what
   conventions to follow (test framework, naming, patterns)
2. **Task** — what to build or change, with enough detail that the agent
   doesn't need to guess
3. **Write-set** — which files to create or modify (explicitly)
4. **Read-set** — which files to read for context before starting (e.g.,
   "read `src/api/subscribe.js` for the existing pattern")
5. **Architecture decisions** — any pre-made decisions relevant to this
   task (e.g., "use KV not D1", "use vitest not jest"). Treat all
   decisions listed here as locked. If you discover a conflicting
   constraint, stop and log it to the decision journal — do not silently
   override the upstream decision. Subagents do not auto-load `rules/`.
   If an agent's Required Rules list names a rule file, the agent must
   Read that file before relying on it — the one-line gloss is a pointer,
   not the authoritative text.
6. **Interface contracts** — types, function signatures, or data shapes
   this task must produce or consume. If subagent output is consumed by
   a downstream agent, specify a JSON schema. If output is human-facing,
   prose is appropriate. This governs shape, not size — target subagent
   return payloads at 1k–2k tokens regardless of shape; verbose returns
   dilute the orchestrator's context.
7. **Quality bar** — "run `npm test` before finishing; all tests must
   pass"
8. **Boundaries** — three tiers: *Always do* (non-negotiables), *Ask
   first* (actions requiring approval), *Never do* (hard stops). Omit if
   all three tiers are empty.
9. **Commit format** — One commit per completed task, per
   `~/.claude/rules/commits.md`. Body explains why if >3 files change.

Omit sections that don't apply, but never omit context, task, or
write-set. If the agent lacks enough information to do the work without
guessing, the prompt is too thin.
