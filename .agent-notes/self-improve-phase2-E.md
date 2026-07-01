# Self-Improve Phase 2 — Agent E: Skills Quality Audit

Scope: all 28 `SKILL.md` under `~/.claude/skills/` (read in full).
Dimensions: completeness, model routing, research integration, verification,
agent-prompt quality, parallelism, resumability, operational readiness.
All read-only. Findings below; pad-free — only real gaps reported.

**Correction to prior-run notes:** The claim that code-review, review-pr,
upgrade-deps, self-improve, and explore lack resumability is STALE. All five now
have a resume gate (verified this run). See per-skill entries.

---

## Per-skill findings

### analytics-setup
**Strengths:** Strong upfront event-plan-then-implement design; reads actual
routes/pages before planning; write-tests step; Operational Readiness block
(SLIs, failure modes, rollback class); verify includes `tsc --noEmit`.
**Gaps:**
- No Step 0 resume gate. Multi-step skill (14 steps) with no progress file —
  if interrupted mid-implementation it re-asks all of Step 1 and re-derives the
  plan. Inconsistent with the 5 sibling setup skills that all resume.
- No research integration: instruments PostHog but never checks current PostHog
  SDK/capture API or Cloudflare Workers fetch-keepalive best practice via
  WebSearch/WebFetch. Allowed-tools omits WebSearch/WebFetch.
**Priority:** Warning (resume), Suggestion (research).
**Specific recommendation:** Add a `## Step 0 — Resume check` block mirroring
`payments-setup/SKILL.md:22-43` writing `.analytics-setup-progress.md`; add
WebSearch/WebFetch to `allowed-tools` (line 5) and a one-line "verify current
posthog-js capture signature" check in Step 5.

### auth-setup
**Strengths:** Operational Readiness with concrete SLI targets + failure modes +
rollback class (lines 345-358); write-tests (Step 14b); verify with `tsc`.
**Gaps:**
- No Step 0 resume gate despite 15 sequential steps each touching DB/secrets.
  Inconsistent with payments/testing/i18n/compliance/bootstrap.
- No research integration: OAuth provider endpoints/scopes (LinkedIn especially
  churns) are hardcoded in templates with no WebFetch verification of current
  authorize/token URLs or scope names.
**Priority:** Warning (resume), Suggestion (research).
**Specific recommendation:** Add resume gate writing `.auth-setup-progress.md`
with the 15 steps as checkboxes; add a Step 2.5 "verify provider OAuth endpoints
against current docs" using WebFetch for any provider chosen.

### brand-knowvah
**Strengths:** Full resume gate (lines 20-34); verify with `tsc` + interactive
checks; clean per-step checkbox discipline.
**Gaps:**
- No model routing table (only the one-line generic banner).
- No operational readiness — acceptable, it is pure visual/frontend scaffolding
  with no new runtime failure modes.
**Priority:** Note.
**Specific recommendation:** None material; the generic routing line suffices for
a single-surface frontend skill.

### changelog-generator
**Strengths:** Model routing table; clear scope/filter phases.
**Gaps:**
- No handling for "not a git repo" / "no tags exist" — `git describe --tags`
  fails with no tags and the skill gives no fallback (should fall back to full
  history or first commit).
- No verification that the produced changelog covers all kept commits (could
  silently drop a feat).
**Priority:** Suggestion.
**Specific recommendation:** In Phase 1 add: "if `git describe --tags` exits
non-zero, fall back to `git log --oneline` from the root commit and note no tags
were found." Add a Phase 4 self-check: kept-commit count == changelog bullet
count.

### code-review
**Strengths:** Resume gate (Step 0, `/tmp/code-review-findings.md`); full model
routing (Sonnet reviewers, Haiku dedup+scoring); research integration (Agents 2
& 5 use WebSearch/WebFetch for CVEs/versions); strong operational-readiness
Agent 11; output-only discipline; confidence scoring + verdict.
**Gaps:**
- Routing table omits the Final-report/verdict synthesis step's model (runs
  inline on the orchestrator; unstated).
- Parallelism is well-batched already (11 agents simultaneous).
**Priority:** Note.
**Specific recommendation:** Add a routing-table row: "Final report + verdict →
orchestrator (Opus if >20 findings, else inline)."

### commit
**Strengths:** Tight, single-purpose, `disable-model-invocation: true` (correct —
not auto-invoked); good safety rules (no --no-verify, no secrets, specific adds).
**Gaps:** None material. No resume needed (atomic). No model routing needed
(trivial). Appropriately minimal.
**Priority:** Positive.

### compliance-setup
**Strengths:** Resume gate; write-tests step; Operational Readiness with mixed
rollback classification and explicit IRREVERSIBLE marker on account deletion
(lines 140-144, 361); verify with `tsc`+build; idempotent migrations.
**Gaps:**
- The irreversible DELETE path is documented but verify (Step 7) does not
  require a test proving the UI acknowledgement gate exists before the endpoint
  is reachable — the on-call note exists but isn't enforced.
**Priority:** Suggestion.
**Specific recommendation:** Add to Step 6b write-tests: "assert DELETE /api/me
returns 4xx unless an explicit confirmation token/flag is present" so the
irreversible-action guard is verified, not just documented.

### doc-docx
**Strengths:** Clear decision tree; redlining workflow with minimal-edit
principle; mandatory final verification via pandoc + grep (lines 143-153);
batching strategy; dependency list with install commands.
**Gaps:**
- No model routing (no banner at all — unlike most skills).
- No behavior spec if pandoc/LibreOffice/soffice is absent beyond "install" —
  no check-then-fallback, and `soffice` headless can hang with no timeout.
**Priority:** Suggestion.
**Specific recommendation:** Add a preflight `command -v pandoc soffice ||`
install-or-stop check, and wrap `soffice --headless` conversions with a timeout.

### doc-pdf
**Strengths:** Comprehensive operation coverage; quick-reference table; OCR and
forms paths.
**Gaps:**
- Generic routing banner but no per-task routing.
- No verification step — e.g., after merge/split, no assertion that output page
  count == sum of inputs; after form-fill, no read-back check.
- No tool-absence handling (pytesseract, poppler) beyond inline pip comments.
**Priority:** Suggestion.
**Specific recommendation:** Add a short "Verify" section: after any write
operation, reopen the output with pypdf and assert page count / field values.

### doc-pptx
**Strengths:** Best verification of the doc family — visual thumbnail validation
loop (lines 161-169) and `validate.py` after each XML edit (line 179); template
inventory discipline; replace.py validates shape existence and overflow.
**Gaps:**
- No model routing banner at all.
- Heavy MANDATORY-read-entire-file directives (html2pptx.md, ooxml.md) with no
  guard if those files are missing (only doc-pptx notes a `find` fallback for
  unpack.py, not for the .md references).
**Priority:** Note.
**Specific recommendation:** Add the standard routing banner; add a "if
html2pptx.md/ooxml.md not found, stop and report" guard alongside the existing
unpack.py fallback note.

### doc-xlsx
**Strengths:** Mandatory recalc + zero-error gate (lines 14-15, 136-148);
formula-not-hardcode rule; verification checklist; interprets recalc.py JSON
errors.
**Gaps:**
- Generic routing banner only.
- recalc.py depends on LibreOffice with no absence/timeout handling (a hung
  soffice macro blocks indefinitely — the skill takes an optional timeout arg
  but doesn't instruct using it defensively).
**Priority:** Suggestion.
**Specific recommendation:** Instruct always passing the timeout arg to recalc.py
and a `command -v soffice` preflight.

### explore
**Strengths:** Resume gate (Step 0, checks `docs/architecture/overview.md`);
model routing table (sonnet analysis, haiku dedup); research integration
(tech-health.md uses WebSearch + NVD/OSV for EOL/CVEs); `context: fork`.
**Gaps:**
- Clones sibling repos with `gh repo clone` but no provenance/size guard and no
  handling for clone failure (private/archived repo) — should skip-and-note, not
  abort.
- No verification that produced Mermaid diagrams parse (invalid Mermaid renders
  blank).
**Priority:** Suggestion.
**Specific recommendation:** Wrap clone in failure-tolerant logic ("on clone
failure, record repo as inaccessible and continue"); add a Mermaid lint pass or
note in Finish that diagrams should be visually confirmed.

### file-organizer
**Strengths:** Plan-before-execute; confirm-before-delete; cross-platform md5
handling; dry-run-style plan presentation.
**Gaps:**
- Destructive (mv/rm across the home folder) with NO resume/undo-log mechanism —
  rules say "Log all moves for potential undo" but no concrete move-log file is
  specified, so a mid-run interruption leaves a half-moved tree with no record.
- No model routing beyond banner.
**Priority:** Warning (operational safety).
**Specific recommendation:** Mandate writing an append-only `move-log.tsv`
(`old\tnew\ttimestamp`) before each batch of moves, and document the inverse
command to replay it — this is the resumability/rollback story for a destructive
skill.

### fix
**Strengths:** Model routing table; bounded loop (5 iters) with same-error vs
different-error branching; re-diagnose on stuck; full-suite regression check
(Phase 4); strong rules (no skip/xfail, minimum-change).
**Gaps:**
- No resume gate — a 5-iteration loop that's interrupted restarts from baseline.
  Lower stakes than setup skills but still re-runs the suite and re-diagnoses.
- Debugger/agent prompts reference parallelism.md structure but don't enumerate
  write-set/read-set inline for the language-agent in Phase 3 Step A beyond
  "files identified by debugger."
**Priority:** Suggestion.
**Specific recommendation:** Optional progress note (last error + changes-so-far)
to `/tmp/fix-progress.md` after each iteration so a resumed run can continue.

### generate-question-bank
**Strengths:** Has resume (`--resume`), stale-state handling (>24h), dry-run-
first, single-chapter test path, output verification step, commit step.
Domain-appropriate.
**Gaps:**
- No model routing banner (the heavy lifting is in the Python script via Batch
  API, so largely N/A — but the skill itself never states Sonnet-vs-Haiku for
  its own orchestration).
- No handling if the Python script or `import-pressbook.js` is absent.
**Priority:** Note.
**Specific recommendation:** Add a one-line preflight: "if
scripts/generate-question-bank.py not found, stop and report."

### i18n-setup
**Strengths:** Resume gate; keeps NAMESPACES in sync across 3 files (explicit);
verify via `i18n:check` + `tsc`; failure policy; Claude-powered translate script;
graceful skip when ANTHROPIC_API_KEY absent.
**Gaps:**
- **Missing Operational Readiness section** — the only setup skill among
  testing/auth/payments/compliance/analytics that wires a backend route
  (`PATCH /api/me/language`, Step 8) yet has no SLI/failure-mode/rollback block.
  Inconsistent with siblings.
- No write-tests step for the backend language endpoint (auth/payments/
  compliance/analytics all have one).
**Priority:** Warning (consistency + the backend route is untested/unmonitored).
**Specific recommendation:** Add a `## Operational Readiness` block (rollback:
Reversible; SLI: language-persist success rate) and a write-tests step for
`PATCH /api/me/language` (happy path + auth rejection), matching the sibling
template.

### internal-comms
**Strengths:** Correct dispatch-to-guideline-file design; explicit fallback when
`examples/` missing or type unmatched (lines 32-33).
**Gaps:** None material — content skill, no code/architecture, so verification/
operational-readiness/parallelism are N/A by design.
**Priority:** Positive.

### payments-setup
**Strengths:** Best-in-class — resume gate with input persistence + step-fail-
stop policy; write-tests incl. idempotency; verify with `tsc` + 7 behavioral
checks; Operational Readiness with reversible-with-migration class; pins Stripe
API version to installed package.
**Gaps:**
- No research integration: hardcodes Stripe API version from package.json (good)
  but never WebFetches Stripe's current Checkout/webhook best practices; minor
  given version pinning.
**Priority:** Note.
**Specific recommendation:** None required; this skill is the template the others
should match.

### plan-mission
**Strengths:** Exemplary operational readiness (Phase 4: SLIs, alert thresholds,
rollback classification with Irreversible acknowledgement, scalability envelope,
on-call story, backwards-compat); system-first blast-radius (Phase 2); full
model routing table with Opus brevity constraints (arxiv:2604.00025); per-task
agent specs include observability + rollback; Phase 8 pre-flight gate; document
hygiene rules.
**Gaps:**
- No resume gate of its own — but it produces a resumable brief and its phases
  are user-gated checkpoints, so mid-run resumability is inherent. Acceptable.
**Priority:** Positive. This is the gold standard for operational readiness.

### powerpoint-addin-setup
**Strengths:** Resume gate; verify with `tsc` + build + sideload checks; failure
policy; excellent failure-mode coverage (the HTTPS-cert gotcha that "everyone
forgets," wef sync, Cmd+Q quirk); generated onebox.sh uses `set -euo pipefail`.
**Gaps:**
- No write-tests step (acceptable — add-in scaffolding is config/HTML entry
  points, little testable logic).
- No model routing table beyond banner.
**Priority:** Note.
**Specific recommendation:** None material.

### project-bootstrap
**Strengths:** Resume gate with input persistence; dependency-ordering table;
warns (not silently adds) missing dependency skills; per-sub-skill verify-or-stop
gate; collects all inputs upfront.
**Gaps:**
- Delegates operational readiness to each sub-skill, so it inherits the
  i18n-setup gap (no OR section) — but bootstrap itself is correct.
**Priority:** Note.
**Specific recommendation:** None at this level; fix i18n-setup.

### review-pr
**Strengths:** Resume gate (Phase 0); delegates review to /code-review (model
routing inherited); single-API-call posting; never auto-submits; PR-level
fallback for out-of-diff findings; position-mapping is mechanical/inline.
**Gaps:**
- No `gh` rate-limit/retry handling — a 5xx or 403 on the metadata or files API
  aborts with no retry, contradicting `rules/retry-idempotency.md` (retry 5xx,
  honor 429 Retry-After).
**Priority:** Suggestion.
**Specific recommendation:** Wrap the `gh api` calls (Phases 1-2, 5) in a
retry-with-backoff per retry-idempotency.md (3 attempts, skip 4xx except 429).

### sandbox
**Strengths:** Resume via persistent named Docker volume (Phase 6, documented in
Notes); validates Keychain secrets up front and stops with fix commands; secrets
never written to disk/image; per-phase stop-on-failure; redacts secrets in
printed run command.
**Gaps:**
- No model routing relevance (it launches Claude Code in a container) — banner is
  vestigial but harmless.
- No verification that the container's Claude run actually progressed (Phase 8
  only checks exit code + tails log) — a 0 exit with no work done isn't detected.
**Priority:** Note.
**Specific recommendation:** None material; exit-code + log tail is reasonable
for a sandbox harness.

### self-improve
**Strengths:** Most sophisticated skill — multi-phase resume gate (Phase 0 with
per-phase `done` markers); full agent-prompt quality (Agents A-H each get
context/task/read-set/output-format); research integration (tiered sources,
fetch guards, provenance + injection-scan gates on clones); model routing in
Rules (Opus for synthesis >20 findings); convergence alarm; dedup + scoring;
URL-registry staleness decay.
**Gaps:**
- Agent prompts are read-only research/audit, so write-set/interface-contract
  sections are intentionally absent — appropriate, not a gap.
- Phase 1/2 agents could note model assignment explicitly (currently implied
  Sonnet); minor.
**Priority:** Positive.

### testing-setup
**Strengths:** Resume gate; verify-or-stop failure policy; verify runs lint +
format + test + coverage + `tsc`; bootstrap test file prevents empty-suite CI
fail; idempotent merges into existing configs; offers commit with push-gated.
**Gaps:**
- No Operational Readiness section — defensible since it scaffolds test
  infra, not a runtime feature; no SLIs apply.
**Priority:** Note.
**Specific recommendation:** None material.

### upgrade-deps
**Strengths:** Resume gate with saved-state extraction; parallel research
(dependency-manager + security-auditor); research integration via those agents;
language-agent prompts have write-set/read-set/quality-bar; bounded review loop
(4 iters) with recurring-finding stop rule; hands off to /plan-mission for
complex upgrades; monorepo conflict resolution; per-phase progress marks.
**Gaps:**
- Strong overall. Minor: Phase 5 launches language agents in parallel but the
  prompt template (Phase 4) doesn't include the architecture-decisions section
  from parallelism.md (it has context/task/write-set/read-set/quality-bar but no
  "locked decisions" tier).
**Priority:** Suggestion.
**Specific recommendation:** Add an "Architecture decisions (locked)" line to the
Phase 4 prompt template, e.g. "do not change the build tool or test framework;
upgrade in place."

### video-downloader
**Strengths:** Simple, single-purpose; delegates to a Python script + yt-dlp;
auto-installs; playlist guard.
**Gaps:** Generic routing banner is vestigial (all work is in the script). No
verification that the download succeeded (file exists, non-zero size). Minor.
**Priority:** Note.
**Specific recommendation:** Add "after download, confirm the output file exists
and is non-empty" to the script-invocation guidance.

### webapp-testing
**Strengths:** Decision tree (static vs dynamic, server running or not);
black-box helper-script discipline to protect context; networkidle pitfall
called out; reconnaissance-then-action pattern; examples referenced.
**Gaps:**
- No model routing banner.
- No handling if Playwright/chromium install fails (only "pip install" given).
**Priority:** Note.
**Specific recommendation:** None material; add a one-line install-failure note.

---

## Cross-skill patterns

### CP-1 (Warning) — Inconsistent resumability across multi-step skills
6 setup-style skills resume (payments, testing, i18n, compliance, brand-knowvah,
powerpoint-addin, project-bootstrap) plus code-review/review-pr/upgrade-deps/
self-improve/explore. But **analytics-setup and auth-setup have NO resume gate**
despite being 14-15-step DB/secret-touching skills in the same family. `fix`
(5-iter loop) and `file-organizer` (destructive moves) also lack any progress/
undo record. Fix: add the standard `## Step 0 — Resume check` +
`.<skill>-progress.md` block (template at payments-setup/SKILL.md:22-96) to
analytics-setup and auth-setup; add a move-log to file-organizer.
Confidence: High.

### CP-2 (Warning) — Operational-readiness coverage is uneven
plan-mission and the setup skills auth/payments/compliance/analytics each carry
an Operational Readiness block (SLIs, failure modes, rollback class).
**i18n-setup is missing it despite shipping a backend route**, and several
code-driving skills lack it where it would apply. testing-setup/brand-knowvah/
powerpoint omitting it is defensible (no runtime feature). Fix: add the OR block
to i18n-setup; adopt a rule that any skill writing a backend route or migration
must include SLIs + rollback classification. Confidence: High.

### CP-3 (Suggestion) — Research integration is thin in setup skills
code-review, upgrade-deps, explore, and self-improve actively WebSearch/WebFetch
current versions/CVEs/best-practices. The implementation setup skills (auth,
payments, analytics) hardcode third-party API surfaces (OAuth endpoints/scopes,
Stripe flows, PostHog capture API) in templates with no "verify against current
docs" step, and most omit WebSearch/WebFetch from allowed-tools. Fastest-drifting
surfaces (OAuth provider endpoints) are the riskiest. Fix: add a one-line
"verify current <provider> API surface via WebFetch" check to auth-setup (Step
2.5) and analytics-setup, and add WebSearch/WebFetch to their allowed-tools.
Confidence: Medium.

### CP-4 (Suggestion) — Verification quality varies in the doc family
doc-pptx is exemplary (validate.py per edit + thumbnail visual loop) and doc-xlsx
strong (mandatory recalc + zero-error gate). doc-pdf and doc-docx have NO
post-operation verification (no page-count assertion after merge/split, no
read-back after form-fill or redline). Fix: add a "Verify" section to doc-pdf and
strengthen doc-docx's existing final-verify to a hard grep gate; both already
have the pattern to copy from doc-pptx/doc-xlsx. Confidence: High.

### CP-5 (Suggestion) — External-tool absence and hangs unguarded in doc skills
doc-docx/doc-pdf/doc-pptx/doc-xlsx depend on soffice/LibreOffice, pandoc,
poppler, pytesseract with only inline "install if missing" comments — no
`command -v` preflight and no timeout on `soffice --headless` (which can hang
indefinitely, violating rules/error-handling.md "every external call needs a
timeout"). Fix: add a shared preflight + always-timeout convention for soffice
invocations. Confidence: Medium.

### CP-6 (Suggestion) — `gh`/network calls lack retry per retry-idempotency.md
review-pr and explore issue `gh api` / `gh repo clone` calls that abort on
transient 5xx/network failures. rules/retry-idempotency.md mandates retry on 5xx
and honoring 429 Retry-After. Fix: wrap gh API calls in 3-attempt backoff,
skipping 4xx except 429. Confidence: Medium.

### CP-7 (Note) — Vestigial generic routing banner
Many skills carry the literal line "Model routing: Sonnet for implementation;
Haiku for verification/scoring; Opus only for explicit architectural decisions"
even when the skill spawns no sub-agents and does all work in a Python script
(video-downloader, generate-question-bank, sandbox, file-organizer). It is
harmless but adds no signal. Skills that DO fan out (code-review, fix, explore,
changelog, upgrade-deps, plan-mission) have real per-step routing tables — the
correct pattern. Fix (optional): drop the banner where no routing decision
exists, or replace with "Single-step skill — no model routing." Confidence: High.
