# Self-Improve Phase 1 — Agent B: Model Routing & API-Surface Currency Audit

Run date: 2026-08-01. Claude Code version: 2.1.220. Supersedes stale
2026-07-24 copy of this file.

## Model/Alias Changes Found

None. Every `model:` value found under `agents/` is one of `opus`, `sonnet`,
`haiku`, `opusplan` — all valid aliases per the pre-seeded table and
confirmed live against `https://code.claude.com/docs/en/model-config`
(fetched 2026-08-01). No agent pins a full model ID, no `claude-opus-4-1`,
no `sonnetplan`, no `fable[1m]`, no other invalid string.

`settings.json:141` sets top-level `"model": "opus"` — valid; on the
installed CLI (v2.1.220, ≥ v2.1.219 threshold confirmed live) this resolves
to Opus 5 on the Anthropic API. Confidence: HIGH.

## Deprecated Patterns In Current Config

None found. `grep -rn "budget_tokens"` across `agents/`, `rules/`,
`skills/` returns zero hits outside `rules/parallelism.md` and
`rules/extended-thinking.md`, and in both files the term appears only in
prose *warning against* using it (correctly stating it 400s on Opus 5 /
Opus 4.8 / Sonnet 5, deprecated on Opus 4.6 / Sonnet 4.6) — not as a
parameter anyone is actually setting. Confidence: HIGH.

No `claude-opus-4-*` / `claude-sonnet-4-*` full IDs pinned anywhere in
config (only appear in prose inside `rules/parallelism.md`,
`rules/extended-thinking.md`, and `skills/self-improve/SKILL.md`,
correctly used as examples of deprecated/removed parameter behavior).

## Bug Found — invalid model+effort combination

- `agents/04-quality-security/compliance-auditor.md:5-6` — `model: haiku`
  paired with `effort: high`. Haiku does not appear in the effort-support
  table on either side: the pre-seeded task knowledge states "the `effort`
  parameter returns 400 on Haiku — do not set it," and the live fetch of
  `code.claude.com/docs/en/model-config` § Adjust effort level confirms:
  "The available effort levels depend on the model. Models not listed here
  do not support effort" — Haiku is absent from that table entirely (only
  Fable 5, Opus 5/Sonnet 5/Opus 4.8/Opus 4.7, and Opus 4.6/Sonnet 4.6 are
  listed). This is the only `model:`/`effort:` mismatch found across all 18
  agents that set `effort:` — every other `effort: high` agent pairs with
  `sonnet` or `opusplan`, both of which support `high`.
  Fix: delete the `effort: high` line from `compliance-auditor.md`
  (haiku agents elsewhere in the repo — e.g. `search-specialist.md`,
  `trend-analyst.md`, `qa-expert.md`, `error-detective.md`,
  `penetration-tester.md`, `accessibility-tester.md` — correctly omit
  `effort:` entirely).
  Confidence: 90 (mechanism confirmed against two independent sources;
  exact runtime failure mode — hard error vs. silent clamp — not
  independently reproduced, but the setting is unsupported regardless).

## New Capabilities Not Leveraged

- **`ultracode` effort-menu entry confirmed as Workflow-only, not an
  effort level** — matches the pre-seeded warning exactly. Live fetch:
  "The `/effort` menu also offers `ultracode`. Ultracode is a Claude Code
  setting rather than a model effort level: it sends `xhigh` to the model
  and additionally has Claude orchestrate dynamic workflows for substantive
  tasks." No config in this repo references `ultracode` — nothing to fix,
  noted for completeness. Confidence: HIGH.
- **Organization effort limits / `availableModels` / fallback model
  chains** (`fallbackModel` in settings) — none of these are configured in
  `settings.json` or `templates/autonomous-settings.json`. Not a defect
  (this is a personal, non-enterprise config), but worth noting as
  available knobs if `settings.json` model routing ever needs a hard
  ceiling or an overload/availability fallback distinct from the
  content-based Fable/Opus 5 safety-classifier fallback. Confidence:
  MEDIUM (not verified whether the user wants this).
- **Category-based automatic model fallback (Fable 5 → Opus 5/Opus 4.8 by
  category)** requires Claude Code v2.1.219+, which the installed 2.1.220
  satisfies — this is active by default, no action needed.
- **Effort levels for Opus 5 / Sonnet 5 confirmed as full
  `low/medium/high/xhigh/max`** — `rules/parallelism.md` already states
  this correctly for Sonnet 5. `rules/extended-thinking.md` states the
  same range for Sonnet 5 but never mentions Opus 5 in its per-model
  default-effort sentence (only names Opus 4.8, Sonnet 5, Sonnet 4.6, Opus
  4.7). Opus 5 behaves identically to Opus 4.8 for effort (default
  `high`, supports the full range) so this is not a factual error, just an
  incomplete enumeration. Confidence: 60 (cosmetic/completeness, not a
  behavioral bug — below the report cutoff).

## Recommended Model Routing Table

No changes recommended to `rules/parallelism.md`'s routing table — it
already reflects Opus 5 as current (`opus` → `claude-opus-5`), already has
the v2.1.219 version-gate note, and already lists Fable/Sonnet 5/Haiku
correctly. Table verified consistent with the live model-config and
models-overview fetches on every cell checked (aliases, context windows,
effort defaults).

## Fetch Warnings

None. All three required fetches returned 200 with substantial content:

- `https://code.claude.com/docs/en/model-config` — ~28k tokens rendered,
  no truncation issues after paging.
- `https://platform.claude.com/docs/en/about-claude/models/overview` — full
  content returned, includes Opus 5 launch info, so the 2026-07-24
  staleness warning in the task brief did NOT reproduce on this run.
- `https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5`
  — full content returned.

WebSearch cross-check ("Anthropic new Claude model release August 2026")
returned low-quality aggregator/blog sources (stormap.ai, scriptbyai.com,
buildfastwithai.com) with one internally-contradictory claim ("Opus 4.8
slated for late 2026" — factually wrong, Opus 4.8 already shipped and is
superseded by Opus 5 per every authoritative source fetched this run).
This is flagged as **LOW confidence, do not trust** — the authoritative
platform.claude.com fetches are unambiguous and current, and win over the
search aggregator per the research-sources hierarchy (Tier 1 docs over
Tier 5 web). No discrepancy between WebSearch and the docs regarding
which models are *current* (both agree Opus 5 is current); the only
disagreement is the aggregator's false claim about Opus 4.8's release
timing, which is simply wrong and not treated as a real discrepancy to
resolve.

## Candidate URLs Discovered

| URL | purpose | Agent B | 2026-08-01 |
|---|---|---|---|
| https://claude.com/blog/claude-model-and-effort-level-in-claude-code | Anthropic guidance blog on model/effort selection in Claude Code, linked from model-config docs | Agent B | 2026-08-01 |
| https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback | Refusal (`stop_reason: "refusal"`) response shapes and handling guidance for Fable 5/Opus 5 | Agent B | 2026-08-01 |
| https://platform.claude.com/docs/en/build-with-claude/fallback-credit | Fallback credit mechanics (avoid double-paying prompt-cache cost on model fallback retries) | Agent B | 2026-08-01 |
| https://platform.claude.com/docs/en/advisor | Advisor tool / `advisorModel` Claude Code setting — pairs a fast executor model with a stronger advisor model mid-generation | Agent B | 2026-08-01 |
| https://platform.claude.com/docs/en/about-claude/models/migration-guide | Canonical migration guide (breaking changes per model generation); heavily cross-referenced by the claude-api skill's cached copy — worth periodic live diff | Agent B | 2026-08-01 |

## Summary of actionable items (score ≥ 70)

1. `agents/04-quality-security/compliance-auditor.md:6` — remove
   `effort: high` (invalid on `model: haiku`). Confidence 90.
