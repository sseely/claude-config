# Extended Thinking

> **Deprecation notice:** Extended thinking (fixed `budget_tokens`) is **deprecated
> on Sonnet 4.6** and **removed on `claude-opus-4-8`**. Use the `effort` parameter
> with adaptive thinking instead (`effort: high`, `xhigh`, etc.). The `budget_tokens`
> API field causes a 400 error on current Opus models.

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

## Thinking depth

Set via the `effort` parameter in agent frontmatter or the `/effort` command.
Default is `high` on Opus 4.8 and Sonnet 4.6; `xhigh` on Opus 4.7.
For one-off requests, say "Take as long as you need" to invoke deeper reasoning.
Do NOT use `budget_tokens` — deprecated on Sonnet 4.6, removed on Opus 4.8.
See `parallelism.md` for the effort level table.

Do not request extended thinking for tasks that are already well-scoped
or have an obvious single solution — it adds latency without benefit.

## Self-refine

For outputs where quality matters more than speed, apply
GENERATE → FEEDBACK → REFINE:

1. Produce the initial output
2. Critically evaluate it against the requirements — what is missing,
   wrong, or imprecise?
3. Refine based on the evaluation

Two to three passes yield ~20% quality improvement (NeurIPS 2023 self-refine).
Returns diminish sharply after 3 passes — stop there.

Apply to: architecture proposals, security analyses, test plans, mission brief
decompositions, complex technical explanations. Not worth the latency for
routine edits, commits, or single-file changes.

## Self-assessment trigger

When operating autonomously (no human to prompt), use this heuristic:

> If you find yourself uncertain which of **3 or more significantly different approaches**
> to take — where "significantly different" means the choice would affect multiple files,
> change the data model, or be expensive to reverse — invoke extended thinking before
> committing to one.

Single-path decisions (only one reasonable approach) and routine operations (commits,
edits, formatting) do not qualify regardless of complexity.
