# Phase 3 — deduplicated, scored findings (self-improve 2026-08-01)

9 agents (A,B,C,X,D,E,F,G,H) + orchestrator. ~70 raw findings → 43 after dedup.
Scored with `skills/code-review/references/scoring-rubric.md`, applied by the
orchestrator (this skill does not spawn a separate scoring agent).

## Merged / deduplicated

| Merged finding | Reported independently by | Final score |
|---|---|---|
| `prompting-quality.md` rules/ figures stale + mitigation inoperative | C-P10, F-Q1, H, orchestrator | 97 |
| CLAUDE.md at 95.7% of its own 4KB cap | F-S1, orchestrator | 97 |
| `compliance-auditor` haiku/effort mismatch | B, orchestrator (O1/O2) | 90 |

## REFUTED — dropped (score 0)
- **C-P8(b)** "0 of 128 agents contain a worked example." Agent G disproved it:
  `agents/09-meta-orchestration/agent-installer.md:74-90` and
  `it-ops-orchestrator.md:41-54` both contain worked examples. Dropped.
- **C-P10 systemic claim.** C implied the inoperative "read only the relevant
  rule file" advice recurs; G checked the full sample and found it exactly once
  (`prompting-quality.md:39-40`). Kept as a single finding, not a pattern.

## Contradiction resolution (research vs. existing rule)
- **C-P1 / PerspectiveGap (arXiv:2606.08878, preprint)** — scores
  `claude-opus-4-8` worst-in-family (13.9%) at orchestration-prompt composition,
  which `rules/parallelism.md:87` routes to `opus`. Evidence: Medium
  (unreplicated preprint). Applicability: High (names the routing decision).
  → **Tier-2 resolution: rule holds; surface as Suggestion labeled
  `[frontier-lag]`.** The paper never tested Opus 5, which is what `opus` now
  resolves to, so re-routing would act on untested inference. Record the
  tension rather than suppress it.

## CRITICAL (blocks the next autonomous run)

| # | file:line | Score | Issue | Fix |
|---|---|---|---|---|
| C1 | `.claude/settings.json` | 95 | **RESOLVED THIS RUN.** Autonomous profile live in interactive sessions since Jul 24 15:36 (8 days); the `pre-autonomous` backup on disk proved `toggle off` never ran. Elevated over safe profile: `Read/Write/Edit/Glob/Grep(**)`, `curl raw.githubusercontent`, `pip install`. Global sudo/rm-rf PreToolUse guard unaffected. | Ran `hooks/autonomous-toggle.sh off` (user-approved). settings.json now the 53-entry safe profile. Root cause (no auto-revert) still open → W25. |
| C2 | `templates/autonomous-settings.json` | 88 | No `Agent(*)` grant, yet `autonomous-execution.md` mandates launching parallel subagents per batch. First dispatch stalls on a human who isn't there. | Add `"Agent(*)"` to the template allow-list. |
| C3 | `templates/autonomous-settings.json` | 85 | No `Bash(~/.claude/hooks/setup-complexity.sh)`; `check-complexity.py:107-114` blocks and requests permission for exactly that script when lizard is absent. Approval wall on the first edit in a fresh autonomous env. | Add the grant. |
| C4 | `rules/diagnosis.md:42-51` vs `rules/autonomous-execution.md:78-82` | 90 | A failing quality gate is an observed discrepancy → engages diagnosis mode, which permits "only these two" stop conditions, both requiring an identified root cause. autonomous-execution mandates STOP after 2 failed tries. An autonomous run hitting a stubborn gate is told both to stop and not to. | State that the 2-try cap bounds *fix attempts*, not investigation; require the diagnosis artifact (mechanism / origin / causal chain / ruled-out) in the STOP journal entry. |

## WARNING (score >= 75)

| # | file:line | Score | Issue | Fix |
|---|---|---|---|---|
| W1 | `rules/prompting-quality.md:35-41` | 97 | Claims "22 files, ~62KB, ~14k tokens"; actual **23 files / 72,367 B / ~18k tokens**. Worse, the prescribed mitigation ("prefer task-scoped reading of the one or two relevant rule files") is *inoperative* — all 23 inject verbatim at session start. | Correct the numbers AND drop the precise counts (they re-stale on every rule addition; this drift arrived via commit 73837bd earlier today). State qualitatively. Replace the mitigation with `paths:` → W2. |
| W2 | `rules/*.md` (10 files) | 85 | **`paths:` VERIFIED SUPPORTED this run** (code.claude.com/docs/en/memory, "Path-specific rules"; applies to `.claude/rules/*.md` incl. user-level). Flagged unused across 4 prior audits, deferred every time for lack of verification. 10 domain rules = 21,857 B = **30% of resident footprint, ~5,460 tokens/session**. Entire tightening axis (Agent H) yields ~105 tokens/session by comparison. **Highest-value finding of the run.** | Add `paths:` to observability, diagrams, retry-idempotency, error-handling, testability, naming-conventions, api-design, testing, logging, environment. Pilot ONE first and confirm scoping fires — user-level applicability is inferred from the shared format, not stated verbatim. |
| W3 | `agents/` (0/128 reference `rules/diagrams.md`) | 95 | 9 agents produce diagrams; none load the PlantUML default. **Regression from commit 73837bd earlier this session** — rule added, 3 skills updated, agents never propagated. Default silently reverts on any delegation. | Add `diagrams.md` to Required Rules of the 9 diagram-producing agents (plantuml-visual-qa, documentation-engineer, technical-writer, legacy-modernizer, error-detective, data-researcher, trend-analyst, sales-engineer, +1). |
| W4 | `CLAUDE.md` | 97 | 3,921 / 4,096 B = **95.7%** of the cap set at prompting-quality.md:31-33. 175 B headroom; pattern is one index line per new rule file (~60 B consumed today). Next 1-2 rule files breach it. | Collapse the `## Rules` index (~700 B naming all 23) to a pointer + load-bearing entries. Reclaims ~400 B. Interacts with W2. |
| W5 | `agents/04-quality-security/` (5 files) | 85 | `error-detective`, `penetration-tester`, `performance-engineer`, `compliance-auditor`, `qa-expert` pinned `model: haiku`. `parallelism.md:90` scopes haiku to "confidence scoring, dedup, format checking, simple grep". error-detective's stated job (root-cause discovery) contradicts `diagnosis.md:36-44`; extended-thinking.md names security, performance, and test-strategy analysis as extended-thinking cases. `parallelism.md:92` also caps haiku at ~50 files — a codebase-wide audit exceeds it. Failure mode is silent false negatives: a missed finding looks identical to a clean audit. | Raise those 5 to `sonnet`; leave `accessibility-tester` on haiku (checklist work, weakest case). |
| W6 | `agents/04-quality-security/compliance-auditor.md:5-6` | 90 | `model: haiku` + `effort: high`; Haiku rejects `effort` (400). Sole such pairing among the 18 agents setting effort. | Set `model: sonnet`, KEEP `effort: high`. (Agent B proposed deleting the effort line — that fixes the API error by silently downgrading a compliance audit. Rejected in favour of the routing fix, which resolves this and W5 together.) |
| W7 | `settings.json:125-127` | 92 | `Bash(forge lint *)`, `Bash(echo "forge lint exit=$?")` (dead — unexpanded var, never matches), `Bash(lizard src/shared/scrubSvg.ts)` (file absent from this repo). Added at global scope in commit c987da5 earlier today — exactly the one-off noise this check exists to catch. | Move to project-local settings; delete the echo entry outright. |
| W8 | `agents/` (6 files) | 93 | Required Rules blocks say only "Apply these rule files" or are bare lists, missing the canonical "the agent must Read that file" closer required by `parallelism.md:55-57`: backend-developer:56, api-designer:31, microservices-architect:99, typescript-pro:136, architect-reviewer:15, code-reviewer:23. 119/125 have it; these 6 missed by the July rollout. | Append the canonical closer. |
| W9 | `rules/lsp.md:81-83` vs `code-reviewer.md:6` / `architect-reviewer.md:7` | 92 | lsp.md mandates `sg` and `tsc --noEmit`; both agents list lsp.md in Required Rules but set `disallowedTools: … Bash`. The instruction is unexecutable. | Grant scoped `Bash(sg:*)` / `Bash(tsc:*)`, or scope lsp.md's mandate to Bash-capable agents. |
| W10 | `agents/04-quality-security/security-auditor.md` | 95 | No Required Rules block at all — the agent where `security.md` matters most. | Add the block including security.md. |
| W11 | `agents/01-core-development/api-designer.md` | 90 | Required Rules omit `api-design.md` — the rule governing its entire job. | Add it. |
| W12 | skills + agents (0 `evals/`) | 95 | No eval harness anywhere across 28 skills / 128 agents; Anthropic's skill-creator mandates test cases + baseline-vs-with-skill comparison. | Scope to `code-review`, `fix`, `plan-mission` only. |
| W13 | `skills/self-improve/SKILL.md` | 90 | 831 lines vs Anthropic's <500 ceiling — sole breach of 28 skills (`payments-setup` at 498 is one edit away). `references/` already used by plan-mission and code-review. | Move Phase 1/2 agent-prompt blocks to `references/`. |
| W14 | `rules/parallelism.md:40-42` | 85 | Section 0 instructs injecting `.agent-notes/` findings "verbatim" with no information-boundary rule. Distractor leakage is a leading measured orchestration failure. Cheapest high-value fix in the set. | Add a need-only clause: pass only observations bearing on this task's write-set. |
| W15 | `CLAUDE.md:34-37` | 90 | Says post-compact-context.md restores "3 sections"; it has 4 (33b15f7 landed after ca4461f corrected the count). | Say 4, or drop the count. |
| W16 | `rules/autonomous-execution.md:75` vs `:155-157` | 88 | ":75 one commit per completed task (not per file, not per batch)" vs ":155-157" mandating a second `fix(TN)` commit for gate fixes. | Reword :75 to "one commit per task, plus fix commits where a gate requires them". |
| W17 | `hooks/check-complexity.py` | 92 | Enforces 500 lines / 30 NLOC / CCN 10 / 5 params; no rule file states these thresholds. Agents cannot comply with limits they cannot see. | Document in code-principles.md or a new complexity rule. |
| W18 | `skills/changelog-generator/SKILL.md:13-20` | 90 | Model Routing table despite self-documenting "runs inline (no sub-agents)"; 0 Agent invocations in the file. Missed by d74fad3, which stripped 13 siblings. | Delete the table. |
| W19 | `settings.json:47-51` | 85 | Only 5 scoped `gh` subcommands; `gh pr create` — used by this repo's own pr-workflow.md — absent, unlike local/template's `gh *:*`. | Add `gh pr create`. |
| W20 | `.claude/settings.local.json:37-39` | 85 | Disables the serena MCP server while global settings.json:114-124 still grants 22 `mcp__serena__*` permissions, dead in this project. | Drop the dead perms or re-enable serena. |
| W21 | `settings.json:104-108` | 85 | `~/church/**` — an unrelated personal project — granted at global scope. | Move to that project's local settings. |
| W22 | `agents/` (50 files, 88 lines) | 85 | Unmeasurable adverb-stacked checklist lines (e.g. `research-analyst.md:12-16`). Confirmed independently by C and G. Pure subtraction — deleting an unmeasurable line loses no behavior. | Delete or replace with measurable criteria. |
| W23 | `skills/self-improve/research-urls.md` | 90 | Candidate table 31→36→57→**91**; only 6 ever promoted. Phase 6 promotes only URLs "fetched this run", but A/B/C each fetch their *active* list — no agent ever fetches a candidate, so promotion is accidental. Discovery works; nothing drains the queue. | Add a Phase 1 step: one agent fetches the top-5 candidates by relevance each run and promotes or demotes them. |
| W24 | `code-review-tasks.md` | 95 | All 2026-07-24 items still `[ ]` though ~25 commits implemented them. Phase 0 must reconstruct state from git each run; future runs risk re-deriving fixed findings. | Tick boxes in the implementing commit, or have Phase 0 reconcile and rewrite. |
| W25 | `hooks/autonomous-toggle.sh:70-78` | 85 | `off` does `mv` (consuming the backup); a second `off` falls to the `elif` and **deletes settings.json outright**. Nothing auto-reverts on mission end — root cause of C1. | Use `cp` + explicit cleanup; add a SessionStart warning when settings.json == settings.autonomous.json. |

## SUGGESTION (score 50-74 capped per rubric, or genuinely low-priority)

| # | file:line | Score | Issue |
|---|---|---|---|
| S1 | `rules/parallelism.md:87`, `skills/plan-mission/SKILL.md:365,367` | 70 | `[frontier-lag]` PerspectiveGap preprint scores Opus worst-in-family at orchestration composition but never tested Opus 5. Rule holds; add a cautionary note so the tension stays auditable. |
| S2 | `rules/parallelism.md` | 70 | v2.1.219 raised default nested subagent depth 1→3; no `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` guidance. Unreviewed behavioral change for a heavily fanning-out config. |
| S3 | hooks (`SessionEnd`, `SubagentStop`, `TaskCompleted`) | 70 | Unwired across 3+ audits. Highest-value: `TaskCompleted` enforcing autonomous-execution's write-set verification. |
| S4 | `skills/doc-pptx/SKILL.md:444-453` | 75 | `soffice`/`pdftoppm` block lacks the preflight/timeout/verification its `doc-docx` twin has. |
| S5 | `templates/autonomous-settings.json` | 85 | Missing `docker-compose *:*` / `psql *:*` present in global. |
| S6 | `rules/parallelism.md:36-77` | 75 | No Resumption guidance for terse subagent follow-ups. |
| S7 | `agents/01-core-development/backend-developer.md:8` vs `:34` | 85 | "per-endpoint p95 target defined for the service" vs a hardcoded "under 100ms p95". |
| S8 | `agents/01-core-development/backend-developer.md:25-31` | 80 | Security bullets restate `security.md:5-12`, already pulled via Required Rules. |
| S9 | `post-compact-context.md:6-15` | 80 | Only section over the 6-line threshold (8 lines / 73 words). Compressible to 4 lines with all 5 steps intact. |
| S10 | `post-compact-context.md:21` | 88 | Pointer to CLAUDE.md (which reloads anyway); drops the `feat(T3):` one-commit-per-task convention present in neither file. |
| S11 | Playwright perms (local/autonomous/template) | 72 | No playwright server in `.mcp.json`; grants dead everywhere. |
| S12 | `testing-setup`, `i18n-setup`, `powerpoint-addin-setup` | 68 | Lack the verify-against-current-docs step their 4 siblings gained in July, despite templating driftable external surfaces. |
| S13 | `rules/parallelism.md` | 70 | Largest rule file (166 lines / 10,610 B). Blockquotes at 109-113 and 115-121 compressible ~60%. |
| S14 | `agents/` rule coverage | 88 | `diagnosis.md` in 6/128 (no Write-capable agent); `lsp.md` in 4/128 vs 65 Serena-equipped agents; CLAUDE.md's confidence ladder reaches 0 subagents (fix: move to research-sources.md, already in 27). |
| S15 | `hooks/session-start.sh:84` | 70 | Lacks the error-trap pattern its sibling hooks use. |

## POSITIVE
- `rules/diagrams.md` has zero *textual* conflicts — repo-wide "mermaid" grep = 0
  hits; explore, plan-mission, autonomous-execution:24 all agree (F, H; 95).
  The gap is propagation to agents (W3), not internal consistency.
- All prior-run Criticals/Warnings verified landed: template serena perms
  (1927c9e), cp/mv + opus default (f00b982), Required Rules 126/128,
  MultiEdit 44→0, Explore/Plan pinned haiku (77c58b4).
- No `budget_tokens`, no deprecated model-ID pins, no invalid aliases (B).
- `parallelism.md` routing table already current for Opus 5 (B).
- All 7 Opus-routed agents comply with brevity + shape; plan-mission's Opus
  phases fully compliant (C, G).
- The config's characterization of arXiv:2604.00025 is *more* honest than the
  paper's own abstract; commit 4385fc7 softening it was correct — leave it (C).
- WebSearch/WebFetch bare-form syntax consistent across all 6 settings files (D).
- 23 of 28 skills clean — the July remediation pass held (E).
- Agent X dedup worked: 14 near-duplicates correctly excluded (historical
  failure mode of that agent).
- Agent G refuted one of Agent C's claims (P8b) — adversarial verification
  functioning as designed.
