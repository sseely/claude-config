# Self-Improve Phase 1 — Agent B Findings

**Scope:** Model version and API-surface changes the config may be lagging on.
**Date:** 2026-06-20
**Sources fetched:** both Agent B URLs returned 200 with rich content (>500 chars). No FETCH GUARD warnings.

---

## Deprecated patterns in current config

### D1. `best` alias definition is stale — now resolves to Fable 5, not Opus
- **Where:** `skills/self-improve/SKILL.md:124` — table row: `| `best` | Most capable available (currently = `opus`) |`
- **Also:** Agent B pre-seeded brief and several rules describe `best` as "= latest Opus".
- **Reality (model-config docs):** `best` "Uses **Fable 5** where your organization has access to it, otherwise the latest Opus model." Fable 5 (`claude-fable-5`) went GA 2026-06-09.
- **Impact:** Any audit using SKILL.md as ground truth will mis-describe `best`. Low functional risk (no agent uses `best`), but the authoritative table is now wrong.
- **Source:** https://code.claude.com/docs/en/model-config (Model aliases table; "Work with Fable 5")

### D2. Effort table in SKILL.md omits `max` and `ultracode`; mislabels availability
- **Where:** `skills/self-improve/SKILL.md:138-146` (effort table stops at `xhigh`).
- **Reality:** Effort levels are now `low`, `medium`, `high`, `xhigh`, `max` on Opus 4.8/4.7 and Fable 5. `max` is session-only (deepest reasoning, no token cap). `ultracode` is a Claude Code-only setting (sends `xhigh` + orchestrates dynamic workflows), session-only, set via `/effort` or `"ultracode": true`.
- **Note:** `rules/parallelism.md:81` DOES list `max` correctly ("max (Opus 4.8/4.7, session-only)") — so the SKILL.md table is internally inconsistent with the rules.
- **Impact:** Audit table under-reports valid effort values; a future agent could wrongly flag `effort: max` as invalid.
- **Source:** https://code.claude.com/docs/en/model-config ("Adjust effort level")

### D3. `budget_tokens` / `MAX_THINKING_TOKENS` references — correctly deprecated, no action needed
- **Where:** `rules/extended-thinking.md:35`, `rules/parallelism.md:86,90`.
- **Status:** These are descriptive guidance that correctly mark `budget_tokens` as deprecated/legacy. NOT active misconfigurations. Confirmed against docs: adaptive reasoning is always-on for Opus 4.7+/Fable 5; fixed budget only applies on Opus 4.6/Sonnet 4.6 via `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`. One refinement: `parallelism.md:86` says Haiku 4.5 "supports fixed-budget extended thinking (budget_tokens) but not adaptive thinking" — docs confirm Haiku 4.5 has Adaptive thinking = No, so this remains accurate.

### D4. No invalid model aliases found in agent frontmatter
- **Audited:** 130 agents via `grep -rn "model:"`. All values are `sonnet`, `opus`, `haiku`, or `opusplan` — all valid per pre-seeded list and docs. `sonnetplan` (the undocumented alias) appears NOWHERE. No deprecated `claude-opus-4-1` or retired IDs in use.
- **Impact:** Clean. No alias remediation required.

---

## New capabilities not yet leveraged

### N1. Fable 5 (`claude-fable-5`) — entirely absent from config
- **Reality:** Fable 5 is Anthropic's most capable widely-released model (GA 2026-06-09). API ID `claude-fable-5`, aliases `fable` and `best`. 1M context always-on, $10/$50 per MTok, adaptive thinking always-on, effort `low`–`max`. Positioned for "tasks larger than a single sitting" — long autonomous sessions, root-cause investigation, architecture decisions.
- **Gap:** `rules/parallelism.md` model-selection table tops out at Opus 4.8 for "long-horizon autonomous execution." `skills/plan-mission/SKILL.md:351` recommends `claude-opus-4-8` for mission execution. Both predate Fable 5.
- **Recommendation:** Add a Fable tier to the routing table for mission-brief/autonomous execution; note Fable's content-based fallback (security/biology classifiers reroute to Opus 4.8).
- **Source:** https://platform.claude.com/docs/en/about-claude/models/overview (Fable 5 row); model-config "Work with Fable 5"

### N2. `fallbackModel` chains — settings.json has none
- **Where:** `settings.json` has no `fallbackModel` field (confirmed via grep).
- **Reality:** `fallbackModel` (array, max 3) switches models on overload/non-retryable server errors per turn. Example: `"fallbackModel": ["claude-sonnet-4-6", "claude-haiku-4-5"]`. Aligns with `rules/retry-idempotency.md` resilience philosophy.
- **Recommendation:** Consider adding a fallback chain for autonomous runs so an Opus overload doesn't hard-fail a mission.

### N3. `availableModels` + `enforceAvailableModels` — model governance unused
- **Reality:** `availableModels` allowlist (v2.1.175+) restricts pickable models across `/model`, `--model`, subagent frontmatter, advisor, and fallback chains. `enforceAvailableModels: true` extends it to the Default option.
- **Relevance:** Could codify the "Haiku for scoring, Sonnet for impl, Opus/Fable for planning" tiering as a hard allowlist — matches the multi-agent best-practice "codify model limits in subagent YAML" finding (CloudZero/Shipyard).

### N4. `advisorModel` / advisor tool — mid-task second-model consultation
- **Reality:** The advisor tool lets Claude consult a second (stronger) model mid-task rather than switching at the plan boundary like `opusplan`. New surface not referenced anywhere in rules or agents.
- **Recommendation:** Worth a note in `rules/parallelism.md` Model Selection as an alternative to `opusplan` for cost-sensitive deep-reasoning moments.

### N5. `opusplan[1m]` and `[1m]`-suffixed pinned models
- **Reality:** `opusplan[1m]` forces 1M context in both plan and execution phases on non-auto-upgrade tiers. `[1m]` suffix also works on full model names (`claude-opus-4-8[1m]`) and pinned env vars.
- **Gap:** Pre-seeded alias list includes `sonnet[1m]`/`opus[1m]` but not `opusplan[1m]`. Minor completeness gap.

### N6. `ANTHROPIC_SMALL_FAST_MODEL` deprecated → `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- **Reality:** model-config explicitly notes `ANTHROPIC_SMALL_FAST_MODEL` is deprecated in favor of `ANTHROPIC_DEFAULT_HAIKU_MODEL`. Not present in this config's settings.json (grep clean) — flagged only so the rules can reference the current var name if env pinning is ever added.

---

## Recommended model routing table (updated for June 2026)

| Role | Recommended | Effort | Rationale |
|------|-------------|--------|-----------|
| Long-horizon autonomous / mission execution | `fable` (`claude-fable-5`) or `opus` (`claude-opus-4-8`) | `high` (→ `xhigh`/`max` for hard multi-path) | Fable sustains multi-sitting sessions, self-verifies; Opus 4.8 if Fable unavailable or security/biology work (Fable reroutes those to Opus 4.8) |
| Planning / architecture | `opus` (`claude-opus-4-8`) | `high` default; `xhigh`/`max` for deep multi-path | Adaptive reasoning always-on; 1M context on API |
| `opusplan` hybrid (plan→exec) | `opusplan` (or `opusplan[1m]`) | n/a | Opus reasoning in plan, Sonnet in execution |
| Implementation | `sonnet` (`claude-sonnet-4-6`) | `high` default; `medium` if token-sensitive | Best speed/intelligence balance |
| Scoring / dedup / format validation | `haiku` (`claude-haiku-4-5-20251001`) | n/a (no `effort` param — returns 400) | 200k context cap; adaptive thinking = No |

Notes:
- Opus 4.8 / Sonnet 4.6 default effort = `high`. Opus 4.7 default = `xhigh`. Fable 5 default = `high`.
- `max` and `ultracode` are session-only; not accepted in `effortLevel`/`effort:` frontmatter persisted settings (frontmatter accepts `low`/`medium`/`high`/`xhigh`).
- Current agent fleet (130 agents) is correctly tiered: opus/opusplan for architecture+security, sonnet for impl, haiku for research/scoring/QA. No invalid aliases.

---

## Warnings (unreachable / thin sources)

None. Both Agent B URLs fetched successfully with rich content:
- https://code.claude.com/docs/en/model-config — 200, full model-config reference (>10k chars)
- https://platform.claude.com/docs/en/about-claude/models/overview — 200, full models overview (>8k chars)

Both should have `last-verified` updated to 2026-06-20 in research-urls.md.

---

## Step 2 provenance note (no clones performed)

WebSearch "Claude Code advanced patterns 2026" and "multi-agent best practices 2026" returned only blog posts, an Anthropic webinar PDF, and aggregator articles (CloudZero, Shipyard, SmartScope, ofox, Medium) — **no GitHub repos with agent configs / prompt libraries** surfaced in the top results. The PROVENANCE GATE (github.com/anthropics OR >1000 stars AND >6mo history) had no candidates to evaluate. No clones, no injection scans needed. Substantive best-practice signal extracted from results without cloning:
- Tier agents by model (Opus orchestrator / Sonnet workers / Haiku formatting) ≈ 40% cheaper than all-Opus — config already does this.
- Codify model limits in subagent YAML to prevent default-to-most-expensive — supports adopting `availableModels` (N3).
- Subagents (report-back) vs Agent Teams (shared task list, cross-talk) decision axis — config's parallelism.md covers subagents but not Agent Teams as a distinct mode.
