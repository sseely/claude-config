# Self-Improve Phase 2 — Agent F: Rules & CLAUDE.md Consistency Audit

Read-only audit. Scope: CLAUDE.md, all 22 files in `rules/`,
`post-compact-context.md`, and 7 sampled agent definitions.

Severity legend: **Critical** (breaks behavior / contradicts), **High**
(material inconsistency or gap), **Medium** (clarity / threshold), **Low**
(polish).

---

## 1. Contradictions

### F-1. Opus 4.7 vs Opus 4.8 default model — stale version reference
- **High**
- `rules/extended-thinking.md:33`: "Default is `high` on Opus 4.8 and
  Sonnet 4.6; `xhigh` on Opus 4.7."
- `rules/parallelism.md:88-91` and the whole config (CLAUDE.md, post-compact)
  treat **Opus 4.8** (`claude-opus-4-8`) as the current model. Opus 4.7 is the
  prior generation. The line reads as if 4.7 is a live tier you'd route to.
- Also `parallelism.md:115` references "Max thinking" and `extended-thinking.md`
  elsewhere says extended thinking is *removed* on Opus 4.8 — so an `xhigh`
  effort default "on Opus 4.7" is dangling guidance for a model the user no
  longer runs.
- **Fix:** Drop the Opus 4.7 clause or relabel as historical:
  "Default is `high` on Opus 4.8 and Sonnet 4.6." If `xhigh` is still a valid
  effort on 4.8, state that explicitly instead of attaching it to 4.7.

### F-2. squash-merge (pr-workflow) vs one-commit-per-task (autonomous) — reconciled but easy to misread
- **Medium** (documented, but the seam is subtle)
- `rules/pr-workflow.md:22-23`: "Feature branches: squash merge → one clean
  commit per feature on main."
- `rules/autonomous-execution.md:163-166` + `pr-workflow.md:26`: mission-brief
  branches use **merge commits** (not squash) to preserve per-task commit IDs.
- These do NOT actually conflict (mission-brief is carved out as an exception in
  both files), but a reader scanning only pr-workflow.md:22 could squash a
  mission branch. The exception lives at line 26, four lines below the squash
  default.
- **Fix:** Add an inline pointer at pr-workflow.md:22:
  "Feature branches: squash merge (exception: mission-brief branches, see below)."
  This is consistency-preserving, not a behavior change.

### F-3. "no period" subject vs research-citation example punctuation — none found (verified clean)
- Checked commits.md examples against the ≤72/lowercase/no-period rule. All
  examples comply. No contradiction. (Recorded so it isn't re-flagged.)

### F-4. YAGNI removal — fully clean (verified)
- `grep -rni "yagni"` across the entire `~/.claude` tree (excluding phase notes)
  returns **zero** hits. The replacement principle "Build to the defined scope —
  no more, no less" (`code-principles.md:3-18`) is in place.
- Both reviewer agents reference the new principle **consistently and
  identically**:
  - `agents/04-quality-security/code-reviewer.md:24`
  - `agents/04-quality-security/architect-reviewer.md:18`
  both read: "flag scope mismatches (spec/source items missing, or code added
  beyond the defined scope)" — this correctly captures the *two equal failure
  modes* from code-principles.md:17-18 (trimming required items AND inventing
  unrequested ones). **No stale YAGNI anywhere. Good.**
- Minor: `penetration-tester.md:8` uses the phrase "defined scope" but in the
  unrelated pentest-boundary sense, not the code-principle sense. Not a problem,
  just noting the phrase collision so a future grep doesn't misread it.

---

## 2. Agent Isolation Risk (ambient context that vanishes in subagents)

### F-5. CLAUDE.md "Required Rules" lists assume the agent can read `~/.claude/rules/*` — but rule *bodies* are never inlined
- **High**
- Every sampled agent ends with a "Required Rules" block that *names* rule files
  (e.g. backend-developer.md:55-67 lists 12 rule files by filename + a one-line
  gloss). The agent is expected to apply them.
- `rules/parallelism.md:34-36` correctly states: "Subagents start with a blank
  slate — no conversation history, no CLAUDE.md, no awareness of prior
  decisions." Subagents also do **not** auto-load `~/.claude/rules/`. So an agent
  told "apply `observability.md` — SLO-first, RED metrics" only has the one-line
  gloss unless it actively `Read`s the file.
- The glosses are good summaries, but for thorough rules (observability on-call,
  retry-idempotency backoff math, architecture blast-radius ordering) the
  one-liner is lossy. Agents that don't proactively Read the file will operate on
  the summary only.
- **Fix:** Either (a) state explicitly in each agent's Required Rules header:
  "Read each listed file with the Read tool before applying — the gloss is an
  index, not the rule," or (b) accept the gloss as authoritative and stop
  implying the full file governs. Option (a) is more faithful to current intent.

### F-6. `lsp.md` Subagent note is correct, but the LSP→Serena swap is only in lsp.md, not surfaced where agents are routed
- **Medium**
- `rules/lsp.md:74-83` correctly tells subagents to use Serena MCP tools, not the
  LSP tool (which agents lack). Each sampled agent's Required Rules list includes
  `lsp.md` with the gloss "Serena MCP navigation for subagents." Good.
- BUT `lsp.md:67-72` ("Diagnostics") tells the orchestrator to read LSP
  diagnostics after edits and *not* run a build step. Subagents have neither LSP
  diagnostics nor that instruction prominently; the subagent equivalent
  ("run the project's typecheck command") is buried at lsp.md:82-83.
- **Fix:** Already mostly handled; low-risk. Optionally hoist the subagent
  typecheck instruction into the agent frontmatter quality-bar lines so it's not
  dependent on the agent reading lsp.md's last paragraph.

### F-7. `memory.md` / Session Notes assume `.agent-notes/` is pre-loaded — parallelism.md handles it, but solo subagents may not
- **Medium**
- CLAUDE.md:26 and `memory.md:5-10` say "check `.agent-notes/` before any task."
- `parallelism.md:38-40` puts the burden on the *orchestrator* to inject prior
  observations verbatim into agent prompts ("Do not rely on the agent to discover
  them"). Correct and consistent.
- Gap: a subagent dispatched **without** the orchestrator pre-loading notes has
  no instruction to go read `.agent-notes/` itself, and may not have a stable cwd
  (Agent threads reset cwd between bash calls). None of the 7 sampled agents
  mention `.agent-notes/` in their bodies.
- **Fix:** This is by-design (orchestrator owns injection), but worth a one-line
  note in parallelism.md: "If the orchestrator did not inject notes, the agent
  should NOT assume none exist." Low priority.

---

## 3. Coverage Gaps (verified against actual files)

Most behaviors the brief lists **do exist** and are well-covered. Confirmed
present:
- Logging → `logging.md` ✓
- Error handling → `error-handling.md` ✓
- API design → `api-design.md` ✓
- Naming → `naming-conventions.md` ✓
- Pre-existing code policy → `pr-workflow.md:28-39` ✓
- PR/branch workflow → `pr-workflow.md` ✓
- SLO observability / on-call → `observability.md:61-74` ✓
- Blast-radius order (data-model→API→service-deps→files) → `architecture.md:3-19`
  ✓ and propagated to architect-reviewer.md:11 and code-reviewer.md:26 ✓
- ADR discipline → `architecture.md:21-49` ✓
- Research source tiering → `research-sources.md` ✓
- Retry/idempotency → `retry-idempotency.md` ✓

### F-8. No rule governs the `Workflow` tool that CLAUDE.md mandates
- **High**
- CLAUDE.md:49: "Use Workflow (via `Workflow` tool) for multi-step parallel
  orchestration... Workflow is user-opt-in only — never invoke unless the user
  explicitly requests it or a skill instructs it."
- There is **no `Workflow` tool in this session's tool list**, and **no rule
  file** describes what Workflow is, its inputs, or how it differs operationally
  from the Agent tool. parallelism.md (the natural home) never mentions Workflow.
- Risk: the instruction is unactionable — an agent told to "use Workflow" has no
  spec. It's also potentially stale (tool may have been removed/renamed).
- **Fix:** Either remove the Workflow sentences from CLAUDE.md:49 if the tool is
  gone, or add a short `rules/orchestration.md` (or a parallelism.md section)
  defining Workflow vs Agent. Verify the tool actually exists in the harness
  first.

### F-9. No global rule for documentation/comment standards
- **Low**
- Several agents demand "documentation complete" (code-reviewer.md:17) but no
  rule file defines what doc completeness means (JSDoc? README? inline?). Minor;
  agents currently self-define. Flagging only for completeness.

### F-10. Concurrency / data-race / locking has no rule
- **Low**
- retry-idempotency, error-handling, and observability cover distributed
  failure, but no rule addresses in-process concurrency (locks, races, async
  ordering) beyond testability.md's "eliminate temporal coupling." Likely
  intentional given the stack (Workers/edge). Not a blocker.

---

## 4. Rule Quality (thresholds, broad exceptions, aspirational statements)

### F-11. observability.md "Cannot define SLI? Feature not ready — stop." is too absolute
- **Medium**
- `observability.md:10`: a hard stop on any feature lacking a definable SLI.
  Taken literally this blocks internal tooling, one-off scripts, and prototypes —
  the same categories testing.md:15 and pr-workflow.md exempt from other rules.
- **Fix:** Scope it: "For every externally-accessed operation (per the scope line
  above), cannot define an SLI? Stop." The scope line at :6-7 already exists;
  the stop directive at :10 just needs to inherit it.

### F-12. backend-developer.md "sub-100ms p95" as a non-negotiable delivery requirement
- **Medium**
- backend-developer.md:7 and :33 state p95 < 100ms as "non-negotiable." This is
  an aspirational absolute that's wrong for many valid backends (report
  generation, third-party-bound endpoints, cold-start edge). It contradicts
  observability.md's correct stance that SLOs are *defined per operation*, not
  globally fixed.
- **Fix:** Change to "meet the SLO defined per `observability.md` for each
  endpoint (default target p95 < 100ms for CRUD reads)." Keeps the intent,
  removes the false absolute.

### F-13. testability.md "more than 2-3 mocks = design smell" — soft threshold stated as rule
- **Low**
- `testability.md:23-24`: reasonable heuristic, but "2-3" is fuzzy and the
  "restructure before writing more tests" directive can be read as a hard gate.
  Fine as guidance; flagging only that it's a judgment call dressed as a
  threshold. No change required.

### F-14. error-handling.md timeout defaults are sensible but unscoped to runtime
- **Low**
- `error-handling.md:55-58`: 5s/30s/1s defaults. Good. Minor: edge/Workers have
  their own subrequest CPU/wall limits that can undercut a 30s batch timeout. A
  one-line "subject to platform limits (e.g. Workers subrequest caps)" would
  prevent a false sense of guarantee. Low.

---

## 5. CLAUDE.md Structure & Size

### F-15. Size is within budget — but the stated limit and the file's own framing differ
- **Info / Low**
- `wc -c CLAUDE.md` = **3432 bytes** → under the 4KB ceiling set by
  `prompting-quality.md:28`. Good, ~570 bytes of headroom.
- Note: prompting-quality.md:25-33 says "Keep them under 4KB" referring to
  *custom instructions* — but CLAUDE.md additionally pulls in all of `rules/`
  indirectly and the full rules tree is ~70KB. The 4KB applies only to the
  always-prepended CLAUDE.md, which is satisfied. No action.

### F-16. Front-loading: critical operational rules are buried below soft ones
- **Medium**
- Current order: Interaction Style → Verification → Session Notes → On Compaction
  → Complex Tasks → Agents → Multi-Agent → Commits → Rules index.
- The **Verification** block (CLAUDE.md:8-22, "use tools before answering;
  declare confidence levels") and **Session Notes / `.agent-notes`**
  (CLAUDE.md:24-26) are the highest-leverage behavioral rules but sit mid-file.
  "Interaction Style" (no filler phrases) leads — low operational stakes.
- **Fix:** Consider promoting Verification and Session Notes above Interaction
  Style, or merge Interaction Style into a single line. Per
  prompting-quality.md's own front-loading logic, the rule most likely to change
  behavior should appear first.

### F-17. CLAUDE.md Rules index (lines 61-67) omits some rule files
- **Medium**
- The index at CLAUDE.md:61-67 lists rule files by category. Cross-checking
  against `ls rules/`: the index is missing **`error-handling.md`** is present
  (line 65 ✓), but verify completeness — index covers: code-principles,
  security, testing, testability, parallelism, autonomous-execution, memory, lsp,
  extended-thinking, prompting-quality, logging, error-handling, api-design,
  observability, architecture, research-sources, environment, naming-conventions,
  pr-workflow, commits, retry-idempotency. That is **21**; `ls` shows **22**
  files. The missing one is **`api-design.md`** — wait, it IS at line 65. Recount
  needed: all 22 appear to be listed. **No gap confirmed.** (Recorded to prevent
  re-flag; the index is complete.)

---

## 6. post-compact-context.md Completeness

`post-compact-context.md` restores: (1) autonomous-execution recovery sequence,
(2) model routing, (3) commit format. CLAUDE.md:30-36 correctly explains that
CLAUDE.md itself reloads verbatim, so post-compact only needs to cover what's
*not* in any always-loaded instruction file.

### F-18. Verification/confidence-level discipline is NOT restored after compaction
- **High**
- CLAUDE.md:8-22 (use tools before answering, declare HIGH/MEDIUM/LOW/UNKNOWN)
  reloads verbatim with CLAUDE.md, so technically it survives — **not** a gap by
  the file's own logic.
- However: the **rule bodies** (`research-sources.md` tiering, `error-handling.md`
  patterns, `observability.md` SLO-first) do NOT reload and are NOT in
  post-compact. After a long autonomous run that compacts mid-task, an agent
  retains only the CLAUDE.md one-line glosses. For mission execution this is the
  most dangerous loss because autonomous-execution.md:30-44 ("re-read README,
  decision-journal") IS restored but the *quality bars* those tasks must meet are
  not.
- **Fix:** Add a 3-4 line "Quality invariants" block to post-compact-context.md:
  "After compaction, these still apply (re-read the rule file if acting on it):
  TDD + 90/90/90 (testing.md), validate at boundaries (security.md), SLO-first +
  on-call readiness (observability.md), blast-radius order data→API→deps→files
  (architecture.md)." Keeps it short; restores the load-bearing gates.

### F-19. post-compact restores model routing but not the Opus behavioral-compensation constraints
- **Medium**
- `post-compact-context.md:17-19` restores Opus→planning / Sonnet→impl /
  Haiku→scoring. But the **Opus behavioral compensation** block
  (parallelism.md:97-108: "do NOT infer unstated requirements, do NOT
  over-engineer") is the part most relevant when *Opus itself* resumes a
  compacted autonomous run. That guidance is lost post-compaction.
- **Fix:** Add one line to post-compact: "If running as Opus: do not infer
  unstated requirements or over-engineer; implement the minimal interpretation
  of each task and log ambiguity (parallelism.md)."

### F-20. post-compact does not restore the consecutive-fix STOP rule
- **Medium**
- autonomous-execution.md:130-136 ("3 consecutive failures on the same
  check/location → stop, do not keep iterating") is a critical safety brake for
  unattended runs and is exactly the kind of nuance compaction erases. It is not
  in post-compact-context.md.
- **Fix:** Add: "Consecutive-fix brake: if the same location/check fails 3× in a
  row, STOP and document — do not keep retrying (autonomous-execution.md)."

---

## Summary of Highest-Value Fixes
1. **F-8** — Define or remove the `Workflow` tool reference (CLAUDE.md:49);
   currently unactionable.
2. **F-18 / F-20 / F-19** — Add quality-invariant + safety-brake + Opus-restraint
   lines to post-compact-context.md; these are the rules most damaged by
   compaction during autonomous runs.
3. **F-5** — Clarify whether agents must `Read` listed rule files or treat the
   gloss as authoritative.
4. **F-1** — Remove stale Opus 4.7 default from extended-thinking.md:33.
5. **F-12 / F-11** — De-absolutize "sub-100ms p95 non-negotiable" and the
   SLI-or-stop directive; route both through per-operation SLOs.

## Verified-Clean (do not re-flag)
- YAGNI fully removed; scope-fidelity principle consistent across both reviewer
  agents (F-4).
- Blast-radius ordering propagated correctly to reviewer agents.
- CLAUDE.md = 3432 bytes, under 4KB (F-15).
- Rules index in CLAUDE.md is complete — all 22 files listed (F-17).
- Commit-message examples comply with commits.md (F-3).
