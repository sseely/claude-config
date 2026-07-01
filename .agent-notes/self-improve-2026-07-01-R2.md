# Self-Improve Audit — Agent R2 — 2026-07-01

Scope: 4 areas. Read-only. Baseline: 2026-06-20 comprehensive audit (all landed).

---

## Area 1 — Fable 5 re-enablement consistency

### Finding 1.1 — settings.json uses undocumented `[1m]` suffix on Fable
`settings.json:142` — `"model": "claude-fable-5[1m]"`. Per official docs
(https://code.claude.com/docs/en/model-config), the `[1m]` suffix is documented
ONLY for `sonnet[1m]`, `opus[1m]`, `opusplan[1m]` — models that do NOT natively
carry a 1M window. Docs state plainly: "On the Anthropic API, Fable 5, Sonnet 5,
Opus 4.8, and Opus 4.7 always run with the 1M window." Fable 5 is native-1M, so
`[1m]` is redundant at best and an undocumented/invalid token at worst. It also
CONTRADICTS the committed plan: FABLE-REACTIVATION.md:58,63,79 and commit 0b38c9a
both specify plain `"claude-fable-5"`. The `[1m]` was added outside the plan.
- **Severity:** Warning
- **Confidence:** 82
- **Fix:** Change `settings.json:142` to `"model": "claude-fable-5"` (drop
  `[1m]`), matching the reactivation plan and the commit message. Fable's 1M
  window is automatic; the suffix is not documented for Fable.

### Finding 1.2 — self-improve SKILL.md model-alias list omits Fable
`skills/self-improve/SKILL.md:122-137` — the pre-seeded "ALL valid `model:`
values" alias table lists `default/best/sonnet/opus/haiku/sonnet[1m]/opus[1m]/
opusplan` and the API-ID list names only `claude-opus-4-8`, `claude-sonnet-5`,
`claude-haiku-4-5-20251001`. It names NEITHER the `fable` alias NOR
`claude-fable-5`. Official docs confirm `fable` and `best` (="Fable 5 where
available") are real aliases. Because settings.json now routes to
`claude-fable-5[1m]`, a future self-improve Agent B run will flag the live
session-default model as an unrecognized/invalid value — a false positive on the
repo's own committed config.
- **Severity:** Warning
- **Confidence:** 88
- **Fix:** Add to the alias table: `| `fable` | Claude Fable 5 for hardest/
  longest-running tasks |` and update `best` to note "= Fable 5 where org has
  access, else latest Opus". Add `claude-fable-5` to the valid API-ID list.

### Finding 1.3 — No stale "disabled/export-control" language leaked into active config (PASS)
grep across *.md/*.json for "downgrade fable / fable unavailable / fable
disabled / export-control / scrub" found only: (a) FABLE-REACTIVATION.md (the
plan doc itself, correctly historical), (b) legal-advisor.md:66 "Export
controls" (unrelated domain content), (c) .agent-notes/ prior-run notes.
parallelism.md (table row 83 + compensation block 119-133), post-compact-
context.md (17-18), prompting-quality.md (16), plan-mission/SKILL.md (351, 402)
all describe Fable as ACTIVE and consistent. No contradiction remains.
- **Severity:** Note (no action)
- **Confidence:** 90

### Finding 1.4 — FABLE-REACTIVATION.md left tracked with all checkboxes unchecked
`FABLE-REACTIVATION.md` is git-tracked (committed 1e374fd) and every `- [ ]`
remains unchecked despite the work being DONE (commit 0b38c9a). As a living
plan doc it now misrepresents state — a reader sees an un-executed plan when it
is fully executed. Low harm, but it is a stale contradiction in a tracked file.
- **Severity:** Suggestion
- **Confidence:** 70
- **Fix:** Either delete FABLE-REACTIVATION.md (work complete, history in git)
  or mark checkboxes `[x]` and add a "COMPLETED 2026-07-01 in 0b38c9a" header.

---

## Area 2 — Untracked runtime/secret directories (SECURITY)

### Finding 2.1 — 32-byte secret `daemon/control.key` not covered by .gitignore
`.gitignore` (whole file) — `git check-ignore` confirms NONE of the untracked
runtime paths are ignored: `daemon/` (contains `control.key` = 32-byte secret,
plus `auth/`, `roster.json`, `dispatch/`), `daemon.lock`, `daemon.log`,
`daemon.status.json`, `jobs/`, `telemetry/`, `chrome/`, `logs/`,
`.last-update-result.json`. A `git add -A` would stage `daemon/control.key` — a
live secret — directly into history. Violates rules/security.md ("Never hardcode
secrets... into source"; committing a key to git is the same exposure class).
- **Severity:** Critical
- **Confidence:** 95
- **Fix:** Add to `.gitignore`:
  ```
  # Local daemon runtime + secrets
  daemon/
  daemon.lock
  daemon.log
  daemon.status.json
  jobs/
  logs/
  telemetry/
  chrome/
  .last-update-result.json
  ```
  (`daemon/` alone covers control.key/auth/roster.json/dispatch.)

### Finding 2.2 — telemetry/ contains PII (email + account/org UUIDs)
`telemetry/1p_failed_events.*.json` — contains raw `email:
scott@scottseely.com`, `account_uuid`, `organization_uuid`, `device_id`. Not
ignored. Committing telemetry leaks PII per rules/logging.md ("Never log PII")
and rules/environment.md redaction guidance. Covered by the `telemetry/` line in
2.1's fix but called out separately because the risk class is PII, not just a
key.
- **Severity:** Warning
- **Confidence:** 90
- **Fix:** Included in 2.1 (`telemetry/`). Ensure it lands before any `git add -A`.

### Note 2.3 — `hooks/complexity-ignore` and `.serena/.gitignore` also untracked
These two are untracked but are likely INTENTIONAL tracked-config candidates
(not runtime junk). `.serena/.gitignore` is git's own ignore file for the serena
cache; `hooks/complexity-ignore` looks like a hook allowlist. Do NOT blanket-
ignore these — decide per-file whether to track them. Flagging so the .gitignore
fix in 2.1 is not over-broadened to swallow them.
- **Severity:** Note
- **Confidence:** 65

---

## Area 3 — diagnosis.md propagation

### Finding 3.1 — post-compact-context.md does NOT restore diagnosis mode
`post-compact-context.md` — grep for "diagnosis" = 0 hits. The file restores
Autonomous Recovery, Model Routing, Commit Format, and Autonomous Restraint
after compaction, but NOT the diagnosis-mode discipline that CLAUDE.md:59-61
establishes. Diagnosis mode ("state the mechanism before any fix; symptom gone ≠
done") is exactly the kind of behavioral rule that is easy to lose post-compact
mid-debugging — the same rationale that justifies the other restored blocks.
CLAUDE.md notes it is reloaded verbatim after compaction, so this is a real gap
only for the window where the model acts on the compacted summary before
re-reading; still worth a one-line restore given the other rules are restored.
- **Severity:** Suggestion
- **Confidence:** 68
- **Fix:** Add to post-compact-context.md a "## Diagnosis Mode (restored)" block:
  "On any observed discrepancy (failing test, oracle mismatch, symptom vs
  intent): state mechanism — cause, file:line origin, causal chain, what you
  ruled out — before proposing a fix. Symptom gone ≠ done. Full standard:
  ~/.claude/rules/diagnosis.md."

### Finding 3.2 — error-detective.md carries diagnosis discipline but does not LINK the rule
`agents/04-quality-security/error-detective.md` — carries root-cause discipline
inline (three-consecutive-hypotheses escalation) but, unlike debugger.md:39
(which explicitly cites `~/.claude/rules/diagnosis.md`), never references the
canonical rule file. Minor inconsistency between the two sibling debugging
agents.
- **Severity:** Suggestion
- **Confidence:** 60
- **Fix:** Add to error-detective.md the same closing line debugger.md uses:
  "Full standard: `~/.claude/rules/diagnosis.md`."

### Note 3.3 — CLAUDE.md + debugger.md wiring is correct (PASS)
CLAUDE.md:59-61 (Diagnosis section) and :70 (rules index) both reference
diagnosis.md. agents/04-quality-security/debugger.md:39 links it explicitly.
Wiring is present where it matters most.

---

## Area 4 — Still-open 2026-06-20 backlog (only genuinely-absent items)

### Finding 4.1 — SubagentStop / PostToolBatch hook events not wired
`settings.json` hooks block (144-...) defines SessionStart, PreToolUse,
PostToolUse, Stop only. `SubagentStop` and `PostToolBatch` remain unwired. Still
genuinely absent.
- **Severity:** Suggestion
- **Confidence:** 80
- **Fix:** Consider a `SubagentStop` hook for per-subagent quality-gate logging
  (aligns with autonomous-execution.md quality-gate discipline). Only if a
  concrete use exists — do not add an empty handler.

### Finding 4.2 — no `paths:` frontmatter on any domain rule
`grep -rl "^paths:" rules/` = 0. Domain rules (api-design, security, logging,
etc.) still load by pointer with no path-scoping. Still absent.
- **Severity:** Suggestion
- **Confidence:** 62
- **Fix:** Only pursue if Claude Code supports `paths:`-scoped rule auto-loading;
  verify feature exists before adding (prior audit deprioritized for this
  reason). Otherwise close as won't-do.

### RESOLVED since 2026-06-20 (dropped, per instructions):
- `fallbackModel` — NOW present: templates/autonomous-settings.json:2 =
  `"opus"`. Resolved.
- `effort:` frontmatter spread — NOW on 18 agents (was ~3). Resolved.
