# Self-Improve Phase 1 — Agent B Findings

**Scope:** Model version and API-surface changes the config may be lagging on.
**Date:** 2026-07-24 (supersedes 2026-06-20 and 2026-07-01 runs in this file's
history — both prior runs' content is preserved in git history / prior tool
output; this run re-verifies against live docs and records only the delta).

## Fetch guard results
All three assigned URLs returned 200 with rich content (all several KB, no
truncation/redirect issues). No FETCH GUARD warnings triggered.
- https://code.claude.com/docs/en/model-config — OK (~28K chars persisted)
- https://platform.claude.com/docs/en/about-claude/models/overview — OK
- https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5 — OK

---

## 1. Deprecated patterns present in config

### D1 (RESOLVED since 2026-06-20 audit)
`skills/self-improve/SKILL.md:125` — `best` alias description now correctly
reads "Fable 5 where the account has access, else `opus`". The 2026-06-20
finding that this was stale is no longer true. No action needed.

### D2 (STILL OPEN) — effort table in SKILL.md omits Fable 5 entirely
`skills/self-improve/SKILL.md:145-151` — the effort-level support table lists
`low/medium/high` as available on "Opus 4.8, 4.7, 4.6, Sonnet 5, Sonnet 4.6"
and `xhigh/max` on "Opus 4.8, Opus 4.7, Sonnet 5" — Fable 5 is not in any row.
Live docs (model-config, "Adjust effort level" table) state: **Fable 5 |
low, medium, high, xhigh, max**. Fable 5 supports the full range including
`xhigh`/`max`, same as Sonnet 5/Opus 4.8/4.7. This table under-reports valid
effort values for Fable and should add a `Fable 5` entry to every row.
Note: this task's own pre-seeded effort-level list has the identical gap
(lists xhigh/max as "Opus 4.8, Opus 4.7, Sonnet 5" without Fable 5) — the
SKILL.md table appears to have been generated from the same incomplete
source. Recommend fixing both the seed text and SKILL.md together.

### D3 — no invalid model/effort values in current config (confirmed clean)
- `grep -rn "^model:" agents/` → 130 agents, all values ∈ {sonnet, opus,
  haiku, opusplan}. All valid per model-config aliases table. No
  `sonnetplan`, no pinned `claude-opus-4-1`, no other invalid string.
- `grep -rn "^effort:" agents/` → 18 agents, all `effort: high`. Valid on
  every model those agents use (sonnet/opus default to `high` anyway, so
  these are redundant-but-harmless, not wrong).
- `settings.json:142` `"model": "fable"` — valid alias (session default
  intentionally changed; not flagged as error per task instructions).
- `settings.json:253` `"effortLevel": "high"` — valid; matches Fable 5's
  documented default effort (`high`).

### D4 (NEW) — fallbackModel set as a bare string, not an array
`templates/autonomous-settings.json:2` — `"fallbackModel": "opus"`.
Every documented example of `fallbackModel` in settings
(code.claude.com/docs/en/model-config, "Fallback model chains") uses an
**array**: `"fallbackModel": ["claude-sonnet-5", "claude-haiku-4-5"]`. The
docs describe it as "one or more fallback models" configured "as an array."
A bare string was not verified against the live schema (no API to test
against in this audit) — recommend converting to `["opus"]` defensively
since the documented contract is array-typed, or confirm with a live test
that Claude Code coerces a scalar. Not confirmed broken; confidence MEDIUM.

### D5 — Opus 4.1 retirement now 12 days out (2026-08-05)
`claude-opus-4-1-20250805` is deprecated and retires **2026-08-05** per
models/overview. Confirmed via grep: **not referenced anywhere in
~/.claude** (no action required), but flagging because the retirement date
has moved from "3 weeks out" (07-01 audit) to imminent. Informational only.

---

## 2. New capabilities not yet leveraged

### N1 — `availableModels` + `enforceAvailableModels` governance unused
No `availableModels` allowlist anywhere in settings.json or templates
(grep clean). Could codify the existing informal tiering (haiku for
scoring/research, sonnet default, opus/opusplan for architecture, fable for
long-horizon) as an enforced allowlist per role. Unchanged from 2026-06-20
finding N3 — still not adopted.

### N2 — `fallbackModel` chain absent from the main settings.json
Only `templates/autonomous-settings.json` sets a fallback (and only as a
bare string, see D4). The primary `settings.json` (which now runs
`"model": "fable"` as the session default) has **no fallback chain** for
overload/server-error conditions. Given Fable 5 also has *content-based*
automatic fallback to Opus 4.8 on safety-classifier flags (separate
mechanism, already documented in parallelism.md), an *availability*-based
`fallbackModel: ["opus", "sonnet"]` in settings.json would cover the
complementary failure mode (Fable overloaded/unavailable, not flagged).

### N3 — Fable 5 feature surface not referenced in rules
Fable 5 supports (per the intro doc): task budgets (beta header
`task-budgets-2026-03-13`), the memory tool, code execution tool,
programmatic tool calling, context-editing tool-result clearing, and
compaction — none of these are mentioned in `rules/parallelism.md`'s Fable
section or `rules/extended-thinking.md`. Not necessarily gaps requiring
action (may be out of scope for this repo's usage pattern), but worth a
scan if any agent/skill would benefit from task budgets on long
mission-brief runs.

### N4 — Agent Teams as a distinct multi-agent mode not documented
WebSearch results (Tembo, eesel, Shipyard) consistently describe three
Claude Code multi-agent patterns: (a) subagents within a session, (b) the
built-in **Agent Teams** feature (shared task list, teammate cross-talk via
SendMessage, parallel teammates on one machine), and (c) external
orchestrators. `rules/parallelism.md` documents (a) and references the
`Workflow` tool, but does not name Agent Teams as a distinct pattern —
despite this session's own tool surface (`SendMessage`, `TaskStop` with
"agent-team teammates" in its description) clearly supporting it. Consider
a short subsection distinguishing "subagent (report-back)" from "team
(shared task list)" dispatch, per the search-result framing.

---

## 3. Recommended model-routing table (2026-07-24 — unchanged from 07-01)

| Role | Recommended | Effort | Notes |
|------|-------------|--------|-------|
| Long-horizon autonomous / mission execution | `fable` (`claude-fable-5`) | `high`→`xhigh`/`max` for hard runs | Falls back to Opus 4.8 automatically on safety-classifier flags (security/biology domains) |
| Planning / architecture | `opus` (`claude-opus-4-8`) | `high` default; `xhigh`/`max` for deep multi-path | 1M context on API |
| `opusplan` hybrid | `opusplan` / `opusplan[1m]` | n/a | Opus in plan mode, Sonnet in execution |
| Implementation | `sonnet` (`claude-sonnet-5`) | `high` default; `medium` if token-sensitive | Native 1M context, no `[1m]` suffix needed on API |
| Scoring / dedup / format validation | `haiku` (`claude-haiku-4-5-20251001`) | n/a — `effort` param returns 400 | 200k context cap |

This matches the live table in `rules/parallelism.md` almost exactly; the
only gap is D2 above (Fable missing from the SKILL.md effort-support table,
not from parallelism.md itself, which already lists Fable correctly).

---

## 4. WebSearch step (provenance-gated)

Both queries ("Claude Code advanced patterns 2026", "Claude Code multi-agent
best practices 2026") returned only blog/aggregator/webinar content — no
GitHub repos in the top 3 results for either query that would pass the
PROVENANCE GATE (github.com/anthropics OR >1000 stars AND >6mo history).
No clones performed, no injection scan needed. Top-3-read signal summarized
in section 2 (N4) and section 1 note on Haiku→Sonnet→Opus→Fable routing
(matches existing config, no change required).

Sources referenced (uncloned, background context only, Tier 5 general web
per research-sources.md — not treated as authoritative):
- https://www.tembo.io/blog/claude-code-multi-agent-orchestration
- https://www.eesel.ai/blog/claude-code-multiple-agent-systems-complete-2026-guide
- https://shipyard.build/blog/claude-code-multi-agent/
- https://resources.anthropic.com/hubfs/Claude%20Code%20Advanced%20Patterns_%20Subagents,%20MCP,%20and%20Scaling%20to%20Real%20Codebases.pdf (Anthropic-hosted, Tier 1-adjacent)

---

## 5. Staleness note

`skills/self-improve/research-urls.md` last-verified dates for all three
assigned URLs are 2026-07-01 (23 days old; 90-day staleness threshold not
yet breached). This run re-verified them live; recommend the orchestrator
(Agent A / self-improve skill owner) bump `last-verified` to 2026-07-24 in
research-urls.md, since Agent B is scoped read-only on that file.
