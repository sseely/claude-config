# Self-improve Phase 3 — deduplicated findings (2026-09-02)

Sources: phase1-A/B/C/X, phase2-D/E/F/G/H. Scored with
`skills/code-review/references/scoring-rubric.md`; filtered per
`skills/self-improve/references/finding-resolution.md`.

## Resolved during this run

- `rules/lsp.md:88-90` vs `agents/04-quality-security/code-reviewer.md` and
  `architect-reviewer.md` — the `disallowedTools: Bash` vs. mandated
  `ast-grep`/typecheck contradiction (F Critical 97, open STOP from the prior
  run) was fixed at the user's direction during this run: `code-reviewer.md`
  now grants Bash, and `rules/lsp.md:88-90` scopes the ast-grep/typecheck
  mandate to Bash-capable agents. F's companion item (`rules/lsp.md:87-91`,
  `claude mcp list` unreachable for no-Bash agents) is closed by the same
  edit. (agents: F, G)

## Critical

- [95] `settings.json:136` (`SessionStart` `"async": true`) +
  `hooks/session-start.sh:100-115` — `check_privilege_elevation` fires
  correctly but its stdout is discarded, so the autonomous permission profile
  has now been live **24 days** (`.claude/settings.json` byte-identical to
  `.claude/settings.autonomous.json`, 2429 B, `cmp` confirmed) with no
  warning ever reaching the model. Fix: drop `"async": true` from that entry
  **and** add a synchronous `ConfigChange` hook running the same check.
  (agents: D) [human-applied]
- [95] `settings.json:212-221` — `InstructionsLoaded` is wired to an inline
  `echo` capturing only a timestamp; `hooks/log-instructions-loaded.sh` (which
  logs `session_id, cwd, hook_event_name, file_path, load_reason`) is never
  invoked by any of the 4 settings files. There is therefore no on-disk
  evidence of which files trigger `InstructionsLoaded` or why. Fix: replace
  `settings.json:217`'s command with
  `~/.claude/hooks/log-instructions-loaded.sh`. (agents: D) [human-applied]
- [90] `CLAUDE.md:44` + `rules/autonomous-execution.md:174` — both instruct
  "Use TodoWrite", but todo/task tools are off by default on Opus 4.8 /
  Sonnet 5 / Fable 5 and newer (changelog 2.1.233), and
  `CLAUDE_CODE_ENABLE_TODO_TOOLS` appears nowhere in any settings file
  (orchestrator verified: this session has no TodoWrite tool). Fix: add
  `"env": {"CLAUDE_CODE_ENABLE_TODO_TOOLS": "1"}` to `settings.json`, or
  rewrite both instructions. (agents: A) [human-applied]
- [90] `skills/doc-pdf/**` and `skills/doc-xlsx/**` are tracked in git
  (`git ls-files` confirmed) despite `.gitignore:49,52` and the header at
  `.gitignore:47-48` calling them Anthropic-proprietary, no-redistribution.
  Fix: `git rm -r --cached skills/doc-pdf skills/doc-xlsx` and commit; also
  correct `skills/self-improve/references/phase0-recall.md:72-73`, which
  asserts all four `doc-*` skills are gitignored. (agents: E)
- [90] `skills/testing-setup/SKILL.md:11,360,372` and
  `skills/project-bootstrap/SKILL.md:59` scaffold **80/80/80** coverage
  thresholds against `rules/testing.md`'s 90/90/90 floor — a CI gate that
  enforces the wrong number on every scaffolded project. Fix: change all four
  to 90/90/90, or add an explicit ADR-style deviation note in testing-setup.
  (agents: E)
- [80] `skills/sandbox/SKILL.md:160` bind-mounts `~/.claude` read-only at
  `/root/.claude`, but `templates/container-entrypoint.sh:24-28` (under
  `set -euo pipefail`) does `mkdir -p /root/.claude && cat > .../settings.json`
  — an `EROFS` write that aborts the entrypoint before `claude` is invoked at
  line 53, breaking every sandbox run. The write is also pointless, since line
  53 uses `--dangerously-skip-permissions`. Fix: delete the settings.json
  write block (lines 23-29). (agents: E)

## Warning

- [96] `docs/fleet/charter.md:41-42` and `docs/fleet/monitoring.md:49` state
  the `rules/` aggregate cap (`test $(cat rules/*.md | wc -l) -le 2020`) but
  nothing runs it — `grep -rn 2020 hooks/ scripts/` is empty, and commit
  37ee159 was a manual recovery from a breach. Current: 1913 lines, 107
  headroom. Fix: add the one-line `test` to `hooks/quality-gate.sh`.
  (agents: F, H)
- [95] `rules/prompting-quality.md:37-38` claims "a pilot came back RED and a
  gate enforces its absence" of `paths:` frontmatter — no such gate exists
  (`hooks/check-frontmatter.py` has no `paths` reference) — while `:56-57`
  prescribes "Domain-specific rules should use `paths:` frontmatter". One file
  both forbids and prescribes it. Fix: delete `:56-57` and change "a gate
  enforces its absence" to "review enforces its absence". Do **not** adopt
  `paths:` — the prior run's pilot was RED. (agents: C, F, G; C/G line numbers
  verified, F's `:104-106` citation is off)
- [95] `skills/self-improve/references/phase2-audit-agents.md:194,203` still
  encode "`prompting-quality.md` requires CLAUDE.md ≤ 4KB" / "CLAUDE.md > 4KB
  → flag"; the byte cap was retired 2026-08-07 and
  `rules/prompting-quality.md:28` now reads "under 200 lines". Fix: replace
  both lines with the 200-line bar and switch the section's `wc -c` to
  `wc -l`. (agents: E, H)
- [93] `CLAUDE.md:26` ("Check `.agent-notes/` before any task") and
  `rules/memory.md:7` are unreachable by subagents, which load neither file;
  none of the 7 sampled agent files names `memory.md` in Required Rules, so
  the only surviving mechanism is `rules/parallelism.md:41` §0, which puts the
  duty on the orchestrator. Fix: add a `memory.md` line to the Required Rules
  block of the write-capable agents (`backend-developer.md:58`,
  `microservices-architect.md:99`, `api-designer.md`, `typescript-pro.md`).
  (agents: F)
- [90] `post-compact-context.md:32-34` says "log the full diagnosis artifact"
  without naming its four fields, and post-compaction the agent has neither
  the contents nor a path. Fix: append "Artifact = mechanism, origin
  `file:line`, causal chain, what you ruled out (`rules/diagnosis.md`)."
  (agents: F)
- [90] `docs/fleet/monitoring.md` MEASURE 2.4 item 3 — the stated rules-budget
  figure (2018) is stale; live `cat rules/*.md | wc -l` is **1913**, and the
  signal has gone unrecorded in `.agent-notes/` for ≥2 cycles. Fix: update the
  number and log the count whenever a `rules/` edit lands, or downgrade the
  bullet to "unverified intention". (agents: B)
- [88] `post-compact-context.md` does not restore the write-set /
  one-writer-per-file rule (`rules/parallelism.md:33-39`,
  `rules/autonomous-execution.md:68-70`) — the rules whose violation is least
  recoverable after compaction. Fix: add a 6th section stating one writer per
  file and the `git diff --name-only` vs. declared-write-set check.
  (agents: F)
- [88] `scripts/check-references.py:76-95,128-131` validates agent/skill/hook
  names but not `docs/**/*.md` paths, while five rules now delegate depth to
  `docs/reference/*.md` and `docs/nist-ai-rmf/crosswalk.md`
  (`retry-idempotency.md:40`, `string-formatting.md:20`,
  `prompting-quality.md:40`, `architecture.md:110`, `observability.md:90`).
  Fix: extend the script to fail on a missing `docs/` target cited from
  `rules/*.md`. (agents: F)
- [85] `settings.json:117-120` — four one-off literal permission grants
  (`Bash(awk -F: 'length($0)...')`, two exact-literal `Bash(echo "...")`
  grants, and `Bash(./sync-fork.sh dot-output *)`, a relative-path grant valid
  only in one repo). Three were added by hand in the last 24 days, so this is
  a recurrence, not a one-off. Fix: remove them; move `sync-fork.sh` to that
  repo's own `.claude/settings.json`; add a lint flagging
  `Bash(echo "...")`/`Bash(./*)` grants. (agents: D) [human-applied]
- [85] `templates/autonomous-settings.json` omits `PreToolUse`→`guard-bash.py`,
  `PreToolUse`→`nudge-search-tool.py`, `PostToolUse`→`check-frontmatter.py`,
  and `InstructionsLoaded` entirely. Hook lists merge across scopes, so this
  is not a live guard gap on this machine — it is a **portability** gap for CI
  runners, other users, and the `sandbox` skill's container, none of which
  have `~/.claude/settings.json` to merge from. Fix: wire the hooks explicitly
  into the template. (agents: D) [human-applied]
- [85] `skills/code-review/SKILL.md:203-204` — `APPROVE` requires
  `Warning = 0` and `APPROVE WITH NITS` requires `Warning < 3`, so
  `Warning = 0` satisfies both rows. Fix: change line 204 to
  `Critical = 0 AND 1 ≤ Warning < 3`, matching the form already used in
  `skills/self-improve/references/output-formats.md:24`. (agents: E; verified)
- [85] `skills/commit/SKILL.md:14-17,25` restates `rules/commits.md`'s type
  list, ≤72-char subject, and ≤80-char body verbatim rather than linking — two
  copies of one enumerated list that will drift on the next edit of either.
  Fix: link to `~/.claude/rules/commits.md` and keep only the skill-specific
  mechanics (heredoc pattern, `git add` file list). (agents: E)
- [85] `rules/parallelism.md` Model Selection table, long-horizon row — the
  parenthetical example ID `claude-fable-5` is stale; the `fable` alias now
  resolves to **Fable 5.1** (`claude-fable-5-1`, launched 2026-09-01,
  requires Claude Code v2.1.255+; installed v2.1.259 satisfies it). Fix:
  update the ID and add a version-gate note mirroring the Opus-5 one.
  (agents: B)
- [82] `rules/testability.md:21-24` — "more than 2-3 mocks … design smell" is
  a range, so 3 mocks is simultaneously at and over the limit; unfalsifiable
  in review. Fix: state one number ("more than 3 mocks"). (agents: F)
- [80] `docs/fleet/monitoring.md` MEASURE 1.2 — the 90/90/90 coverage floor
  has gone unmeasured across ≥2 self-improve cycles (zero recorded coverage
  percentages in any `.agent-notes/` file). Fix: record a real coverage result
  on the next code-touching task, or downgrade the bullet to "unverified
  intention" alongside its sibling scheduled-trigger gap. (agents: B)
- [80] `docs/fleet/monitoring.md` MEASURE 2.4 item 1 — frontmatter parse rate
  (floor 159/159) unmeasured across ≥2 cycles despite being cheap to check;
  live re-check this run: 130 agents + 29 SKILL.md = 159, all parsing. Fix:
  wire the one-line check into this skill's Phase 1 barrier, or downgrade.
  (agents: B)
- [80] `rules/observability.md:5-12` — "If a key operation has no definable
  SLI, treat that as a design smell — clarify … before building it" has no
  stop condition; an agent can declare clarification done. Fix: "…then STOP
  and ask; do not implement an operation whose success criteria you cannot
  state as a metric and a threshold." (agents: F)
- [80] `skills/upgrade-deps/SKILL.md:363` says a RECURRING finding is one seen
  "2+ times" while `:353` in the same file says "3+ times" and
  `rules/autonomous-execution.md`'s Consecutive-fix stop rule says "3 or more
  times". Fix: change `:363` to "3+". (agents: E)
- [80] `skills/self-improve/references/nist-refresh.md` — the completeness-diff
  step is unrunnable as written: no single AIRC HTML page enumerates
  GOVERN/MAP/MEASURE/MANAGE subcategory identifiers, and the 3-fetch cap plus
  the ban on reading source PDFs leaves the diff inconclusive every run. Fix:
  add the four per-function Playbook pages (or the CSV/JSON export) to the
  procedure, or restate the step as an edition-and-audit-log check only.
  (agents: C)
- [80] `templates/autonomous-settings.json:59-63` — five `mcp__playwright__*`
  grants with no playwright MCP server in `.mcp.json` or `.claude/.mcp.json`
  (both grepped); the grants are now in one file, not two, so the prior run's
  note is stale. The prior run marked this `[~]` cancelled because the
  classifier blocked the edit, not because it was resolved. Fix: add a
  playwright MCP entry or drop the grants. (agents: D) [human-applied]
- [78] `rules/code-principles.md:33-42` — "'cannot occur' means provably so"
  gives no test for what counts as proof, so it reads as license to remove any
  guard. Fix: add "Proof means: the type system rejects the state, or an
  enclosing validated boundary in the same file rejects it. A comment
  asserting invariance is not proof." (agents: F)
- [75] `skills/plan-mission/SKILL.md:47-69` — the progress-file template
  tracks Phases 1-7 only, but `:71` says to delete the file "once Phase 8
  passes" and Phase 8 (Pre-flight check, `:307`) is a real gated phase. A
  resumed run has no line to record it. Fix: add `## Phase 8: done` to the
  template. (agents: E)
- [75] `skills/self-improve/references/phase1-research-agents.md:56,68-73,81-89`
  — pre-seed is one generation stale on Fable: the `fable` row should note it
  resolves to Fable 5.1, `claude-fable-5-1` should be added to the full-ID
  list, the `[1m]`-is-invalid warning should name `claude-fable-5-1[1m]`
  explicitly (that exact string is live in `settings.json`), and Fable 5.1
  should be added to the effort table rows. (agents: B)
- [75] `hooks/test_check_frontmatter.py` and `hooks/test_guard_bash.py` are
  named as pytest tests but define no `def test_*`; `pytest hooks/` collects
  0 items, and `hooks/.venv` has no pytest at all (`requirements.txt` lists
  only lizard, pyyaml). Run directly they pass 7/7 and 30/30, but nothing runs
  them after a hook edit. Fix: rename to `smoke_*.py`, or add `def test_*`
  wrappers and add pytest to `requirements.txt`. (agents: D)

## Suggestion

- [88] `post-compact-context.md:14-15` restores "Opus→planning/architecture,
  Sonnet→implementation", stale against `rules/parallelism.md:90,117-119`
  ("Opus now covers implementation and routine agentic work too"). Fix:
  "Opus→planning/architecture *and* high-value implementation, Sonnet→routine
  implementation, Haiku→scoring/dedup." (agents: F)
- [86] `CLAUDE.md:3-6` opens with Interaction Style while the two
  load-bearing sections — Diagnosis (`:60-63`) and Rules (`:65-69`) — are
  last; the front of the file survives context pressure best. Fix: reorder to
  Verification → Rules → Diagnosis → Complex Tasks → Agents → Multi-Agent
  Parallelism → Session Notes → Commit Messages → On Compaction → Interaction
  Style. (agents: F)
- [85] `rules/prompting-quality.md:41-42` declines to state the cap it
  enforces ("Deliberately not stated: file count, byte total, or token
  estimate"), so a reader of that file alone cannot check compliance; the
  2020-line number lives only in `docs/fleet/charter.md:41`. Fix: add "The cap
  itself is stated in `docs/fleet/charter.md` and checked there." (agents: F)
- [85] `rules/research-sources.md:35-49` (Tier 3) omits
  `anthropic.com/engineering` while
  `skills/self-improve/references/phase1-research-agents.md:171-173` already
  instructs Agent C to treat Anthropic as a Tier 3 practitioner source — the
  rule and the skill disagree. Fix: add `**Anthropic Engineering** —
  anthropic.com/engineering (agent harness, context engineering, tool design)`
  after High Scalability. (agents: C, G)
- [85] `hooks/guard-bash.py` and `hooks/nudge-search-tool.py` fail open on any
  exception with a bare `except: return`/`pass` and no log, so a bug that
  silently stops guarding `rm -rf` is undetectable — unlike `project-init.sh`
  and `setup-complexity.sh`, which write to `logs/*.err`. Fix: add a
  best-effort `except Exception as e: log_to(...); return`, itself wrapped so
  logging can never block. (agents: D)
- [85] `agents/explore/SKILL.md:8`, `skills/review-pr/SKILL.md:12`, and
  `skills/upgrade-deps/SKILL.md:14` each carry a one-line model-routing
  sentence duplicated verbatim by a `## Model Routing` table ~10 lines below.
  Fix: delete the standalone sentence in all three — the table is what gets
  updated, so the sentence is what drifts first. (agents: E)
- [84] `rules/research-sources.md:98-100` bars declaring HIGH on Tier 3 or
  lower, while `CLAUDE.md:19` defines HIGH as "Verified via tool or cited
  source" — a Tier-5 blog fetched with WebFetch satisfies CLAUDE.md and is
  barred by the rule. Fix: change `CLAUDE.md:19` to "**HIGH**: Verified
  against a Tier 1-2 source retrieved this run (see
  `rules/research-sources.md`)". (agents: F)
- [80] `agents/` — `isolation: worktree` subagent frontmatter is unused
  (`grep -rln "^isolation:" agents/` empty); it removes the write-conflict
  problem `rules/parallelism.md`'s file-ownership planning exists to avoid.
  Fix: evaluate it for parallel-spawned `refactoring-specialist` /
  `legacy-modernizer`. (agents: A)
- [80] `rules/autonomous-execution.md:86-89` and `rules/diagnosis.md:53-57`
  state the same 2-fix-cap-bounds-investigation rule at equal verbosity,
  cross-referencing each other. F confirms the pair is *consistent* (both
  prior fixes survived compression); H wants one side collapsed. These are
  compatible: the finding is redundancy, not contradiction. Fix: keep
  `diagnosis.md` canonical (it owns the artifact definition) and replace
  `autonomous-execution.md:86-89` with a one-line pointer. ~110 tokens saved
  per session. (agents: F, H)
- [78] `.gitignore` — `agent-memory/` is untracked but not ignored
  (`?? agent-memory/` in git status); it is machine-local per-agent memory,
  the same category as `.claude/agent-memory-local/`. Fix: add it to
  `.gitignore`. (agents: A)
- [76] `rules/api-design.md:36-40` — list endpoints wrap in
  `{data,total,page,pageSize}` and errors use `{error,message}`, but a
  paginated endpoint with a partial failure has no defined shape while "Never
  mix envelopes" forbids improvising. Fix: state that an error response
  replaces the list envelope entirely; the two shapes never nest. (agents: F)
- [75] `rules/` — no rule governs concurrency/async safety beyond
  `error-handling.md:44-51`'s error propagation: nothing covers cancellation,
  race conditions, or shared mutable state across awaits, a real gap for
  `websocket-engineer`, `golang-pro`, `rust-engineer`. Fix: a short
  `rules/concurrency.md` or a "Cancellation and shared state" section in
  `error-handling.md`; budget ~30 lines against the 2020 cap. (agents: F)
- [75] `agents/` frontmatter — `outputStyle: "Concise"` (built-in since
  2.1.237: "leads with results and skips preamble and narration") is unused
  while `rules/prompting-quality.md:103-117` hand-writes the same effect per
  prompt. Fix: evaluate it in Opus-tier agent frontmatter as a native
  supplement. (agents: A)
- [75] `settings.json:128` — `"model": "claude-fable-5-1[1m]"`. The `[1m]`
  suffix is documented only for `sonnet`/`opus`; Fable models are natively 1M
  and explicitly excluded from the picker's `[1m]` list. **However** this
  exact string was written by Claude Code's own `/model` picker at the start
  of this session and the session runs on it with a 1M window — so behavior
  and documentation disagree. Fix: verify against
  `code.claude.com/docs/en/model-config` next run before changing anything; do
  not treat as invalid. (agents: A, B) [human-applied]
- [72] `rules/architecture.md:73-86` names the migration patterns
  (expand-contract, strangler fig) but nothing governs *running* one — batch
  size, backfill idempotency, kill switch; `retry-idempotency.md` covers
  request-level idempotency only. Fix: add three bullets naming batch size,
  resumability, and an abort switch as required properties of any backfill.
  (agents: F)
- [70] `rules/memory.md` never reconciles `.agent-notes/` with the built-in
  auto memory enabled at `settings.json:259`
  (`~/.claude/projects/<project>/memory/MEMORY.md`, 200-line/25KB cap,
  machine-local). Fix: one sentence — `.agent-notes/` is the repo-committed
  cross-session handoff; auto memory is a separate uncommitted machine-local
  store Claude manages itself; do not duplicate entries. (agents: A)
- [70] `rules/parallelism.md` is 211 lines / 13541 B — 11 over the 200-line
  single-file flag and 2.3× the next-largest rule file. Fix: split "Model
  Selection" (the routing table plus the Opus/Fable compensation blocks) into
  `rules/model-routing.md`, leaving orchestration rules in `parallelism.md`.
  (agents: H)
- [70] `rules/parallelism.md:129-141` (Opus behavioral compensation) is where
  an orchestrator looks when routing to Opus, but it does not point at the
  brevity/output-shape guidance in `prompting-quality.md:103-117`. Low
  urgency: G's repo-wide check found all 7 Opus/opusplan agents and 3 Opus
  skill phases already comply. Fix: add one pointer line. (agents: C, G)
- [65] `settings.json` hooks — `ConfigChange` (fires on each settings-file
  change, matcher includes `skills`) is unwired; it is the strictly earlier
  and more reliable trigger for the privilege-elevation check than
  `SessionStart`, and would also catch this skill's own mid-run edits to
  `research-urls.md`. Fix: wire it. (agents: A, D) [human-applied]
- [65] `settings.json` hooks — `SubagentStop` (can block via exit 2) is
  unwired, while `rules/autonomous-execution.md`'s Quality Gates procedure
  relies on the orchestrator remembering to run gates after each batch; also
  nothing tracks spawn depth against
  `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`. Fix: prototype a `SubagentStop` hook
  matched to mission-brief agent types. (agents: A, D) [human-applied]
- [65] `rules/prompting-quality.md:59-68` (Agent context budget) bounds
  context by file count (20-30) with no token threshold, and
  `skills/code-review/SKILL.md:87-95` hands each of 11 parallel agents the
  full file inventory uncapped on `"full project"` scope. `[frontier-lag]` —
  see Contradiction resolutions, P5. Fix: add "recall degrades sharply past
  ~128k tokens (arxiv:2607.19257, preprint); compact or split when context
  passes that band, regardless of file count." (agents: C, G)
- [60] `rules/parallelism.md` "Mechanism — resume, do not re-spawn"
  (~:198-207) documents `SendMessage`-to-resume vs. a fresh `Agent` call but
  never names `subagent_type: "fork"` (on by default since 2.1.232, inherits
  full parent context and prompt cache) as the third option for read-heavy
  research. Fix: add one line distinguishing the three. (agents: A)
- [60] Prompt placement: hard constraints sit 40-230 lines from the task text
  they bind in 7 of 8 sampled agent+skill files
  (`agents/backend-developer.md:58-75`, `fullstack-developer.md:210-219`,
  `security-auditor.md:120-127`, `qa-expert.md:120-126`,
  `it-ops-orchestrator.md:56-65`, `skills/plan-mission/SKILL.md:383-389` vs.
  `:153-175`/`:228-263`, `skills/self-improve/SKILL.md:112` vs. `:65-75`).
  `[frontier-lag]` — see Contradiction resolutions, P2. Fix: move each
  specific rule citation into the section it binds; keep the trailing block as
  a full-list index. (agents: C, G)
- [60] `skills/file-organizer/SKILL.md:119-136` performs destructive
  `mv`/delete operations on the user's real filesystem with no undo log; an
  interrupted run leaves no record of what moved. Fix: write a manifest of
  planned/executed moves (e.g. `.file-organizer-log.md`) before starting.
  (agents: E)
- [60] `skills/changelog-generator/SKILL.md:13-22` has no handling for an
  empty commit range between tags. Fix: add "if no commits in range, report
  and stop." (agents: E)
- [58] `settings.json` hooks — `PermissionDenied` and `PostToolUseFailure` are
  unwired, so nothing logs denied tool calls or tool failures despite
  `rules/logging.md` and `rules/error-handling.md` wanting failures logged;
  `fewer-permission-prompts` currently infers friction from transcripts. Fix:
  wire both to an append-only log. (agents: A, D) [human-applied]
- [55] `settings.json` — `subagentPromptCacheTtl` / `promptCacheTtl` (added
  2.1.243) and per-agent `experimental.cacheTtl` (2.1.248) are all unset,
  while this skill spawns 4-5 parallel research agents per run and
  mission-brief batches run several subagent calls within an hour. Fix:
  evaluate `"subagentPromptCacheTtl": "1h"`. (agents: A) [human-applied]
- [55] Nine scaffolding skills carry no model-routing guidance
  (analytics-setup, auth-setup, brand-knowvah, compliance-setup, i18n-setup,
  payments-setup, powerpoint-addin-setup, project-bootstrap, testing-setup),
  against six that do. Fix: add a one-line Sonnet-for-implementation note,
  distinguishing WebFetch-verification steps from implementation steps.
  (agents: E)
- [55] Operational Readiness sections are missing from `brand-knowvah` and
  `powerpoint-addin-setup`, both of which ship user-facing runtime code, while
  five sibling `*-setup` skills have them. (testing-setup and
  project-bootstrap do not need one.) Fix: add the section in the same format
  as the other five. (agents: E)
- [55] `CLAUDE.md`'s Agents section places the Agent tool and Workflow but
  never places **agent teams** (`subagent_type: "agent-team"`), a third
  distinct primitive built out in 2.1.232 and unreferenced anywhere in
  `rules/` or `agents/`. Fix: name it in one line, or record that it is
  deliberately out of scope. (agents: A)
- [50] `settings.json:55-59` grants five shell `gh` subcommands with no
  structured GitHub MCP server configured (`.mcp.json` has only forge,
  `.claude/.mcp.json` only serena), so PR/issue/workflow JSON is parsed by
  hand. Fix: evaluate a GitHub MCP server; confirm the current official
  server name first. (agents: D)
- [50] `PreModelSwitch`/`PostModelSwitch` (added 2.1.251) are unwired and
  could log model drift, relevant given `settings.json:128` pins a model and
  `:253-257` overrides Opus-5 effort. Fix: low priority; wire only if drift is
  observed. (agents: A) [human-applied]

## Note

- [45] `rules/retry-idempotency.md` §Retry policy vs
  `rules/error-handling.md:53-62` — consistent, but neither states whether the
  5s/30s/1s timeouts are per attempt or across the retry envelope. (agents: F)
  `<!-- Code review (2026-09-02): timeout scope vs. retry envelope is
  unstated. Revisit if a caller reports a 3-attempt operation exceeding its
  stated timeout. -->`
- [45] `post-compact-context.md:18-23` (Commit Format) is 6 content lines — at
  the hard flag threshold and above the file's own 4-line-per-rule target, a
  drift from the 2026-08-07 baseline of ≤5 lines per section, likely from
  37ee159 folding attribution in. (agents: H)
  `<!-- Code review (2026-09-02): Commit Format section is at the 6-line flag.
  Revisit if any other section also reaches 6 lines. -->`
- [45] `agents/` — `maxTurns` (2.1.246, marks output partial at the limit) and
  `background: true` subagent frontmatter are unused; `maxTurns` would let the
  `/fix` skill's 5-iteration loop fail gracefully instead of exhausting turns
  silently. (agents: A)
  `<!-- Code review (2026-09-02): no maxTurns cap on iterative agents. Revisit
  if a /fix run exhausts turns without reporting why. -->`
- [40] `evals/run_evals.py` `MODEL_ALIAS_FIX` — the 2026-08-09
  `claude -p --model haiku` alias bug does **not** reproduce on v2.1.259 (live
  probe returned `claude-haiku-4-5-20251001` correctly). Single reproduction
  only. (agents: B)
  `<!-- Code review (2026-09-02): MODEL_ALIAS_FIX may be obsolete — bug did
  not reproduce on v2.1.259. Revisit after a second independent probe; remove
  the workaround if it stays clean. -->`
- [40] `agents/` — the `Agent(worker, researcher)` tool-restriction syntax
  (whitelisting which named subagents an agent may spawn) is unused; it
  complements the global `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` cap with
  per-agent fan-out control. (agents: A)
  `<!-- Code review (2026-09-02): no per-agent spawn whitelist. Revisit if an
  autonomous agent fans out to unexpected specialists. -->`
- [40] `hooks/log-instructions-loaded.sh` uses `set -uo pipefail` (no `-e`) —
  intentional per its own comment, and the only hook script deviating from the
  `set -euo pipefail` convention. (agents: D)
  `<!-- Code review (2026-09-02): intentional -e omission so the hook never
  blocks. Revisit if this script ever gains a failure path that must be
  surfaced. -->`
- [40] `hooks/notify-on-stop.sh` chimes identically for a clean `Stop` and an
  API-error-terminated turn; `StopFailure` would distinguish them. (agents: D)
  `<!-- Code review (2026-09-02): Stop and StopFailure are not distinguished.
  Revisit if a failed turn is mistaken for a completed one. -->`
- [40] `skills/file-organizer/SKILL.md:71,132` — the skill's "always ask
  before deleting" policy is weaker than the harness-level prohibition on
  permanently deleting data, and implies Claude may delete with confirmation.
  (agents: E)
  `<!-- Code review (2026-09-02): skill policy is weaker than the harness
  deletion prohibition. Revisit if a user reports Claude deleting files under
  this skill. -->`
- [40] `skills/plan-mission/SKILL.md` is 389 lines, 78% of the 500-line skill
  ceiling. (agents: H)
  `<!-- Code review (2026-09-02): at 78% of the skill-length ceiling. Revisit
  at the next audit if it has grown. -->`
- [35] `skills/generate-question-bank/SKILL.md:114` — the `haiku-batch` model
  choice is visible only inside the JSON output schema, not stated as
  skill-level Model Routing guidance. (agents: E)
  `<!-- Code review (2026-09-02): model choice is implicit in the output
  schema. Revisit if the batch model changes. -->`
- [35] `skills/video-downloader/SKILL.md` documents no handling for private,
  age-restricted, or geo-blocked videos, nor yt-dlp extraction failures.
  (agents: E)
  `<!-- Code review (2026-09-02): no failure path for restricted videos.
  Revisit on the first user report of a silent download failure. -->`
- [30] `CLAUDE_CODE_NEW_INIT=1` (interactive multi-phase `/init` that explores
  via subagent and proposes CLAUDE.md/skills/hooks for review) is unreferenced
  by `hooks/project-init.sh`. (agents: A)
  `<!-- Code review (2026-09-02): the new interactive /init is unused.
  Revisit the next time a project is bootstrapped from scratch. -->`
- [30] `/claude-api cost-optimize` (2.1.247) profiles project Claude spend and
  walks cost levers one measured change at a time; unreferenced in `rules/` or
  `CLAUDE.md`. Not a config change. (agents: A)
  `<!-- Code review (2026-09-02): cost-optimize tooling exists but is
  unreferenced. Revisit when a cost audit is actually run. -->`

## Positive

- All 7 Opus/opusplan-routed agents plus 3 Opus-routed skill phases already
  carry both an explicit length constraint and a named output shape — 100%
  compliance with `rules/prompting-quality.md:103-117`, verified repo-wide
  rather than sampled. (agents: G)
- No deprecated model aliases anywhere: all 130 agent files carry an explicit
  `model:`, every value (`sonnet` 113, `haiku` 10, `opusplan` 4, `opus` 3) is
  currently valid, and every one of the 19 `effort: high` agents pairs with a
  model that supports it. The prior run's `compliance-auditor.md` haiku+high
  mismatch is fixed. (agents: B)
- `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` (2.1.257) is correctly **absent** —
  setting it would silently collapse `rules/parallelism.md`'s entire per-role
  model table. (agents: A)
- Twelve of thirteen cross-file rule pointers resolve to a real heading or
  line range; the four compression commits (48c162d, 44d23ae, cb0b38c,
  37ee159) lost **zero** thresholds, file names, or commands. (agents: F)
- Both prior-run fixes survived compression intact: the diagnosis-artifact
  ownership split (`autonomous-execution.md:86-89` ↔ `diagnosis.md:53-57`) and
  the one-commit-per-task discipline (`autonomous-execution.md:157` ↔
  `pr-workflow.md:43` ↔ `commits.md`). (agents: F)
- The "Step 1b/2b/4b docs-verification-before-templating" pattern is present
  with consistent naming and placement across all six applicable `*-setup`
  skills, with no drift — worth preserving as the template for any new one.
  (agents: E)
- Anti-restatement delegation is working: `forge-app` ("The knowledge lives in
  the agent, not here"), `review-pr` (delegates to code-review rather than
  re-implementing the checklist), and `explore:51` (cites
  `rules/retry-idempotency.md` with an accurate short paraphrase instead of
  restating the policy). (agents: E)
- Verbose-prose dimension is clean: no section met the
  >50%-compression-with-no-nuance-lost bar this pass, and CLAUDE.md is 69
  lines against a 200-line cap. (agents: H)
- `i18n-setup`'s "NAMESPACES in sync across all three files" claim verified
  accurate across `i18n/index.ts`, `i18n-audit.ts`, and `translate.ts` — no
  drift. (agents: E)
- Subagent `memory:` frontmatter is already adopted on `code-reviewer` and
  `debugger`, with populated `agent-memory/` directories — the config is ahead
  of the feature here, not behind. (agents: A)

## Contradiction resolutions

### P2 — Instruction placement vs. `rules/prompting-quality.md` + `rules/parallelism.md:33-82`

**Rule text.** `rules/prompting-quality.md` governs constraint *count*
(:70-82), *verb register* (:84-101), and *brevity* (:103-117), and says
nothing about where in a prompt a constraint should sit.
`rules/parallelism.md:33-82` orders agent-prompt sections but justifies the
order as an assembly sequence, not as a placement-effect finding.

**Finding.** arxiv:2607.19257 (*Prompt Design at Scale*, Eliav 2026):
placement effects on adherence are at least as large as format effects in most
models tested. Agent G found the corresponding pattern in 7 of 8 sampled files
— rule citations 40-230 lines from the task text they bind.

**Tier verdict.** Medium evidence + High applicability → **rule holds; surface
as `[frontier-lag]` Suggestion.**

**Reasoning.** The evidence is a single Tier-4 preprint on a synthetic
benchmark with no Opus/Sonnet-tier model in the test set, which caps it at
Medium and bars it from overriding a rule. Applicability is High and concrete:
G located the pattern at specific file:line across the sample, so this is not
an abstract concern. The trailing `## Required Rules` block also has an
independent justification — subagents do not auto-load `rules/`, so the index
must exist somewhere — which means the fix is *duplication into the binding
section*, not relocation. Recorded as a Suggestion rather than dropped so the
next run re-evaluates it against a replication.

### P5 — 64-128k context cliff vs. `rules/prompting-quality.md:59-68`

**Rule text.** "Cap file inventory at 20-30 files per agent … If the read-set
exceeds 30 files, that is a signal to split the task into two agents", citing
attention dilution (arxiv:2509.21361). No token threshold anywhere in the
file. `rules/autonomous-execution.md` compacts on a structural trigger (batch
boundary), not on context fill.

**Finding.** arxiv:2607.19257: recall is stable through 64-128k tokens then
degrades sharply and format-dependently, with accuracy spreads reaching 48
points at 128k.

**Tier verdict.** Medium evidence + High applicability → **rule holds; surface
as `[frontier-lag]` Suggestion.**

**Reasoning.** Same single-preprint ceiling as P2, so it cannot override. But
applicability is High and rising: every model in this config's routing table is
1M-context, and `rules/prompting-quality.md:67-68` already notes the Sonnet-5
tokenizer emits ~1.3× the tokens of Sonnet 4.6 for the same text — so a
30-file read-set now buys fewer files' worth of headroom than when the
file-count cap was written. G supplied a live blast radius
(`skills/code-review/SKILL.md:87-95` hands 11 agents an uncapped inventory).
The fix is additive — the file-count cap stays and keeps proxying for this in
most cases — which is why it is a Suggestion and not a rule change.

### P9 — Anthropic Engineering absent from `rules/research-sources.md` Tier 3

**Rule text.** `rules/research-sources.md:35-49` (Tier 3, "High-quality
practitioner") lists Google SRE, Netflix, Cloudflare, AWS Architecture Center,
Stripe, Martin Fowler, and High Scalability. `anthropic.com/engineering`
appears nowhere in the file.

**Finding.** The most directly applicable practitioner source for this repo's
subject matter (agent harness design, context engineering, tool design) is
unlisted, while
`skills/self-improve/references/phase1-research-agents.md:171-173` already
instructs Agent C to use Anthropic as a Tier 3 source — and Agent C did, this
run, citing `anthropic.com/engineering/effective-harnesses-for-long-running-agents`
as the basis for P7.

**Tier verdict.** This is a config-internal inconsistency, not a
research-vs-rule conflict — but resolved on the same axis: **High
applicability, and the evidence is the repo's own behavior** → the rule file
is corrected.

**Reasoning.** No external evidence tier applies: the disagreement is between
two files in this repo, and the skill's behavior (which already treats the
source as Tier 3 and produced a finding from it) is the operative practice.
The rule file is simply behind. Confidence 85 with two independent
corroborations (C, G) each having read the full file. Fix: add the entry after
High Scalability.

### P10 — `paths:` frontmatter, forbidden and prescribed in one file

**Rule text.** `rules/prompting-quality.md:37-38`: "`paths:` frontmatter would
scope loading, but it is not used here: a pilot came back RED and a gate
enforces its absence." `rules/prompting-quality.md:56-57`: "Domain-specific
rules should use `paths:` frontmatter to load only when matching files are in
play."

**Finding.** Three agents flag it (C at :56-57, G at :56-57 confirming exactly
two `paths:` hits repo-wide and both in this one file, F at a mis-cited
:104-106). F additionally verified the claimed gate does not exist:
`grep -rn "paths" hooks/*.py scripts/*.py` returns no frontmatter-key check
and `hooks/check-frontmatter.py` has no `paths` reference. F traces the false
claim to commit 48c162d — the only case in this run where compression *added*
an unverifiable statement.

**Tier verdict.** **Contradiction resolved by re-reading the source** (line
numbers verified directly this run: hits at :37 and :56). Not a
research-vs-rule tier case.

**Reasoning.** The two statements cannot both hold. The prior run's T13 pilot
came back RED — blocked rather than falsified, because the
`InstructionsLoaded` matcher registration lives in `settings.json`, which the
auto-mode classifier would not let the run edit — and `paths:` was never
applied. So the *enforced* position is non-adoption, and :56-57 is the stray.
The gate sentence is separately false and must be corrected rather than
deleted, since the non-adoption it describes is real. Fix: delete :56-57;
change "a gate enforces its absence" to "review enforces its absence". Do not
recommend adopting `paths:`.

## Dropped

- P3 (markdown carries no universal formatting advantage, arxiv:2607.19257 +
  2502.04295) — score 15. Low applicability: neither study tested a
  Claude-tier model, Anthropic's Tier-1 docs mandate markdown for CLAUDE.md /
  skills / frontmatter, and no config file claims markdown improves accuracy.
  `rules/diagrams.md:9-11` mandates fenced markdown as a *rendering*
  requirement, not an accuracy claim (G confirmed). There is no claim to
  correct. Tier verdict: Low applicability → rule wins, dropped.
- P4 (joint content-format optimization, CFPO arxiv:2502.04295) — score 15.
  Low applicability: all four tested models are ≤8B open models, and the
  paper's own result is that format sensitivity is model-specific, which
  blocks transfer. The transferable half is already encoded at
  `rules/prompting-quality.md:84-101` (register shifting); the automated
  search-loop half is unrunnable against a hand-authored rule set. Tier
  verdict: Low applicability → rule wins, dropped.
- Fable 5.1 direct-API capabilities (`task-budgets-2026-03-13` beta header,
  memory tool, code execution tool, programmatic tool calling, context-editing
  tool-result clearing) unreferenced in config — score 20. These are
  Anthropic-API features, not Claude-Code harness features; no skill in this
  repo calls the API directly. Re-file only if one starts to.
- `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` unset, so
  `settings.json:122-126`'s `additionalDirectories` do not load their own
  CLAUDE.md — score 20. Agent A itself records "no action needed unless those
  directories are expected to carry instructions"; they are `/tmp`,
  `/private/tmp`, and `$HOME`, none of which should.
- MCP tuning knobs unset (`headersHelper`, per-tool
  `_meta.anthropic/maxResultSizeChars`, `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`)
  — score 20. No `.mcp.json` under `~/.claude` beyond forge/serena, and no
  observed startup-latency or long-call problem to motivate a change.
- `CLAUDE.md:65-69` names four load-bearing rule files while `commits.md` and
  `memory.md` get their own sections without appearing in the four — score 15.
  F's own verdict is "harmless… none required".
- `post-compact-context.md:7-11` (Autonomous Execution Recovery, 5 lines)
  exceeds the ≤4-line-per-rule target but is under the hard 6-line flag —
  score 20. H records no fix required.
- Agent D §4 (WebSearch/WebFetch permission syntax) — score 0, explicitly "not
  a finding": exhaustive grep found only the bare form, consistently, in both
  files that use it.
- `settings.json:98` `Bash(~/.claude/hooks/setup-complexity.sh)` lacking a
  trailing `:*` — score 0, included by D only to calibrate confidence on the
  four real noise grants; the argument-less exact grant is correct as written.

## Coverage gaps

- **Agent A** time-boxed out 8 active URLs: `docs/en/overview`, `skills`,
  `agent-teams`, `agent-view`, `routines`, `worktrees`, `tutorials`, and
  `anthropic.com/blog`. Not fetch failures — they remain `active` with their
  existing `last-verified` dates. Any Phase 4 gap traceable to skills,
  agent-teams, agent-view, routines, or worktrees is unmitigated this run.
- **Agent C — NIST completeness diff unrunnable.**
  `airc.nist.gov/airmf-resources/playbook/` returned 200 with rich content but
  enumerates no subcategory identifiers, and `nist-refresh.md` forbids reading
  the source PDFs at runtime, so the 3-fetch cap cannot satisfy the diff. The
  72-subcategory coverage figure is corroboration against the stamped
  derivation, not a live diff: no gap found, and no gap ruled out. Filed as a
  Warning above (procedure defect in `nist-refresh.md`).
- **Agent C — partial extraction**: `arxiv.org/pdf/2606.20683` (1.1MB PDF)
  truncated before the harness-design recommendation tables; no quantitative
  claim from it was used. Re-fetch the HTML rendering next run.
- **Agent C — snippet-level evidence only**: the two Anthropic engineering
  posts backing P8 (writing-tools-for-agents, effective-context-engineering)
  were read from WebSearch snippets, not fetched; P8's evidence strength is
  Low-Medium for that reason.
- **Agent C — sampling shortfall (superseded)**: C reported only 1 `model:
  opus` agent repo-wide. G corrected this — C's `agents/*.md` glob does not
  recurse; the true count is 7, plus 3 Opus-routed skill phases. G's numbers
  are used throughout this file.
- **Agent B — single-probe verification**: the `--model haiku` alias-resolution
  check was one invocation against a two-invocation budget, so the
  `MODEL_ALIAS_FIX` removal is filed as a re-verify Note, not a defect.
- **Agent B — effort table not updated**: the first `model-config` fetch
  returned an internally inconsistent effort-support table (a
  WebFetch-summarizer artifact from a leading prompt). `parallelism.md`'s
  effort table was deliberately not touched; re-verify with a neutral-prompt
  fetch next run.
- **Agent B — `modelSettings` key unverified at source**: confirmed valid via
  WebSearch synthesis only; the primary `code.claude.com/docs/en/settings`
  page is Agent A's URL and was not independently re-fetched for this key.
- **Agent E — read-only inference**: the `sandbox` EROFS finding (Critical,
  80) is inferred from Docker bind-mount semantics plus `set -e`, not
  runtime-verified, per the read-only audit constraint.
- **Agent X — paywalled/unparseable sources**: four ACM DOIs
  (`10.1145/3786304.3787891`, `10.1145/3748302`, `10.1145/3728894`,
  `10.1145/3788284`) returned HTTP 403; `resources.anthropic.com` Agentic
  Coding Trends PDF (834KB) and `arxiv.org/pdf/2502.04498` returned
  unextractable binaries; `simonwillison.net` agentic-engineering-patterns was
  a ~2,800-char stub. All demoted or excluded, none added on a thin basis.
- **Phase 2 write-set exclusions**: permission-file edits (`settings.json`,
  `templates/autonomous-settings.json`, `.claude/settings*.json`) are denied
  to agents by the auto-mode classifier. Every such fix is tagged
  `[human-applied]` above; none was dropped for that reason.

## Counts

| Class | Count |
|---|---|
| Critical | 6 |
| Warning | 24 |
| Suggestion | 32 |
| Note | 13 |
| Positive | 9 |
| Dropped | 8 |

Raw findings across the 8 contributing agents (X contributed discovery only):
~118. Deduplicated and filtered to **75 kept** (Critical + Warning +
Suggestion + Note) plus 9 Positives — a raw-to-deduped ratio of roughly
**1.6 : 1**. The largest merges: `paths:` (3 agents → 1), the CLAUDE.md-4KB
staleness (2 → 1), the 2020-line cap (2 → 1), the Fable 5.1 pre-seed staleness
(2 → 1), the `settings.json` `[1m]` model value (2 → 1, downgraded), and the
`autonomous-execution.md` ↔ `diagnosis.md` redundancy (2 → 1, reconciled as
compatible rather than contradictory).
