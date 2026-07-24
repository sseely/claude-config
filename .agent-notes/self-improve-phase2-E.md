# Self-Improve Phase 2 — Agent E: Skills Quality Audit
Generated 2026-07-24. 27 skills read in full (all SKILL.md under ~/.claude/skills/).

---

## plan-mission

**Strengths:** Excellent phase structure — Phase 2 (blast radius: data model → API → service deps → files), Phase 4 (operational readiness: SLIs, rollback classification, on-call story) directly implement architecture.md/observability.md. Explicit model-routing table with brevity constraints for Opus phases (arxiv:2604.00025). Document-hygiene rules for generated briefs are strong (500-line cap, front-loaded content).

**Gaps:** No resume/progress gate. The skill drives 5 sequential user-confirmation phases (Phase 2,3,4,5,6) that can span a long multi-turn conversation, yet unlike self-improve (`.self-improve-progress.md`), upgrade-deps (`.upgrade-deps-progress.md`), and the entire auth-setup/analytics-setup family, plan-mission has no `.plan-mission-progress.md`. A session interruption after Phase 4 approval loses all confirmed decisions — Phase 8's pre-flight check has nothing to verify against if execution restarts from Phase 1.

**Priority:** Warning

**Recommendation:** `skills/plan-mission/SKILL.md` (no Step 0 exists) — add a resume gate matching the pattern at `skills/auth-setup/SKILL.md:18-38`: write `.plan-mission-progress.md` after each phase's user confirmation, recording the approved blast radius (Phase 2), decisions (Phase 3), operational-readiness answers (Phase 4), and task breakdown (Phase 5) as they're confirmed, so a restart skips already-approved phases.

---

## self-improve

**Strengths:** The gold-standard skill in this repo. Six-phase resume gate (`phase-1: done` … `phase-6: done` in `.self-improve-progress.md`, SKILL.md:29-40), explicit model routing with brevity constraints, three-tier research-vs-rule conflict resolution (SKILL.md:635-645), convergence-alarm anti-pattern check (SKILL.md:681-696) that forces evidence before an APPROVE verdict, and a prior-change regression gate (SKILL.md:62-74) that verifies past findings actually landed.

**Gaps:** Phase 1 and Phase 2 both say "wait for all agents to complete" (SKILL.md:342-349, 617) but neither phase specifies behavior if an agent errors out or times out entirely (vs. returning thin/partial results, which IS handled via the fetch-guard pattern). See cross-skill finding below.

**Priority:** Suggestion

**Recommendation:** `skills/self-improve/SKILL.md:617` — add: "If an agent fails to return output (crash, timeout), retry once, then proceed with the remaining agents and flag the missing coverage explicitly in Phase 4 output rather than silently treating the phase as complete."

---

## code-review

**Strengths:** Extremely thorough 11-agent checklist covering the full spectrum (correctness, security, deps, tests, logging, types, perf, API contracts, operability). Findings checkpoint (`/tmp/code-review-findings.md`) gives Step 0 resume. Confidence-scoring rubric (Step 4) with explicit Haiku routing is a clean cost/quality split. Verdict thresholds are unambiguous.

**Gaps:** Same agent-failure gap as self-improve — Step 2 "launch all simultaneously" and the dedup step (SKILL.md:358-362) assume all 11 agents return successfully; no fallback if one crashes.

**Priority:** Suggestion (see cross-skill pattern)

**Recommendation:** `skills/code-review/SKILL.md:341` (Save findings checkpoint) — note explicitly which of the 11 agents contributed findings, so a resumed run and the final report can flag any agent that failed to report rather than silently presenting partial coverage as complete.

---

## project-bootstrap

**Strengths:** Clean dependency-ordering table (SKILL.md:77-100) with an explicit non-silent-injection rule when payments-setup is picked without auth-setup (SKILL.md:86-92). Step-0 resume gate. Upfront input collection avoids interleaving questions across sub-skills.

**Gaps:** (1) Step 6 final summary (SKILL.md:156-186) does not roll up the Operational Readiness sections each sub-skill produces (SLIs, failure modes, rollback classification) — the user gets a routes/secrets list but no consolidated ops picture for the composed feature set. (2) Like self-improve/code-review, no handling for a sub-skill's execution crashing outright (only verify-failure is handled, Step 5.3).

**Priority:** Suggestion

**Recommendation:** `skills/project-bootstrap/SKILL.md:156` — add an "Operational Readiness rollup" subsection to the final summary that concatenates each sub-skill's SLIs/failure-modes/rollback-classification instead of dropping them.

---

## upgrade-deps

**Strengths:** Best-in-class completeness handling: RECURRING-finding detection with a hard 3x-repeat stop rule (SKILL.md:353,363), monorepo cross-workspace version-conflict resolution (SKILL.md:165-176), TS5→TS6 migration scan gated behind version detection. Clear direct-execute vs. mission-brief complexity gate (Phase 3).

**Gaps:** No material gaps found.

**Priority:** Note

---

## sandbox

**Strengths:** Strong completeness — explicit fix commands printed for every missing Keychain secret (SKILL.md:54-70), stops before any docker action if `Dockerfile.base` is missing (SKILL.md:115-119), secrets redacted in printed commands, volumes give real resumability across sessions.

**Gaps:** Phase 7 (SKILL.md:148-169) passes `ANTHROPIC_API_KEY`/AWS creds into the container but never sets a model override for the containerized Claude Code session. Given sandbox is explicitly built for autonomous `--dangerously-skip-permissions` runs and `~/.claude/rules/parallelism.md` recommends `claude-fable-5` for exactly this workload class (long-horizon autonomous execution), the omission means every sandboxed run silently defaults to whatever the base image resolves rather than an intentional choice.

**Priority:** Suggestion

**Recommendation:** `skills/sandbox/SKILL.md:148-166` — add an optional `SANDBOX_MODEL` env var (default `claude-fable-5` per parallelism.md's autonomous-execution routing) passed through to the container's Claude Code invocation.

---

## fix

**Strengths:** Diagnosis-mode gate is correctly wired to `~/.claude/rules/diagnosis.md` (SKILL.md:53-56) — refuses to enter the fix loop on a guessed cause. Agent prompts explicitly follow parallelism.md structure (SKILL.md:39-46, 68-71). Iteration budget (5, capped at 10 across regressions) with explicit escalation.

**Gaps:** No material gaps found.

**Priority:** Note

---

## review-pr

**Strengths:** Correctly restricts posted comments to Critical/Warning only (avoids resolvable-thread noise from Suggestions), single-review-API-call batching to avoid timeline spam, explicit retry/no-retry policy citing `retry-idempotency.md` (SKILL.md:234-237), always posts as COMMENT never REQUEST_CHANGES/APPROVE — correct human-in-the-loop boundary.

**Gaps:** Findings checkpoint only covers Phase 3 output (SKILL.md:108-121); Phases 1-2 (PR resolution, diff fetch) aren't cached, so a resume still re-fetches PR metadata every time — low-cost, acceptable.

**Priority:** Note

---

## explore

**Strengths:** Resume check offers supplement-vs-regenerate choice (SKILL.md:20-36) rather than blindly overwriting. `tech-health.md` EOL/CVE research step is a genuinely useful addition beyond a typical architecture-mapping skill. Retry policy on clone failures correctly cites `retry-idempotency.md`.

**Gaps:** (1) "Invoke the appropriate language/framework specialist agents to help with unfamiliar stacks. Announce each agent before invoking." (SKILL.md:73) gives no prompt structure at all — no context/task/write-set/read-set per `parallelism.md`'s required agent-prompt structure, despite the skill's own Model Routing table (SKILL.md:12-18) implying per-repo agent delegation. (2) "For each repo, identify and record..." (SKILL.md:53-73) is written sequentially with no instruction to parallelize analysis across the (potentially many) cloned repos, even though nothing here is dependent — each repo's inventory row is independent.

**Priority:** Warning

**Recommendation:** `skills/explore/SKILL.md:73` — replace with an explicit agent-prompt template (context: repo + stack; task: populate one inventory row; write-set: none, read-set: repo root; quality bar: every table column filled or `—`), and instruct that repos be analyzed in parallel batches when 2+ related repos are cloned.

---

## auth-setup

**Strengths:** This and analytics-setup are the reference pattern cited in the audit brief — Step 0 resume gate, Step 1b WebFetch-verifies OAuth provider endpoints/scopes against live docs before templating (research integration done right), explicit Operational Readiness section with SLIs/failure-modes/rollback classification, minimum-test requirements baked into Step 14b.

**Gaps:** No material gaps found.

**Priority:** Note

---

## analytics-setup

**Strengths:** Same reference-quality pattern as auth-setup, plus a genuinely valuable design move: Step 3 forces an explicit event-plan review gate before any code is written, separating "what to measure" from "how to instrument." Step 4b WebFetch-verifies the PostHog capture API shape.

**Gaps:** No material gaps found.

**Priority:** Note

---

## compliance-setup

**Strengths:** Resume gate, Operational Readiness section, and an explicit IRREVERSIBLE annotation on the account-deletion route (SKILL.md:140-143) that correctly requires UI acknowledgement per `architecture.md`'s reversibility-premium guidance.

**Gaps:** Unlike its siblings (auth-setup Step 1b, payments-setup Step 2b, analytics-setup Step 4b), compliance-setup has no "verify against current docs" step for any of its four external integrations (Termly embed script, Canny SDK, SendGrid API, R2 presigned URLs) before templating them. Given Termly/Canny snippet formats and SendGrid API versions do drift, this is the one skill in the family that skips the doc-currency check its peers established as the pattern.

**Priority:** Warning

**Recommendation:** `skills/compliance-setup/SKILL.md` — add a Step 1b (mirroring `skills/auth-setup/SKILL.md:92-105`) that WebFetches current Termly embed docs, Canny SDK docs, and SendGrid v3 API docs before Step 3-4 template substitution.

---

## payments-setup

**Strengths:** Step 2b explicitly WebFetches Stripe's current Checkout Session/webhook-event/API-versioning docs before relying on templated shapes (SKILL.md:112-127) — correct research integration. Idempotency key (`stripe_checkout_session_id` unique constraint) is called out as load-bearing in Step 4 (SKILL.md:163-164). Operational Readiness section present.

**Gaps:** No material gaps found.

**Priority:** Note

---

## i18n-setup

**Strengths:** Explicitly documents the three-file sync hazard (`src/i18n/index.ts`, `scripts/translate.ts`, `scripts/i18n-audit.ts` must all track `NAMESPACES` together, SKILL.md:306-307) — a real footgun called out proactively. Resume gate, staged translation generation with an explicit "leave unchecked if API key missing" resumability nuance (SKILL.md:253-254).

**Gaps:** No "verify against current docs" step for the i18next API surface, unlike auth-setup/payments-setup/analytics-setup. Lower risk than compliance-setup's gap since i18next's core API is stable, but the family pattern is otherwise universal for external SDKs.

**Priority:** Suggestion

**Recommendation:** `skills/i18n-setup/SKILL.md` Step 4 (core i18n module) — add a one-line doc-currency check against the i18next/react-i18next migration guide before writing `src/i18n/index.ts`.

---

## testing-setup

**Strengths:** Correctly documents the Istanbul-over-v8 coverage choice with its rationale (v8 incompatible with Workerd, SKILL.md:14-15) inline rather than leaving it implicit. Conditional CI job removal (stripe-mock, i18n-audit, python-tests) driven cleanly off Step 1 answers.

**Gaps:** No material gaps found (Operational Readiness section correctly omitted — this skill produces dev tooling, not a runtime feature).

**Priority:** Note

---

## powerpoint-addin-setup

**Strengths:** Step 3's dev-cert explanation is unusually good failure-mode documentation — explicitly calls out that a missing trusted cert causes silent failure with no useful error ("the most common cause of 'my add-in won't load'", SKILL.md:130-132) and gives the reset procedure.

**Gaps:** (1) No Operational Readiness section, unlike auth/analytics/payments/compliance/i18n — yet this skill ships a production-facing surface (an Add-in loaded by real users) with its own failure modes (CDN-hosted `office.js` unavailable, stale sideloaded manifest, HTTPS cert expiry in production). (2) No doc-currency check against current Office Add-in manifest guidance — Microsoft has been migrating Office Add-ins toward a unified JSON manifest; this skill scaffolds only the legacy XML `manifest.xml` with no note on whether that's still the recommended path. Confidence: MEDIUM (based on general awareness of the Microsoft 365 unified-manifest push; not verified against current docs in this audit pass).

**Priority:** Suggestion

**Recommendation:** `skills/powerpoint-addin-setup/SKILL.md` — add an Operational Readiness section (CDN office.js unavailability, stale manifest after Cmd+Q-less reload, prod HTTPS cert rotation) and a Step 1b that WebFetches current Office Add-in manifest guidance to confirm XML manifest vs. unified JSON manifest is still correct for PowerPoint task panes.

---

## brand-knowvah

**Strengths:** Resume gate present. Clean conditional-adaptation logic based on which other setup skills have run (auth/compliance/analytics), correctly threading those flags through Sidebar/App.tsx/Layout adaptations.

**Gaps:** No material gaps found (Operational Readiness correctly omitted — pure branding/UI skill introduces no new failure modes beyond what auth/compliance already cover).

**Priority:** Note

---

## changelog-generator

**Strengths:** Clean Conventional-Commits type→category mapping, correct discard list (chore/refactor/test/ci/style/docs/build) to avoid internal noise in customer-facing output.

**Gaps:** No resume gate and no verification step, but the skill is a single-pass, low-cost text transform — proportionate to omit both.

**Priority:** Note

---

## commit

**Strengths:** Correctly scoped — explicit "never --no-verify," "never amend," "never commit secrets/binaries" boundaries; the `git status` check at the end verifies the commit landed (a small but real verification step other single-pass skills skip).

**Gaps:** No material gaps found.

**Priority:** Note

---

## file-organizer

**Strengths:** Requires explicit user confirmation before any destructive action (deletion, the full org plan). Duplicate-detection commands are cross-platform-aware (md5 vs md5sum).

**Gaps:** The only failure-handling instruction is "Stop and ask if you encounter unexpected situations" (SKILL.md:138) — no explicit handling for permission-denied, file-in-use, or destination-already-exists conflicts, and no post-move verification (e.g., confirming file count before/after matches, so a partial `mv` failure wouldn't be silently under-reported). "Log all moves for potential undo" (SKILL.md:135) is stated as a rule but no log format or location is specified, making the stated undo capability unverifiable.

**Priority:** Suggestion

**Recommendation:** `skills/file-organizer/SKILL.md:133-138` — specify a move-log file path and format, and add a post-execution verification step comparing pre/post file counts per target folder before reporting the summary.

---

## generate-question-bank

**Strengths:** Genuinely strong resumability — explicit `--resume` flag plus stale-state handling (`.batch-state.json` >24h → delete and restart, SKILL.md:82-86). Dry-run-first discipline before submitting to the Batch API. Traceability fields (`sourceQuote`, `sourceSection`, `source_citation`) on every generated question.

**Gaps:** No material gaps found.

**Priority:** Note

---

## internal-comms

**Strengths:** Correct fallback behavior when the `examples/` directory or communication type doesn't match a known format (SKILL.md:31-32) — asks rather than guessing.

**Gaps:** No material gaps found for its scope (a routing/format-lookup skill, not an orchestration skill).

**Priority:** Note

---

## video-downloader

**Strengths:** Sensible defaults (best quality, mp4, `~/Downloads/`), auto-installs yt-dlp if missing.

**Gaps:** No verification step anywhere — nothing confirms the downloaded file exists, is non-empty, or is playable after `download_video.py` exits. No documented failure path for common yt-dlp failure modes (geo-restriction, age-restriction, private/deleted video, format unavailable at requested quality). Contrast with doc-pdf/doc-docx's explicit "post-op verification — never declare success blind" pattern.

**Priority:** Suggestion

**Recommendation:** `skills/video-downloader/SKILL.md` (Quick Start section) — add a post-download check (`test -s <output_file>`) and document the expected yt-dlp error output for the 3-4 most common failure modes so the skill can report a specific cause rather than a bare command failure.

---

## webapp-testing

**Strengths:** Explicit anti-pattern callout (don't inspect DOM before `networkidle`, SKILL.md:86-89) — the kind of "ruled out" knowledge that prevents a common flaky-test mistake. Correct guidance to treat helper scripts as black boxes rather than reading them into context.

**Gaps:** No material gaps found.

**Priority:** Note

---

## doc-docx / doc-pdf / doc-pptx / doc-xlsx

**Strengths:** doc-pdf and doc-docx both instrument the "preflight → timeout-bound external call → post-op verification" triad explicitly (doc-docx SKILL.md:164-184, doc-pdf SKILL.md:30-65) citing `error-handling.md`'s external-call rule directly — the best-documented failure-handling of any skill in the repo. doc-xlsx's recalc.py error-classification (SKILL.md:248-262) gives structured, actionable error output. doc-pptx's validate.py-after-every-edit discipline (SKILL.md:179) is a strong verification loop.

**Gaps:** Inconsistent application of the "Model routing" boilerplate line: doc-pdf and doc-xlsx have it, doc-docx and doc-pptx don't. Since none of the four actually spawn subagents (see cross-skill finding below), this is cosmetic, not functional.

**Priority:** Note

---

# Cross-skill patterns

## 1. Vestigial "Model routing" boilerplate with no corresponding agent invocation (Warning)

At least 13 skills carry the line "Model routing: Sonnet for implementation; Haiku for verification/scoring; Opus only for explicit architectural decisions" at or near the top of SKILL.md, but never once invoke the Agent tool to spawn a subagent — every step is executed directly by the current session (Read/Write/Edit/Bash calls), so there is no model to route. Confirmed instances: `auth-setup/SKILL.md:10`, `analytics-setup/SKILL.md:10`, `compliance-setup/SKILL.md:8`, `payments-setup/SKILL.md:10`, `i18n-setup/SKILL.md:8`, `testing-setup/SKILL.md:10`, `powerpoint-addin-setup/SKILL.md:10`, `project-bootstrap/SKILL.md:10`, `sandbox/SKILL.md:13`, `file-organizer/SKILL.md:6`, `internal-comms/SKILL.md:7`, `video-downloader/SKILL.md:6`, `doc-pdf/SKILL.md:7`, `doc-xlsx/SKILL.md:7`. Skills that DO carry a real per-phase model table backed by actual Agent-tool spawns (self-improve, plan-mission, code-review, upgrade-deps, fix, explore, review-pr) are unaffected — the line is meaningful there. `brand-knowvah` and `testing-setup`'s sibling `doc-docx`/`doc-pptx` correctly omit it.

**Fix:** Either delete the line from the skills listed (a Claude Code session has one model for its lifetime; a skill that never spawns subagents cannot "route"), or — if the intent is to suggest the *invoking session* switch models before running the skill — replace it with a one-line note naming the appropriate model for manual `/model` selection, not a routing table implying per-step delegation.

## 2. No handling for an agent crashing/timing out mid-parallel-batch, as opposed to returning weak output (Warning)

self-improve (`SKILL.md:342-349,617`), code-review (`SKILL.md:341,358-362`), and project-bootstrap (`SKILL.md:145-151`, verify-failure only) all gate the next phase on "all N agents complete" but only self-improve's fetch-guard pattern handles a *thin/partial* response — none specify what happens if an agent simply never returns (process crash, tool error, timeout). This is the exact "unhandled failure path" class the audit brief calls out as the top finding category. Fix pattern: retry once per `retry-idempotency.md`, then proceed with the surviving agents and explicitly flag the gap in the phase's own output rather than silently presenting N-1 agents' findings as full coverage.

## 3. The -setup family never batches independent, non-dependent tool calls within a step sequence (Suggestion)

auth-setup, analytics-setup, payments-setup, compliance-setup, i18n-setup, testing-setup, powerpoint-addin-setup, and brand-knowvah are all written as strictly sequential Step 1→N lists. Several adjacent steps have no data dependency on each other (e.g. auth-setup Steps 6-7, "OAuth utilities" and "Auth middleware," both say "No adaptation needed" and read/write entirely separate files) yet are presented as sequential rather than batchable in one turn, contrary to `parallelism.md`'s "if subtasks don't share write targets and don't depend on each other's output, run them in parallel" default. Low individual impact (a few extra tool round-trips per skill run), but present across 8 skills. Not worth restructuring every step list — flagging so a future pass can mark genuinely-independent step pairs as "may run together" where it's unambiguous.

## 4. Research-integration ("verify against current docs") step is inconsistently applied within the -setup family (Suggestion)

auth-setup (Step 1b), payments-setup (Step 2b), and analytics-setup (Step 4b) each WebFetch current provider docs before templating external-API-shaped code. compliance-setup (4 external integrations: Termly, Canny, SendGrid, R2) and i18n-setup (i18next) have no equivalent step, despite the pattern being well-established by their siblings. See per-skill findings above for the concrete fix in each case.
