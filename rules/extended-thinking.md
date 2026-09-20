# Extended Thinking

Extended thinking gives Claude time to reason before responding. Use it
when decision quality matters more than latency: architecture
trade-offs, ambiguous bug investigation, mission planning, security/
threat modeling, test-edge-case coverage, multi-cause performance
analysis. Skip it for straightforward or routine work (commits, simple
fixes, obvious-cause tasks) where latency matters more than thoroughness.

## How to request

Ask explicitly for deeper reasoning: "Think through the trade-offs
before recommending an approach" or "Take your time — accuracy matters
more than speed here."

## Thinking depth

Set via the `effort` parameter in agent frontmatter or `/effort`. Raise
to `xhigh`/`max` for the hardest multi-path decisions; say "Take as long
as you need" for one-off requests. See `model-routing.md` for the
per-model effort table and `budget_tokens` deprecation. Skip it for
already-well-scoped tasks with an obvious single solution.

## Self-refine

For outputs where quality matters more than speed: generate the initial
output, critically evaluate it against requirements (what's missing,
wrong, imprecise), then refine. Two to three passes yield ~20% quality
improvement (NeurIPS 2023 self-refine, arxiv:2303.17651); returns
diminish sharply after that. Apply to architecture proposals, security
analyses, and test plans — not to routine edits or commits.

## Self-assessment trigger

When operating autonomously (no human to prompt): if uncertain which of
**3 or more significantly different approaches** to take — where
"significantly different" means the choice affects multiple files,
changes the data model, or is expensive to reverse — invoke extended
thinking before committing to one. Single-path decisions and routine
operations don't qualify regardless of complexity.
