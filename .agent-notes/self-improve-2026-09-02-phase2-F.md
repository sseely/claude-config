# Agent F — Rules and CLAUDE.md audit (2026-09-02)

Scope: `CLAUDE.md`, `rules/*.md` (24 files, 1913 lines), `post-compact-context.md`,
7 sampled agent files, pointer targets under `docs/reference/` and `docs/nist-ai-rmf/`.
Baseline commits audited: 48c162d, 44d23ae, cb0b38c, 37ee159.

## 1. Contradictions

Systematic pair enumeration. Each pair judged conflict / harmless overlap / consistent.

- **Critical — `rules/lsp.md:84-86` vs `agents/04-quality-security/code-reviewer.md:5,29`
  and `architect-reviewer.md:5,21`.** Confidence 97. Still open from the prior run.
  lsp.md: "For structural code pattern searches, use `ast-grep`, not Grep. / After
  edits, run the project's typecheck command (`tsc --noEmit`, `mypy`, etc.) as the
  quality bar". code-reviewer.md frontmatter: `disallowedTools: Write, Edit, Bash`,
  and Required Rules line 29 lists "`lsp.md` — Serena MCP navigation for subagents".
  Both mandated commands are Bash-only; neither agent can run either. Frontmatter
  cannot express a scoped `Bash(sg:*)`.
  Fix: scope the Subagent-note mandate in `lsp.md:84-86` to Bash-capable agents —
  e.g. "Bash-capable agents: use `ast-grep` … and run the typecheck command.
  Read-only agents (no Bash): use Serena `search_for_pattern` for structural
  searches; typecheck is the orchestrator's gate, not yours."

- **Warning — `rules/prompting-quality.md:37-38` vs `hooks/`+`scripts/`.**
  Confidence 95. prompting-quality.md: "`paths:` frontmatter would scope loading,
  but it is not used here: a pilot came back RED and a gate enforces its absence."
  `grep -rn "paths" hooks/*.py scripts/*.py` returns no frontmatter-key check;
  `hooks/check-frontmatter.py` contains no `paths` reference and no rules/ handling.
  The claimed gate does not exist. Immediately after, `prompting-quality.md:104-106`
  says "Domain-specific rules should use `paths:` frontmatter to load only when
  matching files are in play" — the same file both forbids and prescribes `paths:`.
  Fix: delete the "Domain-specific rules should use `paths:` frontmatter…"
  paragraph at prompting-quality.md:104-106, and change "a gate enforces its
  absence" to "review enforces its absence" unless a `paths:` check is added to
  `hooks/check-frontmatter.py`.

- **Note — `rules/retry-idempotency.md:14-25` vs `rules/error-handling.md:53-62`.**
  Consistent, not conflicting. Confidence 92. error-handling.md owns timeouts on
  external calls ("5s for synchronous API calls, 30s for batch…, 1s for cache
  reads"); retry-idempotency.md owns what to do after a failure ("**5xx errors:**
  … retry up to the limit"; "**Network timeouts:** … read timeout"). No shared
  threshold is stated twice. Gap, not contradiction: neither file states whether
  the 5s timeout is per-attempt or across all 3 attempts.
  Fix: add one line to `retry-idempotency.md` §Retry policy: "The timeouts in
  `error-handling.md` apply per attempt, not to the retry envelope."

- **Note — `rules/logging.md:41-47` vs `rules/observability.md:44-48`.** Harmless
  overlap, correctly delegated. Confidence 96. observability.md:48 states
  "`logging.md` owns field lists and error-log content requirements." Post-cb0b38c
  the error-log content list lives only in logging.md:41-47. Consistent.

- **Note — `rules/testing.md:24-31` vs `rules/testability.md:21-24`.** Consistent.
  Confidence 90. testing.md sets the 90/90/90 coverage floor; testability.md:23 sets
  the "more than 2-3 mocks … design smell" structural rule. Different subjects
  (how tests are written vs how production code is shaped); testability.md:1-3 says
  so explicitly. No conflict.

- **Note — `rules/code-principles.md:80-82` vs `rules/pr-workflow.md:30-37`.**
  Consistent, single source of truth. Confidence 95. code-principles.md's Dead code
  policy is now a bare pointer: "See `pr-workflow.md` — Pre-existing violations
  section." That section exists at pr-workflow.md:28-38 and states the rule
  ("remove it in the same commit; first grep for references"). Pointer resolves.

- **Note — `rules/parallelism.md:88-107` vs `rules/extended-thinking.md:32-36`.**
  Consistent post-cb0b38c. Confidence 94. extended-thinking.md:35-36 now points at
  parallelism.md for the per-model effort table and the `budget_tokens` deprecation
  rather than restating them. parallelism.md:105-107 holds the single copy.

- **Note — `rules/autonomous-execution.md:80-90` vs `rules/diagnosis.md:53-57`.**
  Prior-run fix SURVIVED compression. Confidence 98. autonomous-execution.md:86-89:
  "The 2-try cap bounds **fix attempts, not investigation.** … plus the error
  output." diagnosis.md:55-57: "The 2-fix-attempt cap in
  `rules/autonomous-execution.md` bounds edits, not inquiry." Consistent; one owner,
  one pointer. Not re-filed.

- **Note — `rules/autonomous-execution.md:157-158` vs `rules/pr-workflow.md:43`
  vs `rules/commits.md`.** Prior-run fix SURVIVED. Confidence 96.
  autonomous-execution.md:157: "One commit per task, plus fix commits where a
  quality gate requires them (not per file, not per batch)". pr-workflow.md:43:
  "One logical commit per task. See `commits.md` for message format." No conflict.
  Not re-filed.

- **Suggestion — `post-compact-context.md:14-15` vs `rules/parallelism.md:90,117-119`.**
  Confidence 88. post-compact-context.md restores "Opus→planning/architecture
  decisions, Sonnet→implementation". parallelism.md:90 now says Opus 5 is "also
  viable for high-value implementation and routine agentic work now that Opus 5 is
  cheaper" and :117-119 "Opus now covers implementation and routine agentic work
  too". The compacted restatement is stale against the post-Opus-5 table.
  Fix: change post-compact-context.md:15 to
  "Opus→planning/architecture *and* high-value implementation, Sonnet→routine
  implementation, Haiku→scoring/dedup."

## 2. Agent isolation risk

- **Warning — `CLAUDE.md:26`.** Confidence 93. "Check `.agent-notes/` in the working
  directory before any task." Subagents do not load CLAUDE.md. `rules/memory.md:7`
  restates it, but subagents do not auto-load rules/ either. The only surviving
  mechanism is `rules/parallelism.md:41` §0 Prior observations, which puts the duty
  on the *orchestrator* to inject notes. None of the 7 sampled agent files names
  `memory.md` in Required Rules.
  Fix: add `- memory.md — read .agent-notes/ before starting; write observations`
  to the Required Rules block of the four write-capable sampled agents
  (backend-developer.md:58, microservices-architect.md:99, api-designer.md,
  typescript-pro.md).

- **Warning — `rules/lsp.md:87-91`.** Confidence 90. "Serena is registered at
  **user scope** … If `find_symbol` is missing, verify with `claude mcp list`". The
  verification command is Bash; the two read-only reviewer agents that cite lsp.md
  cannot run it, so the prescribed fallback check is unreachable for exactly the
  agents most likely to hit a missing tool.
  Fix: fold into the same scoping edit as finding 1 — for no-Bash agents, state
  "if Serena tools are absent, report it rather than silently falling back to Grep."

- **Suggestion — `rules/diagrams.md:1-20`.** Confidence 80. PlantUML-default and the
  Artifacts carve-out are ambient; no sampled agent lists `diagrams.md` in Required
  Rules, yet architect-reviewer and microservices-architect are the agents most
  likely to emit diagrams.
  Fix: add `diagrams.md` to Required Rules in architect-reviewer.md:17-21 and
  microservices-architect.md:100-108.

- **Note — `rules/parallelism.md:44-46`.** Confidence 85. "Pass only what bears on
  the write-set — irrelevant observations are distractors". Correct and
  self-contained; the orchestrator-side duty is stated where the orchestrator reads
  it. No fix.

## 3. Coverage gaps

Every category the reference lists as commonly missing is present: logging
(`logging.md`), error handling (`error-handling.md`), API design (`api-design.md`),
naming (`naming-conventions.md`), pre-existing code policy (`pr-workflow.md:28-38`),
SLO-first observability and on-call readiness (`observability.md:5-12,63-76`),
blast radius (`architecture.md:3-16`), ADR discipline (`architecture.md:18-42`),
research tiering (`research-sources.md`). Remaining gaps:

- **Warning — no rule governs `docs/` structure or the reference-pointer contract.**
  Confidence 88. Three rules now delegate depth to `docs/reference/*.md`
  (`retry-idempotency.md:40`, `string-formatting.md:20`, `prompting-quality.md:40`)
  and two to `docs/nist-ai-rmf/crosswalk.md` (`architecture.md:110`,
  `observability.md:90`), but nothing states that a moved block must keep a
  resolvable pointer or that deleting a `docs/reference` file requires updating the
  citing rule. `scripts/check-references.py` checks agent/skill/hook names, not
  `docs/` paths (scripts/check-references.py:76-95,128-131).
  Fix: extend `scripts/check-references.py` with a pattern check for
  `docs/**/*.md` paths cited from `rules/*.md`, failing on a missing target.

- **Warning — the `rules/` aggregate line cap is documented but unenforced.**
  Confidence 96. `docs/fleet/charter.md:41-42` gives the check
  (`test $(cat rules/*.md | wc -l) -le 2020`) and `docs/fleet/monitoring.md:49`
  repeats it, but no hook or script runs it — `grep -rn 2020 hooks/ scripts/`
  is empty. Commit 37ee159 was a manual recovery from a breach. Current actual:
  1913 lines, 107 of headroom.
  Fix: add the one-line `test` to `hooks/quality-gate.sh`, or a
  `PostToolUse` Write/Edit check scoped to `rules/*.md`.

- **Suggestion — no rule governs concurrency/async safety.** Confidence 75.
  `error-handling.md:44-51` covers async error propagation, but nothing covers
  cancellation, race conditions, or shared mutable state across awaits —
  a real gap for `websocket-engineer`, `golang-pro`, `rust-engineer`.
  Fix: either a short `rules/concurrency.md`, or a §"Cancellation and shared state"
  in `error-handling.md`. Note the 2020-line cap: budget ~30 lines.

- **Suggestion — no rule governs data migration/backfill execution.** Confidence 72.
  `architecture.md:73-86` names the patterns (expand-contract, strangler fig) but
  nothing governs running one: batch size, idempotency of the backfill, kill switch.
  `retry-idempotency.md` covers request-level idempotency only.
  Fix: add three bullets to `architecture.md` §Migration patterns naming batch
  size, resumability, and an abort switch as required properties of any backfill.

## 4. Rule quality issues

- **Warning — `rules/testability.md:21-24` threshold is unfalsifiable in review.**
  Confidence 82. "If a test requires more than 2-3 mocks, treat that as a design
  smell" — "2-3" is a range, so 3 mocks is simultaneously at and over the limit.
  Fix: state one number: "more than 3 mocks".

- **Warning — `rules/observability.md:5-12` "design smell" escape hatch is
  unactionable.** Confidence 80. "If a key operation has no definable SLI, treat
  that as a design smell — clarify that operation's success criteria before
  building it." No stop condition; an agent can declare clarification done.
  Fix: "…then STOP and ask; do not implement an operation whose success criteria
  you cannot state as a metric and a threshold."

- **Warning — `rules/code-principles.md:33-42` "provably so" is not operationalized.**
  Confidence 78. "'cannot occur' means provably so, not merely 'shouldn't.'" No test
  is given for what counts as proof, so the rule reads as license to remove any
  guard.
  Fix: add "Proof means: the type system rejects the state, or an enclosing
  validated boundary in the same file rejects it. A comment asserting invariance
  is not proof."

- **Suggestion — `rules/prompting-quality.md:41-42` self-defeating.** Confidence 85.
  "Deliberately not stated: file count, byte total, or token estimate." The rule
  declines to state the cap it is enforcing, so a reader of prompting-quality.md
  alone cannot check compliance; the number lives only in `docs/fleet/charter.md:41`.
  Fix: add "The cap itself is stated in `docs/fleet/charter.md` and checked there."

- **Suggestion — `rules/research-sources.md:98-100` HIGH ceiling vs `CLAUDE.md:19`.**
  Confidence 84. research-sources.md: "A claim may not be declared HIGH on Tier 3 or
  lower"; CLAUDE.md:19: "**HIGH**: Verified via tool or cited source" — a Tier-5
  blog fetched with WebFetch satisfies CLAUDE.md but is barred by
  research-sources.md. Overlap that reads as conflict when only CLAUDE.md is loaded.
  Fix: change CLAUDE.md:19 to "**HIGH**: Verified against a Tier 1-2 source
  retrieved this run (see `rules/research-sources.md`)".

- **Suggestion — `rules/api-design.md:36-40` envelope rule has no error-list case.**
  Confidence 76. List endpoints wrap in `{data,total,page,pageSize}`; errors use
  `{error,message}`. A paginated endpoint returning a partial failure has no
  defined shape, and "Never mix envelopes" forbids improvising.
  Fix: state that an error response replaces the list envelope entirely — the
  two shapes never nest.

## 5. CLAUDE.md structure

- **Suggestion — `CLAUDE.md:3-6` opens with Interaction Style.** Confidence 86.
  The two load-bearing behavioral sections — Diagnosis (`CLAUDE.md:60-63`) and Rules
  (`CLAUDE.md:65-69`) — are last. Under context pressure the front of the file
  survives best; tone is the least load-bearing content there.
  Fix: reorder to Verification → Rules → Diagnosis → Complex Tasks → Agents →
  Multi-Agent Parallelism → Session Notes → Commit Messages → On Compaction →
  Interaction Style.

- **Note — length compliant.** Confidence 99. CLAUDE.md is 69 lines against the
  "under 200 lines" rule at `prompting-quality.md:28`. No action.

- **Suggestion — `CLAUDE.md:65-69` Rules section names four load-bearing files but
  omits `diagnosis.md` from the "load-bearing four" list while `CLAUDE.md:60-63`
  gives diagnosis its own section.** Confidence 80. Actually diagnosis.md IS in the
  four; `commits.md` and `memory.md` are the ones referenced by their own sections
  without appearing in the four. Harmless.
  Fix: none required; if edited, keep the four as-is.

## 6. post-compact-context.md completeness

Restores 5 sections as CLAUDE.md:36-38 advertises. Not restored:

- **Warning — the diagnosis artifact is named but not stated.** Confidence 90.
  post-compact-context.md:32-34 says "log the full diagnosis artifact" without
  listing its four fields (mechanism / origin / causal chain / ruled out,
  `diagnosis.md:14-21`). Post-compaction the agent has neither the artifact's
  contents nor a file path to fetch it from.
  Fix: append to :34 — "Artifact = mechanism, origin `file:line`, causal chain,
  what you ruled out (`rules/diagnosis.md`)."

- **Warning — the write-set / one-writer-per-file rule is not restored.**
  Confidence 88. `parallelism.md:33-39` (file ownership) and
  `autonomous-execution.md:68-70` (verify no files modified outside the declared
  write-set) are the rules whose violation is least recoverable after compaction,
  and neither is in post-compact-context.md.
  Fix: add a 6th section: "## Write-Set Discipline (restored) — one writer per
  file; before committing a batch, `git diff --name-only` must match the batch's
  declared write-set exactly."

- **Suggestion — the complexity limits are not restored.** Confidence 82.
  `code-principles.md:84-98` limits are hook-enforced (500 lines / 30 NLOC / 10 CCN
  / 5 params) and a post-compaction agent will discover them only by being blocked.
  Fix: add one line to the Autonomous Restraint section:
  "Complexity: 500 lines/file, 30 NLOC/function, CCN 10, 5 params — hook-blocked."

- **Note — the STOP brake and the 2-fix cap are both restored** (:26-27, :32-34)
  and match `autonomous-execution.md:118-124,80-90`. Confidence 95. No action.

## 7. Pointer verification

| Rule file:line | Target path | Heading/content claimed | Found |
|---|---|---|---|
| `rules/retry-idempotency.md:40` | `docs/reference/retry-idempotency.md` | worked TypeScript `withRetry` incl. non-retryable classifier | yes — `withRetry` :11, `isNonRetryable` :29 |
| `rules/string-formatting.md:20` | `docs/reference/string-formatting.md` | per-language verdicts; why PowerShell ≠ C# | yes — "## Per-language verdict" :8, "## PowerShell is .NET, but only below the compiler" :28 |
| `rules/prompting-quality.md:40` | `docs/reference/` (dir) | "moving lookup depth to docs/reference/" | yes — dir exists, 2 files |
| `rules/architecture.md:108-110` | `docs/nist-ai-rmf/crosswalk.md` | GOVERN 1.7 / MANAGE 2.4 / GOVERN 6.2 / MANAGE 3.1 rows | yes — :101, :253, :138, :259 |
| `rules/observability.md:89-90` | `docs/nist-ai-rmf/crosswalk.md` | MANAGE 4.1 / MEASURE 2.4 rows | yes — :266, :206 |
| `rules/code-principles.md:82` | `rules/pr-workflow.md` | "Pre-existing violations section" | yes — :28-38 |
| `rules/extended-thinking.md:35-36` | `rules/parallelism.md` | per-model effort table + `budget_tokens` deprecation | yes — :88-101, :105-107 |
| `rules/diagnosis.md:55` | `rules/autonomous-execution.md` | 2-fix-attempt cap | yes — :80-90 |
| `rules/observability.md:48` | `rules/logging.md` | field lists + error-log content | yes — :7-20, :39-47 |
| `rules/pr-workflow.md:43` | `rules/commits.md` | message format | yes |
| `rules/code-principles.md:106-108` | `hooks/complexity-ignore` | path-prefix ignore file | yes — file exists |
| `rules/prompting-quality.md:38` | (unnamed gate) | "a gate enforces its absence" of `paths:` | **NO** — no `paths` check in `hooks/` or `scripts/` |
| `rules/lsp.md:2-3` | LSP plugins installed | typescript-lsp, pyright-lsp, etc. | not verifiable from read-set — see §8 |

One failure: `rules/prompting-quality.md:38`. Filed as a contradiction in §1.

## 8. Compression damage

Constraints that lost a threshold, file name, or command in 48c162d / 44d23ae /
cb0b38c / 37ee159. Each verified against `git show <sha>`.

- **Warning — `rules/prompting-quality.md:37-38` (48c162d).** Confidence 95. The
  commit replaced a `paths:`-as-mitigation claim with "a gate enforces its absence"
  — naming an enforcement mechanism that does not exist, and leaving the
  contradicting :104-106 paragraph in place. This is the only case where
  compression *added* an unverifiable claim.
  Fix: as in §1.

- **Warning — `rules/prompting-quality.md:41-42` (48c162d).** Confidence 90. The
  commit removed the concrete line total and replaced it with "Deliberately not
  stated: file count, byte total, or token estimate." The binding threshold (2020)
  now lives only in `docs/fleet/charter.md:41`, which no rule points at.
  Fix: add the pointer, per §4.

- **Note — `rules/string-formatting.md` (44d23ae, -62 lines).** Confidence 94.
  Survived intact: the accumulation-in-a-loop builder table (:32-42) keeps every
  per-language command (`StringBuilder`, `strings.Builder`,
  `String::with_capacity`, `"".join(parts)`, `reserve()`), the three override cases
  (:12-16) name Java, Go's `fmt.Sprintf`, and loops explicitly, and the trust-boundary
  prohibition (:45-48) is verbatim. Only lookup depth moved. No damage.

- **Note — `rules/retry-idempotency.md` (44d23ae, -26 lines).** Confidence 96.
  Survived intact: max 3 attempts, 100ms base, 2×, 5s cap, ±20% jitter (:5-9);
  the 4xx-except-429 classifier and 409 rule (:14-16); `Idempotency-Key: <uuid>`,
  24h TTL, per-operation/per-client scope (:31-37). Only the TypeScript sample
  moved. No damage.

- **Note — `rules/parallelism.md` (cb0b38c + 48c162d, -17 lines).** Confidence 92.
  Survived intact: the 9-section agent-prompt structure (:40-79) keeps every named
  section; the model table (:88-93) keeps aliases, effort defaults, and context
  sizes; the anti-pattern table (:121-127) keeps the >8-tool limit and its MCP
  carve-out (:129-136); the spawn-depth default of 3 and
  `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (:167-176) are present. No damage.

- **Note — `rules/autonomous-execution.md` (cb0b38c, -15/+4).** Confidence 94.
  The removed copy of the diagnosis artifact was replaced by a pointer at :86-89
  that names `rules/diagnosis.md` and lists the four fields inline
  ("mechanism, origin, causal chain, ruled out"). Threshold ("max 2 tries per gate",
  :80) intact. No damage — but see §6, where the same artifact is *not* recovered
  post-compaction.

- **Note — `rules/observability.md` (cb0b38c, -4/+2).** Confidence 93. The error-log
  content list was replaced by :48 "`logging.md` owns field lists and error-log
  content requirements" — a named file, resolvable. No damage.

- **Note — `rules/extended-thinking.md` (cb0b38c, -13/+4).** Confidence 93. The
  duplicated effort table became :35-36 pointing at `parallelism.md`, and the
  3-significantly-different-approaches trigger (:56-62) survived with its
  definition ("affect multiple files, change the data model, or be expensive to
  reverse"). No damage.

- **Note — `rules/pr-workflow.md` (37ee159).** Confidence 91. The attribution
  section was deleted; the single surviving statement is `commits.md:3-5`, which
  keeps the concrete prohibitions (`Co-Authored-By: Claude`, generated-by footer,
  session link) and the README carve-out. Reachable from pr-workflow.md:43's
  pointer to commits.md. No damage.

Net: 1 constraint damaged (`prompting-quality.md:37-38`, an added false claim);
0 thresholds, file names, or commands lost.
