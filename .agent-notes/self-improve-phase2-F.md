# Phase 2 — Agent F: Config Audit (2026-08-01)

Scope: `CLAUDE.md`, all 23 `rules/*.md`, `post-compact-context.md`, 7 sampled
agents, plus repo-wide greps over `agents/` (128 files) and `skills/`.
Baseline: `git log --oneline -30` reviewed; the 2026-07-24 remediation pass and
the 2026-08-01 mermaid→PlantUML switch (`73837bd`) are treated as done.
Read-only: no config file modified.

Measured facts used below (verified this session):
- `wc -c CLAUDE.md` → **3921** bytes (cap 4096).
- `wc -c post-compact-context.md` → **1439** bytes.
- `cat rules/*.md | wc -c` → **72,367** bytes; **23** files; **11,055** words.
- `diagrams.md` appears in **0 of 128** agent files.
- 125/128 agents have `## Required Rules`; **119** contain a Read instruction,
  **6** do not.

---

## 1. Contradictions

### C1 — Diagnosis "only two stop conditions" vs. autonomous 2-try gate cap
`rules/diagnosis.md:42-51` — **Critical** — confidence 90

> "## Valid stop conditions (only these two)
> 1. **Root cause identified and fixed** — mechanism known, change applied, verified.
> 2. **Root cause identified and proven irreducible** …
> **"This is hard," "this looks like enough," or "should we call it good enough?"
> are NOT stop conditions.**"

`rules/autonomous-execution.md:78-82`

> "If a quality gate fails:
> 1. Attempt to fix (max 2 tries per gate)
> 2. If fix succeeds, re-run all gates from scratch
> 3. If fix fails after 2 tries, STOP and document the failure
>    in the decision journal with full error output"

A failing quality gate (`npm test`) is exactly the "observed discrepancy" that
`diagnosis.md:4-8` says triggers diagnosis mode. Diagnosis then forbids stopping
without a mechanism; autonomous-execution mandates stopping after 2 tries
regardless of whether a mechanism was found. `autonomous-execution.md:132-138`
adds a third number (3 consecutive changes to the same location).

**Fix:** add one sentence to `autonomous-execution.md` after line 82: "The 2-try
cap bounds *attempts*, not *investigation*. Per `diagnosis.md`, the STOP entry in
the decision journal must carry the diagnosis artifact (mechanism, origin
`file:line`, causal chain, ruled-out) or an explicit statement of what was ruled
out and what would be instrumented next." Add the reciprocal pointer at
`diagnosis.md:47`.

### C2 — "exactly one commit per task" vs. the mandated fix commit
`rules/autonomous-execution.md:75` — **Warning** — confidence 88

> "- Verify each completed task has exactly one commit"

`rules/autonomous-execution.md:155-157`

> "- If a quality gate fix requires changes to an already-committed
>   task, create a `fix` commit referencing the task:
>   `fix(T3): resolve lint errors in confirm endpoint`"

The gate at line 75 is a hard between-batch check; line 157 guarantees a second
commit on the same task ID whenever a gate fix lands. The gate fails by
construction on any batch that needed a gate fix.

**Fix:** rewrite line 75 as "Verify each completed task has exactly one `feat`/
`refactor`/`docs` commit; `fix(TN)` commits from gate remediation are expected
and exempt."

### C3 — `lsp.md` requires shell tooling that two agents are structurally denied
`rules/lsp.md:81-83` — **Warning** — confidence 92

> "For structural code pattern searches, prefer `sg` (ast-grep) over Grep.
> After edits, run the project's typecheck command (`tsc --noEmit`, `mypy`,
> etc.) as the quality bar instead of reading LSP diagnostics."

`agents/04-quality-security/code-reviewer.md:6` and
`agents/04-quality-security/architect-reviewer.md:7`

> "disallowedTools: Write, Edit, Bash"

Both agents list `lsp.md` in their Required Rules (`code-reviewer.md:29`,
`architect-reviewer.md:21`). `sg` and `tsc --noEmit` are Bash invocations; these
are the only two Bash-denied agents that carry `lsp.md`. They are instructed to
use tooling they cannot invoke.

**Fix:** in `lsp.md`, scope the Subagent note: "If the agent has no `Bash` tool,
`sg` and typecheck commands do not apply — use Serena `search_for_pattern` and
report findings without running a typecheck." Alternatively drop `lsp.md` from
the two review agents' Required Rules and replace it with a one-line Serena
pointer.

### C4 — pr-workflow mandates and forbids the same unrelated fix
`rules/pr-workflow.md:33` and `:36` — **Warning** — confidence 82

> "- Fix violations **in the same file** if the fix is 1-3 lines; include it in your commit"
> "- For **dead code** in a file you are modifying: remove it in the same commit; first grep for references …"

`rules/pr-workflow.md:38-39`

> "- Never accumulate unrelated fixes into a feature or bug-fix PR — it muddies
>   blame history and makes rollback harder"

Lines 33/36 require folding unrelated lint/dead-code fixes into the working
commit; line 38 forbids exactly that. Line 36 has no size carve-out at all, so
an arbitrarily large dead-code removal is simultaneously required and banned.

**Fix:** rewrite line 38 as "Never accumulate unrelated fixes **beyond the
same-file allowances above** into a feature or bug-fix PR." Add a size cap to
line 36: "…remove it in the same commit if ≤20 lines; otherwise log it to
`.agent-notes/`."

### C5 — prompting-quality contradicts itself on rule residency
`rules/prompting-quality.md:36-38` — **Warning** — confidence 78

> "All rule files are injected verbatim every
> session — confirmed by direct inspection (22 files, ~10.3k words / ~14k
> tokens) — so this is a real, recurring per-session context cost"

`rules/prompting-quality.md:39-41`

> "Manage it: prefer task-scoped reading of the one or two
> relevant rule files over loading the set, and dedup cross-file repetition
> rather than restating it."

If all 23 files are already injected verbatim, "task-scoped reading … over
loading the set" saves nothing — there is no load step to skip. The advice is
actionable only for *subagents* (which do not auto-load rules) and for the
`paths:` frontmatter idea at line 54.

**Fix:** replace lines 39-41 with: "Manage it two ways: (a) for subagents, name
only the one or two rule files the task actually needs — they do not auto-load;
(b) for the resident set, dedup cross-file repetition and move domain rules
behind `paths:` frontmatter. Task-scoped *reading* does not reduce the resident
cost."

### C6 — backend-developer hardcodes a p95 its own opening line delegates
`agents/01-core-development/backend-developer.md:8` — **Warning** — confidence 85

> "Build scalable, secure server-side systems — enforce 90% test coverage and OWASP security standards, and meet the per-endpoint p95 latency target defined for the service."

`agents/01-core-development/backend-developer.md:34`

> "- Response time under 100ms p95 — monitor with RED metrics"

Line 8 says the target is whatever the service defines; line 34 fixes it at
100ms. `rules/observability.md:5-9` (in this agent's Required Rules, line 62)
sides with line 8: "Before implementation: define 'working' as measurable SLI +
SLO for each operation."

**Fix:** change line 34 to "- Meet the endpoint's declared p95 SLO (default
100ms when the service has not declared one) — monitor with RED metrics".

### C7 — CLAUDE.md miscounts the post-compact sections it describes
`CLAUDE.md:34-37` — **Warning** — confidence 90

> "A `PostCompact` hook injects `~/.claude/post-compact-context.md`:
> the autonomous execution recovery sequence, plus 3 sections
> restoring condensed `rules/` content (model routing, commit
> format, autonomous restraint)."

`post-compact-context.md:29-30`

> "## Batch Close-Out (restored)
> Run the mission brief's quality gates between every batch; after 2 consecutive failures on the same gate, STOP and log it — no more retries."

Commit `33b15f7` ("restore batch close-out in post-compact context") landed
*after* `ca4461f` ("correct post-compact-context.md description in CLAUDE.md"),
so the description was never re-corrected. There are 4 restored sections, not 3.

**Fix:** change lines 35-37 to "…plus 4 sections restoring condensed `rules/`
content (model routing, commit format, autonomous restraint, batch close-out)."
Costs ~17 bytes — see S1 for the budget.

### C8 — parallelism requires a Read; six agents' blocks never say Read
`rules/parallelism.md:55-57` — **Warning** — confidence 93

> "Subagents do not auto-load `rules/`. If an agent's Required Rules
> list names a rule file, the agent must Read that file before relying
> on it — the one-line gloss is a pointer, not the authoritative text."

`agents/01-core-development/backend-developer.md:56`

> "Apply these rule files to every task:"

(and `code-reviewer.md:23` "Apply these rule files to every review:";
`api-designer.md:31` same phrasing; `architect-reviewer.md:15`,
`typescript-pro.md:136`, `microservices-architect.md:99` are bare lists with no
imperative at all.)

119 of the 125 agents carry the canonical closer verbatim — "Read the referenced
rule file before relying on it — subagents do not auto-load rules/." — so this is
a 6-file miss from the July per-directory rollout, not a design choice. "Apply
these rule files" tells the agent to comply with text it has never loaded; it
will comply with its prior instead.

**Fix:** append the canonical closer line to all six:
`agents/01-core-development/{backend-developer,api-designer,microservices-architect}.md`,
`agents/02-language-specialists/typescript-pro.md`,
`agents/04-quality-security/{architect-reviewer,code-reviewer}.md`.

### C9 — Required Rules lists exceed the constraint budget
`rules/prompting-quality.md:77-80` — **Suggestion** — confidence 70

> "Keep each section of a rule file, agent prompt, or skill phase to **≤6 hard
> prescriptive constraints**. If a section needs more, split it into named
> sub-sections, each with ≤6 items."

`agents/01-core-development/backend-developer.md:57-68` — 12 rule entries in one
unsplit section (`code-principles`, `testing`, `api-design`, `error-handling`,
`logging`, `observability`, `architecture`, `testability`, `research-sources`,
`security`, `retry-idempotency`, `lsp`). Each entry is a prescriptive "apply
this," landing in the 7-15 "unpredictable — partial compliance" band the same
rule defines at line 74.

**Fix:** split oversized Required Rules blocks into two named sub-sections —
`### Always read` (≤6: the rules that gate correctness for this agent's domain)
and `### Consult when relevant` (the rest). Apply to any agent with >6 entries.

### C10 — `rules/diagrams.md` vs. everything else: no textual conflict found
`rules/diagrams.md` — **Note** — confidence 95

Checked against all 22 other rule files, `CLAUDE.md`, and the 7 sampled agents.
Repo-wide `grep -rn "mermaid"` over `rules/`, `agents/`, `skills/`, `CLAUDE.md`
returns **zero** hits — the `73837bd` switch was applied completely. The three
downstream consumers agree with it explicitly and by name:
`rules/autonomous-execution.md:24` ("diagrams/*.md ← PlantUML diagrams (see
rules/diagrams.md)"), `skills/explore/SKILL.md:103-104`,
`skills/plan-mission/references/brief-structure.md:80-82` and `:111-113`.
No fix needed for consistency. The real exposure is propagation — see G2.

### C11 — the Artifact escape hatch does not name the notation that works
`rules/diagrams.md:19-23` — **Suggestion** — confidence 75

> "- **The destination has a fixed renderer that excludes PlantUML.**
>   Claude Artifacts are the live example — the runtime has no
>   PlantUML renderer, so a PlantUML block there displays as raw
>   text. Use whatever notation that renderer does support, and say
>   in your response why."

The Artifact tool contract states artifacts render mermaid natively (```mermaid
fences in markdown; `<pre class="mermaid">` in HTML). `diagrams.md:10` says
"Never use ASCII art or a prose description" and the whole file drills
PlantUML-only; an agent that has internalized it will emit raw PlantUML into an
artifact rather than infer the unnamed fallback.

**Fix:** change line 22 to "Use whatever notation that renderer does support —
for Claude Artifacts that is mermaid (```mermaid fence in Markdown,
`<pre class="mermaid">` in HTML) — and say in your response why."

---

## 2. Agent isolation risk

### A1 — six agents name rules without instructing a Read
See **C8**. — **Warning** — confidence 93

### A2 — the confidence ladder exists only in CLAUDE.md and evaporates everywhere
`CLAUDE.md:17-22` — **Warning** — confidence 88

> "Confidence levels — declare these when the accuracy of a claim matters:
> - **HIGH**: Verified via tool or cited source
> - **MEDIUM**: Single source, or strong training knowledge — add a caveat
> - **LOW**: Memory only, unverified — say so
> - **UNKNOWN**: Cannot verify — admit it rather than fabricate"

No rule file carries this ladder, so it reaches 0 of 128 subagents. Reports come
back unlabeled and the orchestrator relays them as if verified.
`research-sources.md` governs *where* evidence comes from but never *how
confidence is declared*.

**Fix:** move the four-line ladder verbatim into `rules/research-sources.md`
under a new `## Declaring confidence` heading. It is already in 27 agents'
Required Rules, so this propagates the behavior at zero agent-file churn.

### A3 — `diagnosis.md` reaches 6 of 128 agents; no code-writing agent has it
`CLAUDE.md:60-62` — **Warning** — confidence 90

> "On an observed discrepancy (failing test, oracle mismatch, symptom vs. intent),
> enter diagnosis mode per `~/.claude/rules/diagnosis.md`…"

CLAUDE.md states this globally, but only `debugger`, `error-detective`,
`incident-responder`, `devops-incident-responder`, `legacy-modernizer`, and
`plantuml-visual-qa` list `diagnosis.md`. Every implementation agent
(`backend-developer`, `typescript-pro`, `python-pro`, all language specialists)
hits failing tests routinely and will guess-and-patch instead.

**Fix:** add `- \`diagnosis.md\` — root-cause discipline: state the mechanism
before any fix on an observed defect` to the Required Rules of every agent that
holds `Write` or `Edit`. That is the correct filter: only agents that can change
code can guess-and-patch.

### A4 — `lsp.md` reaches 4 of 128 agents while 65 hold Serena tools
`rules/lsp.md:74-83` — **Warning** — confidence 88

65 agent files grant `mcp__serena__find_symbol` et al.; only 4
(`architect-reviewer`, `code-reviewer`, `api-designer`, `backend-developer`)
list `lsp.md`. The other 61 receive the tools with no guidance on the
Serena-over-Grep / ast-grep-over-regex priority order.

**Fix:** either add `lsp.md` to the Required Rules of every agent whose `tools:`
line contains `mcp__serena__`, or (cheaper, and it dodges C3) inline the
two-sentence Subagent note as a shared snippet appended by the same script that
added the Required Rules blocks.

### A5 — named rules do not match need: api-designer omits `api-design.md`
`agents/01-core-development/api-designer.md:11` — **Warning** — confidence 90

> "Execute API design per `~/.claude/rules/api-design.md`."

`agents/01-core-development/api-designer.md:31-35` — the Required Rules block
lists `code-principles`, `error-handling`, `logging`, `lsp` — and **not**
`api-design.md`. Line 7 also commits the agent to a "breaking-change policy,"
which lives in `architecture.md:75-93`, also absent. The one rule this agent
exists to enforce is the one its Required Rules block omits.

**Fix:** add `api-design.md` and `architecture.md` to the block (and the Read
closer per C8); the line-11 pointer can then be deleted as redundant.

### A6 — code-reviewer's rule list omits what its own checklist checks
`agents/04-quality-security/code-reviewer.md:13` — **Warning** — confidence 85

> "- Coverage: verify a coverage report exists in CI output; flag uncovered changed lines; …"

Its Required Rules (`:24-29`) omit `testing.md` (the 90/90/90 floor and
assertion-quality bar it is judging against), `pr-workflow.md` (the dead-code and
pre-existing-violation policy), `error-handling.md`, and `logging.md` — all four
of which the `/code-review` skill explicitly covers
(`skills/code-review/SKILL.md:6`).

**Fix:** add `testing.md`, `pr-workflow.md`, `error-handling.md`, `logging.md`
to `code-reviewer.md`'s Required Rules, split per C9 into `### Always read` /
`### Consult when relevant`.

### A7 — three agents have no Required Rules block at all
`agents/04-quality-security/security-auditor.md`, `agents/explore.md`,
`agents/plan.md` — **Note** — confidence 95

`explore` and `plan` are pinned to haiku for cheap search (`77c58b4`) and
arguably need none. `security-auditor` is a substantive reviewer and should
carry at minimum `security.md` and `research-sources.md`.

**Fix:** add a Required Rules block with `security.md`, `research-sources.md`,
`architecture.md` plus the Read closer to `security-auditor.md`. Leave
`explore.md` / `plan.md` alone and note the exemption in the self-improve skill
so future passes stop flagging them.

---

## 3. Coverage gaps

### G1 — the complexity hook enforces four limits no rule file states
`hooks/check-complexity.py:32-39` — **Warning** — confidence 92

The hook enforces `MAX_FILE_LINES = 500`, `MAX_FUNC_NLOC = 30`, `MAX_CCN = 10`,
`MAX_PARAMS = 5`, with an exemption list at `hooks/complexity-ignore`. Grepping
`rules/` for "complexit" returns only incidental prose
(`parallelism.md:83`, `extended-thinking.md:73`, `testability.md:48`) — no rule
states any threshold. The numbers survive only in
`agents/04-quality-security/code-reviewer.md:14` ("Cyclomatic complexity < 10")
and `skills/code-review/references/checklists.md:20` ("suggest simplification
>7; flag >10 as Warning; require decomposition >15"). A subagent writing code
learns the file-length and parameter-count caps only by being rejected.

**Fix:** add a `## Complexity limits` section to `rules/code-principles.md`
mirroring the hook constants verbatim (500 file lines / 30 function NLOC / CCN 10
/ 5 params, with a pointer to `hooks/complexity-ignore` for vendored code). It
belongs in `code-principles.md` because 46 agents already list that file.

### G2 — `diagrams.md` propagated to 0 of 128 agents
`rules/diagrams.md:5` — **Warning** — confidence 95

> "Use PlantUML for all generated diagrams."

Seven agents promise diagrams as a deliverable —
`agents/06-developer-experience/documentation-engineer.md:54`,
`agents/06-developer-experience/legacy-modernizer.md:96`,
`agents/08-business-product/business-analyst.md:82-84`,
`agents/08-business-product/sales-engineer.md:51`,
`agents/04-quality-security/error-detective.md:84,117`,
`agents/10-research-analysis/{data-researcher.md:84,trend-analyst.md:105}` —
and none lists `diagrams.md`. `microservices-architect` and `architect-reviewer`
also produce architecture figures. Since subagents do not auto-load `rules/`
(`parallelism.md:36-38`) and mermaid is the strong model prior, every one of them
will emit mermaid, silently reverting the 2026-08-01 default the moment work is
delegated. This is the highest-leverage gap in the audit: the new rule is correct
and internally consistent (C10) but reaches nothing.

**Fix:** add `- \`diagrams.md\` — PlantUML default; pick the diagram type from
the rubric` to the Required Rules of those 7 agents plus
`microservices-architect`, `architect-reviewer`, `api-documenter`, and
`technical-writer`.

### G3 — `api-design.md` status table omits 429
`rules/api-design.md` (Status codes table) — **Suggestion** — confidence 80

`rules/retry-idempotency.md` mandates 429 handling ("**429 Too Many Requests:**
retry after the `Retry-After` header value (or 1s if absent)") and
`api-design.md` requires rate limiting on list endpoints, but the status-code
table jumps 409 → 410 → 500 with no 429 row, so an implementer following it has
no sanctioned code to emit when rate-limiting.

**Fix:** add a `| Rate limited | 429 |` row to the status table and a sentence
requiring a `Retry-After` header on every 429, cross-referencing
`retry-idempotency.md`.

### G4 — the enumerated behaviors are all governed
**Note** — confidence 95

Verified present and actually governing (not merely named): logging standards
(`logging.md`), error handling (`error-handling.md`), API design
(`api-design.md`), file/folder naming (`naming-conventions.md`), pre-existing-code
policy (`pr-workflow.md:28-39`, referenced from `code-principles.md:80-82`),
PR/branch workflow (`pr-workflow.md`), SLO-first + on-call readiness
(`observability.md:3-11`, `:62-75`), blast radius in the required order
(`architecture.md:3-19`), ADR discipline (`architecture.md:21-49`), research
source tiering (`research-sources.md`). No gap at the rule-file level — the
gaps are propagation (A3-A6, G2) and the unwritten complexity limits (G1).

---

## 4. Rule quality

### Q1 — stale, verifiable numbers in prompting-quality
`rules/prompting-quality.md:36-38` — **Warning** — confidence 97

> "footprint** of `rules/` (~62KB). All rule files are injected verbatim every
> session — confirmed by direct inspection (22 files, ~10.3k words / ~14k
> tokens)"

Measured now: **72,367 bytes, 23 files, 11,055 words** — the `diagrams.md`
addition was not reflected. The passage advertises itself as "confirmed by direct
inspection," so a stale number here is worse than no number.

**Fix:** update to "(~72KB … 23 files, ~11.1k words / ~15k tokens)" and add
"— re-measure with `cat rules/*.md | wc -cw` when adding a rule file" so the next
addition updates it.

### Q2 — aspirational, unverifiable dashboard requirement
`rules/observability.md:79-80` — **Suggestion** — confidence 85

> "Every production feature should be visible on a dashboard within one sprint
> of launch."

"Should," "one sprint," and "of launch" are all outside anything an agent can
observe or verify at authoring time — the agent cannot know sprint length or
launch date. The actionable sibling directly below it (lines 86-87, "Do not merge
a feature that introduces new critical paths without updating … the service
dashboard") already covers the merge-time obligation.

**Fix:** delete lines 79-80 and keep the minimum-panels list attached to the
merge gate at 86-87, which is checkable in a PR.

### Q3 — overly broad TDD exception
`rules/testing.md:15-16` — **Suggestion** — confidence 78

> "Exceptions: pure config files, generated code, one-off migration
> scripts, and UI markup with no logic."

"UI markup with no logic" has no boundary in a React/Vue codebase — nearly every
component is markup *plus* a handler or a conditional, and the exception is
readable as covering the whole component. Given `testing.md` reaches 84 of 128
agents (the widest-propagated rule), a loose exception here has the largest blast
radius of any wording issue in the set.

**Fix:** narrow to "…and presentational components with no props-derived
branching, no state, and no event handlers. A component with any conditional
render or handler is logic and requires a test."

### Q4 — gate-failure procedure states one policy at :61 and another at :78
`rules/autonomous-execution.md:61` — **Warning** — confidence 84

> "8. If gates fail: fix issues, re-run gates, then proceed"

Seventeen lines later, `:78-82` caps this at 2 tries and mandates a STOP. Step 8
is the one an executor follows in-line while running a batch and reads as
"iterate until green."

**Fix:** change step 8 to "If gates fail: fix and re-run, **max 2 attempts per
gate** (see Quality Gates below), then proceed or STOP."

### Q5 — undefined unit in the ADR length cap
`rules/architecture.md:48` — **Suggestion** — confidence 72

> "Keep ADRs short — 1 page maximum."

ADRs are markdown files; "1 page" has no rendering to measure against.

**Fix:** "Keep ADRs short — 60 lines maximum."

---

## 5. CLAUDE.md structure

### S1 — 3921 of 4096 bytes; 175 bytes of headroom
`CLAUDE.md` — **Note** — confidence 97

`rules/prompting-quality.md:28` sets the cap: "Keep them under 4KB." The file is
at **95.7%**. The `diagrams.md` line added at `CLAUDE.md:72` consumed part of the
remaining margin, and fix C7 needs another ~17 bytes. The next rule file added
will breach it.

**Fix:** reclaim ~300 bytes now, before the next addition. Two candidates that
lose nothing: (a) `CLAUDE.md:50` — the Agents paragraph spends ~200 bytes on
Workflow-tool caveats ("Use Workflow (via `Workflow` tool) for multi-step
parallel orchestration… never invoke unless the user explicitly requests it or a
skill instructs it") that belong in `rules/parallelism.md`; (b) `CLAUDE.md:66-74`
— the nine-line rules index duplicates `ls rules/`; collapse to two lines naming
only the rules with non-obvious filenames.

### S2 — the highest-stakes rule sits second-to-last
`CLAUDE.md:60-62` — **Suggestion** — confidence 72

Diagnosis mode — the rule that prevents guess-and-patch on every failing test —
is section 8 of 9, below Interaction Style (line 3), Session Notes (24), and
Complex Tasks (39). Verification (line 8) and Diagnosis (60) are the two
correctness-critical sections and they bracket four lower-stakes ones.

**Fix:** move the `## Diagnosis` block to immediately follow `## Verification`
(i.e. after line 22). Both govern "do not fabricate"; adjacency reinforces them
and costs zero bytes.

### S3 — stale post-compact description
See **C7**. — **Warning** — confidence 90

---

## 6. post-compact-context.md completeness

Current file: 1439 bytes, 4 restored sections plus the recovery sequence.

### P1 — the Commit Format line is redundant *and* drops the only convention worth restoring
`post-compact-context.md:21` — **Warning** — confidence 88

> "## Commit Format: see CLAUDE.md (Commit Messages) / `rules/commits.md`."

CLAUDE.md reloads verbatim after compaction (stated at `CLAUDE.md:30-32`), so
pointing at CLAUDE.md restores nothing that is not already back. Meanwhile the
autonomous-only commit conventions — `rules/autonomous-execution.md:150-151`,
"One commit per completed task (not per file, not per batch) / Commit message
references the task ID: `feat(T3): add confirm endpoint`" — appear in **neither**
CLAUDE.md nor the post-compact file, and are exactly what a post-compaction
executor loses.

**Fix:** replace line 21 with "## Commit Discipline (restored) — one commit per
completed task, message references the task ID (`feat(T3): …`); gate fixes get a
separate `fix(TN): …`. Format per CLAUDE.md." Net byte change ≈ +110.

### P2 — two stop thresholds restored side by side with no distinction
`post-compact-context.md:24-25` — **Warning** — confidence 85

> "STOP brake: if the same location/approach fails the same check 3x
> consecutively, stop and log to the decision journal — do not keep iterating."

`post-compact-context.md:30`

> "Run the mission brief's quality gates between every batch; after 2 consecutive failures on the same gate, STOP and log it — no more retries."

An executor reading only this file after compaction gets "3x" and "2 consecutive"
for situations it cannot tell apart. The source rules do distinguish them
(`autonomous-execution.md:132-138` = repeated edits to the same code location;
`:78-82` = attempts to fix one gate) but the condensation drops the distinction.

**Fix:** merge into one line: "STOP brakes — 2 failed fix attempts on the *same
quality gate*, or 3 consecutive edits to the *same code location* without
resolving the check. Either one: stop and log to the decision journal."

### P3 — the decision-journal obligation is not restored
`rules/autonomous-execution.md:140-144` — **Warning** — confidence 82

> "Every non-trivial judgment call gets a row in the decision journal.
> "Non-trivial" means: if a reasonable developer might have chosen
> differently, log it."

The post-compact file names the decision journal three times, but only as the
place to record a STOP. The ongoing per-decision logging duty — the thing that
makes the journal reconstructible across compactions, and the input the audit
trail depends on — is not restored, so journals thin out after the first
compaction.

**Fix:** append to the Autonomous Restraint section: "Log every non-trivial
judgment call to the decision journal as you go — not just STOPs. Non-trivial =
a reasonable developer might have chosen differently." ≈ +150 bytes.

### P4 — the new PlantUML default is not restored
`rules/diagrams.md:5` — **Suggestion** — confidence 78

Mission briefs write `diagrams/*.md` (`autonomous-execution.md:24`), and
`diagrams.md` is a 1-day-old rule that inverts a strong model prior.
Post-compaction, with only CLAUDE.md's one-line index entry (`CLAUDE.md:72`) to
go on, an executor regenerating or extending a brief diagram will produce mermaid.

**Fix:** add a one-line section: "## Diagrams (restored) — PlantUML for all
generated diagrams (```plantuml fence, `@startuml`); pick the type from the rubric
in `rules/diagrams.md`. No mermaid, no ASCII art." ≈ +170 bytes.

### P5 — the write-set boundary gate is only implied
`rules/autonomous-execution.md:73-74` — **Suggestion** — confidence 70

> "- Verify no files were modified outside the declared write-set
>   (compare `git diff --name-only` against the batch's file list)"

`post-compact-context.md:30` restores "run the quality gates" generically. The
write-set check is the one gate that is *not* a command in the brief's gate list
— it is an extra check defined only in the rule file — so a generic "run the
gates" does not recover it.

**Fix:** extend the Batch Close-Out line: "…and verify `git diff --name-only`
touched nothing outside the batch's declared write-set." ≈ +90 bytes.

### P6 — nothing else in the file is redundant with CLAUDE.md
**Note** — confidence 85

Audited each section against the verbatim-reloaded CLAUDE.md: Autonomous
Execution Recovery (`:6-15`), Model Routing (`:17-19`), Autonomous Restraint
(`:23-27`), and Batch Close-Out (`:29-30`) are all absent from CLAUDE.md and
correctly belong here. Only line 21 (P1) is pure redirection. Total after P1-P5:
≈1439 → ≈2000 bytes, which is unconstrained — the 4KB cap in
`prompting-quality.md:28` applies to always-prepended custom instructions, and
this file is injected only on compaction.

---

## Summary table

| # | File | Sev | Conf |
|---|---|---|---|
| C1 | diagnosis.md:42-51 ↔ autonomous-execution.md:78-82 | Critical | 90 |
| C2 | autonomous-execution.md:75 ↔ :155-157 | Warning | 88 |
| C3 | lsp.md:81-83 ↔ code-reviewer.md:6 / architect-reviewer.md:7 | Warning | 92 |
| C4 | pr-workflow.md:33,36 ↔ :38-39 | Warning | 82 |
| C5 | prompting-quality.md:36-38 ↔ :39-41 | Warning | 78 |
| C6 | backend-developer.md:8 ↔ :34 | Warning | 85 |
| C7 | CLAUDE.md:34-37 ↔ post-compact-context.md:29-30 | Warning | 90 |
| C8 | parallelism.md:55-57 ↔ 6 agent Required Rules blocks | Warning | 93 |
| C9 | prompting-quality.md:77-80 ↔ backend-developer.md:57-68 | Suggestion | 70 |
| C10 | diagrams.md — no conflict found (clean) | Note | 95 |
| C11 | diagrams.md:19-23 — Artifact fallback unnamed | Suggestion | 75 |
| A2 | CLAUDE.md:17-22 confidence ladder reaches 0 agents | Warning | 88 |
| A3 | diagnosis.md in 6/128; no Write-capable agent | Warning | 90 |
| A4 | lsp.md in 4/128 vs 65 Serena-equipped agents | Warning | 88 |
| A5 | api-designer.md:31-35 omits api-design.md | Warning | 90 |
| A6 | code-reviewer.md:24-29 omits testing/pr-workflow | Warning | 85 |
| A7 | security-auditor.md has no Required Rules | Note | 95 |
| G1 | complexity limits enforced by hook, in no rule | Warning | 92 |
| G2 | diagrams.md in 0/128 agents | Warning | 95 |
| G3 | api-design.md status table omits 429 | Suggestion | 80 |
| G4 | enumerated behaviors all governed | Note | 95 |
| Q1 | prompting-quality.md:36-38 stale counts | Warning | 97 |
| Q2 | observability.md:79-80 aspirational | Suggestion | 85 |
| Q3 | testing.md:15-16 broad exception | Suggestion | 78 |
| Q4 | autonomous-execution.md:61 vs :78 | Warning | 84 |
| Q5 | architecture.md:48 "1 page" | Suggestion | 72 |
| S1 | CLAUDE.md 3921/4096 bytes | Note | 97 |
| S2 | CLAUDE.md:60-62 Diagnosis buried | Suggestion | 72 |
| P1 | post-compact-context.md:21 redundant + lossy | Warning | 88 |
| P2 | post-compact-context.md:24 vs :30 thresholds | Warning | 85 |
| P3 | decision-journal duty not restored | Warning | 82 |
| P4 | PlantUML default not restored | Suggestion | 78 |
| P5 | write-set gate only implied | Suggestion | 70 |
| P6 | rest of post-compact non-redundant | Note | 85 |
