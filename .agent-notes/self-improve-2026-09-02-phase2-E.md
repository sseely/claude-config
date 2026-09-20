# Phase 2 — Agent E: Skills quality audit

Scope: all `skills/*/SKILL.md` + linked `references/*.md` (25 skills, excl.
`doc-docx/doc-pdf/doc-pptx/doc-xlsx` per instructions — confirmed to exist;
gitignore status checked, see Cross-skill patterns). Read-only.

## doc-* gitignore status (pre-check, not a skill audit)
`doc-docx` and `doc-pptx` are untracked/ignored as `.gitignore:50-51` intends.
`doc-pdf` and `doc-xlsx` are **tracked in git** (`git ls-files skills/doc-pdf
skills/doc-xlsx` returns files) despite matching `.gitignore:49,52` —
gitignore only blocks *new* untracked paths, it does not un-track existing
ones. Severity: Critical, confidence 90. `.gitignore` header at line 47-48
states these are "Anthropic-proprietary... no redistribution" — two of the
four are committed anyway. Fix: `git rm -r --cached skills/doc-pdf
skills/doc-xlsx` and commit. This also invalidates the assumption in
`skills/self-improve/references/phase0-recall.md:72-73` ("gitignored —
.mcp.json, .claude/, the Anthropic-proprietary skills/doc-*") — two of four
are not actually gitignored in practice; fix that file's wording to name
only the two that are.

## Per-skill findings

**analytics-setup** — Strengths: resumability (progress file), Step 4b docs
re-verification, Operational Readiness section, tests step. Gaps: no model
routing anywhere in the file (Suggestion, confidence 70, see cross-skill).
Priority: Low. Fix: add a one-line model note (Sonnet for implementation).

**auth-setup** — same strengths as analytics-setup; same model-routing gap.
Priority: Low.

**brand-knowvah** — Strengths: resumability, staged verify (Step 16, stop-on-
tsc-failure policy). Gaps: no Operational Readiness (acceptable — pure
frontend skin, not a service boundary); no model routing. Priority: Low.

**changelog-generator** — Strengths: simple, clear phase structure. Gaps: no
resumability (89-line skill, low risk); no handling for empty commit range
between tags (Suggestion, `changelog-generator/SKILL.md:13-22`, confidence
60, fix: "if no commits in range, report and stop" line). Priority: Low.

**commit** — Gaps: SKILL.md:14-17 fully restates `rules/commits.md`'s
format spec verbatim rather than linking. See Rule-consistency section.
Priority: Med.

**internal-comms** — Strengths: clean fallback logic when guideline missing.
No gaps found.

**code-review** — Strengths: model routing table, resume checkpoint, agent-
crash handling, 11-checklist/11-agent count match, eval harness (first in
repo, documented rationale). Gaps: verdict table `SKILL.md:203-204` —
`APPROVE` requires `Warning = 0` and `APPROVE WITH NITS` requires
`Warning < 3` with no lower bound, so `Warning = 0` satisfies both rows
simultaneously (ambiguous verdict at the boundary). Severity: Warning,
confidence 85. Fix: change line 204 to `Critical = 0 AND 1 ≤ Warning < 3`,
matching the correct form already used independently in
`skills/self-improve/references/output-formats.md:24`. Priority: Med.

**compliance-setup** — Strengths: resumability, Step 1b docs verification,
Operational Readiness section. No significant gaps.

**explore** — Strengths: retry-idempotency citation (line 51) correctly
links to `rules/retry-idempotency.md` with an accurate short paraphrase (max
3 attempts, exponential backoff) instead of restating the full policy — good
pattern. Gaps: line 8 duplicates the Model Routing table at lines 12-18
verbatim in prose (see cross-skill pattern). No Operational Readiness
(acceptable — produces docs, not shipped code). Priority: Low.

**file-organizer** — Gaps: (1) no resumability/undo-log despite performing
destructive `mv`/delete operations on the user's real filesystem — if
interrupted mid-plan, no record of what moved (Warning, confidence 60,
`file-organizer/SKILL.md:119-136`, fix: write a manifest of planned/executed
moves before starting, e.g. `.file-organizer-log.md`). (2) The skill's own
"always ask before deleting" policy (line 71, 132) is weaker than the
harness-level Prohibited-actions rule against permanently deleting data —
worth an explicit line directing users to delete manually rather than
implying Claude may do it with confirmation (Note, confidence 50). Priority:
Med.

**fix** — Strengths: model routing, phase gate on diagnosis completeness (no
guessed cause), same-error vs different-error branching, escalation after 5
iterations. Diagnosis-artifact fields (line 41-45) are a short field-name
mnemonic tied to an explicit citation of `rules/diagnosis.md`, not a
restatement — no drift. No gaps of note.

**forge-app** — Strengths: explicitly delegates domain knowledge to the
`forge-app-developer` agent specifically to prevent drift ("one copy... The
knowledge lives in the agent, not here" — a good anti-restatement pattern
worth citing as a model for other skills). Gaps: no Operational Readiness
section despite deploying to a live Atlassian site (Suggestion, confidence
40 — Forge has its own platform ops model, lower priority than the *-setup
skills). Priority: Low.

**generate-question-bank** — Strengths: resume via `--resume`/batch-state
file, single-chapter test path, output verified via `--dry-run` first. Gaps:
model use (`haiku-batch`, line 114) is only visible in the JSON output
schema, not stated as skill-level "Model Routing" guidance like other
orchestration skills (Note, confidence 40). Priority: Low.

**i18n-setup** — Strengths: resumability, Step 1b docs verification, staged
verify with explicit stop-on-failure policy, Operational Readiness section
for the language-preference endpoint. Description's "NAMESPACES in sync
across all three files" claim verified accurate (Step 4's `i18n/index.ts`,
Step 7's `i18n-audit.ts` and `translate.ts` — no drift found).

**payments-setup** — Strengths: resumability, Step 2b docs verification,
webhook idempotency test explicitly written into the test plan, Operational
Readiness. No significant gaps.

**plan-mission** — Strengths: resumability mirrors self-improve's Phase 0
pattern (cited explicitly), Operational Readiness baked into Phase 4,
Model Routing table with a correctly-caveated arxiv preprint citation
(labeled "not peer-reviewed", per `research-sources.md` tier-4 rule — good
example). Gaps: the progress-file template (`SKILL.md:47-69`) tracks phases
1 through 7 only (`## Phase 7: done`), but line 71 says "Delete
`.plan-mission-progress.md` once Phase 8 passes" and Phase 8 (Pre-flight
check, line 307) is a real gated phase with its own checklist. A resumed run
has no template line to record Phase 8's status. Severity: Warning,
confidence 75. Fix: add `## Phase 8: done` to the template block. Priority:
Med.

**powerpoint-addin-setup** — Strengths: Step 1b manifest-schema docs
verification (per prior-run improvement), resumability, staged verify. Gaps:
no Operational Readiness (see cross-skill pattern); no model routing.
Priority: Low.

**project-bootstrap** — Strengths: resumability, pre-scans project files to
avoid re-asking already-answered questions. Gaps: menu text
(`SKILL.md:59`) advertises "80/80/80 coverage" for testing-setup — see
Rule-consistency section, this is a second copy of the same wrong number.
No model routing (orchestrates other skills, so acceptable). Priority: Low
standalone / Med as part of the coverage-threshold cluster.

**review-pr** — Strengths: delegates to code-review rather than
re-implementing the checklist (good anti-drift pattern, same idea as
forge-app). Gaps: line 12 duplicates the Model Routing table at lines 19-27
verbatim in prose (cross-skill pattern). Inherits code-review's verdict
boundary ambiguity by delegation. Priority: Low.

**sandbox** — Strengths: resumability via named Docker volumes, redacted
secret printing before exec. **Gap (Critical):** `SKILL.md:160` bind-mounts
`~/.claude` read-only at `/root/.claude` in the `docker run` command, but
`templates/container-entrypoint.sh:24-28` (`set -euo pipefail` is active at
line 2) does `mkdir -p /root/.claude && cat > /root/.claude/settings.json`
at container startup. A read-only bind mount makes the entire mounted path
non-writable from inside the container — a bind mount is not shadowed by a
"writable layer" the way the comment at line 24 claims; writing to a file
inside it fails with `EROFS`. With `set -e` active, this write failure
aborts the entrypoint script before `claude` is ever invoked (line 53),
breaking every sandbox run. Confidence: 80 — inferred from Docker bind-mount
semantics and `set -e`, not runtime-verified (read-only, per task rules).
This also makes the write pointless even if it somehow succeeded: line 53
runs `claude --dangerously-skip-permissions`, which does not consult
`settings.json` permissions at all. Fix: delete the settings.json write
block (lines 23-29) entirely — `--dangerously-skip-permissions` already
grants full tool access, so there is nothing for that file to accomplish.
This confirms and upgrades the prior-run's Medium-confidence note to a
Critical, root-caused finding. Priority: Critical.

**testing-setup** — Strengths: resumability, Step-labeled docs verification,
staged verify. **Gap:** sets coverage thresholds to **80/80/80**
(`SKILL.md:11, 360, 372`) — see Rule-consistency section, contradicts
`rules/testing.md`'s 90/90/90 floor. No Operational Readiness (acceptable —
dev tooling, not a shipped feature). No model routing. Priority: High (the
coverage-threshold item).

**upgrade-deps** — Strengths: model routing, resumability, TypeScript-
migration conditional phases, review loop with NEW/RECURRING finding
tracking. **Gap:** internal inconsistency in the RECURRING-finding stop
threshold — the code-reviewer prompt text at `SKILL.md:353` says "3+ times",
but the Loop-logic bullet at `SKILL.md:363` says "2+ times" for the same
concept in the same file. Severity: Warning, confidence 80. Fix: change
line 363 to "3+ times" to match line 353 and to match the "3 or more
times consecutively" threshold in
`rules/autonomous-execution.md`'s Consecutive-fix stop rule (see
Rule-consistency section — this also resolves a rule-consistency gap, not
just a self-contradiction). Also line 14 duplicates its own Model Routing
table (cross-skill pattern). Priority: Med.

**video-downloader** — Gaps: no handling noted for private/age-restricted/
geo-blocked videos or yt-dlp extraction failures (Note, confidence 40). No
resumability (acceptable — single-shot download). Priority: Low.

**webapp-testing** — Strengths: decision tree keeps scripts as black boxes
to protect context budget, explicit "wait for networkidle before inspecting"
anti-pattern warning. No gaps of note.

## Cross-skill patterns

1. **Nine scaffolding skills have zero model-routing guidance**:
   analytics-setup, auth-setup, brand-knowvah, compliance-setup, i18n-setup,
   payments-setup, powerpoint-addin-setup, project-bootstrap, testing-setup.
   Contrast with code-review, fix, plan-mission, upgrade-deps, explore,
   review-pr, which all specify Sonnet/Haiku/Opus splits. These skills are
   mostly single-flow (no sub-agent fan-out), so the gap is lower-severity,
   but the WebFetch-verification steps (docs check) vs. implementation steps
   arguably warrant differing effort/model notes per `parallelism.md`'s
   routing table. Severity: Suggestion, confidence 55.

2. **Operational Readiness section present in only 5 of 9 "*-setup"-class
   skills that scaffold shipped, production-facing code**: analytics-setup,
   auth-setup, compliance-setup, i18n-setup, payments-setup have it;
   brand-knowvah, powerpoint-addin-setup, testing-setup, project-bootstrap
   do not (testing-setup and project-bootstrap arguably don't need one —
   dev tooling / pure orchestration; brand-knowvah and powerpoint-addin-setup
   ship user-facing runtime code with no SLI/failure-mode/rollback
   documentation). Severity: Suggestion, confidence 55. Fix: add an
   Operational Readiness section to brand-knowvah and powerpoint-addin-setup
   matching the format used in the other five.

3. **Redundant one-line model-routing summary duplicated verbatim with the
   full table immediately below it**, in three skills: `explore/SKILL.md:8`,
   `review-pr/SKILL.md:12`, `upgrade-deps/SKILL.md:14` — all read exactly
   "Model routing: Sonnet for implementation; Haiku for verification/
   scoring; Opus only for explicit architectural decisions." followed within
   ~10 lines by a `## Model Routing` table repeating the same assignment.
   Severity: Suggestion, confidence 90 (mechanical grep match, no
   interpretation needed). Fix: delete the standalone sentence in all three
   files — the table already carries the information and is the one that
   gets updated when routing changes, so the sentence is what drifts first.

4. **Docs-verification-before-templating step** (Step "1b"/"2b"/"4b") is a
   good pattern now present in auth-setup, compliance-setup, i18n-setup,
   payments-setup, powerpoint-addin-setup, analytics-setup — consistent
   naming and placement across all six. No drift found; flagging as a
   Positive pattern worth preserving as the template for any new *-setup
   skill.

## Rule-consistency mismatches (dimension 9)

**Coverage threshold — testing.md vs. two skill files.**
`rules/testing.md` (Coverage — 90/90/90 rule): "Target at least 90% line
coverage, 90% branch coverage, and 90% function coverage. Treat these as a
floor, not a ceiling."
`skills/testing-setup/SKILL.md:11`: "Installs Vitest with the Workers pool,
80/80/80 coverage thresholds..." (repeated at lines 360, 372).
`skills/project-bootstrap/SKILL.md:59`: "testing-setup — Vitest + Workers
pool, 80/80/80 coverage, ESLint, Prettier, husky, CI workflow".
Severity: Critical, confidence 90 — this is a scaffolded CI gate that will
actually enforce the wrong number every time the skill runs, not just a doc
mismatch. Fix: change all three testing-setup occurrences and the
project-bootstrap menu line to 90/90/90, or add an explicit ADR-style note
in testing-setup if 80/80/80 is an intentional, documented deviation for
scaffolded projects (currently there is no such note — it reads as drift,
not a deliberate exception).

**Commit format — commits.md vs. commit/SKILL.md.**
`rules/commits.md`: "**Subject:** `<type>(<scope>): <description>` —
lowercase, no period... Types: `feat`, `fix`, `chore`, `refactor`, `test`,
`docs`, `style`, `perf`, `ci`... Subject ≤72 chars total."
`skills/commit/SKILL.md:14-17`: "Draft a commit subject following
Conventional Commits: - Format: `<type>(<scope>): <description>` —
lowercase, no trailing period - Types: `feat`, `fix`, `chore`, `refactor`,
`test`, `docs`, `style`, `perf`, `ci` - Subject must be ≤72 characters
total." Near-verbatim duplicate of the type list and the character limit.
Severity: Warning, confidence 85 (no current contradiction, but two
independent copies of the same enumerated list will drift the next time
either is edited — e.g. `rules/commits.md` allows ≤80 body chars which
`commit/SKILL.md:25` also separately restates). Fix: replace
`commit/SKILL.md`'s bullet list with a link to `~/.claude/rules/commits.md`
plus only the mechanics that are skill-specific (the heredoc pattern,
`git add` file-list requirement).

**Consecutive-failure threshold — autonomous-execution.md vs.
upgrade-deps/SKILL.md (also an internal self-contradiction).**
`rules/autonomous-execution.md` (Consecutive-fix stop rule): "If the same
code location or approach has been changed **3 or more times**
consecutively without resolving the same failing check, stop."
`skills/upgrade-deps/SKILL.md:353` (code-reviewer prompt text): "If a
RECURRING finding has appeared **3+ times** without resolution, stop and
report it." — consistent with the rule.
`skills/upgrade-deps/SKILL.md:363` (Loop-logic bullet, same file): "Identify
any RECURRING findings (same issue appeared **2+ times**)" — inconsistent
with both its own line 353 and the rule. Severity: Warning, confidence 80.
Fix: change line 363's "2+" to "3+".

## Self-improve reference drift

**Confirmed, high-confidence:** `skills/self-improve/references/
phase2-audit-agents.md:194,203` (Agent H's own dimension-1 checklist) still
says `` `prompting-quality.md` requires CLAUDE.md ≤ 4KB `` and "CLAUDE.md >
4KB → flag", but the current `rules/prompting-quality.md:28` reads "Keep
CLAUDE.md **under 200 lines**, per Anthropic's guidance..." — the 4KB
threshold is gone from the source rule. Severity: Warning, confidence 95
(this is the exact drift the task explicitly asked to check). Fix: replace
`phase2-audit-agents.md:194` and `:203` with a 200-line check (and drop the
byte-count `wc -c` command at the top of that section in favor of `wc -l`,
consistent with the `wc -l` calls already used elsewhere in Agent H's file
list).

**Checked, no drift found:** Phase numbering (0–6) is consistent between
`SKILL.md` and all cross-references to it; Phase 1 agent letters (A, B, C,
X) and Phase 2 agent letters (D–H) are consistent across `SKILL.md`,
`phase1-research-agents.md`, `phase2-audit-agents.md`, `finding-resolution.md`,
`fleet-monitoring-drift.md`, `nist-refresh.md`, `url-registry.md`,
`output-formats.md`. `finding-resolution.md`'s scoring-rubric delegation to
`skills/code-review/references/scoring-rubric.md` matches that file's actual
headings and threshold table (0-24 drop / 25-49 classify / 50-74 cap /
75-100 keep) verbatim on both sides. `nist-refresh.md` is correctly linked
from `fleet-monitoring-drift.md` and `phase1-research-agents.md:136` despite
not being directly linked from `SKILL.md` — not orphaned. `phase0-recall.md`
step 6's "AD-10 freezes `.agent-notes/self-improve-phaseN-*` names" claim in
`fleet-monitoring-drift.md:79` is consistent with the actual output file
name Agent B is told to write to elsewhere. One drift found: see the doc-*
gitignore item above (`phase0-recall.md:72-73`).
