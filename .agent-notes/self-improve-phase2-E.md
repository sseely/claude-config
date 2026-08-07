# Self-Improve Phase 2 — Agent E: Skills Quality Audit

Date: 2026-08-01. Scope: all 28 `skills/*/SKILL.md` + `references/`
subdirectories (`code-review/references/`, `plan-mission/references/`).
Read `rules/parallelism.md` and `rules/observability.md` first per
instructions. Cross-checked `git log --oneline -30 -- skills/` before
flagging anything, to avoid re-flagging the 2026-07-24 remediation pass
(resume gates added to analytics-setup/auth-setup/compliance-setup/
payments-setup/i18n-setup/testing-setup/powerpoint-addin-setup/
brand-knowvah/project-bootstrap/sandbox; verify-docs steps added to
analytics-setup/auth-setup/compliance-setup/payments-setup; model-routing
lines stripped from 13 non-orchestrating skills in d74fad3; fix.md got a
one-line-mechanism requirement in 7db4795; plan-mission got a resume gate
in 4fc3b22; doc-pdf got preflight/timeout/verification in 5d2011a).

Most skills are clean — this pass caught what survived remediation.
Skills not listed below (analytics-setup, auth-setup, code-review, commit,
compliance-setup, doc-docx, doc-pdf, doc-xlsx, explore, fix,
generate-question-bank, i18n-setup, payments-setup, plan-mission, review-pr,
sandbox, self-improve, testing-setup, upgrade-deps, webapp-testing) had no
finding worth recording — clean.

---

### changelog-generator
- **Strengths**: clean phase structure, sensible Conventional-Commits
  filtering, one-line-per-change translation guidance.
- **Gaps**: `skills/changelog-generator/SKILL.md:13-20` carries a "Model
  Routing" table (Phase 3 → sonnet, Phase 4 → sonnet) plus the line "This
  skill runs inline (no sub-agents); routing applies if agents are spawned
  for large commit volumes." The skill never invokes the Agent tool — no
  `allowed-tools: Agent`, no agent dispatch anywhere in the 5 phases. This
  is exactly the vestigial-routing pattern that commit `d74fad3` stripped
  from 13 other skills on 2026-07-24, but changelog-generator was not in
  that commit's file list and was missed.
- **Priority**: Warning
- **Recommendation**: Delete lines 13-20 (the "## Model Routing" section),
  matching the treatment already applied to analytics-setup, auth-setup,
  doc-pdf, doc-xlsx, file-organizer, i18n-setup, internal-comms,
  payments-setup, powerpoint-addin-setup, project-bootstrap, sandbox,
  testing-setup, video-downloader.
- **Confidence**: 90

### doc-pptx
- **Strengths**: strong template-driven workflow (thumbnail grids,
  inventory/replace validation scripts catch bad shape references before
  they corrupt output).
- **Gaps**: `skills/doc-pptx/SKILL.md:444-453` ("Converting Slides to
  Images") shells out to `soffice --headless --convert-to pdf` and
  `pdftoppm -jpeg -r 150` with no `command -v` preflight check, no
  `timeout` wrapper, and no post-op verification that the PDF/JPEGs were
  actually produced. The sibling skill `doc-docx/SKILL.md:164-184`
  ("Converting Documents to Images") uses the *identical* soffice→pdftoppm
  pipeline and has all three safeguards (preflight, `timeout 120`,
  `test -s`/`ls` verification per `error-handling.md`'s external-call
  rule). `doc-pdf/SKILL.md:28-63` was given the same treatment in commit
  `5d2011a`. doc-pptx uses the exact same external tools for the exact
  same conversion and was not covered by either remediation.
- **Priority**: Warning
- **Recommendation**: Port the preflight/timeout/verification block from
  `doc-docx/SKILL.md:164-184` into doc-pptx's "Converting Slides to
  Images" section (same two binaries: soffice, pdftoppm).
- **Confidence**: 75

### video-downloader
- **Strengths**: simple, well-scoped CLI wrapper; sensible defaults.
- **Gaps**: no verification step after `download_video.py` runs — no
  check that the output file exists/is non-empty, and no documented
  handling for the common yt-dlp failure modes (age-restricted, private,
  geo-blocked, deleted video). A failed download and a successful one
  produce the same "done" narrative from the skill's perspective. No
  resumability for interrupted large downloads either (contrast with
  `generate-question-bank`'s explicit `--resume` flag for its own
  long-running operation).
- **Priority**: Suggestion
- **Recommendation**: Add a post-download check (file exists, size > 0)
  and a short troubleshooting list mapping yt-dlp's common error strings
  to user-facing guidance.
- **Confidence**: 60

### file-organizer
- **Gaps**: "Execute Organization" step only says "Log all moves for
  potential undo" with no defined log format or undo mechanism, and no
  resumability if interrupted mid-batch (partial moves, no marker of what
  completed). Low severity given this is a personal-file utility, not a
  production/code skill.
- **Priority**: Suggestion
- **Confidence**: 40

### project-bootstrap
- **Gaps**: `skills/project-bootstrap/SKILL.md:92-98,135-150` — the skill's
  own dependency table (Step 3) states `testing-setup` and `i18n-setup`
  each require "nothing," yet Step 5 mandates strictly sequential
  execution ("Do not interleave steps from different skills") for every
  selected sub-skill. Since project-bootstrap runs sub-skill steps inline
  rather than via the Agent tool, there's no multi-agent write-conflict
  risk to justify serializing two skills with no declared dependency on
  each other and non-overlapping file footprints (test infra vs. locale
  files).
- **Priority**: Suggestion
- **Recommendation**: Either note explicitly why strict sequencing was
  chosen (e.g. easier resume/checkpoint semantics) or allow
  no-dependency skills to run as parallel Agent dispatches.
- **Confidence**: 55

### brand-knowvah
- **Gaps**: unlike sibling production skills (auth-setup, payments-setup,
  compliance-setup, analytics-setup, i18n-setup — each has an explicit
  "Write tests" step before Verify), brand-knowvah's Step 16 ("Verify")
  is `tsc --noEmit` plus manual UI checks (toggle dark mode, resize,
  click hamburger) with no automated test coverage of ThemeContext's
  conditional logic (OS-aware theme resolution, auth-gated custom prefs,
  localStorage persistence) or Sidebar's conditional rendering
  (credits badge, admin section).
- **Priority**: Suggestion
- **Confidence**: 65

---

## Cross-skill patterns

### Pattern 1 — Inconsistent "verify against current docs" coverage within one skill family
**Skills affected**: testing-setup, i18n-setup, powerpoint-addin-setup (gap) vs.
analytics-setup, auth-setup, compliance-setup, payments-setup (have it).

All seven are Cloudflare-Workers-project scaffolding skills from the same
family, sharing the resume-gate/progress-file pattern. Four of them
(analytics-setup Step 4b, auth-setup Step 1b, compliance-setup Step 1b,
payments-setup Step 2b) added an explicit "WebFetch the current docs and
confirm the endpoint/param/scope names the templates use" step during the
2026-07 remediation pass, because the external API surfaces they template
against (PostHog capture API, OAuth provider endpoints, Termly/Canny/
SendGrid/R2, Stripe) drift over time. testing-setup (vitest-pool-workers
config surface), i18n-setup (i18next init/config API), and
powerpoint-addin-setup (Office Add-in manifest schema, office-addin-dev-certs
CLI surface) template against equally driftable external surfaces but
never got the same treatment — this is the same fix pattern the sibling
skills already prove out, just not propagated to the remaining three.
**Recommendation**: Add a lightweight "verify against current docs" step
to testing-setup (vitest-pool-workers), i18n-setup (i18next), and
powerpoint-addin-setup (Office Add-in manifest / dev-certs) mirroring the
Step-1b/2b/4b pattern already used in the other four.
**Confidence**: 68

### Pattern 2 — Resumability, model routing, and verification are otherwise consistently applied
Not a gap — noted for completeness. Resume gates
(`.{skill}-progress.md` + Step 0 check), `tsc --noEmit` before other
verification, and "stop on first verify failure, don't cascade" are
applied uniformly across all scaffolding skills that have write-sets. The
2026-07-24 remediation pass (resume gates, model-routing strip, verify-docs
steps) was executed thoroughly; findings in this pass are the residue it
missed, not evidence of a systemic gap.
