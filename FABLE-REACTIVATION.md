# Fable 5 Reactivation Plan
<!-- Prepared 2026-06-30 for Fable/Mythos coming back online ~2026-07-01.
     Fable was scrubbed 2026-06-12 by export-control shutdown via commits
     2c823ae + b911918. This plan reverses that, freshened to current
     Claude Fable 5 facts. DO NOT run any edit until Pre-flight passes. -->

## Pre-flight (gate — all must pass before editing)

- [ ] **Confirm Fable is actually live.** The shutdown was regulatory, so
      "back tomorrow" must be verified, not assumed. This account uses claude.ai
      subscription auth (no API key / no `ant` profile), so probe via Claude
      Code's **`/model` picker**: if `claude-fable-5` / "Fable" is selectable, it
      is back. To be certain, select it and send a trivial prompt — a normal
      reply confirms access; an error / absence means still gated → abort, do not
      route to an absent model. (No `ant` install needed.)
- [ ] **Confirm 30-day data retention.** Fable 5 is unavailable under ZDR;
      an org below 30-day retention gets `400 invalid_request_error` on every
      Fable request. Verify org retention config before routing.

## Edit sites (reverse of 2c823ae + b911918)

1. [ ] `rules/parallelism.md` — Model Selection table: restore the long-horizon
   row to `fable` (`claude-fable-5`). Current stale row:
   `| Long-horizon autonomous execution | `opus` (`claude-opus-4-8`) | ...`
   → `| Long-horizon autonomous execution | `fable` (`claude-fable-5`) | `high` default; `xhigh` for agentic runs | 1M | Mission-brief execution, autonomous sessions, multi-hour/multi-day work |`

2. [ ] `rules/parallelism.md` — restore a **Fable 5 behavioral notes** block
   after the Opus compensation block. DO NOT blind-revert the old 4-bullet
   version (b911918) — it is now understated. Write from current facts
   (source: claude-api skill / model-migration Fable 5 section):
   - Describe the outcome, not the steps — Fable derives the approach; over-
     prescriptive prompts/skills reduce output quality (A/B with scaffolding removed)
   - Omit verification reminders — Fable self-checks; instead require progress
     claims be audited against tool results (kills fabricated status on long runs)
   - Subagent dispatch encouraged — prefer async sub-agents that keep context
     over spawn-and-block
   - State boundaries explicitly (assessment-vs-action; don't take unrequested-
     but-adjacent actions like composing drafts / backup branches)
   - Give it a memory surface (a `.md` scratchpad; one lesson per file)
   - Turns run minutes at higher effort — plan timeouts / async check-ins;
     run an effort sweep incl. low/medium for routine work
   - No new breaking API surface vs Opus 4.8 except: thinking is always-on
     (`{type:"disabled"}` and `budget_tokens` both 400 — omit `thinking`)

3. [ ] `post-compact-context.md:17-18` — restore routing line:
   `Fable→long-horizon autonomous execution (mission briefs, multi-hour runs)`
   `Opus→planning/architecture decisions, Sonnet→implementation, Haiku→scoring/dedup.`

4. [ ] `rules/prompting-quality.md:16` — the scoping-keywords note header:
   `> **On Claude 4.6+/Opus 4.8:**` → `> **On Claude 4.6+/Fable 5:**`
   (both are true; the original named Fable). Consider naming both.

5. [ ] `skills/plan-mission/SKILL.md` — two spots (currently `claude-opus-4-8`):
   - `:351` recommended execution model → `claude-fable-5` (native 1M context)
   - Phase table "Brief execution (autonomous)" row → `claude-fable-5`

6. [ ] `settings.json` — **DECISION REQUIRED** (see below). The dropped line was
   top-level `"model": "claude-fable-5"` (Fable as the default for ALL sessions).

## The one decision: Fable's scope

**Option A — Fable as session default (restore prior state).**
Re-add `"model": "claude-fable-5"` to settings.json. Every session runs on
Fable. Highest capability; highest cost ($10/$50 vs Opus $5/$25); minutes-long
turns everywhere. This is what the config had before 2026-06-12.

**Option B — Fable reserved for long-horizon autonomous only.**
Leave settings.json session default as-is (Opus). Do edits 1-5 only, so Fable
runs *just* for mission-brief / multi-hour autonomous work via the routing
table + plan-mission + autonomous-toggle. Most interactive sessions stay on
Opus/Sonnet. Lower blended cost; Fable's minutes-long turns confined to work
that benefits from them.

<!-- SELECTED 2026-06-30: Option A — Fable as session default.
     Edit 6 (restore settings.json "model") and the autonomous-fallback edit
     below are REQUIRED, not conditional. -->

**Decision: Option A.** Edit 6 is required:
- [ ] `settings.json` — re-add top-level `"model": "claude-fable-5"` (after
  `"agentPushNotifEnabled": true`). Every session runs on Fable.

## Autonomous fallback (REQUIRED under Option A)

- [ ] `templates/autonomous-settings.json:2` — `fallbackModel` is currently
   `"sonnet"`. For Fable-primary runs, set it to `"opus"` — Fable's safety
   classifiers (bio/cyber) can false-positive and refuse; `claude-opus-4-8` is
   the documented Fable fallback target, so an overnight run degrades to Opus
   rather than a weaker model. (Claude Code harness fallback, distinct from the
   API-level server-side `fallbacks` param.)

## Commit

One commit, e.g.:
`chore(config): re-enable Fable routing after access restored`
Body: reference the 2026-06-12 shutdown (2c823ae, b911918) it reverses, the
verification done in Pre-flight, and which scope Option was chosen.
