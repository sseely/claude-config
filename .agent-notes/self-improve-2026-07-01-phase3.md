# Self-Improve Phase 3 — Synthesis (2026-07-01)

Scoped run. The 2026-06-20 comprehensive audit (9 agents) landed in full — git
log shows one commit per finding (W1→d20de49/7765ab1, W3→58c7061/a574c2e,
W6→78154cb, S6→d04b8e4, S7→12355e7, etc.), and the 2026-06-30 Sonnet 5 pass
(ae5feb6) is present verbatim. Re-running the full fan-out 11 days later would
re-derive a known, deprioritized backlog. This run targeted the genuine delta:
Fable 5 re-enablement (0b38c9a, ~2h ago), the new untracked runtime dirs, and
diagnosis.md (19f0ccc) propagation. Two delta agents (R1 ecosystem/model,
R2 config) + orchestrator size/consistency checks.

## Regression / convergence gate (Phase 0)
- 3 most-recent prior findings (2026-06-30) CONFIRMED present:
  parallelism.md:84 `claude-sonnet-5`; extended-thinking.md:39 "removed…Sonnet 5
  (400)"; prompting-quality.md:60 "~1.3× tokenizer". Implemented in ae5feb6.
- 2026-06-20 W1–W7/S-series: spot-checked 6, all present. No regressions.

## Findings (deduped, scored)

### Critical
- C1 [95] `.gitignore` — untracked `daemon/` (holds `control.key`, a 32-byte
  secret, + `auth/`), `telemetry/` (PII: email/account_uuid/org_uuid/device_id),
  `daemon.lock/log/status.json`, `jobs/`, `logs/`, `chrome/`,
  `.last-update-result.json` are NOT ignored. `git add -A` stages a secret + PII.
  Violates security.md. Fix: add all to .gitignore. (R2 + orchestrator git-status)

### Warning
- W1 [88] `skills/self-improve/SKILL.md` Agent B pre-seeded model list omits the
  `fable` alias and `claude-fable-5` ID → next self-improve Agent B run
  false-positive-flags the live session default. Fix: add both; note
  `best`=Fable-where-available. (R1 + R2 converge; also missing `opusplan[1m]`.)
- W2 [75] `settings.json` working tree sets `"model": "claude-fable-5[1m]"`.
  `[1m]` is undocumented for Fable (natively 1M per model-config; suffix only
  documented for sonnet/opus/opusplan). UNCOMMITTED edit — HEAD + commit 0b38c9a
  both have plain `claude-fable-5`. If the alias is rejected, model selection
  silently breaks every session. Fix: drop suffix → `claude-fable-5`.

### Suggestion
- S1 [70] `FABLE-REACTIVATION.md` (tracked) — 10 `[ ]` checkboxes though work
  landed in 0b38c9a; misrepresents state. Fix: delete (git has history) or mark
  `[x]` + COMPLETED header.
- S2 [60] `agents/04-quality-security/error-detective.md` — 0 diagnosis refs;
  debugger.md:39 carries `Full standard: ~/.claude/rules/diagnosis.md`. Parity
  gap. Fix: add the same citation line.
- S3 [55] `CLAUDE.md` 3866B = 94% of the 4KB cap (was 3432B on 2026-06-20; +434B
  from the diagnosis section). Diagnosis section (59-61) restates diagnosis.md —
  the "reference, don't repeat" pattern prompting-quality.md itself prescribes.
  Fix: compress to a one-line pointer to recover headroom before the next add.
- S4 [55] Fable 5 auto-falls back to Opus 4.8 on cybersecurity/biology safety
  classifiers (R1, HIGH). This config runs many security agents, so autonomous
  security-repo runs will see frequent silent reroutes. Fix: one-line note in
  parallelism.md Fable block / autonomous-execution.md.
- S5 [45] New settings keys align with existing rules: `sandbox.credentials`
  (v2.1.187, blocks credential-file reads — fits /sandbox skill + security.md),
  `autoMode.classifyAllShell` (v2.1.193). Evaluate adopting in /sandbox.

### Notes
- N1 hook-matcher fix shipped (v2.1.195). Verify existing PreToolUse/PostToolUse
  matchers still fire as intended.
- N2 `paths:` frontmatter on domain rules still absent (0 files) — pursue only
  after confirming Claude Code supports paths-scoped rule loading.
- N3 `SubagentStop`/`PostToolBatch` hooks still unwired — standing opportunity
  (also raised 2026-06-20 S8); adopt only with a concrete trigger.

## Dropped / reconciled
- post-compact-context.md "missing diagnosis restore" (R2 SUGG 68) — FALSE
  POSITIVE. Diagnosis mode lives in CLAUDE.md:59-61, which reloads verbatim after
  compaction; post-compact-context.md is only for content NOT in instruction
  files. No action.
- `fallbackModel` — RESOLVED (now `"opus"` in autonomous-settings.json).
- `effort:` frontmatter spread — RESOLVED (now on 18 agents, was ~3).
- Fable re-enablement validity — CONFIRMED correct (R1 HIGH: export controls
  lifted ~Jun 30, access restored Jul 1; 30-day non-ZDR retention; always-on
  thinking, no budget_tokens; long-horizon positioning). Not a finding.

## Verdict: REQUEST CHANGES (Critical=1)
