# Model Routing


Match model to task complexity and cost:

| Role | Model alias | Effort | Context | When |
|------|-------------|--------|---------|------|
| Planning / architecture / implementation (heavy) | `opus` (`claude-opus-5`) | `high` default; `xhigh` for deep multi-path decisions | 1M tokens | Phase 3 decisions, mission decomposition, threat modeling; also viable for high-value implementation and routine agentic work now that Opus 5 is cheaper |
| Long-horizon autonomous execution | `fable` (`claude-fable-5-1`; the alias resolves there on v2.1.255+, installed v2.1.259) | `high` default; `xhigh` for agentic runs | 1M | Mission-brief execution, autonomous sessions, multi-hour/multi-day work |
| Implementation | `sonnet` (`claude-sonnet-5`) | `high` default; `xhigh` for hard tasks; lower to `medium` if token-sensitive | 1M tokens | Feature work, bug fixes, refactoring, code generation |
| Scoring / dedup / validation | `haiku` (`claude-haiku-4-5-20251001`) | n/a | 200k tokens | Confidence scoring, dedup passes, format checking, simple grep tasks |

<!-- Code review (2026-08-01, corrected 2026-08-08 against Table 8): PerspectiveGap (arXiv:2606.08878, preprint) scores claude-opus-4-8 at 13.9% on orchestration-prompt composition. Not worst-in-family — claude-haiku-4-5 is 5.7%. Table 8 does test two Claude 5 models and both roughly double Opus 4.8: claude-fable-5 31.4%, claude-sonnet-5 25.7%; claude-opus-4-7 is 19.1%. Opus 5 itself is untested, which is what `opus` resolves to on v2.1.219+. Rule retained deliberately; the Fable row above is independently supported by this data. Revisit if Opus 5 orchestration data appears. -->

> **Haiku context limit:** 200k tokens vs 1M for Sonnet/Opus. Do not pass >50 files to a Haiku agent in a single prompt.

> **Version gate:** `opus` resolves to Opus 5 only on Claude Code v2.1.219+;
> earlier versions resolve to Opus 4.8. Confirm `claude --version` before
> relying on Opus-5-era routing economics below.

Note: Haiku 4.5 supports fixed-budget extended thinking (`budget_tokens`) but not adaptive thinking; the `effort` parameter returns 400 on Haiku — do not set it.

> **Effort:** Set via `effort:` frontmatter in agent/skill files, `--effort` flag, or `/effort` command.
> Extended thinking (`budget_tokens`) is **removed on `claude-opus-4-8` and Sonnet 5 (400)**; deprecated on Opus 4.6 / Sonnet 4.6.
> Use `type: "adaptive"` with the effort parameter; `budget_tokens` is a legacy pattern.
> `opusplan` is a valid Claude Code alias: uses `opus` in plan mode, `sonnet` in execution.

Default to Sonnet for implementation agents unless the task requires deep
multi-path reasoning. Use Haiku aggressively for any agent whose job is to
evaluate, score, or format — not to create.

> **Sonnet 5** reaches near-Opus-4.8 quality on coding and agentic work at
> ~60% of Opus cost, strengthening the default-to-Sonnet rule above.

> **Opus 5** is roughly Fable-class capability at roughly half Opus 4.8's
> cost, so Opus now covers implementation and routine agentic work too — not
> just the deepest multi-path decisions. Fable still owns the long-horizon
> autonomous row.

**Opus behavioral compensation** — add to the prompt when routing to Opus,
to counteract known tendencies (validated in production):

- Do NOT infer unstated requirements — implement the simplest interpretation
- Do NOT over-engineer — no speculative abstractions or extension points
- Do NOT spawn subagents unless the task explicitly requires it
- If scope is ambiguous, implement the minimal interpretation and note the
  ambiguity; do not silently expand
- A spec, source being ported, or enumerated requirement list is NOT
  ambiguous scope — implement all of it; the above is not license to trim it
- End the prompt per `prompting-quality.md`'s scale-aware brevity section:
  "Return only the structured result — no preamble, no trailing summary."
- The seven Opus/opusplan agents also set `outputStyle: Concise` in frontmatter;
  it sets tone at the system level and stacks with the per-prompt shape rule.

**Fable behavioral compensation** — when routing to Fable
(`claude-fable-5-1`), invert the Opus constraints; its design is the opposite:

- Describe the outcome, not the steps — Fable derives the approach; over-
  prescriptive prompts/skills reduce output quality
- Encourage subagents — prefer async sub-agents that keep context over
  spawn-and-block
- Require progress claims be audited against tool results (suppresses fabricated
  status on long runs); state boundaries explicitly (assessment vs. action)
- Give it a memory surface (a `.md` scratchpad, one lesson per file)
- Turns run minutes at higher effort — plan async check-ins; sweep effort
  including low/medium for routine work
- Thinking is always-on: omit the `thinking` param (`{type:"disabled"}` and
  `budget_tokens` both 400)

Fable 5 auto-falls back to Opus 4.8 when its cybersecurity/biology safety
classifiers trigger. Autonomous runs on security-adjacent repos (e.g. the
security/PowerShell-hardening agents) will see frequent silent reroutes — expect
Opus behavior mid-run and don't mistake it for a routing bug.

**Anti-patterns to avoid:**

| Anti-pattern | Why it hurts | Fix |
|---|---|---|
| Opus for trivial edits | 5–10× cost with no quality gain | Use Sonnet; reserve Opus for multi-path architectural decisions |
| Max thinking for routine tasks | 2–4× token multiplier | Adaptive thinking only when 3+ significantly different approaches exist (see `extended-thinking.md`) |
| Haiku for code generation | Under-powered; produces more errors requiring fix loops | Sonnet minimum for any task that writes or modifies code |
| Sonnet for simple scoring/grep | Wasted cost | Haiku for pass/fail checks, dedup, format validation |
| Tool list >8 per agent | Decision paralysis; wasted token selection | Scope to 3–5 tools per agent; delegate to narrower specialists. See the MCP carve-out below. |

## MCP carve-out on the >8 tool limit

A **cohesive MCP tool group** counts as one capability against the >8 limit,
not as N tools. A group qualifies when its tools come from a single MCP
server, serve one capability the agent genuinely needs, and would be selected
as a set rather than weighed against each other — which is what makes them
cheap to reason over. Serena's navigation tools qualify; so do the forge MCP
tools on `forge-app-developer`.

This is a carve-out, not a blanket exemption for anything prefixed `mcp__`.
Two unrelated MCP servers on one agent are two capabilities, and the limit
applies normally to the tools outside any qualifying group.

