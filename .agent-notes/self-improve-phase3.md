# Self-improve Phase 3 — synthesis, dedup, scoring (2026-10-08)

Inputs: phase1 A/B/C/X(Discovery Summary), phase2 D/E1/E2/F/G/H, orchestrator
notes (Verified section treated as settled). Agent I and Agent F per-file
verdict tables are verdicts, not findings: not scored. Every Critical/Warning
below was re-checked against the source file this run unless marked
"(agent-verified)".

## Counts

| Stage | Total | Critical | Warning | Suggestion | Note |
|---|---:|---:|---:|---:|---:|
| Raw (agent-labelled items, approx.) | ~385 | 1 | ~70 | ~170 | ~145 |
| After dedup (distinct root issues) | 241 | — | — | — | — |
| After filter (kept) | 156 | 1 | 49 | 94 | 12 |
| Dropped (score <25, already tracked, or merged) | 85 | | | | |

Raw by source: A 49, B 34, C 15, X 2, D 42, E1 98, E2 73, F 27, G 10, H 25,
orchestrator 10. Raw severity split is approximate (agents mixed severity
labels, confidence scores and table rows). Severity after filter is this
pass's own assignment under the rubric (0-24 drop; 25-49 Note/Suggestion;
50-74 cap Suggestion; 75+ keep).

## Findings by theme

Execution order hint: A (S-001 first; S-010/S-011 depend on it) → B → C →
D/E (self-improve spec + registry, before the next run) → F, G, H.

### A. Hooks and compaction

- **S-001 Critical 95** — `settings.json:154-162`, `hooks/session-start.sh`
  (no `compact` branch), `CLAUDE.md:70-79`. PostCompact `cat
  ~/.claude/post-compact-context.md` writes plain stdout, which for PostCompact
  goes to the debug log only (hooks.md:786: only UserPromptSubmit,
  UserPromptExpansion, SessionStart, PostModelSwitch inject stdout). The file
  has never reached context after compaction; CLAUDE.md "On Compaction"
  describes behaviour that does not occur and also miscounts sections (says 5;
  file has 6). Fix: register the `cat` under `SessionStart` with
  `"matcher": "compact"` (settings.json and templates/autonomous-settings.json),
  delete the PostCompact entry, rewrite CLAUDE.md:70-79 to one line without a
  section count; verify once with `claude --debug` after `/compact`.
  Sources: D, Orchestrator (verified), H (Dead #3, Verbose #5), F.
- **S-002 Warning 80** — `settings.json:164-172`. PreCompact `echo '--
  COMPACTING ...'` is a no-op (stdout → debug log). Fix: delete, or replace
  with a handoff-note writer. Sources: D.
- **S-003 Warning 80** — `settings.json:118-126`. ConfigChange runs
  `session-start.sh`; its output is discarded on that event, and it re-runs
  tool checks/venv setup on every config edit. Fix: remove the entry (optionally
  an async `log-hook-event.sh ConfigChange`). Sources: D.
- **S-004 Warning 75** — `settings.json` PreToolUse `guard-bash.py` entry (and
  template copy). Safety hook fails open on crash/timeout; `onFailure: "block"`
  (2.1.295) exists, 0 uses. Fix: add `"onFailure": "block"` to guard-bash only;
  confirm field semantics in hooks doc first (B saw it only in the changelog).
  Sources: A, B.
- **S-005 Warning 75** — `hooks/nudge-search-tool.py:243`.
  `permissionDecision: "allow"` (F090 fix) silently approves every nudged Grep,
  including ones outside working dirs that would otherwise prompt. Fix: emit
  only `hookSpecificOutput.additionalContext`, no decision; verify delivery in
  debug log; add a test. Sources: D.
- **S-006 Warning 85** — `hooks/_hooklib.sh:22-42`. Rotation renames but never
  deletes; `logs/` is 75 MB (du verified). Fix: delete rotated siblings older
  than N days in `hook_rotate_log` (or from a SessionEnd hook). Extends F040
  (done). Sources: D.
- **S-007 Warning 85** — `hooks/_hooklib.sh:55-78`. Redaction covers only
  `tool_input.command`/`error`; SubagentStop rows (~95% of volume) persist
  `background_tasks[].command`, `last_assistant_message`, `transcript_path`
  unredacted for weeks (logging.md no-secrets). Fix: allow-list SubagentStop
  fields (`session_id, agent_id, agent_type, cwd, stop_hook_active,
  logged_at`). Sources: D (agent-verified sample).
- **S-008 Warning 82** — `hooks/quality-gate.sh:57`. `^([^:]+):(.+)$` splits
  bare commands like `npm run test:unit` at the first colon. Fix: require
  `": "` separator, document, add a test case. Sources: D.
- **S-009 Warning 78** — `hooks/autonomous-toggle.sh:43-56`. When the source
  profile changed, `cmp` fails and `cp` overwrites `settings.pre-autonomous.json`
  with the old autonomous profile; `off` then restores elevated settings and
  deletes the backup. Fix: never overwrite an existing backup (or skip when the
  current file matches any known autonomous source); add a test. Sources: D.
- **S-010 Suggestion 65** — `post-compact-context.md:34-37`. "Opus restraint"
  is the only model-behaviour line restored, for every model; model-routing.md
  tells Fable (the autonomous-mission model) to invert it. Fix: prefix "If
  routed to Opus:" and add one Fable line, or drop it. Depends on S-001.
  Sources: F, H.
- **S-011 Suggestion 60** — `post-compact-context.md:1-5, :18-27, :29-43`.
  Commit Format is 10 lines incl. the T15 decision-log HTML comment (:19-21);
  Restraint and Batch Close-Out overlap; no diagnosis line. Fix: compress
  commit format to ~3 lines (pointer to rules/commits.md), merge Restraint +
  Close-Out, add "On any observed defect: state the mechanism before proposing
  a fix", delete the T15 comment. Value is 0 today (file never injected) and
  becomes ~265 tokens/compaction after S-001, because a hook `cat` injects
  comments verbatim. Sources: H, F.
- **S-012 Suggestion 60** — `settings.json` hooks. `StopFailure` unwired
  although `hooks/notify-on-stop.sh:3` acknowledges the gap; `SubagentStart`
  additionalContext could inject `.agent-notes/` pointers. Fix: wire
  StopFailure to the notifier; consider SubagentStart. Do not wire
  speculative events. Sources: A, D.
- **S-013 Suggestion 60** — `hooks/session-start.sh:86`. `setup-complexity.sh`
  (pip installs) runs synchronously with no timeout; the wrapper exists at
  :29-47. Fix: reuse `run_with_timeout` or print the hint only. Sources: D.
- **S-014 Suggestion 60** — `hooks/project-init.sh:24-42,80-88`. Writes
  `.agent-notes/`, `.mcp.json` (hard-coded serena path), `.serena/`,
  `.gitignore` into every git repo on first prompt, and re-runs detection each
  prompt. Fix: early exit once set up; allow-list repo roots; stop writing
  `.mcp.json` (serena is user-scope). Sources: D.
- **S-015 Suggestion 60** — `hooks/guard-bash.py:40-45,156-161`. PROTECTED
  lacks `~/.claude`, `~/git`; `check_sudo` misses `env X=1 sudo`/`time sudo`.
  Fix: add paths; apply `_strip_prefixes` in check_sudo. (Best-effort per
  F134.) Sources: D.
- **S-016 Suggestion 60** — no tests for `nudge-search-tool.py`,
  `autonomous-toggle.sh`, `_hooklib.py/.sh`, `session-start.sh`
  (`quality-gate.sh:178-182` runs three suites). Fix: start with
  autonomous-toggle (S-009) and nudge pure functions. Sources: D.
- **S-017 Suggestion 55** — `hooks/record-turn-start.sh:10`,
  `notify-on-stop.sh:21`. One global `.runtime/claude-turn-start` shared by all
  sessions. Fix: key by `session_id`. Sources: D.
- **S-018 Suggestion 50** — `hooks/complexity-ignore:14-23`. Machine-specific
  plantuml-ts absolute paths in a global file; one entry uncommented. Sources: D.
- **S-019 Suggestion 45** — `hooks/check-complexity.py:157-208`. Duplicated
  git-toplevel + `git show` block. Fix: extract `_git_show_head(path)`.
  Sources: D.
- **S-020 Suggestion 40** — hook handler `if` field unused; check-frontmatter
  and check-complexity spawn on every Write/Edit. Fix: narrow with `if`
  globs; keep script-side guards. Sources: A.
- **S-021 Suggestion 30** — `hooks/session-start.sh`: warn on resume when
  `prompt_cache_likely_expired` and `context_tokens` large. Sources: A.
- **S-022 Note 30** — 2.1.292 escapes `<system-reminder>` in hook output;
  2.1.248/2.1.214 changed stdout/exit-2 handling. Spot-check
  session-start.sh/log-hook-event.sh stdout. Sources: A.
- **S-023 Note 30** — `hooks/.venv`, `hooks/.pytest_cache`: confirm ignored
  (`git check-ignore` matched only `__pycache__`). Sources: D.

### B. Model and effort currency

- **S-024 Warning 95** — `settings.json:294-299`. Top-level `effortLevel:
  "high"` is ignored by Opus 5.5; the only per-model key is `claude-opus-5`
  (Opus 5). The orchestrator therefore runs at Opus 5.5's default `medium`,
  not the `high`/`xhigh` model-routing.md assumes. Fix: decide the intended
  level; `/effort <level>` writes `modelSettings."claude-opus-5-5"`; drop the
  stale `claude-opus-5` key (human-applied). Sources: A, B (B1), D,
  Orchestrator (verified: model-config.md:613, settings-reference.md:967).
- **S-025 Warning 85** — `rules/model-routing.md` table/effort note;
  `agents/**` (~84 sonnet agents without `effort:`). Opus/Sonnet/Haiku 5.5
  default to `medium` in Claude Code, so agents that inherited `high` on
  Sonnet 5 silently dropped. The Agent tool `effort` parameter (2.1.292) is
  undocumented in rules. Fix: one sentence in model-routing.md ("5.5 models
  default medium; `effort:` frontmatter or the Agent `effort` parameter is
  the opt-in"); set `effort: high` on review/debug agents (debugger,
  code-reviewer, security-auditor) after spot-check. Sources: B (B2), A,
  Orchestrator (verified model-config.md:609).
- **S-026 Warning 90** — `rules/model-routing.md:10,13,20-22`;
  `evals/run_evals.py:31-33`. `haiku`=`claude-haiku-4-5-20251001`, 200k
  context, "effort returns 400 — do not set it" are stale: Haiku 5.5
  (v2.1.293+) has 1M context, adaptive thinking, effort low..max (default
  medium), $0.10/$0.50 (≤100K-token prompts). Fix: update alias line, version
  gate, delete the 200k/400 caveats, restate ">50 files" as cost/recall advice
  (>100K prompts cost 5×); refresh the eval comment. Sources: A, B (B3),
  Orchestrator (verified model-config.md:46,64,600,609).
- **S-027 Warning 80** — `rules/model-routing.md:10` + anti-pattern "Sonnet
  for scoring/grep" vs `skills/code-review/SKILL.md:16-29` (Sonnet scoring,
  deliberate). Stale Haiku claims propagated: `review-pr/SKILL.md:25` ("Sonnet
  + Haiku per that skill"), `upgrade-deps/SKILL.md:14` ("Haiku for
  verification/scoring", no such step), `explore/SKILL.md:16` (haiku dedup
  row, no such step), `self-improve/references/finding-resolution.md:39-43`
  ("unlike /code-review ... Haiku scoring agent"). Fix: add model-routing
  carve-out "scoring that must read source = sonnet; haiku for format/dedup
  by id"; correct the four skill lines. Sources: E1, A.
- **S-028 Warning 85** — `rules/model-routing.md:36-37`. "**Sonnet 5**
  reaches near-Opus-4.8 quality at ~60% ... **Opus 5** is roughly Fable-class
  ..." describe models the aliases no longer resolve to; unsourced. Current
  list prices: Sonnet 5.5 $2/$10 = 50% of Opus 5.5 $4/$20. Fix: delete, or
  replace with a cited 5.5 statement. Sources: B, F, H.
- **S-029 Warning 80** — `skills/plan-mission/SKILL.md:343` ("ran on Opus 5")
  user-visible every run; `:383-390` PerspectiveGap "Known tension" box says
  "Opus 5 ... what `opus` resolves to on v2.1.219+". Fix: ":343 → the
  session's `opus` model"; replace the box with one pointer to
  model-routing.md. Sources: E1, G (G7), B.
- **S-030 Suggestion 60** — `rules/model-routing.md:30` ("`budget_tokens`
  removed on claude-opus-4-8/Sonnet 5" → "not accepted on 4.7+ and all
  5.x"); `:72` and `hooks/log-hook-event.sh:19` ("falls back to Opus 4.8" →
  the provider's default Opus, now 5.5); `:12-13` fable gate v2.1.255 vs
  model-config v2.1.257. Sources: B, F, H, D.
- **S-031 Suggestion 55** — `rules/prompting-quality.md:15` ("4.6+/Fable
  5/Opus 4.8") and `:59-60` (Sonnet 5 tokenizer 1.3× vs 4.6). Fix: "4.7+
  tokenizer (Opus 4.7, 5.x, Haiku 5.5): ~1.3× vs 4.6 and earlier"; generalize
  the model floor. Sources: B, F, H.
- **S-032 Suggestion 45** — `rules/model-routing.md` "Opus behavioral
  compensation" (and 6 agent copies): validated on Opus 4.x, not 5.5. Opus 5
  guide's scope advice matches it (C1), so keep; label the validation basis
  and run `/doctor prompt-audit` once. Sources: A, F, B, C.
- **S-033 Suggestion 45** — `rules/model-routing.md:12-13`: mapping is
  Anthropic-API only; Bedrock/Vertex/Foundry differ. Fix: one clause.
  Sources: B (B4).
- **S-034 Note 35** — `rules/model-routing.md:15-18` PerspectiveGap HTML
  comment is stale ("Opus 5 untested"). Costs 0 resident tokens (stripped);
  delete for human readers only. Sources: H, F, B.
- **S-035 Suggestion 30** — `fallbackModel` only in the autonomous template,
  not user settings. Sources: A.

### C. Permissions and security

- **S-036 Warning 80** — `~/.claude/.claude/settings.json` is byte-identical
  to `settings.autonomous.json` (cmp verified). Every session in this repo runs
  the autonomous profile as project settings (gitignored, invisible to git
  status); the pre-autonomous backup is stale. Fix: regenerate
  `settings.pre-autonomous.json` from current hooks, then
  `autonomous-toggle.sh off ~/.claude` (or delete the project-level files).
  Extends F088/F011. Sources: D.
- **S-037 Warning 75** — `settings.json:93`. `autonomous-toggle.sh on:*` is
  pre-approved; a prompt-injected session can elevate itself without a prompt
  (security floor). Fix: delete :93, keep :94 (`off`). Sources: D.
- **S-038 Warning 75** — `settings.json:91` + `hooks/quality-gate.sh:50-62`.
  The pre-approved script `bash -c`'s every line of the target repo's
  `.claude-quality-gates`: any cloned repo runs arbitrary shell with no prompt
  (security floor). Fix: drop the global allow (keep in the opt-in autonomous
  template) or add a trusted-root check in the script. Distinct from F056
  (auto-invocation). Sources: D.
- **S-039 Warning 75** — `templates/autonomous-settings.json` lacks
  `Bash(ast-grep:*)`/`Bash(lizard:*)` (grep: 0) while rules/lsp.md directs
  subagents to ast-grep; autonomous runs stall on prompts. Fix: add both.
  Sources: D.
- **S-040 Suggestion 70** — `settings.json:41,52,53,54` and others: `git
  push:*`, `git config:*` (hooksPath → exec), `gh api:*` (any verb), `gh
  repo:*` (`delete --yes`), `docker run:*`, `uv:*`, `cp/mv:*`. Fix: narrow to
  benign subcommands (`git config --get *`, `gh repo view/clone`); replace
  `gh api` with a read-only github MCP allow (`mcp__github__get_*`).
  Sources: D.
- **S-041 Suggestion 70** — `templates/autonomous-settings.json`: `git:*`,
  `python3:*`, `node:*`, `psql:*`, `chmod:*`, `docker:*`, `gh:*` unscoped,
  defeating the `./**` file scoping from F011. Fix: specific invocations;
  per-mission additions via /plan-mission. Sources: D.
- **S-042 Suggestion 60** — `settings.json:303-338` `autoMode`: regenerated
  block again hard-codes knowvah/plantuml-ts as the only trusted repo (F091
  human-applied, regressed). Fix: generic global text; add `~/.claude`,
  `~/git/**` as trusted. Sources: D.
- **S-043 Suggestion 55** — `settings.json:98,101,104` `Grep(...)` and the
  template's `Glob(./**)`/`Grep(./**)`: permission doc consults only
  Read/Edit path rules. Fix: delete. Sources: D.
- **S-044 Suggestion 50** — `settings.json:99` `Edit(~/.claude/**)` lets any
  session rewrite hooks/settings unprompted. Fix: scope to
  `{rules,skills,agents,docs}/**`. Sources: D.
- **S-045 Suggestion 50** — `settings.json:105` bare `WebFetch` allow (any URL,
  exfiltration channel). Fix: domain-scoped allows. Sources: D.
- **S-046 Suggestion 50** — uncommitted `settings.json` /
  `templates/autonomous-settings.json` diff (~18 days) includes an untracked
  default-model change Fable→`opus` and lost trailing newline. Fix: commit
  with stated reason. Sources: D.
- **S-047 Suggestion 45** — `permissions.defaultMode` unset; auto mode is now
  the silent default (2.1.284). Fix: set explicitly. Sources: A.
- **S-048 Suggestion 45** — `~/.claude/.claude/.mcp.json`: serena with
  `--project ~/.claude/.claude` and a hard-coded path; likely a second instance
  beside the user-scope one. Fix: confirm with `claude mcp list`, delete.
  Sources: D.
- **S-049 Suggestion 30** — `settings.json:30,76-92` rarely-firing
  project-specific allows (`forge lint`, `ollama`, `docker model`, ...) →
  per-project `settings.local.json`. Sources: D.
- **S-050 Note 30** — `agents/04-quality-security/code-reviewer.md:6-7`:
  `memory: user` auto-enables Write/Edit vs `disallowedTools: Write, Edit`;
  precedence undocumented. Sources: A.

### D. self-improve skill spec defects

- **S-051 Warning 90** — `skills/self-improve/references/phase1-research-agents.md:62-101`.
  Alias/version note says installed v2.1.278, `opus`→Opus 5, `sonnet`→Sonnet 5,
  and tells Agent B not to flag configs on that basis; ID list omits 5.5 IDs;
  effort table Opus 5/Sonnet 5 only; `best` row stale. Regression of F193.
  Fix: replace :75-101 prose with a pointer to rules/model-routing.md +
  model-config doc; keep only the alias-validity list. Sources: E1, B,
  Orchestrator.
- **S-052 Warning 90** — `phase1-research-agents.md:20` (Agent A writes
  Candidate URLs) vs `:292` (Agent X, parallel, writes the same section):
  violates parallelism.md file ownership. Fix: X (or Phase 6) sole writer;
  A/B/C emit candidates in their notes. Sources: Orchestrator.
- **S-053 Warning 90** — `phase1-research-agents.md:332` ("Never delete a
  candidate") vs `references/url-registry.md:25-27` (move and remove on
  promotion); 18 URLs now appear twice in research-urls.md. Fix: adopt move
  semantics (or "never delete unpromoted candidates"), then dedupe. Sources:
  Orchestrator.
- **S-054 Warning 90** — `references/phase2-audit-agents.md:14-26, :29-31`.
  Agent D file list omits ~12 hook files (guard-bash, check-complexity,
  check-frontmatter, session-start, nudge, _hooklib, log-*) and the
  `.claude/settings.*.json` copies; Dimension 1 names 9 of 33 hook events.
  Fix: glob (`hooks/*.{sh,py}` minus `test_*`, `.claude/settings*.json`,
  `.mcp.json`) and "diff wired events against the docs' event list".
  Sources: D, Orchestrator.
- **S-055 Warning 85** — `references/phase2-audit-agents.md:49-52`. Agent E
  reads all skills incl. gitignored `skills/synced` and vendored `doc-*`
  (~764 KB, ~190k tokens), over prompting-quality.md's per-agent budget.
  Fix: spec E1 (workflow) / E2 (scaffolding), exclude gitignored/vendored
  dirs; Agent I reads both. Sources: Orchestrator.
- **S-056 Warning 85** — `references/phase0-recall.md:1-25`. Duplicate
  "for fidelity" copy of the resume stub already diverged from SKILL.md:25-28
  (no interrupted-barrier branch) and says Phase 1 has "nine agents" (four).
  Fix: delete :1-25, keep steps 1-6. Sources: E1.
- **S-057 Warning 80** — `phase1-research-agents.md:150` and
  `references/nist-refresh.md:67` ("every other Phase 1 agent waits on Agent
  C") vs `phase1-research-agents.md:337` ("any two of A, B, C"). Also only
  Agent G consumes Phase 1 output. Fix: one model — launch D/E/F/H with Phase
  1, gate only G on C; reword the NIST cap rationale. Sources: E1,
  Orchestrator (Medium on the gate-only-G part).
- **S-058 Warning 75** — `references/fleet-monitoring-drift.md:18,69`
  (`:42-75`, `:95-98`) and `docs/fleet/lifecycle.md:85` cite line numbers that
  no longer match; Agent B is pointed at the wrong text every run. Fix: cite
  headings. Sources: E1, B.
- **S-059 Suggestion 65** — `skills/self-improve/SKILL.md:29-31`. Resume loads
  "D through H"; Agent I's verdict table (needed verbatim in Phase 5) is never
  reloaded. Fix: "D through I". Sources: E1.
- **S-060 Suggestion 60** — `docs/fleet/lifecycle.md:74-99` +
  `fleet-monitoring-drift.md`: drift check compares against a deprecated set
  lifecycle.md never states — vacuous. Fix: define deprecated as status
  Deprecated/Retired on the model-deprecations page. Sources: B.
- **S-061 Suggestion 55** — Phase 2 spec ignores built-in auditors:
  `/doctor prompt-audit` (2.1.283), `/skill-doctor`, `/usage` per-skill cost.
  Fix: run them once per run and feed output to G/H/I. Sources: A.
- **S-062 Suggestion 55** — `SKILL.md:71` and `:118` duplicate the Phase 3
  Opus-routing + brevity sentence. Fix: delete :118. Sources: E1.
- **S-063 Suggestion 55** — `phase1-research-agents.md:127` search string
  "Claude Code advanced patterns 2025". Fix: drop the year. Sources: E1.
- **S-064 Suggestion 50** — `phase1-research-agents.md:203-219` restates
  prompting-quality.md's paper summary. Fix: pointer + keep "Evaluate:"
  questions. Sources: E1.
- **S-065 Suggestion 50** — No model named for Agents A-I; all inherit the
  orchestrator model. Fix: `sonnet` for D/H and mechanical passes. (The
  `context: fork` part is F166 — see Merged.) Sources: E1.
- **S-066 Suggestion 30** — `references/output-formats.md:55` vs
  `SKILL.md:105` hand-off string differs. Sources: E1.
- **S-067 Note 35** — `phase2-audit-agents.md:99-106,137-141,183-190`
  hard-coded agent/skill sample lists will rot on renames. Sources: E1.

### E. Research URL registry (fetch-guard reconciliation)

Per output-formats.md unreachable-URL rule; registry status changes are
Phase 6's job (url-registry.md §3), these carry the replacement work.

- **S-068 Warning 80** — `skills/self-improve/research-urls.md` docs entries
  read through WebFetch truncate at 100k chars: changelog (1.04M; 2.1.265-2.1.286
  invisible to B), hooks (257k; cut mid-InstructionsLoaded), settings-reference
  (419k; `onFailure` not reached), sub-agents, mcp, skills, agent-view. Thin
  fetch per the guard. Fix: phase1 spec fetches `code.claude.com/docs/en/<page>.md`
  and the raw CHANGELOG.md via `curl` to scratchpad and greps (the orchestrator's
  verification method); register raw CHANGELOG.md. Sources: A, B, Orchestrator.
- **S-069 Suggestion 65** — `research-urls.md` `/docs/en/settings` is the
  precedence page; key reference is `/docs/en/settings-reference`. Fix:
  replace/add. Sources: A, B.
- **S-070 Suggestion 65** — arXiv PDF URLs `2607.25398`, `2603.24755` return
  unreadable binary. Fix: swap to `abs/`/`html/` URLs. Sources: C, X.
- **S-071 Suggestion 60** — Discovery Queries using `site:platform.claude.com`,
  `site:anthropic.com/research` ignore the operator (0 on-domain hits). Fix:
  WebSearch `allowed_domains` or drop. Sources: X, Orchestrator (Medium).
- **S-072 Suggestion 55** — `/docs/en/tutorials` serves the "Common workflows"
  page (title mismatch). Fix: update URL/label. Sources: A.
- **S-073 Suggestion 45** — `anthropic.com/research` and `/blog` indexes show
  only Sep-Oct 2026 (older behind "See more"). Fix: add llms.txt / a dated
  listing source. Sources: A, C.
- **S-074 Note 30** — `/docs/en/whats-new` newest digest is Week 37; check
  w38-w40 per-week URLs. Sources: A.

### F. Workflow skills

- **S-075 Warning 80** — `skills/sandbox/SKILL.md:79,85-86`. "Store all
  retrieved values as shell variables for use in Phase 7"; each Bash call is a
  fresh shell, so Phase 7 `docker run` gets empty secrets/paths. Fix: run
  Phases 2-7 as one Bash invocation or persist non-secret paths to a state
  file and re-fetch secrets inline in Phase 7. Sources: E1.
- **S-076 Warning 75** — `sandbox/SKILL.md:204`. Foreground `docker run` for a
  1-4 h mission exceeds the 10-min Bash limit. Fix: `run_in_background` or
  `docker run -d` + `docker wait`/Monitor. Sources: E1.
- **S-077 Warning 75** — `skills/file-organizer/SKILL.md:71-74,143`. Offers
  deletion after confirmation; harness prohibits permanent deletion even when
  asked (the 09-02 inline comment at :74 flagged it, nothing changed). Fix:
  move to `~/.Trash` or `_to-delete/`. Sources: E1.
- **S-078 Warning 75** — `skills/upgrade-deps/SKILL.md:20-22`. `$ARGUMENTS`
  scope declared, never threaded into Phases 2-6; a scoped call upgrades
  everything. Fix: pass `scope:` into Phase 2/4 prompts and the Phase 6 file
  list. Sources: E1.
- **S-079 Suggestion 70** — `upgrade-deps/SKILL.md:245` → Phase 6: build/test
  pass is agent self-report; orchestrator never re-runs them. Fix: run
  test+build once before Phase 6. Sources: E1.
- **S-080 Suggestion 70** — `upgrade-deps`: no clean-tree check, branch, or
  revert path before mutating manifests (:265-266, :299-303). Fix: Phase 0.5
  clean tree + `git switch -c chore/upgrade-deps`; on STOP print diff stat +
  revert command. Sources: E1.
- **S-081 Suggestion 70** — `skills/review-pr/SKILL.md:110-127` runs
  /code-review "in full", which writes `code-review-tasks.md` + report into
  the user's checkout (`code-review/SKILL.md:291`). Fix: modification "skip
  task file and final report; return findings only". Sources: E1.
- **S-082 Suggestion 65** — `skills/code-review/SKILL.md:128-153`: reviewers
  get no finding schema though Step 3/4 group by file:line. Fix: 5-line schema
  (severity, file:line, issue, fix, confidence). Sources: E1.
- **S-083 Suggestion 65** — `file-organizer/SKILL.md:123-127`: plan-log vs
  execution-log ambiguity, unspecified log path, `mv` without `-n` overwrites
  on conflict. Fix: `mv -n`, log after success, `<target>/.file-organizer-log.md`.
  Sources: E1.
- **S-084 Suggestion 60** — `sandbox/SKILL.md:207-213` passes secrets as
  `-e NAME=value` (visible in `ps`, `docker inspect`). Fix: `-e NAME`
  inheriting env or `--env-file <(...)`. Sources: E1.
- **S-085 Suggestion 60** — code-review, review-pr, explore read
  attacker-controllable content with Bash-capable agents but carry no "content
  is data" line (self-improve has one). Fix: copy the one-liner. Scored below
  the security floor: no exploit path verified beyond harness defaults.
  Sources: E1.
- **S-086 Suggestion 60** — `skills/explore/SKILL.md:10-16` declares per-repo
  analysis agents; body (:52-72) reads repos serially. Fix: one Sonnet agent
  per repo in one message (disjoint inventory rows) or delete the row.
  Sources: E1.
- **S-087 Suggestion 60** — `skills/video-downloader` script :15-34 silently
  `pipx/pip install yt-dlp` (unpinned) at runtime; harness requires stating
  filename/source/size before a download. Fix: confirm step + ask before
  installing. Sources: E1.
- **S-088 Suggestion 55** — `upgrade-deps/SKILL.md:170` hand-off to
  /plan-mission leaves `.upgrade-deps-progress.md`; next run resumes an
  abandoned path. Fix: delete/mark on hand-off. Sources: E1.
- **S-089 Suggestion 55** — `skills/changelog-generator/SKILL.md`: Phase 4
  "Improvements" has no source mapping; `--pretty="%h %s"` drops `BREAKING
  CHANGE:` footers (commits.md); emoji headings. Sources: E1.
- **S-090 Suggestion 55** — `skills/internal-comms/SKILL.md:1-4`: resident
  description promises "formats that your company likes" but holds only
  generic samples; auto-triggers. Fix: `disable-model-invocation: true` (or
  delete). Sources: E1.
- **S-091 Suggestion 55** — `code-review/SKILL.md:33,170` fixed
  `/tmp/code-review-findings.md`; concurrent reviews clobber (F100 class).
  Fix: key by repo hash + head_sha. Sources: E1.
- **S-092 Suggestion 55** — `skills/plan-mission/SKILL.md`: :31 "phases 1
  through 7" vs template phases 1-8; brevity strings duplicated at :395-401;
  Phase 6 lacks "wait for confirmation"; Phase 8 baseline-failure handling
  undefined; Phase 1 reuses `docs/architecture/overview.md` with no staleness
  check. Sources: E1, G (G6).
- **S-093 Suggestion 50** — `file-organizer/SKILL.md:172-235` ~60 lines of
  generic advice; per-file hashing spawns (:31,:62); no exclusion list for
  dotfiles/`~/Library`/git repos. Sources: E1.
- **S-094 Suggestion 50** — sandbox hygiene: `cp -R ~/.claude/hooks` copies
  30 MB `.venv` (:143); detect clone never cleaned (:83-87); no `--model`/
  budget cap in the container. Sources: E1.
- **S-095 Suggestion 50** — explore: PlantUML never syntax-checked; step
  numbering gap (:39-48) and no `gh repo view` failure path; "stale" undefined
  (:29). Sources: E1.
- **S-096 Suggestion 50** — narrated history inside instructions:
  `code-review/SKILL.md:230-238`, `checklists.md:1-9`,
  `scoring-rubric.md:3-5`, `sandbox/SKILL.md:262-265` (dead pointers to
  gitignored `plans/` D9/D11/T32). Fix: keep operative rule only. Sources: E1.
- **S-097 Suggestion 45** — plan-mission `allowed-tools` (:9) has no
  WebFetch/WebSearch; library/service decisions rest on training data.
  Sources: E1.
- **S-098 Suggestion 45** — code-review: no dimension→agent mapping
  (:135-136); verdict required at top (:275) and end (:284). Sources: E1.
- **S-099 Suggestion 45** — `skills/fix/SKILL.md`: no revert offer after 5
  failed iterations (:92-102); language-agent table borrowed from
  upgrade-deps (:65-67); stale maxTurns comment (:59). Sources: E1.
- **S-100 Suggestion 45** — upgrade-deps: Phase 2 research prompts
  unspecified (:127-128); single "upgrade all" commit vs pr-workflow.md;
  `ts6-migration.md:57-58` phase-number drift; monorepo section misplaced
  (:70-81). Sources: E1.
- **S-101 Suggestion 45** — `skills/commit/SKILL.md:21-26`: no
  "no Co-Authored-By/generated footer" line (commits.md); pre-staged-files
  behaviour ambiguous. Sources: E1.
- **S-102 Suggestion 40** — `review-pr/SKILL.md:285-287`: 422 "fix the
  payload" is wrong when an existing PENDING review causes it (GitHub
  behaviour from memory, MEDIUM). Sources: E1.
- **S-103 Suggestion 40** — `skills/forge-app/SKILL.md:10` allowed-tools
  omits Monitor though :71 mandates it; no record of deployed probes for
  :108 cleanup. Sources: E1.
- **S-104 Suggestion 40** — `skills/webapp-testing/SKILL.md`: no
  assertion/view-screenshot guidance; no port-in-use/never-ready handling.
  Vendored; minimal edit. Sources: E1.
- **S-105 Suggestion 35** — imported skills use CRITICAL emphasis:
  `doc-pptx/SKILL.md:53,155,179,218,307,319`, `webapp-testing/SKILL.md:67`,
  `doc-docx`. Fix: plain imperatives with reason. Sources: C (C2).

### G. Scaffolding skills

- **S-106 Warning 85** — `skills/project-bootstrap/SKILL.md:130-138`:
  progress template lists `testing-setup` first "(in execution order)" while
  :106-108 runs it last; resume executes in the wrong order. Sources: E2.
- **S-107 Warning 75** — `auth-setup/SKILL.md:429`,
  `payments-setup/SKILL.md:403`, `compliance-setup/SKILL.md:367`,
  `i18n-setup:236`: test steps use `test/helpers/db.ts`, which exists only
  after testing-setup (now last, per F029); `tsc --noEmit` then fail-stops the
  bootstrap. Needs a design decision (split testing-setup, or defer all
  write-tests steps). Sources: E2 (consequence of F029 fix).
- **S-108 Warning 85** — `skills/analytics-setup/SKILL.md:343-350`:
  `useAnalytics()` (React hook) called in the plain `api.ts` fetch wrapper →
  "Invalid hook call". Fix: module-level capture registration or event
  bridge. Sources: E2.
- **S-109 Warning 80** — `analytics-setup/SKILL.md:360-365`
  (`POSTHOG_API_KEY` in `[vars]`), `compliance-setup/SKILL.md:300-312`
  (`R2_ACCESS_KEY_ID`, `SENDGRID_API_KEY` in `[vars]`; `R2_SECRET_ACCESS_KEY`
  required by `sbom_cron.ts` never mentioned). Secret/var name collision and
  security.md/environment.md violation. Fix: `wrangler secret put` +
  `.dev.vars.example`. Sources: E2.
- **S-110 Warning 80** — `auth-setup/backend/utils_oauth.ts:25-45`,
  `routes_auth.ts:199-205`: OAuth `state` = timestamp + HMAC, not bound to the
  browser (no cookie nonce/PKCE) → login CSRF, replayable within 10 min
  (security floor). Fix: HttpOnly `oauth_state` nonce cookie in signed state;
  add PKCE. Sources: E2 (agent-verified).
- **S-111 Warning 80** — `compliance-setup/SKILL.md:6` allowed-tools lacks
  WebFetch though Step 1b (:92) requires it; same gap in
  `project-bootstrap/SKILL.md:5` (sub-skill docs steps run under its list) and
  `brand-knowvah`. Fix: align allowed-tools with steps. Sources: E2.
- **S-112 Warning 80** — `testing-setup/SKILL.md:140-145`,
  `config/vitest.config.ts:1-12`: "vitest 5 not yet supported" and
  `vitest@^4.1.0` cap; `@cloudflare/vitest-plugin` 1.4.0 peers `^4.1.0 ||
  ^5.0.0`. Fix: remove cap after checking `@vitest/coverage-istanbul` peers.
  Sources: E2.
- **S-113 Warning 85** — `brand-knowvah/SKILL.md:376` runs `npm run
  i18n:translate`; i18n-setup defines `translate` (`i18n-setup/SKILL.md:204`).
  Fix: `npm run translate`. Sources: E2.
- **S-114 Warning 75** — i18n footer keys `login.footer.{privacy,terms,cookies}`
  have three different English values across compliance-setup
  (`i18n/en_auth_consent.json`), auth-setup Step 13, brand-knowvah Step 15;
  "do not overwrite" makes run order pick the winner. Fix: one owner
  (compliance-setup). Sources: E2.
- **S-115 Warning 75** — `payments-setup/backend/routes_payments.ts:149-172`
  grants credits on `checkout.session.completed` without `payment_status ===
  'paid'` (verified absent); async methods credit before funds clear. Fix:
  check paid; handle `async_payment_succeeded`/`failed`. Sources: E2.
- **S-116 Warning 75** — external calls without timeouts (error-handling.md):
  `analytics-setup/backend/services_analytics.ts:50` fetch,
  `routes_payments.ts:29` Stripe client (no `timeout`/`maxNetworkRetries`,
  verified), Anthropic client in `i18n-setup/scripts/translate.ts`. Fix:
  `AbortSignal.timeout`, `timeout: 10_000, maxNetworkRetries: 2`. Sources: E2.
- **S-117 Warning 75** — `testing-setup/test/globalSetup.ts` (~:57-62)
  ignores `spawnSync('psql', ...)` status; failed migrations are swallowed.
  Fix: fail on non-zero with stderr. Sources: E2.
- **S-118 Warning 75** — `testing-setup` Step 12 + `config/vitest.config.ts:104-109`:
  90% thresholds with one bootstrap test → `test:coverage` (ci.yml:72) red on
  first push; compliance ships untested `routes_feedback.ts`, `sbom_cron.ts`,
  `services_audit.ts`, and Step 7.3 runs `test/feedback.test.ts` that no step
  creates. Fix: ratchet/`COVERAGE_ENFORCE` gate or state CI-red explicitly;
  create or drop the feedback test. Sources: E2.
- **S-119 Warning 75** — `brand-knowvah` Step 9 removes only the Canny link
  when compliance-setup was not run; `Layout.tsx:51-53` policy links reference
  undefined ROUTES → tsc failure. Sources: E2.
- **S-120 Suggestion 70** — `analytics-setup/frontend/AnalyticsContext.tsx:46-75`:
  consent withdrawal never calls `opt_out_capturing()`/`reset()` (GDPR).
  Sources: E2.
- **S-121 Suggestion 65** — `i18n-setup/scripts/translate.ts:4,31-47,175`:
  default `claude-opus-4-8` for bulk translation (model-routing anti-pattern;
  not the current alias target) → `claude-sonnet-5-5`; hand-rolled `withRetry`
  (F051) stacks on SDK's default 2 retries and reads `retry-after` from a
  `Headers` object as a record (never matches). Fix: SDK `maxRetries`/`timeout`,
  drop the copy; re-check 4.7+ param rules. Sources: E2, B.
- **S-122 Suggestion 65** — `powerpoint-addin-setup/SKILL.md:137,153`: agent
  runs `office-addin-dev-certs install` (OS trust-store change — harness
  prohibits system security changes); frame as user-run. Also `VITE_PID`
  unset before trap under `set -u`; Windows sideload uncovered. Sources: E2.
- **S-123 Suggestion 60** — `auth-setup/SKILL.md:460,465` readiness lists
  token-refresh and JWT-key failures; the skill has neither. Fix: state verify
  failures, KV error rate. Sources: E2.
- **S-124 Suggestion 60** — SKILL.md version pins behind: stripe 22.6.2 (23.0.0),
  posthog-js 1.434.2, react-i18next 17.0.14, @anthropic-ai/sdk 0.127.0. Fix:
  install latest then record, or a pin-check step. Sources: E2.
- **S-125 Suggestion 60** — `brand-knowvah/SKILL.md:327-331` Tailwind v3
  `tailwind.config.ts` guidance in a v4 skill. Sources: E2.
- **S-126 Suggestion 55** — logging.md: `services_analytics.ts:62,67`
  free-form `console.warn` (F095 residual); three `logger.ts` copies
  (auth/payments/compliance) without `trace_id`. Fix: one shared logger with
  request child. Sources: E2.
- **S-127 Suggestion 50** — ~330 lines of Step 0/cleanup/"mark [x]"
  boilerplate across nine scaffolding skills, already diverging. Fix:
  `skills/_shared/progress-protocol.md`. Sources: E2.
- **S-128 Suggestion 50** — `payments-setup` `handleBuyPack` passes no Stripe
  `idempotencyKey` (retry-idempotency.md). Sources: E2.
- **S-129 Suggestion 45** — `project-bootstrap/SKILL.md:69` "Vitest + Workers
  pool" stale; sub-skill vs bootstrap progress files can disagree. Sources: E2.
- **S-130 Suggestion 45** — `testing-setup` coverage `include: ['src/**/*.ts']`
  excludes `ui/src` despite "90/90/90" claim. Sources: E2.
- **S-131 Suggestion 40** — brand-knowvah: `Sidebar.tsx` CCN ~13 vs 10 limit;
  `brand-knowvah/.mcp.json` personal paths not in skill .gitignore; posthog
  unpinned vs analytics pin. Sources: E2.
- **S-132 Suggestion 40** — auth-setup Steps 9/10 duplicate the Response
  pitfall paragraph; compliance IRREVERSIBLE note renders as stray text
  (~:212) and Step 0 can skip the Step 1b docs check. Sources: E2.
- **S-133 Note 40** — dangling refs: `AnalyticsContext.tsx:21` "skill's
  README" (none); `constants_payments.ts:6-9` cites a removed
  `@ts-expect-error`. Sources: E2.

### H. Rules and CLAUDE.md tightening

- **S-134 Warning 85** — `rules/prompting-quality.md:36`: "a pilot came back
  RED and review enforces its absence" is false: 771e555 (T16) recorded GREEN
  on 2.1.278, `docs/fleet/charter.md:43-45` names diagrams.md as the AD-1
  exception, and path-scoped loading was observed on 2.1.292. Fix: correct
  the sentence; re-pilot 2-3 domain rules (observability, api-design,
  retry-idempotency) with source-file globs and measure. Sources:
  Orchestrator, H (Dead #7), A, F.
- **S-135 Warning 75 [research overrides rule]** — `rules/extended-thinking.md:24-30`
  Self-refine instructs explicit critique/refine passes for architecture,
  security, test plans (Opus-routed work). Opus 5 prompting guide (Tier 1):
  explicit re-check instructions cause over-verification. Fix: scope to
  Sonnet/Haiku outputs; "on Opus 5+ raise effort instead". Sources: C (C1,
  C14), G (G4), F.
- **S-136 Warning 75** — `rules/security.md:28` forbids internal IDs in
  responses; `rules/error-handling.md:34-38` models "User 42 not found".
  Fix: "client-facing: caller-supplied identifier only; internal IDs to the
  server log". Sources: F.
- **S-137 Warning 75** — `CLAUDE.md:56`: "`subagent_type: "agent-team"` is
  available"; agent teams need `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, set
  nowhere (grep 0). Fix: state the requirement or set it. Sources: A.
- **S-138 Suggestion 60 [research overrides rule]** —
  `rules/prompting-quality.md:61-62` "Recall degrades sharply past ~128k
  tokens ... compact or split" rests on one preprint; Opus 5 guide documents
  consistent behaviour to 1M. Fix: "one preprint reports a 64-128k cliff on
  some models; split on evidence, not a fixed trigger". Sources: C (C4), G
  (G9).
- **S-139 Suggestion 60** — `docs/fleet/charter.md:41-42`,
  `hooks/quality-gate.sh:138`: rules cap 2020 lines vs actual 1272 (wc). Fix:
  ratchet to ~1350. Sources: F.
- **S-140 Suggestion 60** — `agents/01-core-development/graphql-architect.md:21-22`
  and `agents/02-language-specialists/java-architect.md:21-22`: "End the prompt
  per prompting-quality.md's brevity section" is an orchestrator instruction
  pasted into the agent body; graphql also conflicts with its own :34-36
  ("2-4 sentences"). Fix: delete the bullet; single Output format in graphql.
  Sources: G (G1, G2).
- **S-141 Suggestion 55** — `docs/fleet/monitoring.md:45-46,49-52,56`: "159/159"
  (now 138/138), `gen-fleet-inventory.py` "does not exist yet" (exists),
  "1958 lines" (1272). Fix: point to fleet-signals.md. Sources: B.
- **S-142 Suggestion 55** — `agents/04-quality-security/code-reviewer.md:14`
  "CCN < 10" vs hook "≤10". Sources: F.
- **S-143 Suggestion 55** — `rules/prompting-quality.md:25-39,48-62,80-117`,
  `rules/extended-thinking.md:3-8,28-36`: citation/rationale prose that
  changes no behaviour; "Register shifting ... validated empirically" has no
  cite; brevity rule rests on a math preprint while the Opus 5 guide (Tier 1)
  supports it directly. Fix: keep directives, move provenance to
  docs/reference/, re-cite the Opus 5 guide; do not carry H's "(pilot RED)"
  wording (see S-134). Sources: F, H (Verbose #1-4), C (C6).
- **S-144 Suggestion 50** — `CLAUDE.md:17-23` duplicates research-sources.md
  confidence table; Rules/Multi-Agent Parallelism sections are pointers to
  auto-loaded rules. Fix: one-line pointers; keep "Check `.agent-notes/`
  before any task". Sources: H (Redundancy #1-2), F.
- **S-145 Suggestion 45 [research overrides, partial]** —
  `rules/prompting-quality.md:7` and the "Strong" example are prohibition-only;
  Tier-1 best-practices prefer positive instruction + reason. Fix: add "pair
  each prohibition with the positive alternative and the reason"; optional
  same for model-routing "Do NOT" bullets. Sources: C (C2), G (G3, G5).
- **S-146 Suggestion 40 [frontier-lag]** — `rules/prompting-quality.md:64-76`
  constraint budget. Existing rule: ≤6 per section, tiers "interpolated, LOW-MEDIUM
  traceability". Conflicting finding: MOSAIC body states the three bands
  qualitatively and reports a recency effect for Claude 3.7 (later constraints
  followed better); Tier-1 guide puts queries last in long prompts. Case for
  re-evaluation: placement guidance is absent and cheap, but the only
  Claude-specific data is two generations old. Fix if adopted: "place hard
  constraints last"; reword caveat to "qualitative bands from MOSAIC Fig 3
  (models ≤ Claude 3.7)". Sources: C (C3), G (G5).
- **S-147 Suggestion 45** — `rules/lsp.md:15-16` callout duplicates :34-43;
  "Agents lack the LSP tool" holds only for allowlisted agents. Sources: F, H.
- **S-148 Suggestion 40** — `rules/parallelism.md`: add
  `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20) beside spawn depth;
  read-only agents report observations in their hand-back. Sources: A, F.
- **S-149 Suggestion 40** — `code-reviewer.md`, `security-auditor.md` have no
  Output format section. Fix: `Severity | File:Line | Issue | Fix`. Sources: G
  (G8).
- **S-150 Suggestion 35** — agent frontmatter unused: `omitClaudeMd` for
  read-only mechanical agents (measure via /cost), `isolation: worktree` for
  write-heavy refactor agents, `maxTurns` for research agents. Sources: A.
- **S-151 Suggestion 35** — session listing cost: `syncClaudeAiSkills`,
  `skillOverrides: name-only`, MCP `alwaysLoad: false` for heavy servers.
  Sources: A.
- **S-152 Note 30** — `CLAUDE.md:47` 5-week-old HTML comment; 0 resident
  tokens (stripped); delete for readers. Sources: H.
- **S-153 Note 30** — `docs/nist-ai-rmf/README.md:14`: NIST states AI RMF 1.0
  revision in progress; add a watch note. Sources: C.
- **S-154 Note 30** — MCP protocol 2026-07-28 negotiation default (2.1.292);
  confirm serena connects after upgrade; `MCP_PROTOCOL_NEGOTIATION=legacy`
  fallback. Sources: A.
- **S-155 Note 30** — autonomous template could set
  `CLAUDE_CODE_RETRY_WATCHDOG_MAX_WAIT_MS` /
  `CLAUDE_CODE_OVERLOADED_RETRY_BASE_DELAY_MS`. Sources: A.
- **S-156 Note 30** — `rules/extended-thinking.md:16-22` restates
  model-routing.md effort note. Sources: H.

## Contradiction resolutions

1. **C vs G — cloud-architect brevity (C6).** Re-read
   `agents/03-infrastructure/cloud-architect.md:18`: "No prose introductions or
   trailing summaries" plus ADR schema. G is right; C grepped the literal "no
   preamble". C6 cloud-architect item dropped (score 0).
2. **G1 scope ("6 files").** `grep -rln "End the prompt" agents/` returns 2
   (graphql-architect, java-architect). The other four carry the Opus block
   without that bullet. Narrowed to 2 files; severity lowered to Suggestion
   60 (S-140).
3. **Token savings that count HTML comments.** H claimed model-routing.md:15-18
   (~60 tokens, "comments are injected verbatim") and CLAUDE.md:47 (~40).
   Orchestrator verified stripping (memory.md:150) and the session-injected
   model-routing.md lacks the comment. Savings set to 0; kept as Notes for
   staleness only (S-034, S-152).
4. **post-compact-context.md savings.** H's ~265 tokens/compaction and F's
   content fixes are worth 0 today because PostCompact never injects
   (S-001). Re-valued as conditional on S-001; comments in that file DO cost
   tokens once a SessionStart `cat` injects it (S-011).
5. **`paths:` pilot.** prompting-quality.md:36 says RED; H's Verbose #1 rewrite
   keeps "(pilot RED)"; F says T16 GREEN. Re-read 771e555 (GREEN, logged
   evidence) and charter.md:43-45 (diagrams.md exception). Rule text is wrong;
   H's clause rejected (S-134, S-143).
6. **Haiku 5.5 severity.** A: Critical; B: Warning. Following the stale rule
   causes no failure (it only withholds effort and caps file count), so
   Warning 90 (S-026).
7. **modelSettings key.** D conf 55 (matching rule unread) vs B HIGH quote vs
   orchestrator verified. Settled: Warning 95 (S-024).
8. **Sonnet 5.5 default effort.** B: CLI doc medium vs platform API high.
   Orchestrator verified model-config.md:609 (CLI) → medium governs (S-025).
9. **Scoring model.** model-routing.md routes scoring to haiku; code-review
   routes to Sonnet with a stated reason. Haiku 5.5 removes the 200k/no-effort
   argument but not code-review's "scorer must verify against source"
   argument. Resolved as a carve-out in the rule, not a code-review revert
   (S-027).
10. **internal-comms.** Prior-run 9e verdict "keep, best-in-set progressive
    disclosure" vs E1 "delete or disable". Re-read SKILL.md:1-4: description is
    resident and claims company formats; no disable flag. Both observations
    hold; minimal fix is `disable-model-invocation: true` (S-090).
11. **CLAUDE.md pointer sections.** F "keep" vs H "delete two sections".
    Session Notes carries a behaviour trigger; keep that line, compress the
    rest (S-144).
12. **Opus compensation block.** A/F want re-validation; C1 says the Opus 5
    guide's scope advice matches it. Keep the block; label its validation
    basis (S-032).
13. **autonomous profile severity.** D labelled Note; `cmp` confirms identity,
    a standing privilege state in every session here → Warning 80 (S-036).
14. **Security-floor application.** Applied (≥75) to S-037, S-038 (no model
    judgement between untrusted input and execution/escalation) and S-110.
    Not applied to S-040/S-041/S-085: each still requires the model to choose
    the action and the auto-mode classifier reviews it; scored 60-70.
15. **Rules line count.** H 1398 vs F/B 1272; `cat rules/*.md | wc -l` = 1272.

### Research vs rule (three-tier rubric)

- **Override (High evidence + High applicability):**
  - Opus 5 guide vs extended-thinking.md Self-refine → S-135 (rule change).
  - Opus 5 guide (consistent to 1M) vs prompting-quality.md 128k trigger →
    S-138.
  - Best-practices positive framing vs prompting-quality.md prohibition
    keywords → partial override S-145 (add pairing; keep prohibitions class
    because the Opus 5 guide itself uses negative scoping).
- **Frontier-lag (Medium evidence + High-ish applicability):**
  - MOSAIC recency/placement → S-146. Applicability lifted from Low-Medium by
    the adjacent Tier-1 "queries last" guidance; rule holds pending
    re-evaluation.
- **Dropped (Low evidence or Low applicability):**
  - C8 AGENTIF "conditional constraints count ~double": Medium evidence, but
    the doubling is not stated in the source; no rule change.
  - C9 config-structure study (2605.10039): Medium-Low evidence; no rule
    claims an adherence benefit from structure, so nothing to change.
  - C11 ManyIH / G10 precedence table: Medium/Medium; config hierarchy is 3-4
    tiers, below the failure regime; no change.
  - C5 2509.21361 demotion: Low evidence for current models; rule already
    cites it at MEDIUM as a cost heuristic; citation swap not worth a task.
  - C7 Prompting Inversion: Low applicability (OpenAI-only); config does not
    cite it.
  - C13 JSON task status: Medium evidence, unverified against
    docs/reference/autonomous-execution.md; dropped.

## Merged into prior item

- E1 self-improve "no Agent-prompt scaffolding ... residual of F166" — the
  `context: fork` part → **F166**. Model-naming part kept as S-065.
- A bundled `/verify` skill (runs before commits, 2.1.286) → **F043/F056**:
  a `verify` skill wrapping `hooks/quality-gate.sh` is one candidate
  resolution for the pre-commit/auto-invocation spike.
- E2 compliance `routes_sbom.ts` rate-limit race → **F047** (E2 skipped it
  explicitly; S-118's untested-files list does not re-raise it).

## Dropped (score <25 or already tracked)

- A AGENTS.md fallback — 15, no action for this repo.
- A TaskOutput/`taskOutputMaxChars` removal — 0, no references.
- A `claude purge` rename — 0, no references.
- A bundled `/verify` skill — merged (above).
- A `http`/`prompt`/`agent` hook types pilot — 20, speculative.
- A `updatedToolOutput`/`defer`/`terminalSequence` fields — 20, speculative.
- A PermissionRequest agent hooks / `asyncRewake` — 10, none used.
- A Sonnet 5.5 cache-read price conflict — 15, no config target.
- A auto-mode classifier pin quirk — 10, not pinned.
- A 1M default on Bedrock/Vertex — 10, no config impact.
- A MCP `widgets`/`anthropic-skills` names — 5, no conflict.
- A `mcp_tool` hook, `mcp login`, `headersHelper` — 5, no need.
- A auto-memory 2.1.284/2.1.285 changes — 10, "no change" by A.
- A `claudeMdExcludes` — 15, low value.
- A `/autocompact` per-model — 10, informational.
- A subagent hand-back: "drop post-report-turn instructions" — 10, no such
  instruction in parallelism.md.
- A `Agent(model:opus)` / it-ops-orchestrator note — 20.
- A + B built-in `/code-review` cost comparison — 20, LOW evidence.
- A Monitor `persistent` stale text — 15, grep not done.
- A Workflow pause/resume — 5, consistent with CLAUDE.md.
- A per-agent `experimental.cacheTtl` — 20, speculative.
- A `CLAUDE_CODE_WEB_SEARCH_REFILLS_PER_HOUR` — 15.
- A + B `maxEffortLevel`/`modelPicker`/`autoCompactWindow` — 20, speculative
  knobs.
- B `CLAUDE_CODE_SUBAGENT_MODEL` — 15, 109 agents pin `model:`.
- B hook-based spawn/model guard — 20, speculative.
- B subagent `skills:` 32-entry cap — 10, count unverified, no hit found.
- B Opus/Sonnet 5.5 API features — 10, applicability LOW.
- B synced skill-creator retired model example — 15, vendored synced file.
- B6 API parameter deprecations — 0, none in repo.
- B sonnet gate v2.1.284 vs 2.1.285 — 20, local transcripts confirm 2.1.285.
- B WebSearch "Haiku 5.5 unreleased" — 10, known lag caveat.
- C1 "only report high-severity" review phrasing — 0, none found.
- C5, C7, C8, C9, C10, C11, C12, C13 — see three-tier record above.
- C6 cloud-architect brevity — 0, false positive (resolution 1).
- G10 Fable/parallelism precedence table — 20 (C11 aligned).
- G aligned confirmations (C1/C2/C6/C7/C8/C9/C12) — 0, no action.
- D all 13 wired events valid — 0.
- D `~/church/**` exists — 0.
- D WebFetch/WebSearch bare syntax — 0, verified correct.
- D `.mcp.json` forge/github disabled consistently — 0.
- D env keys / F112 closure note — 10.
- D template serena per-tool allows vs wildcard — 15.
- D template `fallbackModel` chain — 20, "fine here".
- D CwdChanged/Elicitation/PermissionRequest hooks — 0, D advises not wiring.
- E1 explore AskUser inside fork — 15, UNKNOWN.
- E1 code-review research dimension — 10, acceptable.
- E1 review-pr >100 files — 15.
- E1 review-pr phase renumbering — 20.
- E1 sandbox `docker info` pre-flight — 20.
- E1 sandbox F015/F016/F096 residual — 0, confirmed fixed.
- E1 fix diagnosis restatement watch — 10.
- E1 fix debugger Opus escalation — 20.
- E1 forge `install list` check — 20.
- E1 webapp-testing unicode/decision-tree tokens — 15.
- E1 webapp-testing two browser stacks — 20.
- E1 webapp-testing F032/F044 residual — already tracked.
- E1 video-downloader failure path — already in task file (F207, dropped
  2026-09-20 at 15; no new evidence).
- E1 video-downloader ToS line — 15.
- E1 changelog SHA trace / no-tags fallback — 20.
- E1 internal-comms examples naming/typo/duplicate fallbacks — 15.
- E1 commit hook-failure branch / 80-col check — 20.
- E1 plan-mission HTML line-count comment — 15.
- E1 plan-mission Phase 1 Explore fan-out — 20.
- E1 upgrade-deps Dependabot overlap — 10.
- E2 auth step-number vs checklist id drift — 15.
- E2 auth api-design error shapes — 20.
- E2 payments product pricing defaults — 20.
- E2 analytics generic-example vocabulary — 15.
- E2 analytics Step 3 Opus routing note — 20, speculative.
- E2 i18n step ordering / hard-coded locale counts — 20.
- E2 testing ci.yml unconditional bindings / husky prettier-only — 20.
- E2 powerpoint manifest-type record — 20.
- E2 brand D-path pnpm assumptions — 10.
- E2 batch template Reads — 15.
- E2 bootstrap 35k-token context / fresh-agent option — 20.
- F supply-chain rule gap — 20 (F defers).
- F destructive-git rule — 0 (hook covers).
- F constraint-budget counts — 0, fine.
- F post-compact threshold wording — 10 (F009 done).
- F parallelism.md v2.1.219 depth fact — 15.
- H plan-mission growth watch — 20.
- H post-compact `---` separators — 5.
- H post-compact Model Routing restatement — 20 (H: keep).
- H rules measurement 1398 lines — 0, wc = 1272.
- X qualified-but-capped candidates — 0, Phase 6 registry work.
