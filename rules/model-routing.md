# Model Routing

Match model to task complexity and cost:

| Role | Alias | Effort | Ctx | When |
|------|-------|--------|-----|------|
| Planning / heavy impl | `opus` | `high`/`xhigh` | 1M | Phase 3 decisions, mission decomposition, threat modeling |
| Long-horizon autonomy | `fable` | `high`/`xhigh` | 1M | Mission-brief execution, multi-day sessions |
| Implementation | `sonnet` | `high`/`xhigh`/`medium` | 1M | Feature work, bug fixes, refactoring, codegen |
| Scoring / dedup / validation | `haiku` | n/a | 200k | Confidence scoring, dedup, format checks, grep |

Aliases resolve to: `opus`=`claude-opus-5`, `fable`=`claude-fable-5-1`
(v2.1.255+), `sonnet`=`claude-sonnet-5`, `haiku`=`claude-haiku-4-5-20251001`.

<!-- Code review (2026-08-01): PerspectiveGap (arXiv:2606.08878, preprint)
scores opus-4-8 at 13.9% on orchestration-prompt composition, haiku-4-5
5.7%, fable-5 31.4%, sonnet-5 25.7%. Opus 5 untested — revisit if data
appears. -->

> **Haiku context limit:** 200k vs 1M for Sonnet/Opus — do not pass >50
> files to a Haiku agent in one prompt. It supports fixed-budget thinking
> (`budget_tokens`) but not adaptive; `effort` returns 400 — do not set it.

> **Version gate:** `opus` resolves to Opus 5 only on Claude Code
> v2.1.219+; earlier versions get Opus 4.8. Confirm `claude --version`.

> **Effort:** set via `effort:` frontmatter, `--effort`, or `/effort`.
> `budget_tokens` is removed on `claude-opus-4-8`/Sonnet 5 (400); use
> `type: "adaptive"` instead. `opusplan` = `opus` in plan mode, `sonnet`
> in execution.

Default to Sonnet for implementation unless the task needs deep
multi-path reasoning. Use Haiku aggressively for scoring/formatting, not
for creating. **Sonnet 5** reaches near-Opus-4.8 quality at ~60% of Opus
cost. **Opus 5** is roughly Fable-class capability at ~half Opus 4.8's
cost, so it now also covers routine agentic work — Fable still owns the
long-horizon autonomous row.

**Opus behavioral compensation** — add to the prompt when routing to Opus,
to counteract known tendencies (validated in production):

**Scope discipline:**
- Do NOT infer unstated requirements — implement the simplest interpretation
- Do NOT over-engineer — no speculative abstractions or extension points
- Do NOT spawn subagents unless the task explicitly requires it
- If scope is ambiguous, implement the minimal interpretation and note it;
  do not silently expand

**Output shape:**
- A spec, ported source, or enumerated requirement list is NOT ambiguous
  scope — implement all of it; the above is not license to trim it
- End the prompt per `prompting-quality.md`'s brevity section: "Return
  only the structured result — no preamble, no trailing summary."

**Fable behavioral compensation** — when routing to Fable, invert the
Opus constraints; its design is the opposite. This per-model guidance
overrides `rules/parallelism.md`'s single-agent default whenever the
session model is Fable:

- Describe the outcome, not the steps — over-prescriptive prompts reduce
  output quality
- Encourage subagents — prefer async sub-agents that keep context over
  spawn-and-block
- Audit progress claims against tool results; state boundaries explicitly
  (assessment vs. action)
- Give it a memory surface (a `.md` scratchpad, one lesson per file)
- Turns run minutes at higher effort — plan async check-ins
- Thinking is always-on: omit the `thinking` param

Fable 5 falls back to Opus 4.8 when safety classifiers trigger —
security-adjacent runs will see frequent silent reroutes to Opus.

**Anti-patterns:**

| Anti-pattern | Why | Fix |
|---|---|---|
| Opus for trivial edits | 5–10× cost, no gain | Sonnet; Opus for multi-path only |
| Max thinking for routine tasks | 2–4× tokens | Adaptive only for 3+ approaches |
| Haiku for code generation | More fix loops | Sonnet minimum for code writes |
| Sonnet for scoring/grep | Wasted cost | Haiku for pass/fail, dedup checks |
| Tool list >8 per agent | Decision paralysis | 3–5 tools; see MCP carve-out |

## MCP carve-out on the >8 tool limit

A **cohesive MCP tool group** counts as one capability against the >8
limit. A group qualifies when its tools come from a single MCP server,
serve one capability the agent needs, and would be selected as a set —
Serena's navigation tools qualify, as do `forge-app-developer`'s.

Two unrelated MCP servers on one agent are two capabilities; the limit
applies normally to tools outside a qualifying group.
