# Agent F — Rules and CLAUDE.md audit (2026-10-08)

Scope read: CLAUDE.md (79 lines, 3716 B), rules/*.md (26 files, 1272 lines,
~57.7 KB), post-compact-context.md (2579 B), 7 sampled agents. Items already in
code-review-tasks.md (F009, F065, F066, F067-F070, F085, F101, F140, F141,
F192, F197-F199) are not re-derived. Prior-run (09-02) lsp.md-vs-read-only-agents
Critical is RESOLVED: code-reviewer.md now has Bash in `tools:` and disallows only
Write/Edit. The `paths:` pilot: diagrams.md carries it deliberately (charter AD-1
exception, T16 green); not re-proposed.

## Findings

### 1. Contradictions

- **Warning — `rules/security.md:28` vs `rules/error-handling.md:34-38`.**
  Conf 72. security.md: "Never expose stack traces, SQL errors, file paths, or
  internal IDs in responses". error-handling.md: "Include the relevant identifier
  or value: 'User 42 not found' not 'User not found'", then forbids only "stack
  traces, SQL, file paths" in client-surfaced messages. The internal-ID item is in
  one list and the model example in the other. Fix: in error-handling.md add
  "(client-facing: use the caller-supplied identifier, never an internal ID;
  full detail goes to the server log)" or drop `internal IDs` from security.md.

- **Suggestion — `agents/04-quality-security/code-reviewer.md:14` vs
  `rules/code-principles.md` (hook limits) / `docs/fleet/charter.md:39`.**
  Conf 68. code-reviewer: "Cyclomatic complexity < 10 maintained". Hook/charter:
  "cyclomatic complexity ≤10" blocks only when exceeded. A CCN-10 function passes
  the hook and fails the reviewer checklist. Fix: change agent line to "≤ 10
  (hook limit; flag > 10)".

- **Suggestion — `post-compact-context.md:34-36` vs `rules/model-routing.md:62-71`.**
  Conf 65. post-compact restores "Opus restraint: implement the simplest
  interpretation; no speculative abstractions" under Autonomous Restraint, but
  model-routing assigns autonomous mission-brief execution to Fable, whose guidance
  is explicitly "invert the Opus constraints". After compaction in an autonomous
  Fable session the only restored model-behavior directive is the Opus one.
  Fix: reword heading to "If routed to Opus: ..." and add one Fable line
  ("Fable: outcome-oriented prompts, async subagents, audit progress claims against
  tool results") or drop the Opus line (it is already in model-routing.md, which
  the file itself says may or may not survive compaction).

### 2. Stale capability / version claims (do not invent replacements)

- **Warning — `rules/model-routing.md:36-38`.** Conf 90. "**Sonnet 5** reaches
  near-Opus-4.8 quality at ~60% of Opus cost. **Opus 5** is roughly Fable-class
  capability at ~half Opus 4.8's cost". Aliases now resolve to 5.5 (lines 10, 24-26),
  so both comparative claims describe models the aliases no longer point to, and
  the numbers are unsourced. Fix: delete the two sentences (keep "so it now also
  covers routine agentic work" only if re-verified), or replace with a sourced
  claim about 5.5 after checking Anthropic's model page.
- **Suggestion — `rules/model-routing.md:14-18`.** Conf 70. HTML comment cites
  PerspectiveGap scores for opus-4-8/sonnet-5/fable-5 and "Opus 5 untested";
  none of those are the current aliases. Comment is not resident-useful. Fix:
  move to `.agent-notes` or delete.
- **Suggestion — `rules/model-routing.md:30-31`.** Conf 60. "`budget_tokens` is
  removed on `claude-opus-4-8`/Sonnet 5 (400)" — names superseded ids; state for
  current alias ids or generalize ("on current Opus/Sonnet").
- **Suggestion — `rules/model-routing.md:72`.** Conf 60. "Fable 5 falls back to
  Opus 4.8 when safety classifiers trigger" — fallback target may now be Opus 5.x;
  re-verify.
- **Suggestion — `rules/model-routing.md:~48-58` ("Opus behavioral
  compensation ... validated in production").** Conf 55. The compensation list
  was validated on earlier Opus; alias is now Opus 5.5 with no re-validation noted.
  Fix: add "(validated on Opus 4.x; re-check on 5.5)" or run one eval before
  keeping 7 resident bullets.
- **Suggestion — `rules/prompting-quality.md:15-18`.** Conf 60. "On Claude
  4.6+/Fable 5/Opus 4.8" names models two generations back; claim ("scoping beats
  intensity") likely still true but un-reverified for 5.5. Fix: say "current
  models" or re-cite.
- **Suggestion — `rules/prompting-quality.md:59-60`.** Conf 65. "The Sonnet 5
  tokenizer emits ~1.3× the tokens of Sonnet 4.6" — comparison to a retired baseline;
  actionless. Delete.
- **Note — `post-compact-context.md:13-15`.** Model Routing section has no
  version/capability claims; it is not stale (Opus "high-value implementation"
  matches routing). OK.
- **Note — `rules/parallelism.md:~100` "As of v2.1.219 default depth is 3".**
  Conf 50. Version-pinned fact; fine but will drift (cf. F192/F193).

### 3. Agent isolation risk

- **Warning — `CLAUDE.md:~43` ("Check `.agent-notes/` ... before any task") and
  `rules/memory.md`.** Conf 70. Subagents do not see CLAUDE.md; sampled agents
  (backend-developer, microservices-architect, typescript-pro) list memory.md only
  as "read the referenced rule file" — it is skippable. architect-reviewer,
  code-reviewer, api-designer do not list memory.md at all, so read-only reviewers
  neither read nor write notes. parallelism.md covers this by making the
  orchestrator paste notes into the prompt, so the risk is bounded; only flag if
  reviewers are expected to write observations. Fix: none required; add a
  one-line note in parallelism.md that read-only agents report observations in
  their return message instead.
- **Note — `rules/lsp.md` "Agents lack the LSP tool".** Conf 55. This subagent
  session lists an `LSP` tool and WebStorm MCP tools; claim is true for
  agents with explicit `tools:` allowlists but not for `tools: *` agents
  (general-purpose, claude). Fix: "Agents with an explicit tools allowlist lack LSP".
- **Note — rules relying on hooks that only fire in the main session** (complexity
  limits, code-principles.md): subagent Write/Edit also trigger PostToolUse, so
  OK; no finding.

### 4. Coverage gaps

- **Suggestion — no rule on dependency/supply-chain additions** (new package
  adoption, pinning, lockfile hygiene). Only code-principles "Add libraries only
  when fetch is genuinely insufficient" touches it. Conf 45. Defer: upgrade-deps
  skill covers upgrades; a 3-line addition to security.md would close adoption.
- **Suggestion — no rule on concurrency of this repo's own edits / destructive
  git ops**; handled by guard-bash.py hook (mechanical), so correctly not a rule.
  Conf 40. No action.
- **Note — every category listed in the Agent F spec (logging, error handling,
  API design, naming, pre-existing code, PR/branch, SLO/on-call, blast radius,
  ADR, research tiers) has a governing rule.** Coverage is complete.

### 5. Rule quality

- **Warning — `docs/fleet/charter.md:41-42` cap vs reality.** Conf 80. Cap is
  `rules/*.md` ≤ 2020 lines; actual is 1272 (63%). A cap with 748 lines of slack
  no longer constrains drift. Fix: ratchet to ~1350 in charter and the check.
  (Complements F066, which was written when rules/ was 1960/2020; that task is
  done, the ratchet was not.)
- **Suggestion — `rules/extended-thinking.md:28-36`** "Self-refine ... ~20%
  improvement (NeurIPS 2023 ...)" and `rules/prompting-quality.md:48-62,93-100`
  carry citation/rationale prose (arxiv ids, MOSAIC tiers, "Scale-aware brevity")
  that changes no behavior beyond the one-line directive. Conf 75. Fix: keep
  directive, move provenance to docs/reference/ (see verdict table).
- **Suggestion — `rules/prompting-quality.md:80-90` "Register shifting".** Conf 50.
  Sound directive, but "validated empirically" has no cite; either cite or label
  MEDIUM per research-sources.md.
- **Suggestion — `rules/observability.md`** (3022 B) is backend-service-specific
  (SLO burn-rate windows, dashboards "within one sprint") and loads in every
  session including config/docs work. Conf 70. Candidate for `paths:` — requires
  new evidence given RED pilot, but diagrams.md pilot is GREEN (charter) and
  was run on v2.1.278+; that is new evidence for a second pilot, owner decision.
- **Note — constraint-budget (≤6 per section).** model-routing "Opus behavioral
  compensation" now 2 sub-sections (F069 fixed). architecture.md "When to
  escalate" has 4; observability "What not to do" packs 4 clauses in one sentence.
  Fine.

### 6. CLAUDE.md structure

- **Suggestion — CLAUDE.md:~14-31 order.** Conf 55. "Interaction Style" and
  "Verification" lead (good, F141 moved it). "Rules" line points to the load-bearing
  five; Complex Tasks / Agents / Parallelism / Session Notes / Commit / Compaction
  follow. Agents section is 6 bullets including Workflow/agent-team availability
  (user-opt-in note) — acceptable. No buried critical rule found. 79 lines, under
  the 200-line cap.
- **Note — CLAUDE.md:50-54** "Multi-Agent Parallelism" is a one-line pointer;
  fine. "On Compaction" explains hook; good for humans but 6 lines resident
  every session with no behavioral effect on the model. Conf 50, trim candidate
  (~350 B).

### 7. post-compact-context.md completeness

- **Suggestion — missing: diagnosis method.** Conf 60. Only the artifact list in
  Batch Close-Out is restored; the "no fix before a stated mechanism / instrument
  before hypothesizing" rule is not. CLAUDE.md (survives compaction) has a
  one-line Diagnosis pointer, so partially covered. Fix: add 1 line to Batch
  Close-Out: "On any observed defect: state mechanism before proposing a fix."
- **Suggestion — missing: .agent-notes handoff and file-ownership for
  interactive multi-agent work.** Write-set discipline restored for autonomous
  only. Conf 45. Acceptable; CLAUDE.md covers notes.
- **Note — threshold wording:** post-compact:30 "fails the same check 3x
  consecutively" vs autonomous-execution "3+ edits to one location" — already
  distinguished in the file itself; related to F009 (open-ended).
- **Note — commit-format section (lines 17-28)** retains a "T15 unverified" HTML
  comment from 2026-09-20; whether rules/ survives compaction is still
  unverified. If `/context` is now available, verify once and delete either the
  section or the comment. Conf 70.

## Per-rule verdict table (performance per token)

Sizes in bytes (wc -c). "Leaning" is the owner-facing recommendation.

| File | Bytes | Leaning | One-line reason |
|---|---:|---|---|
| api-design.md | 550 | keep | Already a stub with two sharp rules; cheap |
| architecture.md | 3412 | trim | Blast-radius order + reversibility change behavior; ADR/migration prose duplicates docs/reference |
| autonomous-execution.md | 688 | keep | Pointer stub, gates a large reference doc |
| code-principles.md | 4324 | trim | Scope and Defensive-code sections are high-yield; HTTP client table + SOLID boilerplate are low-yield |
| commits.md | 1437 | keep | Directly overrides default attribution behavior |
| diagnosis.md | 3395 | keep | Highest behavioral delta in the set; could drop "Scope of change" paragraph |
| diagrams.md | 698 | keep | Already `paths:`-scoped; 698 B is negligible |
| environment.md | 484 | merge | 484 B stub; fold into security.md (Secrets) and delete file |
| error-handling.md | 2889 | keep | Concrete, testable; fix the internal-ID conflict |
| extended-thinking.md | 1830 | trim | Citation/self-refine padding; keep trigger list and self-assessment trigger (~900 B) |
| logging.md | 1674 | keep | Specific required fields; no duplicate |
| lsp.md | 1964 | keep | Priority order drives tool choice; "Agents lack LSP" needs the allowlist caveat |
| memory.md | 1851 | trim | Observation template is useful; "What NOT to write" + auto-memory prose could halve |
| model-routing.md | 4640 | trim | Table + gates are valuable; delete stale capability claims, PerspectiveGap comment, validate Opus bullets (~1.2 KB savings) |
| naming-conventions.md | 492 | merge | Stub of 3 bullets; fold into code-principles.md or move to `paths:` |
| observability.md | 3022 | trim | Backend-only; candidate for a second `paths:` pilot (owner call) |
| parallelism.md | 4592 | trim | Planning procedure + file-ownership are core; prompt-structure para and depth/resumption notes are reference-grade |
| pr-workflow.md | 2018 | keep | Pre-existing-violations policy is unique and actionable |
| prompting-quality.md | 5256 | trim | Largest rule; ~40% citation/rationale; constraint-keywords + context-budget are the payload |
| research-sources.md | 814 | keep | Already compressed to confidence table |
| retry-idempotency.md | 1786 | keep | Numeric policy, no ambient duplicate |
| security.md | 1471 | keep | Small, specific; absorb environment.md |
| string-formatting.md | 1997 | trim | Per-language builder table is mildly useful; language verdicts already in docs/reference; consider `paths:` for code files |
| testability.md | 1997 | keep | Distinct from testing.md; shapes design, not just tests |
| testing.md | 1806 | keep | TDD + 90/90/90 + assertion quality; each line gradable |
| CLAUDE.md | 3716 | keep | Pointer index; trim "On Compaction" (~350 B) |
| post-compact-context.md | 2579 | trim | Resolve unverified-survival comment; fix Opus-vs-Fable line; add diagnosis one-liner |

Aggregate: rules/ ≈ 57.7 KB resident (~14-15k tokens). Realistic trim
without behavior loss: ~7-9 KB (prompting-quality ~2 KB, model-routing ~1.2 KB,
parallelism ~1.2 KB, code-principles ~1 KB, extended-thinking ~0.9 KB,
architecture ~1 KB, memory ~0.8 KB). No file warrants outright delete; two
(environment.md, naming-conventions.md) are merge candidates at < 500 B each.
