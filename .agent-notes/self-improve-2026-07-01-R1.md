# Self-Improve Audit R1 — Ecosystem Delta Since 2026-06-20

**Agent:** R1 (ecosystem/model-fact verification)
**Date:** 2026-07-01
**Scope:** Only what changed in the ~2 weeks since the 2026-06-20 audit, plus current model-fact verification.

## Fetch guard results
All four sources returned rich content (all >>1000 chars, HTTP 200). No unreachable/thin warnings.
- changelog: OK (structured June 2026 entries returned)
- model-config: OK (58KB, persisted to tool-results)
- models/overview: OK
- Fable 5 intro page: OK
- WebSearch (Fable 5 status): OK

---

## 1. Changelog — NEW / CHANGED vs mid-June 2026

The changelog content covers through June 30, 2026 (v2.1.197). **No July 2026 entries exist yet.**
Entries dated **after ~June 20** (i.e., genuinely new since the last audit):

| Date | Ver | What | Adopt for a parallelism/autonomous/hooks-governed repo? |
|------|-----|------|------|
| Jun 30 | 2.1.197 | **Claude Sonnet 5 becomes the default model; 1M-token context** | Already reflected in rules (Sonnet 5 routing economics). No action. |
| Jun 29 | 2.1.196 | Org default models; clickable file attachments; MCP security; background-job reliability | Minor. Background-job reliability helps autonomous runs — no config change. |
| Jun 26 | 2.1.195 | `CLAUDE_CODE_DISABLE_MOUSE_CLICKS`; hook matcher fixes; voice dictation | Hook matcher fixes are relevant if hooks misfire — verify existing hooks still match. |
| Jun 25 | 2.1.193 | `autoMode.classifyAllShell` setting; auto-mode denial reasons; `OTEL_LOG_ASSISTANT_RESPONSES`; bash file autocomplete | `autoMode.classifyAllShell` worth considering for autonomous/sandbox safety. `OTEL_LOG_ASSISTANT_RESPONSES` ties to observability rules. |
| Jun 24 | 2.1.191 | `/rewind` support; background-agent reliability; `/deep-research` fixes | `/rewind` useful for interactive recovery. No rule change. |
| Jun 23 | 2.1.187 | `sandbox.credentials` setting; **org model restrictions** (Console toggle, v2.1.187+); remote MCP timeout | `sandbox.credentials` aligns with security.md (block credential-file access) — candidate for /sandbox skill. Org model restrictions relevant to model-governance. |
| Jun 22 | 2.1.186 | `claude mcp login/logout` CLI; `/workflows` status filtering; Skills section in `/plugin` | Minor. |

**Net:** Nothing here forces a rules change. Two settings worth evaluating for the security/sandbox posture: `sandbox.credentials` and `autoMode.classifyAllShell`. `OTEL_LOG_ASSISTANT_RESPONSES` is optional observability tie-in.

> Caveat (MEDIUM confidence): The changelog fetch's own raw body appeared to terminate at May 29 in one view, but the model returned a structured June table. June entries corroborated by model-config version notes (Sonnet 5 requires v2.1.197; org restrictions require v2.1.187) — so the June dates are trustworthy.

---

## 2. Model aliases + effort levels (model-config) — CORRECTIONS TO KNOWN-GOOD SET

**Documented `model:` aliases (HIGH confidence, from model-config):**
`default`, `best`, **`fable`**, `sonnet`, `opus`, `haiku`, `sonnet[1m]`, `opus[1m]`, `opusplan`

**DELTA vs R1 known-good set {default, best, sonnet, opus, haiku, sonnet[1m], opus[1m], opusplan}:**
- ➕ **`fable`** — NEW alias, not in the R1 known-good list. "Uses Claude Fable 5 for your hardest and longest-running tasks." Also `opusplan[1m]` is referenced as a valid variant.
- `best` IS confirmed present ("Uses Fable 5 where your org has access, otherwise latest Opus").
- All others confirmed unchanged.

**Documented `effort:` levels (HIGH confidence):**
`low`, `medium`, `high`, `xhigh`, `max` — **matches known-good exactly.** No change.
- Note: `ultracode` exists in the `/effort` menu but is a **Claude Code setting, not a model effort level** (sends `xhigh` + dynamic workflows, session-only). Not part of `effortLevel`/`--effort`/`CLAUDE_CODE_EFFORT_LEVEL`.
- Settings-file `effortLevel` accepts only `low`/`medium`/`high`/`xhigh` (`max` and `ultracode` are session-only).

**Effort support by model (HIGH):** Fable 5, Sonnet 5, Opus 4.8, Opus 4.7 all support `low..max`. Opus 4.6 / Sonnet 4.6 cap at `low/medium/high/max` (no `xhigh`). Default effort = `high` on Fable 5, Sonnet 5, Opus 4.8; `xhigh` on Opus 4.7.

**New Fable env var (HIGH):** `ANTHROPIC_DEFAULT_FABLE_MODEL` (+ `_NAME/_DESCRIPTION/_SUPPORTED_CAPABILITIES`), and `DISABLE_PROMPT_CACHING_FABLE`. `ANTHROPIC_SMALL_FAST_MODEL` is deprecated in favor of `ANTHROPIC_DEFAULT_HAIKU_MODEL`.

---

## 3. Model IDs (models/overview) — verification

Known-good IDs all CONFIRMED (HIGH confidence):
- `claude-opus-4-8` ✓
- `claude-sonnet-5` ✓ (introductory pricing $2/$10 per MTok through Aug 31, 2026)
- `claude-haiku-4-5-20251001` ✓ (alias `claude-haiku-4-5`)
- `claude-fable-5` ✓ ($10/$50 per MTok)

**New / notable:**
- `claude-mythos-5` — shares Fable 5 specs/pricing; invitation-only (Project Glasswing), NOT generally available. Defensive-cybersecurity workflows only.
- **Deprecation:** `claude-opus-4-1-20250805` deprecated, **retires Aug 5, 2026** → migrate to Opus 4.8. (Not used by this config.)
- Extended thinking (fixed-budget) = **No** on Fable 5, Opus 4.8, Sonnet 5; **Yes** only on Haiku 4.5. Adaptive thinking = always-on for Fable 5; Yes for Opus 4.8/Sonnet 5; No for Haiku 4.5. This matches the rules' guidance that `budget_tokens` is removed/400 on Opus 4.8 + Sonnet 5.

**API-parameter facts (HIGH):**
- `MAX_THINKING_TOKENS=0` turns thinking off on the Anthropic API **except on Fable 5** (no effect there).
- `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` and fixed thinking budgets **do not apply** to Fable 5 / Sonnet 5 / Opus 4.7+.

---

## 4. CRITICAL — Claude Fable 5 verification

Config just re-enabled Fable 5 routing (disabled 2026-06-12 for US export-control). Status now:

**Export-control timeline (HIGH confidence, multi-source):**
- GA June 9, 2026 → suspended June 12, 2026 (US export control on Fable 5 + Mythos 5) → **US Dept. of Commerce lifted the controls ~June 30; access officially resumed July 1, 2026.**
- Anthropic's own doc now shows: "Access to Claude Fable 5 and Claude Mythos 5 has been restored." (statement: anthropic.com/news/redeploying-fable-5-mythos-5)
- ⇒ The config's re-enable of Fable 5 routing (per commit 0b38c9a) is **correctly timed and valid.**

**Four facts to verify:**

| Fact | Verdict | Confidence | Evidence |
|------|---------|-----------|----------|
| (a) Fable 5 is generally available | **CONFIRMED** | HIGH | Overview + intro page: "generally available on the Claude API, AWS, Bedrock, Google Cloud, Foundry"; access restored July 1. |
| (b) Requires 30-day retention (non-ZDR) | **CONFIRMED** | HIGH | Intro page: "carry 30-day data retention and are **not available under zero data retention**; both are designated Covered Models." model-config: `/model` picker omits/disables Fable 5 under ZDR. |
| (c) Always-on adaptive thinking, no budget_tokens param | **CONFIRMED** | HIGH | Intro: "Adaptive thinking is the only thinking mode… applies whenever the `thinking` parameter is unset. `thinking:{\"type\":\"disabled\"}` is not supported. Use the effort parameter." model-config: "Thinking cannot be turned off on Fable 5." (Note: raw chain-of-thought never returned; `thinking.display` = summarized/omitted.) |
| (d) Positioned for long-horizon agentic/autonomous work | **CONFIRMED** | HIGH | Intro: "built for the most demanding reasoning and **long-horizon agentic work**." model-config: "suited to tasks larger than a single sitting… sustains long autonomous sessions, investigates before acting, verifies its work." |

**All four Fable 5 facts CONFIRMED at HIGH confidence.** The rules file guidance for Fable (`fable` alias, always-on thinking, omit `thinking` param, describe-outcome-not-steps, long-horizon routing) is accurate and current.

**One refinement the config could add (MEDIUM):** Fable 5 runs safety classifiers (cybersecurity + biology) that trigger automatic fallback to Opus 4.8. Autonomous/mission-brief runs on Fable in security- or biology-adjacent repos should expect frequent silent reroutes (even on the first request, from CLAUDE.md/git-status context). Worth a one-line note in autonomous-execution or parallelism model-selection guidance.

---

## Summary of actionable deltas
1. **Add `fable` (and `opusplan[1m]`) to any local list of valid model aliases** — `fable` was absent from the R1 known-good set but is documented. (parallelism.md already references `fable`/`claude-fable-5`, so likely already covered — verify no stale alias allowlist elsewhere.)
2. **Fable 5 facts all verified HIGH** — no correction needed to existing Fable guidance; re-enable is correctly timed.
3. Optional: note Fable 5 safety-classifier auto-fallback behavior for autonomous runs.
4. Optional settings to evaluate for security/sandbox posture: `sandbox.credentials`, `autoMode.classifyAllShell`.
5. `effort` levels unchanged; `claude-opus-4-1` retires Aug 5 2026 (not used here).
