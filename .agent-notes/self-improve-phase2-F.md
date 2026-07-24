# Self-Improve Phase 2 — Agent F: Rules / CLAUDE.md / Agent Consistency Audit (2026-07-24)

Read-only. Scope read in full: `CLAUDE.md`, all **23** files under `rules/`
(the brief said 22 — the CLAUDE.md index at :65-72 is correct, the brief was
stale), `post-compact-context.md`, 7 sampled agents, plus `skills/fix`,
`skills/auth-setup`, `skills/payments-setup` and grep sweeps across all 126
agents where a claim required fleet-wide verification.

Severity: **Critical** / **Warning** / **Suggestion** / **Note**.
25 findings, highest impact first within each section.

---

## 1. Contradictions

### F1. Coverage floor drift — six agents ship a floor below the global floor
**Critical**

- `rules/testing.md:26-27` — "Target at least 90% line coverage, 90% branch
  coverage, and 90% function coverage. Treat these as a floor, not a ceiling."
- `agents/01-core-development/frontend-developer.md:23` — "Comprehensive test
  coverage (>85%)" (repeated at `:147`)
- `agents/02-language-specialists/java-architect.md:14` — "Test coverage
  exceeding 85%"
- `agents/02-language-specialists/angular-architect.md:14` — "Test coverage >
  85% achieved"
- `agents/04-quality-security/test-automator.md:11` — "Test coverage > 80%
  achieved"
- `agents/03-infrastructure/devops-engineer.md:13` — "Test automation > 80%
  coverage"
- `agents/06-developer-experience/legacy-modernizer.md:11` — "Test coverage >
  80% achieved"

None of the six cite `testing.md`. `test-automator` — the agent whose entire
job is coverage — ships the lowest number. An agent asked to "meet the coverage
bar" will meet 80%, and the orchestrator has no signal that the floor was
missed.

**Fix:** replace each numeric with "per `~/.claude/rules/testing.md` — 90/90/90
floor". Six single-line edits. Root cause is F11.

### F2. `/fix` explicitly permits skipping diagnosis mid-loop
**Critical**

- `rules/diagnosis.md:33-34` — "**No fix before a stated mechanism.** A proposed
  change offered before the mechanism is identified is incomplete work. Do not
  propose it."
- `skills/fix/SKILL.md:84-86` — "If the error is DIFFERENT → the fix made
  progress; pass the new error directly to the language agent for the next fix
  attempt **(skip re-diagnosis if the new error is straightforward)**"

A different error is a new observed discrepancy, which `diagnosis.md:4-8`
defines as the trigger to enter diagnosis mode. The skill's Phase 2 gate
(`fix/SKILL.md:53-56`) enforces the root-cause artifact correctly on entry, then
the Phase 3 loop routes around it. This is the exact failure mode
`diagnosis.md:35-37` names ("Do not guess to make progress").

**Fix:** at `fix/SKILL.md:86`, delete the parenthetical and route the new error
back to the debugger for a fresh Mechanism/Origin/Causal-chain/Ruled-out
artifact before the next fix attempt.

### F3. `/fix` iteration budget overruns the consecutive-fix stop rule
**Warning**

- `rules/autonomous-execution.md:132-138` — "If the same code location or
  approach has been changed 3 or more times consecutively without resolving the
  same failing check, **stop**. Three consecutive failures signal an
  architectural or design problem…"
- `skills/fix/SKILL.md:58` — "## Phase 3 — Fix loop (max 5 iterations)"; and
  `:107-108` — "cap the total iteration budget across all failures at 10"

In an autonomous session `/fix` runs to 5 (or 10) where the protocol brakes at
3. `post-compact-context.md:26-28` restores the 3× brake, so after a compaction
the two numbers are both live and disagree.

**Fix:** add to `fix/SKILL.md:58` — "In autonomous mode (mission brief active),
the cap is 3 per the consecutive-fix stop rule in `autonomous-execution.md`."

### F4. Scaffolding skills write implementation before tests
**Warning**

- `rules/testing.md:11-13` — "Don't write implementation code that isn't
  covered by a test you wrote first."
- `skills/auth-setup/SKILL.md:392` — "## Step 14b — Write tests", following
  Steps 1–14 which write the OAuth handlers, session KV layer, and DB schema
- `skills/payments-setup/SKILL.md:433` — "## Step 15b — Write tests", following
  15 implementation steps

The tests enumerated (`auth-setup:395-397`, `payments-setup:436-438`) cover
exactly the behavior the prior steps implemented — test-last by construction.
`testing.md:15-16`'s exceptions (config, generated code, one-off migrations, UI
markup with no logic) do not cover session handlers or webhook idempotency
logic. Note `skills/testing-setup/SKILL.md:371` and
`skills/plan-mission/SKILL.md:183` both do mandate TDD — the config is
internally split on this.

**Fix:** pick one. Either move the test step ahead of the handler steps in both
skills, or add an explicit carve-out to `testing.md:15` for
template-instantiating scaffold skills. Current silence reads as a violation.

### F5. Reviewer agents are prescribed `sg` but denied Bash
**Warning**

- `rules/lsp.md:81` — "For structural code pattern searches, prefer `sg`
  (ast-grep) over Grep."
- `agents/04-quality-security/code-reviewer.md:6` — "disallowedTools: Write,
  Edit, Bash" (tools at `:4` = Read, Grep, Glob + Serena), while `:29` lists
  `lsp.md` in Required Rules
- `agents/04-quality-security/architect-reviewer.md:7` — "disallowedTools:
  Write, Edit, Bash", while `:21` lists `lsp.md`

`sg` is a CLI. Both agents are handed a rule whose central recommendation they
cannot execute, and both fall back to Grep — the tool `lsp.md:34-41`
specifically warns produces false positives on injection and error-swallowing
patterns, which is what a code reviewer is looking for.

**Fix:** add `Bash(sg:*)` to both agents' allowed tools (it is read-only), or
drop the ast-grep clause from those two Required Rules glosses.

### F6. `backend-developer` hardcodes a p95 its own preamble calls per-service
**Warning**

- `agents/01-core-development/backend-developer.md:8` — "meet the **per-endpoint
  p95 latency target defined for the service**"
- `agents/01-core-development/backend-developer.md:34` — "Response time under
  **100ms p95** — monitor with RED metrics"
- `rules/observability.md:5-9` — "define 'working' as measurable SLI + SLO for
  each operation … (e.g., error rate < 0.1%, p95 < 200ms)"

A prior audit (phase3 S7) softened line 8; line 34 was not updated in the same
pass, so the file now asserts both. It is also a magic literal per
`code-principles.md:50-54`.

**Fix:** `:34` → "Meet the endpoint's declared p95 SLO — monitor with RED
metrics."

### F7. `pr-workflow.md` pre-existing-violation rules conflict internally
**Warning**

- `rules/pr-workflow.md:33` — "Fix violations **in the same file** if the fix is
  1-3 lines; include it in your commit"
- `rules/pr-workflow.md:36` — "For **dead code** in a file you are modifying:
  remove it in the same commit"
- `rules/pr-workflow.md:38-39` — "Never accumulate unrelated fixes into a
  feature or bug-fix PR — it muddies blame history and makes rollback harder"

For a 40-line dead function found while fixing a bug, the three bullets give
three different answers: leave it (>3 lines), remove it (dead-code bullet), and
don't touch it (unrelated fix). `code-principles.md:80-82` delegates the entire
dead-code policy to this section, so no tiebreaker exists anywhere.

**Fix:** state precedence at `:36` — "dead code is exempt from the 1-3 line cap
and from the unrelated-fix prohibition; if removal exceeds ~30 lines, log to
`.agent-notes/` for a dedicated cleanup PR instead."

### F8. `parallelism.md`'s cost gate contradicts its own trigger list
**Warning**

- `rules/parallelism.md:6` — "Default to single-agent; split only when a
  specific bottleneck is demonstrated."
- `rules/parallelism.md:20-21` — "**Trigger this planning step when:** More than
  one file, module, or component needs the same type of work (analysis,
  refactoring, test writing)"

"More than one file needs the same type of work" describes nearly every
non-trivial task, and step 4 of the triggered procedure (`:17`) says "invoke all
dependency-free subtasks … as parallel agent calls in a single response". The
gate at `:6` and the trigger at `:21` point in opposite directions on a 15×-cost
decision.

Compounding: `CLAUDE.md:53` — the always-resident one-line summary — reproduces
only the pro-parallel half ("batch independent work in parallel, sequence
dependent batches") and omits the cost gate entirely. The resident text says
parallelize; the pointed-to file says don't.

**Fix:** reword `:21` to "…**and** serial execution is the measured
bottleneck"; add "default single-agent (~15× token cost)" to `CLAUDE.md:53`
(~40 bytes — funded by F23).

### F9. `environment.md`'s canonical validation contradicts `security.md`
**Suggestion**

- `rules/security.md:9-12` — "Parse and validate with a schema (Zod, io-ts, JSON
  Schema) rather than ad-hoc checks … Enforce length limits, type constraints,
  and allowed-value sets"
- `rules/environment.md:14-21` — the prescribed startup-validation snippet is a
  presence-only `if (!process.env[key])` loop with no type or range check; and
  `environment.md:39` points readers to `security.md` as though the two agree

Env vars are a system boundary (`PORT` arrives as a string,
`DB_MAX_POOL_SIZE` unbounded).

**Fix:** replace the snippet with a schema parse, or add one line after `:24` —
"presence is the floor; parse types and ranges with a schema per `security.md`."

### F10. `architecture.md` forbids the review it later mandates
**Suggestion**

- `rules/architecture.md:56` — "Express **every** architectural constraint as a
  lint/import check/test — **not code review**."
- `rules/architecture.md:121-129` — "Stop and get **architectural review** (not
  just code review) when: … Two valid approaches exist and the choice affects
  multiple teams"

"Every" is unachievable — Conway's-law seams (`:117-119`) and reversibility
judgments (`:60-62`) do not lint. The `architect-reviewer` agent exists solely
to perform the review `:56` says should not happen.

**Fix:** `:56` → "Express every *mechanically checkable* architectural
constraint as a lint/import check/test."

---

## 2. Agent isolation risk

### F11. 119 of 126 agents carry no rule propagation at all
**Critical**

`grep -rl "Required Rules" agents/` returns **7 of 126 files** —
`code-reviewer`, `security-auditor`, `architect-reviewer`, `api-designer`,
`microservices-architect`, `backend-developer`, `typescript-pro`. The sample
supplied for this audit was 6 of those 7, which makes the fleet look far
healthier than it is.

- `rules/parallelism.md:34-36` — "Subagents start with a blank slate — no
  conversation history, no CLAUDE.md, no awareness of prior decisions."

Everything else inherits nothing: `python-pro`, `frontend-developer`,
`debugger`, `security-engineer`, `test-automator`, `refactoring-specialist`, all
13 haiku agents. TDD (`testing.md`), the 90/90/90 floor, `security.md`,
`logging.md`, `error-handling.md` and `diagnosis.md` are in force for ~6% of the
agent fleet. F1 is the observable symptom.

**Fix:** mechanical batch edit. Append a 3-5 line Required Rules block to the
02- (language specialists) and 04- (quality/security) tiers first — those are
the agents that write and review code. Do not attempt all 119 in one pass.

### F12. The "you must Read the rule file" instruction is unreachable
**Critical**

- `rules/parallelism.md:53-55` — "Subagents do not auto-load `rules/`. If an
  agent's Required Rules list names a rule file, the agent must Read that file
  before relying on it — the one-line gloss is a pointer, not the authoritative
  text."

This sentence lives inside `parallelism.md`, which subagents also do not
auto-load. It is addressed to a reader who never sees it.
`grep -rn "Read .*rules/" agents/` returns **zero matches** — not one of the 126
agents instructs itself to Read a rule file. The prior audit's W7 remediation
was applied to the wrong file: it documents the requirement rather than
delivering it.

**Fix:** move the sentence into the Required Rules block header of each of the 7
agents that have one (and into the F11 template) — "Read each file below at
`~/.claude/rules/<name>` before starting; the gloss is a pointer, not the rule."

### F13. Required Rules cite bare filenames that will not resolve
**Warning**

- Bare names: `backend-developer.md:57-68`, `typescript-pro.md:137-141`,
  `microservices-architect.md:100-106`, `code-reviewer.md:24-29` — e.g.
  "`testing.md` — TDD, 90/90/90 coverage floor, assertion quality"
- Resolvable paths, only 4 of 126 files: `api-designer.md:11`
  ("`~/.claude/rules/api-design.md`"), `architect-reviewer.md:13`,
  `debugger.md:39`, `error-detective.md:10`

A subagent whose cwd is a user project that acts on F12 and calls
`Read("testing.md")` gets a miss and silently proceeds without the rule.

**Fix:** prefix every Required Rules entry with `~/.claude/rules/`. Combine with
the F12 edit — same lines.

### F14. `it-ops-orchestrator` cannot invoke the agents it exists to route to
**Warning**

- `agents/09-meta-orchestration/it-ops-orchestrator.md:3` — "routing work to
  specialized agents"; `:26-28` — "Assign each sub-problem to the correct agent
  / Merge responses into a coherent unified solution"
- `agents/09-meta-orchestration/it-ops-orchestrator.md:4` — "tools: Read, Write,
  Edit, Bash, Glob, Grep" — **no Agent/Task tool**

Its sole declared purpose is unreachable with its declared toolset; it will
implement the work itself, which `:7` explicitly forbids ("never attempt to
implement what a specialist should own"). It also has no Required Rules block
and never references `parallelism.md`'s agent-prompt structure (`:32-71`) or
file-ownership rules (`:25-30`) — an orchestrator carrying none of the
orchestration rules.

**Fix:** add `Agent` to `:4`; add a Required Rules block naming
`~/.claude/rules/parallelism.md` with the F12 Read instruction.

### F15. `microservices-architect` paraphrases `observability.md` in place
**Suggestion**

- `agents/01-core-development/microservices-architect.md:97` — "Apply SLO-first
  design, RED metrics (rate/error rate/duration p50/p95/p99), distributed
  tracing with W3C traceparent, burn-rate alerting, on-call readiness checklist,
  dashboard minimums, and log correlation format."
- Same file `:102` also lists `observability.md` in Required Rules
- `rules/prompting-quality.md:35-39` — "dedup cross-file repetition rather than
  restating it"

The paraphrase is what the agent actually acts on (it is in-context; the rule
file is not), and it drops `observability.md:55-56`'s concrete burn-rate windows
(fast 1h/2%, slow 6h/5%) — the only numbers in that rule that are directly
actionable.

**Fix:** `:97` → "Read `~/.claude/rules/observability.md` and apply it in full."

---

## 3. Coverage gaps

**Verified present, complete, and referenced from CLAUDE.md — no hole:** logging
(`logging.md` ← `CLAUDE.md:69`), error handling (`error-handling.md` ← `:69`),
API design (`api-design.md` ← `:69`), file/folder naming
(`naming-conventions.md` ← `:72`), pre-existing code policy
(`pr-workflow.md:28-39` ← `:72`), PR/branch workflow (`:72`), SLO-first +
on-call readiness (`observability.md:3-11` and `:62-75` ← `:69`), system-first
blast radius (`architecture.md:3-19` ← `:71`), ADR triggers
(`architecture.md:21-28` ← `:71`), research source tiering
(`research-sources.md` ← `:71`). Genuine holes below.

### F16. ADR rule gives a format but no location
**Suggestion**

`rules/architecture.md:23-28` lists five ADR triggers and `:70-73` makes an ADR
mandatory for irreversible changes, but neither `architecture.md` nor
`naming-conventions.md:3-20` states where an ADR file lives or how it is
numbered. `architecture.md:67` cites "ADR-042" as though a scheme exists.
"Write an ADR" is not an executable instruction without a path.

**Fix:** one line after `architecture.md:49` — "Location:
`docs/adr/NNN-short-title.md`, zero-padded sequential."

### F17. Skills are governed by nothing and unmentioned in CLAUDE.md
**Suggestion**

`CLAUDE.md:47-49` governs agents and the Workflow tool. The 28 directories under
`skills/` appear nowhere in `CLAUDE.md` or in any of the 23 rule files, so there
is no stated precedence when a skill's steps conflict with a rule — which is
exactly the unadjudicated collision in F2 and F4.

**Fix:** one clause appended to the existing `CLAUDE.md:49` paragraph (no new
section, no net growth if F23 is taken) — "Skills in `~/.claude/skills/` are
procedures, not exemptions: where a skill's steps conflict with `rules/`, the
rule wins unless the skill states the carve-out explicitly."

### F18. The on-call merge gate is invisible to the merge rule
**Suggestion**

- `rules/observability.md:62` — "## On-call readiness (**required before
  merge**)"; `:86-87` — "Do not merge a feature that introduces new critical
  paths without updating (or creating) the service dashboard."
- `rules/pr-workflow.md` — contains branch naming, PR size, merge strategy,
  pre-existing violations and commit discipline, but no merge checklist and no
  reference to `observability.md`

A gate declared "required before merge" that the file owning merge policy does
not know about will not fire.

**Fix:** add to `pr-workflow.md` after `:26` — "Merge gate: a feature adding new
failure modes requires the on-call readiness items in `observability.md:62-75`."

---

## 4. Rule quality

### F19. `parallelism.md`'s primary gate has no test
**Warning**

- `rules/parallelism.md:4-6` — "Justify multi-agent when: (1) parallel
  bottleneck **demonstrated** … Default to single-agent; split only when a
  specific bottleneck is **demonstrated**."

"Demonstrated" is undefined — measured wall-clock? file count? independent
write-sets? The gate controlling a stated 15× cost multiplier cannot be checked
by the agent applying it or by a reviewer afterward, which is why the concrete
trigger list at `:20-23` wins in practice (F8). An unfalsifiable gate is not a
gate.

**Fix:** give it an operational test at `:6`, e.g. "demonstrated = ≥3
non-overlapping write-sets, or a serial step measured at >10 minutes."

### F20. `retry-idempotency.md`'s 5s cap can never bind
**Suggestion**

- `rules/retry-idempotency.md:5-6` — "**Max attempts:** 3 … **Backoff:**
  exponential — 100ms base, 2× multiplier, **5s cap**"
- `rules/retry-idempotency.md:52` — `await new Promise(r => setTimeout(r,
  Math.min(delay, 5000)))`

With maxAttempts = 3 the worst-case delay is 200ms × 1.2 = 240ms. The cap binds
only from attempt 7 onward. A documented constant no code path can reach is a
dead literal by `code-principles.md:50-54`, and it invites readers to assume a
much longer retry window than the policy actually produces.

**Fix:** either drop the cap from `:6`, or annotate — "5s cap (binds only if
maxAttempts is raised above 6)".

### F21. Two constraint-budget self-violations
**Suggestion**

- `rules/prompting-quality.md:78-81` — "Keep each section of a rule file, agent
  prompt, or skill phase to **≤6 hard prescriptive constraints**. … Numbered
  sequential steps (procedures) are exempt"
- `agents/02-language-specialists/typescript-pro.md:17-33` — one "tsconfig
  defaults" section with **16** mandatory settings; `:39-57` "Banned patterns" —
  **14** prohibitions
- `agents/01-core-development/backend-developer.md:57-68` — a **12**-entry
  Required Rules block

None are numbered procedures, so the `:81` exemption does not apply. By the
rule's own MOSAIC citation these land in the ">15 = degraded, constraints
ignored or averaged together" band — a plausible contributing cause of F1 and
F6 (constraints in long agent files getting blended away).

**Fix:** split `typescript-pro`'s tsconfig block into "Module resolution" /
"Strictness" / "Emit" sub-sections of ≤6 each; split `backend-developer`'s
Required Rules into "Always read" (4) and "Read when relevant" (8).

### F22. `observability.md` dashboard rule is aspirational, not checkable
**Note**

- `rules/observability.md:79-80` — "Every production feature **should** be
  visible on a dashboard **within one sprint** of launch."

"Should", "sprint" undefined, no artifact to inspect — a reviewer cannot pass or
fail it. Two lines below, `:86-87` states the same requirement as a hard merge
gate ("Do not merge a feature that introduces new critical paths without
updating … the service dashboard"), which is checkable.

**Fix:** delete `:79-80`; `:86-87` already carries the requirement in
enforceable form.

---

## 5. CLAUDE.md structure

### F23. The Agents paragraph is the largest block and the least resident-worthy
**Suggestion**

`CLAUDE.md:49` is a single ~640-byte prose paragraph — ~17% of the 3790-byte
file — mixing five unrelated concerns: agent file location, `subagent_type`
invoke mechanics, the ~30-minute delegation threshold, the announce requirement,
and Workflow opt-in. Only the delegation threshold, the announce requirement and
the Workflow opt-in are needed on every turn; location and invoke mechanics are
consulted once, at the moment of dispatch, when `parallelism.md` is already the
natural read.

**Fix:** keep two sentences (delegation threshold + announce + "Workflow is
user-opt-in only"), move location/`subagent_type` mechanics into
`parallelism.md`'s agent-prompt-structure section. Frees ~300 bytes — enough to
fund F8's cost-gate clause (~40B) and F17's skills clause (~180B) without
breaching the 4KB cap in `prompting-quality.md:27-29`.

### F24. Verification block outranks the correctness gates by position
**Note**

`CLAUDE.md:8-22` (~700 bytes: Verification plus the four-level confidence
ladder) sits at positions 2–3, while Diagnosis — the only section carrying a
hard behavioral gate ("state the mechanism … before any fix") — is at `:59-61`,
second from last. Ordering inside a reloaded CLAUDE.md is a weak signal, so this
is a Note, not a defect. But `:17-22` spends ~230 bytes on four definitions that
compress to one line without loss: "HIGH verified / MEDIUM single-source, caveat
it / LOW memory, say so / UNKNOWN, admit it." That is a second ~150-byte source
of headroom if F23's is not enough.

No finding on the Rules index (`:63-72`) — it names all 23 files correctly
across seven groups.

---

## 6. post-compact-context.md completeness

Checked every candidate against `CLAUDE.md` before claiming, per the brief.
**Not reported** (all reload verbatim and need no restoration): diagnosis mode
(`CLAUDE.md:59-61`), one-writer-per-file ownership (`:53`), `.agent-notes`
discipline (`:26`), TodoWrite for multi-part tasks (`:43`), Conventional Commits
subject format (`:57`), the confidence ladder (`:17-22`).

### F25. Batch-close discipline is not restored
**Warning**

`post-compact-context.md:6-15` restores how to **resume** — re-read README, the
decision journal, `[x]`/`[ ]` state, current batch overview. Nothing restores
how to **close** a batch, and none of it is in CLAUDE.md, so it is genuinely
lost on compaction:

- `rules/autonomous-execution.md:68-76` — quality gates are "mandatory between
  batches"; "Verify no files were modified outside the declared write-set
  (compare `git diff --name-only` against the batch's file list)"; "Verify each
  completed task has exactly one commit"
- `rules/autonomous-execution.md:78-82` — "Attempt to fix (max **2** tries per
  gate) … If fix fails after 2 tries, STOP"

The 3× consecutive-fix brake *is* restored at `post-compact-context.md:26-28`;
the 2-tries-per-gate limit is a different number and is not. Compaction most
often lands mid-batch — precisely when the close protocol matters — and the
restored text tells the model how to pick the work back up but not what it owes
before moving on.

**Fix:** add a 4-line "Batch Close (restored)" block: run the brief's Quality
Gates; max 2 fix tries per gate then STOP; verify `git diff --name-only` against
the declared write-set; one commit per task.

**Funding (Note, bundled):** `post-compact-context.md:21-24` is dead weight —
"`type(scope): description` ≤72 chars, lowercase, no period. Body … Required for
>3-file changes" duplicates `CLAUDE.md:57`, which reloads verbatim per
`CLAUDE.md:30-32`. The only non-duplicated content is the type list. Reduce
`:21-24` to one line ("Types: feat, fix, chore, refactor, test, docs, style,
perf, ci — format per CLAUDE.md"), reclaiming ~120 bytes for the block above.
