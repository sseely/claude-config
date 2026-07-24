# Self-Improve Phase 3 — Synthesis (2026-07-24)

Full 9-agent fan-out (A,B,C,X Phase 1; D,E,F,G,H Phase 2). Agent A was
user-killed once and relaunched full — completed cleanly, all 13 URLs 200.
Orchestrator directly verified the top contradictions against source rather
than trusting agent summaries (skill Phase 3 rule).

## Regression / convergence gate (Phase 0)
- Prior run 2026-07-01: all 8 findings marked [x]. Spot-checked all 8 — ALL
  present, no regressions: .gitignore secrets/PII ignored (C1); fable alias in
  self-improve SKILL (W1); settings.json:142 clean alias no [1m] (W2);
  error-detective.md:10 diagnosis pointer (S2); CLAUDE.md 3790B under cap (S3);
  parallelism.md:137 classifier note (S4); sandbox:199 sandbox.credentials (S5).
- Agent H independently confirmed 2 of its OWN prior findings now fixed
  (autonomous-execution.md compaction dup; commit-format restatement) → loop is
  converging, not drifting.
- NEW gate finding: daemon-auth-cooldown / daemon-auth-status.json untracked &
  NOT gitignored (prior C1 covered daemon/ + daemon.* but not daemon-auth-*).
  Contents benign (status string + timestamp) — hygiene, not a leak.

## Number corrections (agents disagreed; orchestrator arbitrated)
- rules/*.md count = **22** (verified `ls`). A said 24, F said 23 — both wrong.
- Opus agents carrying brevity constraint = **6/6** (G corrected C's 7/7).
- F1 coverage-floor agents: grep shows ~10+ files at 80/85%, broader than F's 6.

## Findings (deduped, scored 0-100)

### Critical
- C1 [85] `templates/autonomous-settings.json:56-57` grants
  `safe_delete_symbol` + `rename_symbol` but OMITS
  `mcp__serena__find_referencing_symbols` (present in global settings.json).
  An autonomous refactor checks references before renaming/deleting → hits a
  permission prompt → STALLS with no human present. Squarely "before next
  autonomous run." Fix: add find_referencing_symbols (and get_symbols_overview
  / find_symbol) to the template allow-list. (Agent D)

### Warning
- W0 [95] **Opus 5 shipped 2026-07-24 (this run's date) and the audit's research
  MISSED it** — Agent B fetched models/overview + model-config today and
  reported Opus 4.8 as current (stale/pre-launch pages + WebFetch 15-min cache;
  fetch-guard can't catch a 200-but-stale page). Confirmed live via WebSearch:
  Opus 5 is the new default for most users, ~Fable-5 capability at ~half price,
  SOTA on coding/knowledge (Frontier-Bench, GDPval-AA), low/med/high effort
  toggle. Materially shifts model-routing economics (W5; parallelism.md routing
  table; the `model: fable` session default). Fix: refresh the model-routing
  table in parallelism.md + the pre-seeded model lists in self-improve/SKILL.md
  for Opus 5; re-evaluate whether the session default should be `opus` (=Opus 5)
  vs `fable`. Sources: anthropic.com/news/claude-opus-5, CNBC/Fortune 2026-07-24.
  (Discovered mid-run by user prompt; NOT surfaced by any agent.)
- W1 [100] `rules/prompting-quality.md:35-39` asserts rules "are not all
  resident — keep it that way." DIRECTLY FALSE: orchestrator confirmed all 22
  rule files present verbatim in this session's system prompt (~10.3k words /
  310 directive bullets / ~14k tokens every request). Independent of the N=40
  preprint (arXiv:2607.19257, Medium evidence) — the factual claim is refuted by
  direct observation. Fix: correct the wording to state rules ARE resident; THEN
  pursue the structural fix (paths:-scoping) only after W7 verification.
  (Agents C, G + orchestrator direct confirmation)
- W2 [90] Six+ agents ship coverage floors below `testing.md` 90/90/90 and none
  cite testing.md: frontend-developer.md:23,147 (>85%), java-architect.md:7,14
  (85%), plus angular-architect, test-automator, devops-engineer,
  legacy-modernizer, mobile-developer, docker/terraform, dotnet-core-expert
  (80-85%). Verified by grep. Fix: raise to 90/90/90 or add explicit
  per-agent rationale + testing.md citation. (Agent F1)
- W3 [90] `skills/fix/SKILL.md:86` "skip re-diagnosis if the new error is
  straightforward" contradicts `diagnosis.md:33-34` "no fix before a stated
  mechanism." Verified. Fix: require a one-line mechanism even on iteration, or
  scope diagnosis.md's mandate to exclude fast-iterate loops. (Agent F2)
- W4 [85] Only **7 of 126** agents carry a Required Rules block (verified), and
  the "subagents must Read the rule file" instruction lives ONLY in
  parallelism.md — which subagents don't auto-load. `grep "Read .*rules/"
  agents/` = 0. The rule standard is documented but never delivered to 119
  agents; W2 is the visible symptom. Fix: add a minimal Required Rules +
  "Read the file" line to the highest-traffic agents (reviewers, architects,
  language leads). (Agent F11/F12)
- W5 [80] Explore/Plan built-ins now INHERIT the session model (v2.1.198,
  was always-Haiku). With `settings.json` `model: fable`, every codebase search
  bills at Fable tier. No Explore/Plan override exists (grep empty). Fix: add a
  user-level `Explore`/`Plan` agent with `model: haiku`. VERIFY the v2.1.198
  behavior first. (Agent A — highest-leverage cost fix)
- W6 [80] `skills/self-improve/SKILL.md:145-151` effort table omits Fable 5 from
  every row incl. xhigh/max (line 150 = "Opus 4.8, Opus 4.7, Sonnet 5"). Docs:
  Fable 5 supports full low–max range. Next Agent-B run will false-positive on a
  Fable-routed high-effort agent. Fix: add Fable 5 to the effort rows. (Agent B)
- W7 [75] `rules/prompting-quality.md:52-55` open `<!-- Code review (2026-07-01):
  ... -->` comment, 23 days unresolved, re: unverified `paths:`-scoped rule
  loading. Blocks W1's structural fix. Fix: WebFetch code.claude.com/docs/en/
  settings to confirm/deny paths: support, then resolve the comment. (Agent H)
- W8 [75] `cp` / `mv` absent from global `settings.json` permissions despite
  being in every other settings file → constant prompts on basic file ops. Fix:
  add `Bash(cp:*)` / `Bash(mv:*)` to global allow. (Agent D)
- W9 [72] `plan-mission` has 5 sequential user-confirmation phases but NO resume/
  progress gate, unlike self-improve/upgrade-deps/auth-setup family. Interrupt =
  restart. Fix: add a `.plan-mission-progress.md` gate mirroring self-improve.
  (Agent E)
- W10 [70] No agent-crash handling: self-improve/code-review/project-bootstrap
  gate phases on "all N agents complete" but handle only thin/partial responses,
  not a crashed/killed/timed-out agent. Orchestrator HIT this exact case when
  Agent A was killed this run. Fix: add "if an agent returns no output, relaunch
  once or proceed with an explicit gap note." (Agent E + lived experience)
- W11 [65] 13 skills carry vestigial per-model routing boilerplate but never
  invoke the Agent tool (auth/analytics/compliance/payments/i18n/testing-setup,
  powerpoint-addin-setup, project-bootstrap, sandbox, file-organizer,
  internal-comms, video-downloader, doc-pdf/doc-xlsx). Dead instruction. Fix:
  strip the routing line from non-orchestrating skills. (Agent E)
- W12 [65] `.claude/settings.local.json` disables the serena MCP server yet still
  lists 11 dead `mcp__serena__*` permissions AND grants unscoped
  Read/Write/Edit/Glob/Grep(*) (broader than global's dir-scoped grants). Fix:
  drop the dead serena perms; confirm the unscoped grants are intentional.
  (Agent D)
- W13 [60] Overstated citation: `prompting-quality.md:104-107` states
  "Opus-tier models over-elaborate without explicit constraint" as established
  fact and escalates to a hard "must" at :109; arXiv:2604.00025 tested 31 OPEN
  models 0.5B-405B, named no frontier closed model. Also plan-mission:412,
  self-improve:243,804. Fix: restate as observed-in-practice heuristic; keep the
  practice. (Agents C, G)
- W14 [55] `compliance-setup` lacks the "verify against current docs" step its
  siblings (auth/payments/analytics-setup) have, despite integrating 4 external
  services (Termly, Canny, SendGrid, R2). Fix: add a verify-against-docs step.
  (Agent E)

### Suggestion
- S1 [55] `templates/autonomous-settings.json:2` `"fallbackModel": "opus"` is a
  bare string; model-config docs show array chain syntax
  `["claude-sonnet-5","claude-haiku-4-5"]`. Not confirmed broken. Fix: verify
  bare-string acceptance or convert to array. (Agents B, D)
- S2 [50] Progressive disclosure: self-improve (809 ln), code-review (534),
  plan-mission (417) SKILL.md have no `references/` dir (0 skills repo-wide do).
  Anthropic Skills spec favors a ~500-token SKILL.md w/ overflow in references/.
  Fix: move stable rubric/template blocks to references/. (Agent G/M4)
- S3 [50] No subagent RETURN-SIZE budget anywhere; parallelism.md §6 governs
  return shape not size. code-review's 11 parallel Sonnet agents feed an
  unbounded checkpoint file. Fix: add "target 1k-2k token returns" to
  parallelism.md §6. (Agent G/M5)
- S4 [48] self-improve scoring rubric (SKILL.md:646-654) duplicates
  code-review's (390-412) instead of referencing it; already drifted
  (code-review has a CLAUDE.md-relevance clause self-improve lacks). Fix:
  reference, don't copy. (Agent H)
- S5 [45] daemon-auth-cooldown / daemon-auth-status.json untracked & not
  ignored. Benign contents. Fix: add `daemon-auth-*` to .gitignore. (Phase 0)
- S6 [45] self-improve verdict table (SKILL.md:678) vs code-review's (482-486):
  when Critical=0 AND Warning=0, both APPROVE and APPROVE-WITH-NITS clauses are
  satisfiable. Fix: make NITS require Warning≥1. (Agent H — orchestrator hit
  this resolving its own verdict; not triggered this run since Warnings>0.)
- S7 [45] parallelism.md:38-67 "Agent prompt structure" is a 10-item list >
  the file's own ≤6-constraint budget (prompting-quality.md:69-81). Numbered
  procedures are exempt, but this is a parallel-prescriptive list. Fix: group
  into sub-sections or mark as an ordered procedure. (Agent G/M3)
- S8 [42] Hook robustness: notify-on-stop.sh:26-28 swallows notifier failures
  silently; check-complexity.py:136-138 fail-open with zero logging;
  session-start.sh:29-37 async auto-install has no timeout. Fix: log on failure;
  add a timeout guard. (Agent D)
- S9 [40] `Notification`, `SubagentStop`, `CwdChanged` hook events unwired.
  Concrete triggers exist (permission-stall alert, agent-completion tracking,
  worktree provisioning). Standing opportunity; adopt with a concrete trigger.
  (Agents D, A)
- S10 [40] Reviewer agents (code-reviewer, architect-reviewer) instructed to use
  `sg`/ast-grep but their tool list denies Bash. Fix: grant scoped Bash(sg:*) or
  drop the ast-grep instruction. (Agent F)

### Notes
- N1 [35] 44 agent files list `MultiEdit`; current sub-agents doc's
  background-subagent allowlist shows `Edit` not `MultiEdit`, and subagents
  background by default (v2.1.198). MEDIUM confidence it silently strips edit
  capability. Comment: `// Code review: verify MultiEdit still resolves for
  background subagents; smoke-test one agent.` (Agent A)
- N2 [35] `it-ops-orchestrator.md` has no Agent/Task tool in frontmatter, so it
  cannot route to the specialists it exists to orchestrate. Verify whether
  orchestration works via another mechanism. (Agent F)
- N3 [30] CLAUDE.md:34-36 mischaracterizes post-compact-context.md (names 1 of 4
  sections; claims content "isn't in any instruction file" when 3 of 4 sections
  condense rules/). Comment on CLAUDE.md:34. (Agent H)
- N4 [30] MEMORY.md has no YAML frontmatter → the v2.1.214 `modified`-timestamp
  feature never activates. Low impact. (Agent A)
- N5 [28] post-compact-context.md restores how to RESUME a batch but not how to
  CLOSE one (the "mandatory between batches" quality gates +
  2-tries-per-gate stop, autonomous-execution.md:68-82, lost on compaction,
  absent from CLAUDE.md). Fund from the commit-format dup at post-compact:21-24.
  (Agent F25)

## Research resolution (three-tier, per skill)
- N=40 instruction ceiling (arXiv:2607.19257) — Medium evidence, High
  applicability (Sonnet 5/Haiku named). But W1's config-side fix does NOT depend
  on the preprint: the "rules aren't resident" claim is refuted by direct
  observation. So W1 is a confirmed defect, not [frontier-lag]. The deeper
  "should we cut rule volume" question is [frontier-lag]: real signal, but the
  remedy (paths: scoping) is blocked on W7 verification. Rule holds pending that.
- Brevity constraints (arXiv:2604.00025) — Medium evidence, Low-Med
  applicability (no frontier model tested). Config ALREADY applies it to 6/6
  Opus agents (Aligned). W13 corrects only the overstated warrant, not the
  practice. Extending to Sonnet reviewers = judgment call, left as non-finding.
- Constraint pinning through compaction (arXiv:2606.22528) — config is AHEAD
  (PostCompact hook + file-on-disk pin). Not a finding. (Agent C)

## Dropped / reconciled
- "post-compact missing diagnosis restore" — NOT repeated; diagnosis lives in
  CLAUDE.md:59-61 which reloads verbatim (prior false positive, F verified).
- Agent-A MultiEdit → Note not Warning (unconfirmed; MultiEdit absent from this
  harness anyway; most agents also list Edit).
- rules/ paths:-scoping as an immediate fix → deferred behind W7 (feature
  unverified). Not dropped, sequenced.

## Verdict: REQUEST CHANGES (Critical=1, Warning=15)
