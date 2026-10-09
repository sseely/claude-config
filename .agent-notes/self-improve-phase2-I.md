# Self-improve Phase 2 — Agent I verdict pass (2026-10-08)

Est. tokens = lines x 13 (estimate, not measurement). E split into E1/E2. Comments in rules are stripped on injection (~0 tokens); paths: scoping works (GREEN, 771e555) so domain rules may earn keep (scope with paths:). Agents were only sampled (~17 of ~130 across F/G/H/E1); unlisted agents are not reviewed.

file | category | lines | est. tokens | verdict | reason
--- | --- | --- | --- | --- | ---
rules/api-design.md | rule | 14 | 182 | keep (scope with paths:) | F: cheap, sharp; orchestrator: paths: scoping works, candidate pilot
rules/architecture.md | rule | 81 | 1053 | trim | F: ADR/migration prose duplicates docs/reference; keep blast-radius+reversibility
rules/autonomous-execution.md | rule | 15 | 195 | keep | F: pointer stub gating a reference doc
rules/code-principles.md | rule | 99 | 1287 | trim | F: HTTP-client table + SOLID boilerplate low-yield; ~1 KB
rules/commits.md | rule | 40 | 520 | keep | F: overrides default attribution behavior
rules/diagnosis.md | rule | 65 | 845 | keep | F: highest behavioral delta; optional drop of Scope-of-change paragraph
rules/diagrams.md | rule | 21 | 273 | keep | F/H: already paths:-scoped (GREEN pilot, 771e555)
rules/environment.md | rule | 11 | 143 | merge | F: 484 B stub; fold into security.md Secrets
rules/error-handling.md | rule | 75 | 975 | keep | F: concrete; fix internal-ID wording conflict with security.md
rules/extended-thinking.md | rule | 40 | 520 | trim | F/H: citation padding; G4: Self-refine misaligned with Opus 5+ (~900 B keepable)
rules/logging.md | rule | 50 | 650 | keep | F: specific required fields, no duplicate
rules/lsp.md | rule | 43 | 559 | keep | F/H: drives tool choice; minor: drop duplicate subagent callout, add allowlist caveat
rules/memory.md | rule | 50 | 650 | trim | F: 'What NOT to write' + auto-memory prose could halve (~0.8 KB)
rules/model-routing.md | rule | 93 | 1209 | trim | F/H/E1: stale 5.0 capability claims, validate Opus bullets (comment ~0 tokens, strip does not drive verdict)
rules/naming-conventions.md | rule | 10 | 130 | merge | F: 3-bullet stub; fold into code-principles.md
rules/observability.md | rule | 67 | 871 | keep (scope with paths:) | F: backend-only; orchestrator: paths: works, second-pilot candidate
rules/parallelism.md | rule | 90 | 1170 | trim | F/G10: prompt-structure + depth/resumption notes reference-grade; Fable override as table (~1.2 KB)
rules/pr-workflow.md | rule | 43 | 559 | keep | F: unique pre-existing-violations policy
rules/prompting-quality.md | rule | 117 | 1521 | trim | F/G/H: ~40% citation prose, stale model names, 128k overreach, line 36 'pilot RED' wrong (~2 KB)
rules/research-sources.md | rule | 14 | 182 | keep | F: already compressed
rules/retry-idempotency.md | rule | 42 | 546 | keep (scope with paths:) | F: numeric policy; orchestrator: pilot candidate for paths:
rules/security.md | rule | 42 | 546 | keep | F: small, specific; absorbs environment.md
rules/string-formatting.md | rule | 49 | 637 | keep (scope with paths:) | F: builder table mildly useful, suggested paths: for code files
rules/testability.md | rule | 49 | 637 | keep | F: distinct from testing.md
rules/testing.md | rule | 52 | 676 | keep | F: TDD + 90/90/90 each gradable
agents/01-core-development/api-designer.md | agent | 54 | 702 | keep | F/G sampled: no defect found
agents/01-core-development/backend-developer.md | agent | 115 | 1495 | keep | F/G sampled: memory.md only skippable ref; no defect
agents/01-core-development/electron-pro.md | agent | 42 | 546 | keep | not sampled this run
agents/01-core-development/frontend-developer.md | agent | 44 | 572 | keep | not sampled this run
agents/01-core-development/fullstack-developer.md | agent | 44 | 572 | keep | not sampled this run
agents/01-core-development/graphql-architect.md | agent | 57 | 741 | trim | G1/G2: pasted prompt-author line + conflicting output shapes
agents/01-core-development/microservices-architect.md | agent | 47 | 611 | keep | F sampled: no defect found
agents/01-core-development/mobile-developer.md | agent | 42 | 546 | keep | not sampled this run
agents/01-core-development/ui-designer.md | agent | 52 | 676 | keep | not sampled this run
agents/01-core-development/websocket-engineer.md | agent | 43 | 559 | keep | not sampled this run
agents/02-language-specialists/angular-architect.md | agent | 36 | 468 | keep | not sampled this run
agents/02-language-specialists/cpp-pro.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/csharp-developer.md | agent | 50 | 650 | keep | not sampled this run
agents/02-language-specialists/django-developer.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/dotnet-framework-4.8-expert.md | agent | 40 | 520 | keep | not sampled this run
agents/02-language-specialists/elixir-expert.md | agent | 45 | 585 | keep | not sampled this run
agents/02-language-specialists/flutter-expert.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/golang-pro.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/java-architect.md | agent | 50 | 650 | trim | G1: pasted 'End the prompt' line in agent body
agents/02-language-specialists/javascript-pro.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/kotlin-specialist.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/laravel-specialist.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/nextjs-developer.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/php-pro.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/powershell-5.1-expert.md | agent | 60 | 780 | keep | not sampled this run
agents/02-language-specialists/powershell-7-expert.md | agent | 59 | 767 | keep | not sampled this run
agents/02-language-specialists/python-pro.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/rails-expert.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/react-specialist.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/ruby-2-7-specialist.md | agent | 90 | 1170 | keep | not sampled this run
agents/02-language-specialists/ruby-specialist.md | agent | 92 | 1196 | keep | not sampled this run
agents/02-language-specialists/rust-engineer.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/spring-boot-engineer.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/sql-pro.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/swift-expert.md | agent | 35 | 455 | keep | not sampled this run
agents/02-language-specialists/typescript-pro.md | agent | 146 | 1898 | keep | F sampled: no defect found
agents/02-language-specialists/vue-expert.md | agent | 35 | 455 | keep | not sampled this run
agents/03-infrastructure/azure-infra-engineer.md | agent | 57 | 741 | keep | not sampled this run
agents/03-infrastructure/cloud-architect.md | agent | 61 | 793 | trim | G1: pasted 'End the prompt' line (G: brevity itself PASS)
agents/03-infrastructure/database-administrator.md | agent | 54 | 702 | keep | not sampled this run
agents/03-infrastructure/deployment-engineer.md | agent | 53 | 689 | keep | not sampled this run
agents/03-infrastructure/devops-engineer.md | agent | 51 | 663 | keep | not sampled this run
agents/03-infrastructure/docker-expert.md | agent | 57 | 741 | keep | not sampled this run
agents/03-infrastructure/incident-responder.md | agent | 63 | 819 | keep | not sampled this run
agents/03-infrastructure/kubernetes-specialist.md | agent | 53 | 689 | keep | not sampled this run
agents/03-infrastructure/network-engineer.md | agent | 50 | 650 | keep | not sampled this run
agents/03-infrastructure/platform-engineer.md | agent | 52 | 676 | keep | not sampled this run
agents/03-infrastructure/security-engineer.md | agent | 53 | 689 | keep | not sampled this run
agents/03-infrastructure/sre-engineer.md | agent | 53 | 689 | keep | not sampled this run
agents/03-infrastructure/terraform-engineer.md | agent | 53 | 689 | keep | not sampled this run
agents/03-infrastructure/terragrunt-expert.md | agent | 144 | 1872 | keep | not sampled this run
agents/03-infrastructure/windows-infra-admin.md | agent | 57 | 741 | keep | not sampled this run
agents/04-quality-security/accessibility-tester.md | agent | 41 | 533 | keep | not sampled this run
agents/04-quality-security/ad-security-reviewer.md | agent | 67 | 871 | trim | G1: pasted 'End the prompt' line
agents/04-quality-security/ai-risk-auditor.md | agent | 99 | 1287 | keep | not sampled this run
agents/04-quality-security/architect-reviewer.md | agent | 22 | 286 | keep | F sampled: no memory.md ref; read-only, bounded
agents/04-quality-security/chaos-engineer.md | agent | 43 | 559 | keep | not sampled this run
agents/04-quality-security/code-reviewer.md | agent | 31 | 403 | keep | F/G8: minor - CCN '<10' wording, add output-shape line
agents/04-quality-security/compliance-auditor.md | agent | 43 | 559 | keep | not sampled this run
agents/04-quality-security/debugger.md | agent | 65 | 845 | keep | not sampled this run
agents/04-quality-security/error-detective.md | agent | 47 | 611 | keep | not sampled this run
agents/04-quality-security/penetration-tester.md | agent | 40 | 520 | keep | not sampled this run
agents/04-quality-security/performance-engineer.md | agent | 40 | 520 | keep | not sampled this run
agents/04-quality-security/powershell-security-hardening.md | agent | 64 | 832 | trim | G1: pasted 'End the prompt' line
agents/04-quality-security/qa-expert.md | agent | 48 | 624 | keep | not sampled this run
agents/04-quality-security/security-auditor.md | agent | 48 | 624 | keep | G8: optional one-line output shape
agents/04-quality-security/test-automator.md | agent | 44 | 572 | keep | not sampled this run
agents/05-data-ai/ai-engineer.md | agent | 49 | 637 | keep | not sampled this run
agents/05-data-ai/data-analyst.md | agent | 46 | 598 | keep | not sampled this run
agents/05-data-ai/data-engineer.md | agent | 48 | 624 | keep | not sampled this run
agents/05-data-ai/data-scientist.md | agent | 49 | 637 | keep | not sampled this run
agents/05-data-ai/database-optimizer.md | agent | 46 | 598 | keep | not sampled this run
agents/05-data-ai/llm-architect.md | agent | 63 | 819 | trim | G1: pasted 'End the prompt' line
agents/05-data-ai/ml-engineer.md | agent | 51 | 663 | keep | not sampled this run
agents/05-data-ai/mlops-engineer.md | agent | 48 | 624 | keep | not sampled this run
agents/05-data-ai/nlp-engineer.md | agent | 50 | 650 | keep | not sampled this run
agents/05-data-ai/postgres-pro.md | agent | 54 | 702 | keep | not sampled this run
agents/05-data-ai/prompt-engineer.md | agent | 46 | 598 | keep | not sampled this run
agents/06-developer-experience/build-engineer.md | agent | 57 | 741 | keep | not sampled this run
agents/06-developer-experience/cli-developer.md | agent | 53 | 689 | keep | not sampled this run
agents/06-developer-experience/dependency-manager.md | agent | 46 | 598 | keep | not sampled this run
agents/06-developer-experience/documentation-engineer.md | agent | 46 | 598 | keep | not sampled this run
agents/06-developer-experience/git-workflow-manager.md | agent | 40 | 520 | keep | not sampled this run
agents/06-developer-experience/legacy-modernizer.md | agent | 49 | 637 | keep | not sampled this run
agents/06-developer-experience/mcp-developer.md | agent | 51 | 663 | keep | not sampled this run
agents/06-developer-experience/powershell-module-architect.md | agent | 63 | 819 | keep | not sampled this run
agents/06-developer-experience/powershell-ui-architect.md | agent | 130 | 1690 | keep | not sampled this run
agents/06-developer-experience/refactoring-specialist.md | agent | 50 | 650 | keep | not sampled this run
agents/06-developer-experience/slack-expert.md | agent | 116 | 1508 | keep | not sampled this run
agents/06-developer-experience/tooling-engineer.md | agent | 51 | 663 | keep | not sampled this run
agents/07-specialized-domains/api-documenter.md | agent | 55 | 715 | keep | not sampled this run
agents/07-specialized-domains/forge-app-developer.md | agent | 179 | 2327 | keep | E1: verified exists, referenced by forge-app skill
agents/07-specialized-domains/m365-admin.md | agent | 50 | 650 | keep | not sampled this run
agents/07-specialized-domains/mobile-app-developer.md | agent | 69 | 897 | keep | not sampled this run
agents/07-specialized-domains/payment-integration.md | agent | 57 | 741 | keep | not sampled this run
agents/07-specialized-domains/risk-manager.md | agent | 126 | 1638 | keep | not sampled this run
agents/08-business-product/business-analyst.md | agent | 57 | 741 | keep | not sampled this run
agents/08-business-product/content-marketer.md | agent | 57 | 741 | keep | not sampled this run
agents/08-business-product/legal-advisor.md | agent | 125 | 1625 | keep | not sampled this run
agents/08-business-product/product-manager.md | agent | 58 | 754 | keep | not sampled this run
agents/08-business-product/project-manager.md | agent | 52 | 676 | keep | not sampled this run
agents/08-business-product/technical-writer.md | agent | 84 | 1092 | keep | not sampled this run
agents/08-business-product/ux-researcher.md | agent | 61 | 793 | keep | not sampled this run
agents/09-meta-orchestration/agent-installer.md | agent | 99 | 1287 | keep | not sampled this run
agents/09-meta-orchestration/it-ops-orchestrator.md | agent | 69 | 897 | keep | G sampled: no defect found
agents/10-research-analysis/data-researcher.md | agent | 132 | 1716 | keep | not sampled this run
agents/10-research-analysis/market-intelligence-analyst.md | agent | 47 | 611 | keep | not sampled this run
agents/10-research-analysis/research-analyst.md | agent | 125 | 1625 | keep | not sampled this run
agents/10-research-analysis/search-specialist.md | agent | 128 | 1664 | keep | not sampled this run
agents/explore.md | agent | 43 | 559 | keep | not sampled this run
agents/plan.md | agent | 41 | 533 | keep | not sampled this run
agents/plantuml-visual-qa.md | agent | 304 | 3952 | keep | G: Opus brevity check PASS (304 lines, not size-assessed)
skills/analytics-setup/SKILL.md | skill | 466 | 6058 | keep | E2: only real planning step; fix hook-in-module, var/secret clash
skills/auth-setup/SKILL.md | skill | 497 | 6461 | keep | E2: high value; fix state binding, readiness drift, dup gotcha text
skills/brand-knowvah/SKILL.md | skill | 498 | 6474 | trim | E2: two skills in one file; split React path to reference, ~60-line router
skills/changelog-generator/SKILL.md | skill | 93 | 1209 | keep | E1: fix Improvements/breaking-footer gaps
skills/code-review/SKILL.md | skill | 330 | 4290 | keep | E1: resilience+checklists are the product; cut ~25 lines history
skills/commit/SKILL.md | skill | 36 | 468 | keep | E1: model of rule-linking; +1 line on attribution
skills/compliance-setup/SKILL.md | skill | 428 | 5564 | keep | E2: valuable scope; fix allowed-tools, secrets-in-vars, tests (~30 lines prose trim optional)
skills/explore/SKILL.md | skill | 133 | 1729 | keep | E1: wire declared parallel routing or delete table
skills/file-organizer/SKILL.md | skill | 235 | 3055 | trim | E1: 60+ lines generic advice (-100); delete->trash, mv -n
skills/fix/SKILL.md | skill | 129 | 1677 | keep | E1: best value per line; implements diagnosis.md
skills/forge-app/SKILL.md | skill | 109 | 1417 | keep | E1: exemplary single-sourcing
skills/i18n-setup/SKILL.md | skill | 374 | 4862 | keep | E2: good guards; switch translate default to Sonnet, SDK retry
skills/internal-comms/SKILL.md | skill | 31 | 403 | delete | E1: resident description, generic content, no company formats (or disable-model-invocation)
skills/payments-setup/SKILL.md | skill | 493 | 6409 | keep | E2: strong idempotency; add payment_status guard + Stripe timeout
skills/plan-mission/SKILL.md | skill | 401 | 5213 | trim | E1/G7: stale Opus 5 text, dup PerspectiveGap box + brevity block (-20 lines)
skills/powerpoint-addin-setup/SKILL.md | skill | 431 | 5603 | trim | E2: niche; compress scaffolding prose (~60 lines); cert install user-run
skills/project-bootstrap/SKILL.md | skill | 205 | 2665 | keep | E2: cheap orchestrator; fix order template + helper dependency
skills/review-pr/SKILL.md | skill | 289 | 3757 | keep | E1: highest correctness per line; cut 8-line routing section
skills/sandbox/SKILL.md | skill | 265 | 3445 | keep | E1: security value high; fix shell-state + foreground-run bugs
skills/self-improve/SKILL.md | skill | 119 | 1547 | keep | E1: SKILL.md earned (every line changes control flow); minor dup at :71/:118
skills/testing-setup/SKILL.md | skill | 437 | 5681 | keep | E2: foundation; fix stale vitest cap and first-CI-red
skills/upgrade-deps/SKILL.md | skill | 332 | 4316 | keep | E1: structure earned; fix scope threading/verification/branch safety
skills/video-downloader/SKILL.md | skill | 92 | 1196 | keep | E1: add confirm + failure line
skills/webapp-testing/SKILL.md | skill | 104 | 1352 | keep | E1: vendored; add verification guidance
skills/brand-knowvah/references/vitepress-docs-site.md | skill | 184 | 2392 | keep | E2: clean docs-site path, no drift
skills/code-review/references/checklists.md | skill | 248 | 3224 | keep | E1: checklists are the review's content; ~9 lines history
skills/code-review/references/scoring-rubric.md | skill | 108 | 1404 | keep | E1: single-sourced rubric; drop relocation note only
skills/payments-setup/references/i18n-keys.md | skill | 63 | 819 | keep | E2: loaded only when i18n ran
skills/plan-mission/references/brief-structure.md | skill | 129 | 1677 | keep | E1: readiness propagation earned
skills/self-improve/references/finding-resolution.md | skill | 63 | 819 | trim | E1: stale Haiku-scoring comparison :39-43
skills/self-improve/references/fleet-monitoring-drift.md | skill | 85 | 1105 | trim | E1: hard-coded line refs into phase1 (use heading refs)
skills/self-improve/references/nist-refresh.md | skill | 88 | 1144 | trim | E1: barrier-rationale contradiction :66-69
skills/self-improve/references/output-formats.md | skill | 89 | 1157 | keep | E1: only minor header wording inconsistency
skills/self-improve/references/phase0-recall.md | skill | 76 | 988 | trim | E1: lines 1-25 duplicate resume gate (stale copy); wrong agent count
skills/self-improve/references/phase1-research-agents.md | skill | 359 | 4667 | trim | E1/orch: stale model resolution :75-101, restated paper, write conflict on research-urls.md, barrier contradiction
skills/self-improve/references/phase2-audit-agents.md | skill | 330 | 4290 | trim | D/E1/orch: stale Agent D file list + event list, E read-set over budget, hard-coded lists
skills/self-improve/references/url-registry.md | skill | 79 | 1027 | trim | orch: promotion move-vs-never-delete contradiction with phase1
skills/upgrade-deps/references/ts6-migration.md | skill | 81 | 1053 | keep | E1: conditional ref; phase-number drift note only
hooks/_hooklib.py | hook | 43 | 559 | keep | D: no finding beyond missing tests
hooks/_hooklib.sh | hook | 84 | 1092 | keep | D: fix log rotation never deletes + redaction misses SubagentStop payload
hooks/autonomous-toggle.sh | hook | 115 | 1495 | keep | D: 'on' backup-clobber bug; remove pre-approval of 'on'
hooks/check-complexity.py | hook | 316 | 4108 | trim | D: head_baseline/head_line_count duplicate git-show block (extract helper)
hooks/check-frontmatter.py | hook | 315 | 4095 | keep | D: tested, no finding
hooks/guard-bash.py | hook | 265 | 3445 | keep | D: thin coverage (~/.claude, sudo prefixes) - extend, not trim
hooks/log-hook-event.sh | hook | 37 | 481 | keep | D: on-call text stale re Fable reroute
hooks/log-instructions-loaded.sh | hook | 41 | 533 | keep | D: no finding beyond no tests
hooks/notify-on-stop.sh | hook | 48 | 624 | keep | D: global timestamp shared across sessions
hooks/nudge-search-tool.py | hook | 254 | 3302 | keep | D: allow decision auto-approves Grep; no tests
hooks/project-init.sh | hook | 88 | 1144 | trim | D: mutates every git repo; early-exit, drop .mcp.json writes
hooks/quality-gate.sh | hook | 273 | 3549 | keep | D: gates parser mis-splits ':' ; blanket allow risk
hooks/record-turn-start.sh | hook | 10 | 130 | keep | D: key timestamp by session_id
hooks/session-start.sh | hook | 116 | 1508 | keep | D: add timeout to blocking install; ConfigChange wiring should go
hooks/setup-complexity.sh | hook | 76 | 988 | keep | D: no finding
CLAUDE.md | rule | 79 | 1027 | trim | F/H: pointer sections duplicate rules, 'On Compaction' stale count (outside wc sweep; lines per H)
post-compact-context.md | rule | 47 | 611 | trim | H/F: 47->~27 lines, Opus-vs-Fable line; comments here DO cost tokens (outside wc sweep; lines per H)
(shared Step0/cleanup/mark-lines across 9 setup skills) | skill | 330 | 4290 | merge | E2: extract to one shared progress-protocol file (~250 lines saved; not a real file)

## Summary
- Rows: 193 (incl. 2 non-sweep rule files + 1 pseudo-row). Verdicts: keep 161 (of which 4 'scope with paths:'), trim 28, merge 3, delete 1.
- Unsampled agents defaulted to keep: 96 (not reviewed, not endorsed).
- Top 5 trim/merge/delete by file size: skills/brand-knowvah/SKILL.md (6474 tok); skills/powerpoint-addin-setup/SKILL.md (5603 tok); skills/plan-mission/SKILL.md (5213 tok); skills/self-improve/references/phase1-research-agents.md (4667 tok); skills/self-improve/references/phase2-audit-agents.md (4290 tok).
- Resident-cost trims (every session) are rules, not skills: rules/prompting-quality.md (1521 tok), rules/code-principles.md (1287 tok), rules/model-routing.md (1209 tok); plus CLAUDE.md. Skills are mostly disable-model-invocation/on-invoke only.
- paths: scoping candidates: api-design, observability, retry-idempotency, string-formatting (orchestrator est. ~5.4k tok/session across ~10 domain rules).
- Only delete: skills/internal-comms/SKILL.md (resident description, generic content). Merges: environment.md->security.md, naming-conventions.md->code-principles.md, shared setup-skill boilerplate.
- Most findings are defect fixes (hooks, setup skills), not size trims; hooks carry 0 resident tokens.
