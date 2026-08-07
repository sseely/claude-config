# Phase 2 — Configuration audit agent prompts

Full prompts for the five Phase 2 audit agents, split out of `SKILL.md` to
keep it under Anthropic's 500-line skill ceiling. Dispatch order and the
parallelism rule live in `SKILL.md`; everything an agent needs is here.

All five are read-only.

### Agent D — Settings, hooks, and MCP

Read these files completely:

- `~/.claude/settings.json`
- `~/.claude/.claude/settings.json`
- `~/.claude/.claude/settings.local.json`
- `~/.claude/.mcp.json`
- `~/.claude/templates/autonomous-settings.json`
- `~/.claude/hooks/autonomous-toggle.sh`
- `~/.claude/hooks/notify-on-stop.sh`
- `~/.claude/hooks/project-init.sh`
- `~/.claude/hooks/quality-gate.sh`
- `~/.claude/hooks/record-turn-start.sh`
- `~/.claude/post-compact-context.md`

Evaluate:
1. **Hook events**: Which of PreToolUse, PostToolUse, Notification,
   SubagentStop, PreCompact, PostCompact, Elicitation, CwdChanged,
   InstructionsLoaded are missing? What would each enable?
2. **Permission noise**: Identify stale one-off permissions
   (absolute paths, literal command strings, echo variants).
   List each entry by approximate line number.
3. **Permission gaps**: Commands in `settings.local.json` or the
   autonomous template but absent from global `settings.json`.
4. **WebSearch syntax**: Is `"WebSearch"` vs `"WebSearch(*)"` 
   consistent? Which form does Claude Code actually require?
5. **MCP gaps**: What MCP servers would replace current `gh`, `curl`,
   or filesystem shell calls with structured, type-safe equivalents?
6. **Hook quality**: For each hook — `set -euo pipefail`? Platform
   guards? Idempotency? Error logging?
7. **Autonomous template completeness**: Missing permissions vs. what
   the global settings grant. Check especially MCP tools, package
   managers, and CLI tools.

### Agent E — Skills quality

Read ALL skill SKILL.md files under `~/.claude/skills/`.

For each skill, evaluate against these dimensions:

1. **Completeness** — What happens when prerequisites are missing,
   a tool fails, or external state is unexpected?
2. **Model routing** — Does the skill specify which model (Opus/
   Sonnet/Haiku) for which sub-step? Planning vs. execution vs.
   scoring have different cost/quality tradeoffs.
3. **Research integration** — Does the skill use WebSearch/WebFetch
   to check current best practices for the tech stack it encounters?
4. **Verification** — After doing work, does the skill verify
   output (run tests, check types, validate structure)?
5. **Agent prompt quality** — When spawning subagents, does the
   skill provide: context, task, write-set, read-set, architecture
   decisions, interface contracts, quality bar?
6. **Parallelism plan** — Are there sequential steps that could be
   batched?
7. **Resumability** — What's preserved if interrupted?
8. **Operational readiness** — For skills that produce or drive
   architecture or code changes, do they enforce observability
   requirements (SLIs, on-call story, alert thresholds), rollback
   classification, and blast radius documentation? Or do they
   produce functionally correct output that is operationally blind?

Report per-skill with **Strengths** / **Gaps** / **Priority** /
**Specific recommendation**. Then a cross-skill section for patterns
appearing across multiple skills.

### Agent F — Rules and CLAUDE.md

Read these files completely:

- `~/.claude/CLAUDE.md`
- All files under `~/.claude/rules/`
- `~/.claude/post-compact-context.md`

Sample these agent definitions for rule propagation:
- `~/.claude/agents/01-core-development/backend-developer.md`
- `~/.claude/agents/01-core-development/microservices-architect.md`
- `~/.claude/agents/01-core-development/api-designer.md`
- `~/.claude/agents/02-language-specialists/typescript-pro.md`
- `~/.claude/agents/04-quality-security/architect-reviewer.md`
- `~/.claude/agents/04-quality-security/code-reviewer.md`
- `~/.claude/agents/09-meta-orchestration/it-ops-orchestrator.md`

Evaluate:
1. **Contradictions**: Pairs of rules or rule vs. agent that conflict
   (quote both sides).
2. **Agent isolation risk**: Rules that assume ambient context
   (CLAUDE.md, prior conversation) — these disappear in subagents.
3. **Coverage gaps**: Behaviors with no governing rule. Common
   missing categories: logging standards, error handling strategy,
   API design conventions, file/folder naming, pre-existing code
   policy, PR/branch workflow, SLO-first observability and on-call
   readiness, system-first blast radius analysis (data model → API
   contracts → service deps → files), ADR discipline (when an ADR
   is required vs optional), research source tiering.
4. **Rule quality issues**: Unclear thresholds, overly broad
   exceptions, aspirational statements that aren't actionable.
5. **CLAUDE.md structure**: Are the most critical rules front-loaded?
   Is anything buried that should be prominent?
6. **post-compact-context.md completeness**: What critical behavioral
   rules are NOT restored after compaction?

### Agent G — Prompt structure audit

Apply the research principles from Agent C as a dynamic checklist.
Do not use a fixed checklist — the principles come from this run's
research, so they vary across invocations.

**File sample to audit:**
- All files under `~/.claude/rules/`
- `~/.claude/CLAUDE.md`
- Five agent files: sample two from `agents/01-core-development/`,
  two from `agents/04-quality-security/`, one from
  `agents/09-meta-orchestration/`
- Three SKILL.md files: `plan-mission`, `code-review`, `self-improve`

**Standing check (run regardless of Agent C findings):**

Audit scale-aware brevity constraints (arxiv:2604.00025). For every agent
prompt and skill phase that routes to Opus:
1. Does the prompt include an explicit output-length or conciseness constraint?
   (e.g., "return only the structured result", "one line per finding, no prose")
2. Does it specify output shape (schema, bullet list, table) rather than
   open-ended "report" or "explain"?
Report each Opus-routed prompt that lacks both as a Warning.

**For each principle Agent C marked as "Misaligned":**
1. Check every file in the sample for the violation
2. Report: `file:line`, what the violation is, what correct form looks like
3. Assign confidence 0–100 using the same rubric as `/code-review`
4. If the violation is widespread (>3 files), note it as a systemic
   pattern, not a per-file finding

**For each principle Agent C marked as "Aligned" or "Config is better":**
- Confirm alignment with one concrete example (file:line) from the
  sample. An alignment claim without evidence doesn't count.

**Output format:** use `/code-review` severity levels —
Critical / Warning / Suggestion / Note — based on how broadly and
consequentially the principle is violated, not on how confident the
research is. Confidence scores filter findings in Phase 3.

### Agent H — Tightening audit

Audit `~/.claude` for instruction bloat, cross-file redundancy, and verbose
prose that consumes token budget without adding actionability. All read-only.

**Files to read:**

```bash
cat ~/.claude/CLAUDE.md
cat ~/.claude/post-compact-context.md
ls ~/.claude/rules/ | while read f; do wc -l ~/.claude/rules/"$f"; done
# Read every rule file:
cat ~/.claude/rules/*.md
# Sample agents (read these fully):
cat ~/.claude/agents/01-core-development/backend-developer.md
cat ~/.claude/agents/01-core-development/api-designer.md
cat ~/.claude/agents/04-quality-security/architect-reviewer.md
cat ~/.claude/agents/04-quality-security/code-reviewer.md
cat ~/.claude/agents/09-meta-orchestration/it-ops-orchestrator.md
# Sample skills (read these fully):
cat ~/.claude/skills/self-improve/SKILL.md
cat ~/.claude/skills/plan-mission/SKILL.md
cat ~/.claude/skills/code-review/SKILL.md
```

**Evaluate each dimension below. Report findings with file:line.**

#### 1. File size vs. prompting-quality.md limits

`prompting-quality.md` requires CLAUDE.md ≤ 4KB. Check:

```bash
wc -c ~/.claude/CLAUDE.md
wc -l ~/.claude/post-compact-context.md
wc -l ~/.claude/rules/*.md | sort -rn | head -10
```

Report any file that exceeds its natural utility ceiling:
- CLAUDE.md > 4KB → flag
- `post-compact-context.md` > 120 lines → flag (goal: condensed restoration, not full rules)
- Any single rule file > 200 lines → flag as candidate for splitting
- Any agent file > 300 lines → flag as candidate for trimming

#### 2. Cross-file redundancy

Identify content that appears in two or more files with substantial overlap.
Common patterns to look for:

- A rule stated in full in both `CLAUDE.md` and a `rules/` file (CLAUDE.md
  should reference, not repeat)
- The same behavioral rule in both `rules/X.md` and `post-compact-context.md`
  at equal verbosity (post-compact should be a condensed version, not a copy)
- An agent's body text that duplicates content in its `## Required Rules`
  section references (the body should add agent-specific detail, not restate
  the rule)
- The same checklist item appearing in multiple skill files

For each redundancy: quote both locations with file:line, estimate how many
tokens the duplication costs per session (multiply by sessions-per-day if known),
and state which location should be the single source of truth.

#### 3. Verbose prose vs. tight bullets

Identify sections where a long prose explanation could be replaced by a shorter
form without losing actionability. Apply this test: *if a competent developer
could act correctly after reading only the first sentence and a bullet list,
the rest is bloat.*

Look for:
- Paragraphs of ≥ 4 sentences that precede a bullet list saying the same thing
- "For example" blocks that illustrate an already-clear rule
- Motivational context ("the reason we do this is...") that belongs in a commit
  message, not a rule file — actionable rules don't need rationale unless the
  rule is counterintuitive

For each candidate: give the file:line range, current word count, and a
rewritten version under 40 words that preserves the actionable constraint.
Only suggest rewrites where compression > 50% and no behavioral nuance is lost.

#### 4. Dead or stale content

Flag:
- `<!-- Code review: ... -->` comments that are still open (not yet addressed)
- Sections referencing features, tools, or patterns that no longer exist in the
  config (e.g., references to a model name that's been updated elsewhere)
- "TODO" or "REVISIT" markers older than the current config generation
- Rules that are fully subsumed by a more specific rule added later

#### 5. post-compact-context.md calibration

This file is injected after every compaction. Every line costs tokens on every
compaction event. Check:

- Does each section restore a genuine behavioral rule, or does it repeat
  content that CLAUDE.md already restores verbatim?
- Are any sections too verbose to serve as a "restore" — i.e., longer than
  the corresponding rule file section they're meant to summarize?
- Are there sections that could be merged (e.g., two adjacent 3-line sections
  that are both about error handling)?

Target: each restored rule should be ≤ 4 lines. Flag any section > 6 lines as
a compression candidate.

**Output format:**

Group findings under:
- **Bloat** — file is over the size limit
- **Redundancy** — same content in two places; recommend single source
- **Verbose prose** — can be compressed >50%; include rewritten version
- **Dead content** — stale, unreferenced, or superseded
- **post-compact calibration** — specific to that file

For each finding: `file:line`, severity (Warning / Suggestion / Note), and
concrete fix. No findings without a concrete fix.

Wait for all five agents to complete before Phase 3.

**Agent-crash handling:** If any agent in this phase returns no output
(crashed, killed, or timed out), relaunch it once. If it fails again on
retry, proceed without it and record the unaudited axis as an explicit gap
in the Phase 4 report.

**Phase 2 completion:** Each agent writes its full output to
`.agent-notes/self-improve-phase2-[D|E|F|G|H].md` before returning. Once all
five have completed (or been retried/gapped per the crash-handling rule
above), append `phase-2: done` to `~/.claude/.self-improve-progress.md`.

---
