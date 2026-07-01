# Self-Improve Phase 3 — Deduplicated, Scored Findings (2026-06-20)

Raw findings: ~50 across Agents A,B,C,D,E,F,G,H. Below are the survivors after
dedup, source-reconciliation, and scoring (0-100 rubric). Dropped items listed last.

## Dropped (false positives / reconciled away)
- **Fable 5 cluster (B2,B3, parts of B4)** — config deliberately downgraded Fable→Opus
  (commit b911918) after US export-control shutdown of Fable 5 / Mythos 5 (2026-06-12,
  confirmed via anthropic.com/news/fable-mythos-access). `best`=opus is correct for this
  account. Re-adding Fable would be wrong. DROP.
- **F-8 Workflow tool "stale/undefined" (Agent F)** — FALSE POSITIVE. CLAUDE.md:49 correctly
  describes the real, current Workflow tool; the subagent lacked it in its own tool list.
  DROP.
- **F-1 extended-thinking.md:33 "Opus 4.7 stale"** — line is accurate (xhigh IS the Opus 4.7
  default). Downgraded to Note N2, not an error.
- **A2 "Playwright MCP dead"** — reconciled with D-F11: it's live (user-scope), just not in
  repo .mcp.json. Becomes Suggestion S3, not a dead-permission finding.

## Warnings (score >=70, consequential)
- W1 [75] `templates/autonomous-settings.json` lacks `Bash(pytest:*)` (has go/dotnet/pip
  install/npm). Python autonomous test gate (testing.md) stalls → gate failure stops run.
  Fix: add `"Bash(pytest:*)"`. (Agent D-F17, verified)
- W2 [72] `settings.json` global lacks `Bash(go:*)` and `Bash(dotnet:*)` though project-init.sh
  detects Go/.NET and csharp/jdtls LSPs are enabled; every interactive build prompts.
  Fix: add both. (Agent D-F7, verified grep)
- W3 [78] Resumability gap: `analytics-setup` and `auth-setup` have NO resume gate (grep-verified
  empty) despite being 14-15-step secret/DB skills whose siblings all resume. CONVERGENCE FLAG:
  prior task file (2026-06-09) claimed auth-setup resumable — it is not. Fix: Step-0 resume
  check + progress file. (Agent E1)
- W4 [72] `i18n-setup` ships `PATCH /api/me/language` with no operational-readiness section and
  no test for that endpoint. Fix: add OR section + endpoint test. (Agent E2)
- W5 [75] `skills/self-improve/SKILL.md:791` Phase 3 Opus routing has no explicit conciseness
  constraint (arxiv:2604.00025 — Opus over-elaborates). Fix: add "Return only the deduplicated
  scored list — no preamble." (Agent G4, self-referential)
- W6 [78] `rules/autonomous-execution.md` Startup Sequence (:32-41) and After-Compaction (:43-55)
  near-duplicate, + 3rd copy post-compact-context.md:6-15. Fix: collapse :43-55 to a pointer.
  (Agents H-R1, F-18 overlap)
- W7 [65] Agent "Required Rules" sections list rules by filename+gloss, but subagents don't
  auto-load rules/; ambiguous whether the agent must Read the file or treat gloss as
  authoritative. Fix: one line in parallelism.md agent-prompt-structure. (Agent F-5)

## Suggestions (50-70, capped at Suggestion)
- S1 [70] Commit-format full spec restated in `autonomous-execution.md` (~:156-166); collapse
  to pointer to commits.md. (CLAUDE.md:57 is an acceptable summary+pointer — leave it.)
  (Agents G1/H-R2, narrowed)
- S2 [60] ~11 vendored agent `tools:` lists name non-existent tools (Docker, database, redis,
  postgresql, terraform, kubectl, figma) — silently ignored. Replace with `Bash`. Systemic.
  (Agent A1, verified backend-developer.md:4)
- S3 [60] `playwright` MCP defined in user-scope `~/.claude.json`, not version-controlled
  `.mcp.json`. Add to repo .mcp.json; optionally scope to a browser-test subagent. (A2/D-F11)
- S4 [62] `fallbackModel` unset; `availableModels`/`enforceAvailableModels` unused. An
  Opus→Sonnet fallback prevents hard stops on overload during long autonomous runs. Set in
  autonomous template. (Agents A6/B7)
- S5 [55] `effort:` set in only ~3/126 agents though parallelism.md prescribes high/xhigh per
  role. Add to planning/architecture/security agents. (Agent A4)
- S6 [58] `hooks/session-start.sh:32` runs `sudo apt-get install -y ast-grep` (gated behind
  CLAUDE_AUTO_INSTALL_TOOLS). sudo in a hook contradicts the PreToolUse sudo-block and can hang
  non-interactively. Drop sudo / require manual install. (Agent D-F15, verified)
- S7 [55] False absolutes: `observability.md` "Cannot define SLI? Feature not ready — stop" and
  `backend-developer.md:9` "sub-100ms p95 non-negotiable" contradict per-operation SLO design.
  Soften. (Agents F-11/F-12)
- S8 [55] SubagentStop + Notification hook events unused; SubagentStop could auto-run quality
  gates per autonomous-execution.md. (Agents A3/D-F1/F2)
- S9 [52] `review-pr` and `explore` gh/network calls lack retry per retry-idempotency.md.
  (Agent E5)
- S10 [52] doc-pdf/doc-docx no post-op verification; soffice/pandoc no `command -v` preflight,
  no timeout on `soffice --headless` (violates error-handling.md). (Agent E4)
- S11 [50] auth/payments/analytics hardcode third-party API surfaces with no "verify against
  current docs" step; omit WebSearch/WebFetch from allowed-tools. (Agent E3)

## Notes (25-49 or low-friction)
- N1 `skills/self-improve/SKILL.md` effort table omits `max`/`ultracode`; inconsistent with
  parallelism.md. (Agent B4)
- N2 `rules/extended-thinking.md:33` — accurate but could note Opus 4.8 also supports xhigh.
- N3 WebSearch/WebFetch permission syntax inconsistent (bare vs `(*)`) across 3 settings files;
  standardize on bare. (Agent D-F10)
- N4 No aggregate cap on `rules/` resident footprint (~62KB). (Agents C5/G3)
- N5 `post-compact-context.md` doesn't restore the 3-consecutive-fail STOP brake or Opus
  behavioral-restraint constraints. (Agent F-19/F-20)
- N6 Registry: `anthropic.com/blog` thin for Agent A (press newsroom). Switch Agent A target to
  `code.claude.com/docs/en/changelog` (already a candidate). 5 new candidate doc URLs appended
  by Agent A. (Agent A10)

## Positives
- YAGNI fully removed; scope-fidelity principle consistently propagated to both reviewer agents.
- All 130 agent model aliases valid; zero invalid/retired IDs.
- Opus-routed skill phases (plan-mission 3/5) already carry brevity constraints — config ahead
  of the field on 5/6 prompt-design principles (Agent C).
- CLAUDE.md 3432B (<4KB); post-compact 24 lines; no rule >200 lines; no agent >300.
- Hooks use `set -euo pipefail`; notify-on-stop has darwin platform guard.
- mem0 fully removed; serena-only .mcp.json.
