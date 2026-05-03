# Extended Thinking

Extended thinking gives Claude time to reason before responding.
Use it when decision quality matters more than latency.

## When to use

- Architecture decisions with multiple competing trade-offs
- Complex bug investigation with several plausible root causes
- Mission planning — breaking large work into batches and tasks
- Security analysis — attack surface enumeration, threat modeling
- Test strategy — identifying edge cases, failure modes, coverage gaps
- Performance analysis — diagnosing bottlenecks with multiple causes

## When not to use

- Straightforward coding or refactoring tasks
- Simple fixes where the cause is obvious
- Routine operations (commits, file edits, documentation updates)
- Any task where latency matters more than thoroughness

## How to request

Ask explicitly for deeper reasoning before acting:
- "Think through the trade-offs before recommending an approach"
- "Reason through possible failure modes before implementing"
- "Consider all edge cases before writing the test plan"
- "Take your time — accuracy matters more than speed here"

Claude Code uses extended thinking automatically for complex planning
tasks. You can also request it explicitly for any analysis task.

## Thinking budget

Extended thinking consumes additional tokens. For most tasks the
default budget is sufficient. For very complex decisions, explicitly
signal that more time is acceptable: "Take as long as you need."

Do not request extended thinking for tasks that are already well-scoped
or have an obvious single solution — it adds latency without benefit.
