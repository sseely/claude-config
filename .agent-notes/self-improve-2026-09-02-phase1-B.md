# Self-Improve Phase 1 — Agent B: Model Routing & API-Surface Currency Audit

Run date: 2026-09-02. Installed Claude Code: v2.1.259. Supersedes the
2026-08-01 copy of this file (run date 2026-08-01, CLI v2.1.220).

## Sources fetched

| URL | Status | Chars (approx) |
|---|---|---|
| https://code.claude.com/docs/en/model-config | 200/rich | ~6k (2 fetches: initial + targeted re-fetch for `[1m]` verification) |
| https://platform.claude.com/docs/en/about-claude/models/overview | 200/rich | ~6.5k |
| https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5 | 200/rich, redirected in-page to `.../models/fable-5/introducing-claude-fable-5-and-claude-mythos-5` (same domain, expected canonicalization — not flagged) | ~5k |
| WebSearch: "Claude Fable 5.1 model launch September 2026" | 8 results returned | n/a |
| WebSearch: `settings.json "modelSettings" "effortLevel" documented` | 8 results returned | n/a |
| `claude -p --model haiku ...` local CLI probe | exit 0, `modelUsage` returned | n/a |

No fetch-guard warnings triggered — all three Agent B table URLs returned
≥500 chars of rich, on-domain content.

## Current model list (verified)

Per `platform.claude.com/docs/en/models/overview` (fetched live) and
corroborated by 6 independent WebSearch sources (VentureBeat, 9to5Mac, AWS
Bedrock docs, others) reporting a **2026-09-01** Fable 5.1 / Mythos 5.1
launch:

| Model | API ID | Context | Default effort | Retirement (not sooner than) |
|---|---|---|---|---|
| Claude Fable 5.1 | `claude-fable-5-1` | 1M native | `high` | 2027-09-01 |
| Claude Opus 5 | `claude-opus-5` | 1M native | `high` | 2027-07-24 |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M native | `high` | 2027-06-30 |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` (alias `claude-haiku-4-5`) | 200K | not supported | 2026-10-15 |

Legacy, still available: Fable 5 (`claude-fable-5`), Opus 4.8/4.7/4.6/4.5,
Sonnet 4.6/4.5.

**Confidence: HIGH** — Tier-1 doc (platform.claude.com models/overview,
fetched this run) + 6 corroborating Tier-3/5 sources on launch date, no
disagreement among sources on which models are current.

**Fable 5.1 CLI version gate:** requires Claude Code **v2.1.255+**
(`code.claude.com/docs/en/model-config`, fetched this run). Installed
v2.1.259 satisfies this — Fable 5.1 is fully usable on this install.
Confidence: HIGH.

**`fable` alias now resolves to Fable 5.1 by default** ("Latest Fable model
(5.1 by default)" — model-config page, fetched this run). Confidence: HIGH.

## Deprecated patterns in current config

- None found in `agents/**/*.md`. All 130 files carry an explicit `model:`
  field (0 files defaulted); every value is one of the aliases `sonnet`
  (113), `haiku` (10), `opusplan` (4), `opus` (3) — all confirmed
  currently valid. No full pinned model ID, no `sonnetplan`, no
  `claude-opus-4-1`. Confidence: HIGH (exhaustive grep, not a sample).
- **`compliance-auditor.md` haiku+`effort:high` mismatch flagged in the
  2026-08-01 run is FIXED.** `agents/04-quality-security/compliance-
  auditor.md:5-6` now reads `model: sonnet` / `effort: high` — a valid
  pairing. Confirmed by direct read this run. No further action.
  Confidence: HIGH.
- All 19 `effort: high` agents pair with `model: sonnet` (18) or
  `model: opusplan` (1, `cloud-architect.md`) — both support `high` per
  the live models/overview table (`Default effort: high` for Sonnet 5,
  Opus 5; `opusplan` resolves to Opus-then-Sonnet, both support `high`).
  **No invalid model+effort pairing found in the current fleet.**
  Confidence: HIGH.

## New capabilities not yet leveraged

- **`settings.json` top-level `"model": "claude-fable-5-1[1m]"` is very
  likely invalid/no-op syntax** — see Critical finding below.
- **Fable 5.1/Fable 5 support `task-budgets-2026-03-13` beta header, the
  memory tool, code execution tool, programmatic tool calling, and
  context-editing tool-result clearing** (fetched from the Fable 5 intro
  page, which Fable 5.1 "builds on" per its own banner note). None of
  these are referenced anywhere in `~/.claude` config. Not necessarily a
  gap — these are direct-API features, not Claude-Code-harness features —
  but worth a Suggestion-level note for `rules/parallelism.md` or a future
  Agent A pass if any skill starts calling the Anthropic API directly.
  Confidence: MEDIUM (feature list confirmed live; applicability to this
  repo's Claude-Code-only usage unconfirmed).
- **`modelSettings` in `settings.json` is a documented, valid key** (per-
  model effort defaults, available since Claude Code v2.1.243). This
  repo's `settings.json:139-143` sets
  `"modelSettings": {"claude-opus-5": {"effortLevel": "medium"}}` —
  syntactically valid. Confidence: MEDIUM (WebSearch synthesis citing
  `code.claude.com/docs/en/settings` plus two GitHub issues on the same
  feature; not independently fetched from the primary doc this run —
  Agent A owns that URL).
- **`claude -p --model haiku` alias-resolution bug from 2026-08-09 does
  NOT reproduce on v2.1.259.** Live probe this run:
  `claude -p --model haiku --output-format json --strict-mcp-config
  --tools "" --setting-sources "" --system-prompt "Reply PONG" "ping"`
  returned `modelUsage.claude-haiku-4-5-20251001` (canonicalModel
  `claude-haiku-4-5`) — correct resolution, not `claude-sonnet-5`.
  Confidence: HIGH (direct reproduction, one invocation, ~$0.0008).
  **Fix:** re-verify `evals/run_evals.py`'s `MODEL_ALIAS_FIX` workaround
  is still needed; if this reproduces clean on a second independent
  check, the workaround is removable. Not removed this run — single
  reproduction only, per the two-invocation budget.

## Recommended model routing table (only rows that differ from parallelism.md)

| Role | Current parallelism.md text | Recommended change |
|---|---|---|
| Long-horizon autonomous execution | `` `fable` (`claude-fable-5`) `` | `` `fable` (`claude-fable-5-1`) `` — the `fable` alias now resolves to Fable 5.1 by default; the parenthetical example ID is stale. Also consider appending a version-gate note parallel to the existing Opus-5 one: "Fable 5.1 requires Claude Code v2.1.255+ (installed v2.1.259 satisfies this)." |

No other row changes — `opus`→`claude-opus-5`, `sonnet`→`claude-sonnet-5`,
`haiku`→`claude-haiku-4-5-20251001` all confirmed still current against the
live models/overview table.

**Not recommended as a table change (data quality issue, not a finding):**
the first `model-config` fetch (before I re-fetched with a neutral prompt)
returned an internally-inconsistent effort-support table claiming Sonnet
4.6 supports `xhigh` in one row while stating "Opus 4.6, Sonnet 4.6 support
only low/medium/high/max (no xhigh)" two lines later — almost certainly a
WebFetch-summarizer artifact from my leading prompt, not a real page
change. Do not update `parallelism.md`'s effort table from this run;
re-verify with a neutral-prompt fetch of `model-config` before touching it.
Confidence: LOW on the contradictory claim itself (flagged, not trusted).

## Stale pre-seed corrections (exact lines in phase1-research-agents.md to change)

- `phase1-research-agents.md:56` — `` | `fable` | **Valid alias**: latest
  Fable for long-horizon agentic/autonomous work (access-gated) | `` — add
  "(currently resolves to Fable 5.1, launched 2026-09-01)" or otherwise
  note the 5.1 launch; the row is not wrong but is now one generation
  behind what "latest" means.
- `phase1-research-agents.md:68-71` — the Full Anthropic API model IDs list
  (`claude-opus-4-8`, `claude-opus-5`, `claude-sonnet-5`,
  `claude-haiku-4-5-20251001`, `claude-fable-5`) should add
  `claude-fable-5-1` as a valid full ID — confirmed live, and it is now
  the ID the plain `fable` alias resolves to.
- `phase1-research-agents.md:72-73` — "Fable 5 runs 1M context natively —
  there is NO `fable[1m]` variant, so `claude-fable-5[1m]` is invalid; use
  plain `fable` / `claude-fable-5`." **Re-confirmed true for Fable 5.1 as
  well** (see Critical finding below) — extend the wording to also name
  `claude-fable-5-1[1m]` as invalid, since that is the exact string
  currently sitting in this repo's `settings.json`.
- `phase1-research-agents.md:81-89` (effort levels table) — add Fable 5.1
  to every row alongside Fable 5 (currently the table only names "Fable
  5"). Cosmetic — Fable 5.1 behaves identically to Fable 5 for effort
  support per the live models/overview table (`high` default, no
  indication of a narrower range) — but the table should say so rather
  than silently omitting the newer name. Confidence: MEDIUM (behavioral
  equivalence inferred, not explicitly stated on a fetched page).

## Fleet drift

### Model-deprecation drift

**Verdict: no drift.** `docs/fleet/lifecycle.md`'s "Model and API-surface
monitoring (MANAGE 3.2)" section (read in full this run) does not itself
enumerate any deprecated model or alias — it describes the *monitoring
mechanism* (wires to this Agent B run) and explicitly defers the
deprecated-set judgment to whatever Agent B finds live, each run
("updating the table from that finding is a manual, judgment-driven edit
... not to a retirement procedure"). So the drift-check's defined
intersection — "lifecycle.md guidance ∩ Agent B's alias table" — is empty
by construction: lifecycle.md names no specific deprecated items this run
could find still referenced.

Cross-checked anyway against the fleet's actual `model:` values (`sonnet`,
`haiku`, `opusplan`, `opus` — see tally below): none of the 4 aliases in
use is deprecated per the live `model-config` and `models/overview`
fetches this run. All four remain first-class, currently documented
aliases.

**No Must-fix task generated.** Confidence: HIGH (exhaustive frontmatter
grep against a live-fetched current-alias list).

### Unmeasured monitoring signals

Scanned `.agent-notes/*.md` dated 2026-08-01 or later (the prior cycle's
Agent B note date) through today, 12 files: `fleet-governance-2026-08.md`,
`nist-ai-rmf-integration-2026-08.md`, `sandbox-cross-session-messaging-
2026-08.md`, and the 9 `self-improve-*` phase files re-dated 2026-08-07
(content from the 2026-08-01 run). Also checked the still-older
`self-improve-2026-07-24-phase3.md` as an earlier cycle for the
"≥2 consecutive runs" threshold.

Signals `docs/fleet/monitoring.md` presents as already-defined (excluding
the sections it itself labels "unverified intention": MEASURE 1.2's
scheduled-trigger gap, MEASURE 2.4 item 2's inventory-divergence gate,
MEASURE 3.1's risk register, MANAGE 4.1's appeal path):

| Signal | Section | Evidence found in `.agent-notes/`? | Verdict |
|---|---|---|---|
| Test coverage floor (90/90/90) | MEASURE 1.2 | None — zero recorded coverage percentages in any note across both the 2026-07-24 and 2026-08-01 cycles | **Drift** (≥2 consecutive cycles unmeasured) |
| Complexity limits (hook-enforced) | MEASURE 1.2 | No `.agent-notes/` entry recording a trigger count or compliance value; mitigating factor: the hook itself is a hard block on every `Write`/`Edit`, so violations cannot silently accumulate even without a note | **Drift, but lower urgency** — mechanically self-enforcing, the *note* is the only thing missing |
| Frontmatter parse rate (floor 159/159) | MEASURE 2.4 item 1 | None — zero hits for "frontmatter" + "parse" or the literal "159" across all 17 files scanned | **Drift** (≥2 consecutive cycles unmeasured). Live re-check this run: 130 `agents/**/*.md` + 29 `skills/*/SKILL.md` = 159 files, matches the stated floor, and all 130 agent files parsed a `model:` field cleanly — so the floor is *currently true*, it is simply never recorded as measured |
| Rules budget (≤2020 lines, doc says "currently 2018") | MEASURE 2.4 item 3 | One weak hit (a file matching "line cap" in prose, not a recorded count) | **Drift**, and the doc's own stated figure (2018) is now additionally stale: live `cat rules/*.md \| wc -l` this run = **1913**, not 2018 — the aggressive rule-compression commits visible in this session's git log (`48c162d`, `44d23ae`, `cb0b38c`) dropped it further and `monitoring.md` was never updated to reflect that |
| Near-miss capture mechanism | MANAGE 4.1 | Extensive — 17 `.agent-notes/*.md` files across both cycles, most following the structured context/finding/impact shape from `rules/memory.md` | **Not drift** — actively used |
| Error tracking (quality-gate/`.agent-notes`/commit-history) | MANAGE 4.3 | `git log` shows `fix(config): keep rules/ under its 2020-line cap` and several `refactor(rules):` commits this session's window; several `.agent-notes/` files discuss quality-gate and error-tracking mechanics | **Not drift** — evidenced via the commit-history channel the doc itself names |

**Should-fix tasks generated (per fleet-monitoring-drift.md severity rule):**

1. Coverage floor unmeasured for ≥2 cycles — either record an actual
   coverage run result in `.agent-notes/` on the next code-touching task,
   or downgrade `docs/fleet/monitoring.md`'s MEASURE 1.2 coverage bullet
   to "unverified intention" alongside its sibling scheduled-trigger gap.
   Confidence: HIGH (exhaustive grep, two cycles).
2. Frontmatter parse rate unmeasured for ≥2 cycles despite being
   mechanically cheap to check (`find agents skills -name "*.md" | wc -l`
   + a YAML-parse pass) — either wire a one-line check into an existing
   run (e.g. this skill's own Phase 1 barrier) or downgrade the bullet.
   Confidence: HIGH.
3. Rules budget figure in `monitoring.md` is stale (says 2018, live count
   is 1913) on top of being unmeasured via `.agent-notes/` — update the
   number and, going forward, log the count in `.agent-notes/` whenever a
   `rules/` edit lands, or downgrade to "unverified intention."
   Confidence: HIGH (live count re-run this session).

## Critical finding — `settings.json` model value likely invalid

- **`settings.json:126`** — top-level `"model": "claude-fable-5-1[1m]"`.
  A neutral, non-leading re-fetch of `code.claude.com/docs/en/model-config`
  this run (quoting verbatim) found exactly two documented `[1m]`-suffix
  aliases: `sonnet[1m]` and `opus[1m]`. Direct quote on Fable: "Claude Code
  removes 1M model variants from the model picker. On models with a native
  1M window, such as Sonnet 5 and the Fable models..." — i.e. Fable models
  are natively 1M and are explicitly *excluded* from the model-picker's
  `[1m]`-variant list, the same way Sonnet 5's own `[1m]` suffix is
  documented as "No effect when `sonnet` already resolves to Sonnet 5 with
  its native 1M window." Neither `fable[1m]` nor `claude-fable-5-1[1m]`
  appears anywhere on the page. (An earlier fetch in this same run, made
  with a leading prompt, produced a summarizer artifact incorrectly
  claiming `fable[1m]` "exists per documentation" — discarded in favor of
  this neutral-prompt, quote-verified re-fetch.)
  **Fix:** change `settings.json:126` to `"model": "claude-fable-5-1"`
  (drop the `[1m]` suffix — it is a no-op at best, undocumented/rejected
  at worst, since Fable is already natively 1M and not in the documented
  `[1m]`-variant set).
  Confidence: 85 (two independent fetches converge; not empirically
  tested by actually launching a session with this exact string, which
  would settle "no-op" vs. "hard error" definitively).

## Fetch-guard warnings

None. All required URLs returned 200 with substantial (>500 char) content;
no redirects to unexpected domains (the Fable-5-intro URL's in-domain
redirect to its canonical `/models/fable-5/...` path is expected
`platform.claude.com` → `platform.claude.com` behavior, not flagged).

## Candidate URLs discovered

| URL | purpose | Agent B | 2026-09-02 |
|---|---|---|---|
| https://platform.claude.com/docs/en/models/fable-5-1/overview | Fable 5.1 model page — specs, pricing, retirement date (referenced from models/overview this run, not yet independently fetched) | Agent B | 2026-09-02 |
| https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1 | Fable 5.1 changelog vs Fable 5 — directly informs the "New capabilities" section next run | Agent B | 2026-09-02 |
| https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions | Canonical explainer for alias vs. pinned-ID vs. dateless-ID semantics, referenced from models/overview | Agent B | 2026-09-02 |
| https://platform.claude.com/docs/en/about-claude/model-deprecations | Official deprecation/retirement schedule — directly feeds the Model-deprecation drift check in future runs | Agent B | 2026-09-02 |
| https://platform.claude.com/docs/en/build-with-claude/context-windows | Context-window sizing/tokenizer reference, cited by both `sonnet[1m]`/`opus[1m]` doc rows | Agent B | 2026-09-02 |
| https://www.anthropic.com/news/redeploying-fable-5 | Anthropic's own statement on the Fable 5 access-restoration incident referenced from the Fable-5-intro page | Agent B | 2026-09-02 |
| https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-fable-5-1.html | Tier-1 AWS Bedrock model card for Fable 5.1 — independent corroboration source for future launch-date verification | Agent B | 2026-09-02 |

## Summary of actionable items (score ≥ 70)

1. **[Critical, 85]** `settings.json:126` — change `"model":
   "claude-fable-5-1[1m]"` to `"claude-fable-5-1"`; the `[1m]` suffix is
   not a documented alias for Fable models (only `sonnet[1m]`/`opus[1m]`
   exist).
2. **[Should-fix, HIGH]** `rules/parallelism.md` Model Selection table,
   Fable row — update parenthetical example ID from `claude-fable-5` to
   `claude-fable-5-1` (alias now resolves to 5.1 by default); optionally
   add a v2.1.255+ version-gate note mirroring the existing Opus-5 one.
3. **[Should-fix, HIGH]** `docs/fleet/monitoring.md` MEASURE 1.2 — test
   coverage floor unmeasured across ≥2 self-improve cycles; measure it or
   downgrade the bullet to "unverified intention."
4. **[Should-fix, HIGH]** `docs/fleet/monitoring.md` MEASURE 2.4 item 1 —
   frontmatter parse rate (159/159) unmeasured across ≥2 cycles despite
   being cheap to check; wire a check or downgrade.
5. **[Should-fix, HIGH]** `docs/fleet/monitoring.md` MEASURE 2.4 item 3 —
   rules-budget figure is stale (doc says 2018, live count is 1913) and
   unmeasured via `.agent-notes/`; update the number and start logging it.
6. **[Suggestion, MEDIUM]** `phase1-research-agents.md:56,68-73,81-89` —
   four pre-seed corrections for Fable 5.1 (see "Stale pre-seed
   corrections" section above) — most concretely, extend the existing
   `fable[1m]`-is-invalid warning to name `claude-fable-5-1[1m]`
   explicitly, since that string is live in this repo's own
   `settings.json` right now.
7. **[Note, HIGH]** The 2026-08-09 `claude -p --model haiku` alias bug
   does not reproduce on v2.1.259 — re-verify `evals/run_evals.py`'s
   `MODEL_ALIAS_FIX` workaround is still needed before removing it (only
   one reproduction attempt made this run, per budget).
