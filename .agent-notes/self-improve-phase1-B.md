# Self-improve Phase 1 — Agent B (model version and API surface)
Run date: 2026-10-08. Installed Claude Code: 2.1.295. Read-only research; no clones made (no repo met the provenance gate and merited cloning; WebSearch top results were third-party blogs, so the clone gate was not exercised).

Pre-existing items checked: `code-review-tasks.md` has no entry for any finding below (grep for opus/sonnet/fable/haiku/model-config/tokeniz returned only the 2026-09-20 agent-fleet audit rows and the closed F069/F070/F172).

## Deprecated Patterns In Config

### B1. `settings.json` effort config no longer applies to the `opus` alias (Warning)
- What: `"model": "opus"` (settings.json:116) now resolves to Opus 5.5. `"effortLevel": "high"` (settings.json:294) is a top-level user-settings key that Opus 5.5 ignores, and the only per-model override is keyed `claude-opus-5` -> `medium` (settings.json:295-299), which matches Opus 5 only. Net: the orchestrator session runs at Opus 5.5's own default (`medium`), not the `high` the rules (`model-routing.md` table: opus `high`/`xhigh`) assume.
- Evidence: settings-reference (fetched): "Opus 5.5 and models released after it ignore [top-level effortLevel] and start at their own default until you save a level for them, which `/effort` writes under modelSettings"; model-config: default effort is `medium` on Opus 5.5, Sonnet 5.5, Haiku 5.5; "Moving from Opus 5 to Opus 5.5, start at `medium`."
- Fix: decide the intended effort for Opus 5.5 (doc advice: start `medium`, raise per task), then run `/effort <level>` in a session so it writes `modelSettings."claude-opus-5-5"`, or add that key by hand (human-applied: settings.json). Drop or retarget the stale `claude-opus-5` entry. Optionally add `maxEffortLevel`.
- Confidence: HIGH (Tier 1, retrieved this run).

### B2. Sonnet 5.5 default effort is `medium` in Claude Code, so ~84 agents with no `effort:` changed behaviour (Warning)
- What: 102 agents are `model: sonnet`; 18 set `effort: high`, the rest inherit. On Sonnet 5 the inherited default was `high`; on Sonnet 5.5 (alias since v2.1.285) Claude Code docs say `medium`.
- Evidence: model-config section 2 "medium on Opus 5.5, Sonnet 5.5, and Haiku 5.5". CONFLICT: platform.claude.com models/overview and sonnet-5-5/overview list Sonnet 5.5 default effort `high` (that is the raw API default). Claude Code docs govern the CLI; the divergence itself is worth a note.
- Fix: no mass edit. Add one sentence in `model-routing.md` that agent defaults are `medium` on the 5.5 models and that `effort: high` frontmatter is the deliberate opt-in; spot-check the review/debug agents (`debugger` was already flagged to get `effort: high` in the 2026-09-20 table).
- Confidence: MEDIUM (docs disagree; the CLI doc is the more relevant one).

### B3. `rules/model-routing.md` Haiku statements are stale as of yesterday (Warning)
- What: model-routing.md:12-13 says `haiku`=`claude-haiku-4-5-20251001`; lines 19-21 say Haiku has 200k context, no adaptive thinking, and `effort` returns 400. Haiku 5.5 (`claude-haiku-5-5`, released 2026-10-07) is the `haiku` alias on the Anthropic API from v2.1.293; installed 2.1.295 already maps there. Haiku 5.5: 1M context, 128K output, adaptive thinking with `effort` (default `medium`), same newer tokenizer (~30% more tokens than Haiku 4.5 for the same text), $0.10/$0.50 per MTok up to 100K-token prompts and $0.50/$2.50 above 100K.
- Evidence: models/overview and haiku-5-5/overview (fetched), model-config, changelog 2.1.293. Caveat: WebSearch still said "Haiku 5.5 not released"; the official docs (released Oct 7) override it, consistent with the "search lags launches" caveat in research-urls.md.
- Fix: rewrite the Haiku line and the Haiku note: alias -> `claude-haiku-5-5` (v2.1.293+; Haiku 4.5 on Bedrock/Vertex/Foundry per provider table), 1M ctx, effort supported, drop the ">50 files / 200k" rationale or restate it as a token-cost cap (tokenizer +30%, >100K prompts cost 5x). Keep the "do not pass >50 files" rule only as cost/recall advice.
- Confidence: HIGH.

### B4. Per-provider alias resolution not captured (Suggestion)
- What: model-config provider table: on Bedrock/Vertex `opus`=Opus 5.5, `sonnet`=Sonnet 4.5, `haiku`=Haiku 4.5; on Foundry `opus`=Opus 4.6, `sonnet`=Sonnet 4.5. `model-routing.md` states the Anthropic-API mapping only. Relevant to the `sandbox` skill if it ever runs against a non-API provider.
- Fix: add one clause "Anthropic API mapping; other providers differ (see model-config)".
- Confidence: HIGH.

### B5. Hook failure semantics changed; settings.json hooks do not use `onFailure` (Suggestion)
- What: 2.1.295 adds `onFailure: "block"` for command/HTTP hooks (hook that cannot start, times out or exits unexpectedly blocks the action); 2.1.292/2.1.288 made PreToolUse/PermissionRequest hooks fail closed when matching fails. `grep -c onFailure` on settings.json and templates/autonomous-settings.json = 0. The security-critical PreToolUse hooks (guard-bash, complexity gate) would be fail-open on crash today.
- Evidence: changelog 2.1.295 / 2.1.292 (Tier 1). The hooks reference was not fetched for exact field semantics; confirm at https://code.claude.com/docs/en/hooks before editing.
- Fix: add `"onFailure": "block"` to guard-bash and any other safety-gating PreToolUse command hooks in settings.json and the autonomous template (human-applied; permissions/hook file).
- Confidence: MEDIUM (field semantics from changelog line only).

### B6. API-parameter deprecations: nothing hit in config (Note)
- `temperature`/`top_p`/`top_k` non-default -> 400 on Claude 4.7+ and 5.x. Repo grep (rules, skills, agents, evals, templates, hooks, docs) found no such parameters. `budget_tokens` appears only in prose (`rules/extended-thinking.md:21`, model-routing.md:30). Opus 5.5 also rejects/changes: thinking text omitted by default (`thinking.display` defaults to `omitted`), text between tool calls comes back in thinking blocks, Sonnet 5.5 rejects forced tool use and `computer_20251124`. Only relevant to code in `skills/i18n-setup/scripts/translate.ts` (see Stale Model References) and the claude-api skill users.
- Confidence: HIGH for no occurrences (exhaustive grep), MEDIUM for migration-guide details (guide was read via a truncated summary).

## New Capabilities Unused

1. Agent tool `effort` parameter (v2.1.292): lets the orchestrator set per-spawn effort instead of editing agent frontmatter. Nothing in `rules/parallelism.md`/`model-routing.md` mentions it. Fix: add to the "Agent prompt structure"/routing section. Confidence HIGH.
2. `modelSettings` per-model `maxEffortLevel` (v2.1.267+) and per-model `autoCompactWindow` (v2.1.288+): cap Opus effort and compaction per model; unused. Confidence HIGH.
3. `CLAUDE_CODE_SUBAGENT_MODEL` env (model-config): default model for subagents/teammates/workflow agents with no `model:`; repo sets none (the 3 `haiku` agents are explore, plan, agent-installer). Low value, since 109 agents already pin `model:`. Confidence HIGH.
4. Hook `onFailure: "block"` (B5) and `agentId` on `tool.check` (2.1.290), `agent.spawn` hook now covering teammates and workflow agents (2.1.289/2.1.292): enables a deterministic spawn-depth/model guard for the parallelism rule instead of prose. Confidence MEDIUM.
5. Subagent `skills:` preload is capped at 32 entries (2.1.295). 16 agents use `skills:`; verify none exceed 32. Confidence HIGH on the cap, unchecked count per agent.
6. Opus 5.5 / Sonnet 5.5 API features that matter only for code the repo scaffolds: task budgets (beta), mid-conversation tool changes (beta), `thinking.display` options, Sonnet 5.5 `between_tools` thinking-off setting, cache reads 5% of input price on Opus/Sonnet 5.5 (2.5% on Fable 5.1), min cacheable prompt 512 tokens on Sonnet 5.5, Batch API 300k output with `output-300k-2026-03-24` beta. Confidence HIGH (docs), applicability LOW.
7. `/code-review` built-in at medium effort now includes cleanup/CLAUDE.md findings on Opus 5.5 and Sonnet 5.5 (2.1.290): overlaps the repo's `code-review` skill; no action needed beyond awareness.

## Stale Model References (file:line)

Verified current facts (this run): `opus`=claude-opus-5-5 (v2.1.280+; $4/$20; 1M; retirement not before 2027-09-22); `sonnet`=claude-sonnet-5-5 (v2.1.284+ per model-config, 2.1.285 per local transcripts; $2/$10; 1M); `haiku`=claude-haiku-5-5 (v2.1.293+); `fable`=claude-fable-5-1 (v2.1.257+ per model-config; model-routing says 2.1.255); `best` = what `fable` resolves to when available, else `opus`; `default` = Opus 5.5 on Pro/Max/Team/Enterprise/API/AWS/Bedrock/Vertex, Sonnet 4.5 on Foundry. Opus 5.5 min version is v2.1.280, matching the correction in the brief; Sonnet 5.5 min is v2.1.284 (model-config), one patch lower than model-routing.md:25's v2.1.285 (minor; note the doc figure).

| File:line | Stale claim | Correct |
|---|---|---|
| `skills/self-improve/references/phase1-research-agents.md:62-73` alias table, `:65` `best` row | `best` = "Fable 5 where the account has access, else opus"; no 5.5 row | `best` = whatever `fable` resolves to (Fable 5.1), else `opus` |
| `phase1-research-agents.md:75-85` version note | `opus` -> Opus 5 (`claude-opus-5`) "on v2.1.219 and later"; `default` -> Opus 5; `sonnet` -> Sonnet 5; "installed v2.1.278" | `opus`/`default` -> Opus 5.5 on v2.1.280+ (Opus 5 only on 2.1.219-2.1.278); `sonnet` -> Sonnet 5.5 on v2.1.284+; `haiku` -> Haiku 5.5 on v2.1.293+; installed 2.1.295. This is the staleness finding against the spec you asked for. |
| `phase1-research-agents.md:82-85` valid-ID list | omits `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-fable-5-1`, `claude-mythos-5-1` | add them; keep `claude-sonnet-4-6`, `claude-opus-4-8` |
| `phase1-research-agents.md:93-101` effort table | columns list Opus 5 / Sonnet 5 / Fable 5(.1) only; "Default high on Sonnet 5, ..." | add Opus 5.5, Sonnet 5.5, Haiku 5.5 to all five levels; default `medium` on Opus 5.5/Sonnet 5.5/Haiku 5.5 (CLI), `xhigh` default on Opus 4.7, `high` elsewhere; Opus/Sonnet 4.6: `xhigh` runs as `high`; Haiku 4.5 has no effort. "Session-only max" row: still true (2.1.295 fix). |
| `phase1-research-agents.md:86-89` | "NO `fable[1m]` variant"; "`/model` picker emits `claude-fable-5-1[1m]`, docs and behavior disagree" | model-config still lists no Fable `[1m]`. 2.1.295 and 2.1.287 changelogs: native 1M, no suffix; keep the claim, drop the picker-disagreement sentence unless re-verified. |
| `phase1-research-agents.md:117-126` + `fleet-monitoring-drift.md:17-18,69` + `docs/fleet/lifecycle.md:85` | line-number citations (`:42-75`, `:95-98`, `:40`) | no longer match file layout; replace with section anchors |
| `rules/model-routing.md:12-13` | `haiku`=`claude-haiku-4-5-20251001` | `claude-haiku-5-5` (see B3) |
| `rules/model-routing.md:19-21` | Haiku 200k ctx; no adaptive; effort 400s | 1M ctx, adaptive, effort supported (default medium) |
| `rules/model-routing.md:16-17` comment | PerspectiveGap data covers opus-4-8/haiku-4-5/fable-5/sonnet-5; "Opus 5 untested" | still unrevisited for Opus 5.5/Sonnet 5.5/Haiku 5.5; low priority |
| `rules/model-routing.md:30` | "`budget_tokens` removed on `claude-opus-4-8`/Sonnet 5 (400)" | docs: extended thinking (`type: enabled` + `budget_tokens`) "deprecated on Opus 4.6 and Sonnet 4.6 and not accepted on later models" (4.7+). Wording `claude-opus-4-8`/Sonnet 5 understates; change to "Opus 4.7+ and all 5.x" |
| `rules/model-routing.md:35-38` prose | "**Sonnet 5** reaches near-Opus-4.8 quality at ~60% of Opus cost. **Opus 5** is roughly Fable-class..." | cost now: Sonnet 5.5 $2/$10 = 50% of Opus 5.5 $4/$20 (Opus 5.5 is 20% below Opus 5's list rates; third-party sources claim up to 40% cheaper per task at default effort). Quality claims are unverified marketing paraphrase; either cite the Opus 5.5 / Sonnet 5.5 pages or delete the sentences (LOW confidence on the claims as written). |
| `rules/prompting-quality.md:15` | "On Claude 4.6+/Fable 5/Opus 4.8" | fine as a floor; could say "4.6+ incl. 5.x/5.5" |
| `rules/prompting-quality.md:59-60` | "The Sonnet 5 tokenizer emits ~1.3x the tokens of Sonnet 4.6" | still correct in direction (tokenizer introduced with Opus 4.7, ~30% more tokens vs earlier models; Haiku 5.5 doc says ~30% vs Haiku 4.5). Reword to "4.7+ tokenizer (Opus 4.7, Sonnet 5.x, Haiku 5.5): ~1.3x vs 4.6 and earlier". MEDIUM that Sonnet 5 specifically measured 1.3x. |
| `skills/plan-mission/SKILL.md:343` | "ran on Opus 5, the session's default `opus` alias" | Opus 5.5 on v2.1.280+ |
| `skills/plan-mission/SKILL.md:384-390` | "`opus` resolves to [Opus 5] on v2.1.219+... Opus 5 itself is untested" | `opus` -> Opus 5.5 on 2.1.280+; Opus 5.5 equally untested in PerspectiveGap |
| `skills/plan-mission/SKILL.md:342` | "`fable` (long-horizon, native 1M context)" | still correct |
| `hooks/log-hook-event.sh:19` | "Fable's safety classifier rerouted the session to Opus 4.8" | fallback target is "the provider's default Opus" per category (v2.1.219+): Opus 5.5 now. Same stale claim at `rules/model-routing.md:72` ("falls back to Opus 4.8"). |
| `evals/run_evals.py:33` | probe observed `claude-haiku-4-5-20251001` for `--model haiku` (v2.1.278) | on 2.1.293+ it will report `claude-haiku-5-5`; comment is a dated observation, but any eval assertion on the Haiku ID would break (check `grep -n haiku evals/`) |
| `skills/i18n-setup/scripts/translate.ts:4,175` | default `claude-opus-4-8` | still valid (retirement not before 2027-05-28) but two generations behind; update to `claude-opus-5-5` and re-check the call for 4.7+ parameter rules (no temperature/top_p/top_k; thinking blocks) |
| `skills/synced/.../skill-creator/references/schemas.md:228` | `claude-sonnet-4-20250514` | RETIRED 2026-06-15; vendored synced file, example text only; low priority, do not hand-edit synced content |
| `settings.json:295-299` | `claude-opus-5` modelSettings key | see B1 |

Retirement watch (deprecations page): `claude-haiku-4-5-20251001` retirement "not sooner than October 15, 2026" (one week out) - no pinned Haiku 4.5 ID in the repo except the eval comment; aliases move to 5.5 so no action beyond B3. `claude-sonnet-4-5-20250929` deprecated 2026-09-30, retires 2026-11-30 (replacement `claude-sonnet-5-5`): no references in repo. `claude-opus-4-5-20251101` retires not sooner than 2026-11-24: no references. Counts for `agents/**` `model:` values: sonnet 102, opus 3, opusplan 4, haiku 3 - all aliases, none pinned/deprecated.

## Recommended Routing Table

Aliases per Anthropic-API mapping, Claude Code 2.1.295.

| Role | Alias | Resolves to | Default effort (CLI) | Suggested effort | Ctx | Price in/out per MTok | Use for |
|---|---|---|---|---|---|---|---|
| Orchestrator, planning, threat modeling, multi-path design | `opus` | claude-opus-5-5 | medium | medium by default, `high`/`xhigh` for planning, `max` only ad hoc | 1M | $4 / $20 | Phase 3/5 decisions, ambiguous bugs |
| Long-horizon autonomous / mission-brief execution | `fable` | claude-fable-5-1 | high | high/xhigh | 1M | $10 / $50 | multi-hour missions; falls back to Opus (Opus 5.5) on classifier trips |
| Implementation, refactor, codegen, most specialists | `sonnet` | claude-sonnet-5-5 | medium (CLI) / high (API) | `high` explicit for review/debug agents | 1M | $2 / $10 | 102 agents |
| Scoring, dedup, format checks, exploration, search | `haiku` | claude-haiku-5-5 | medium | `low`/`medium` (now supports effort) | 1M | $0.10 / $0.50 (>100K prompts: $0.50 / $2.50) | confidence scoring, grep-style, Explore/Plan helpers |
| Plan then execute | `opusplan` | Opus 5.5 plan / Sonnet 5.5 exec | n/a | n/a | 1M | blended | 4 architect agents |

Notes for the routing doc: (a) Haiku 5.5 is now a viable reviewer/scorer, with a >100K-prompt price step, so keep scoring prompts under 100K tokens; (b) stop treating Haiku as 200k, and replace the effort-prohibition with "supported, default medium"; (c) Opus 5.5 default effort `medium` makes the "Opus overthinks, add scope discipline" compensation block less essential, but keep it (behaviour unverified on 5.5; Opus 5 prompting guide URL is in research-urls.md candidates); (d) explicit-pin escape hatch: `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU,FABLE}_MODEL`; (e) consider evaluating the 3 `haiku` agents' tool-heavy work (explore, plan) on 5.5 since the tokenizer costs ~30% more tokens.

## Fleet Drift Check

Local, no-fetch, per `references/fleet-monitoring-drift.md`.

### Condition 1: Deprecated model still referenced
- `docs/fleet/lifecycle.md` "Model and API-surface monitoring (MANAGE 3.2)" (lines 74-99) names no deprecated model or alias; it only delegates to Agent B. So the deprecated set = official deprecations ∩ alias table. Agent `model:` values: `sonnet` x102, `opus` x3, `opusplan` x4, `haiku` x3 (explore, plan, agent-installer); `grep` for pinned IDs in agents/ = none. Result: NO drift (no Must-fix). Confidence HIGH.
- Spec defect: the drift doc says to "compare against the pre-seeded alias table" and lifecycle.md calls the guidance "stated" - but lifecycle.md states no deprecated-set. The check is vacuous as written. Suggest lifecycle.md add one line: "Deprecated = any model with status Deprecated/Retired on platform.claude.com/docs/en/about-claude/model-deprecations".

### Condition 2: Monitoring signal unmeasured >1 cycle
- Prior Agent B file is `.agent-notes/self-improve-2026-09-02-phase1-B.md`; since then `fleet-signals.md` has a row dated 2026-09-20: Rules Lines 1270, Frontmatter 138/138, Hook Tests pass, Inventory Check pass. So MEASURE 2.4 signals 1 (frontmatter) and 3 (rules budget) were measured in the current cycle. No drift.
- Stale doc text, not drift: `docs/fleet/monitoring.md:45-46` says floor "159/159" (now 138/138 after the fleet trim); `:49-52` says `scripts/gen-fleet-inventory.py` "does not exist yet" but `scripts/gen-fleet-inventory.py` exists and `fleet-signals.md` already has an `Inventory Check` column showing `pass`; `:56` cites "1958 as of 2026-09-02" (now 1270 in fleet-signals, `cat rules/*.md | wc -l` = 1272 today). Rules budget has 750 lines of headroom against the 2020 cap. Fix: update the three numbers/claims or point to fleet-signals.md. Also `fleet-signals.md` rows before 2026-09-20 have 4 columns under a 5-column header (cosmetic).
- MEASURE 3.1 (risk-register exists, 123 lines claimed): not re-measured here; `docs/fleet/risk-register.md` existence not checked in this pass (out of scope for Agent B's two conditions beyond a name check). Skipped. MANAGE 4.1/4.3 are qualitative; no numeric signal.
- Result: no Should-fix drift tasks; 1 doc-accuracy Suggestion (monitoring.md numbers/claims).

## Fetch Log

| URL | Result | Notes |
|---|---|---|
| https://code.claude.com/docs/en/model-config | 200, ~100K of 116K chars read | rich; tail (env var table end) not read. HIGH. |
| https://platform.claude.com/docs/en/about-claude/models/overview | 200, rich | already reflects Opus 5.5 / Sonnet 5.5 / Haiku 5.5 / Fable 5.1 (not stale this run); cross-checked against model-config |
| https://platform.claude.com/docs/en/about-claude/model-deprecations | 200, rich | deprecation table above |
| https://platform.claude.com/docs/en/models/opus-5-5/migration-guide | 200, 89.5K (saved to tool-results, summarised from headings/greps) | read selectively |
| https://platform.claude.com/docs/en/models/haiku-5-5/overview | 200, rich | |
| https://platform.claude.com/docs/en/models/sonnet-5-5/overview | 200, rich | |
| https://code.claude.com/docs/en/changelog | 200, first 100K of 1.04M chars | only 2.1.287-2.1.295 visible; 2.1.280-2.1.286 NOT read (page truncation). Not a thin-fetch Warning; a coverage gap. |
| https://code.claude.com/docs/en/settings | 200, 56K | modelSettings key format incomplete |
| https://code.claude.com/docs/en/settings-reference | 200, first 100K of 419K | modelSettings/effortLevel quotes obtained; hooks `onFailure` section not reached |
| WebSearch "Claude Opus 5.5 Sonnet 5.5 release tokenizer pricing effort" | ok | third-party; pricing consistent with official; tokenizer for 5.5 not confirmed there (official Haiku 5.5 page says shared 4.7+ tokenizer) |
| WebSearch "Claude Code multi-agent best practices subagent model routing Opus 5.5 Haiku 5.5" | ok, but stale | claimed Haiku 5.5 unreleased; contradicted by official docs (released 2026-10-07). Only generic blog advice; no repos cloned, so the provenance/injection gate was not triggered. |

No fetch-guard Warnings (all >500 chars, 200). Only one "Warning-class" quirk: the spec's "top 3 results" read for the two WebSearch queries was not done beyond snippets because the results were all third-party blogs of low tier (Tier 5) with a known-stale claim; marked LOW and not used.

## Candidate URLs

(Not written to research-urls.md per deviation. Already-candidate items from 2026-09-02 that are now fetchable: fable-5-1/overview, fable-5-1/whats-new, model-ids-and-versions, model-deprecations [fetched here], context-windows.)

| URL | Purpose |
|---|---|
| https://platform.claude.com/docs/en/models/opus-5-5/overview | Opus 5.5 spec page |
| https://platform.claude.com/docs/en/models/opus-5-5/migration-guide | PROMOTE: fetched 200/rich; migration checklist from Opus 5 / Sonnet 5 |
| https://platform.claude.com/docs/en/models/haiku-5-5/overview | PROMOTE: fetched 200/rich |
| https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5 | Haiku 5.5 changes vs 4.5 |
| https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide | Haiku 5.5 migration |
| https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5 | Haiku 5.5 prompting (for scorer/subagent prompts) |
| https://platform.claude.com/docs/en/models/sonnet-5-5/overview | PROMOTE: fetched 200/rich |
| https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5 | Sonnet 5.5 breaking changes (between_tools, forced tool use, thinking-block binding) |
| https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5 | Sonnet 5.5 prompting |
| https://platform.claude.com/docs/en/build-with-claude/effort | Effort parameter reference (API) - resolves the Sonnet 5.5 default-effort conflict |
| https://platform.claude.com/docs/en/build-with-claude/task-budgets | Task budgets (beta) for agentic workloads |
| https://code.claude.com/docs/en/settings-reference | PROMOTE: fetched 200/rich; authoritative modelSettings / effortLevel / hook fields |
| https://code.claude.com/docs/llms.txt | Documentation index for enumerating doc pages |
| https://www.anthropic.com/claude-haiku-5-5 | Haiku 5.5 announcement |
| https://platform.claude.com/docs/en/about-claude/pricing | Full pricing incl. cache writes, long-context steps |
