# Orchestrator findings — self-improve run 2026-08-01

Findings made by the orchestrator directly, not by a Phase 1/2 agent.
Feed these into Phase 3 dedup alongside the agent notes.

## Observation: Haiku routing contradicts parallelism.md for analysis agents
- **Context**: Verifying Agent B's `compliance-auditor.md` effort/model finding;
  widened the check to all of `agents/04-quality-security/`.
- **Finding**: 6 of 14 quality-security agents are pinned `model: haiku`:
  accessibility-tester, compliance-auditor, error-detective,
  penetration-tester, performance-engineer, qa-expert.
  `rules/parallelism.md:90` scopes haiku to "Confidence scoring, dedup
  passes, format checking, simple grep tasks" — none of these six do that:
  - `error-detective.md` — "complex error pattern analysis, correlation,
    root cause discovery, distributed system debugging". Directly contradicts
    `rules/diagnosis.md:36-44`, which requires a stated mechanism, causal
    chain, and ruled-out list. That is multi-path reasoning, not scoring.
  - `penetration-tester.md` — exploit reasoning and attack-surface
    enumeration; `rules/extended-thinking.md:8` lists security analysis /
    threat modeling as an extended-thinking case.
  - `performance-engineer.md` — "bottleneck identification ... multiple
    causes"; extended-thinking.md:11 names performance analysis explicitly.
  - `qa-expert.md` — test strategy; extended-thinking.md:10 names test
    strategy explicitly.
  - `compliance-auditor.md` — 100% control coverage across GDPR/HIPAA/
    PCI/SOC2 with per-control evidence citation.
  - `accessibility-tester.md` — WCAG conformance; closest to legitimate
    checklist work, weakest case for re-routing.
- **Secondary**: `parallelism.md:92` caps Haiku agents at ~50 files
  (200k ctx). A codebase-wide compliance or pentest audit exceeds that.
- **Impact**: These agents are under-powered for their stated jobs, and the
  routing contradicts two rules the config itself sets. Anti-pattern table
  at parallelism.md warns "Haiku for code generation ... produces more errors
  requiring fix loops"; the analysis analogue is silent false-negatives —
  an audit that misses findings looks identical to a clean audit.
- **Proposed fix**: raise error-detective, penetration-tester,
  performance-engineer, compliance-auditor, qa-expert to `sonnet`; leave
  accessibility-tester on haiku. Keep `effort: high` where present.
- **Confidence**: High (85) — direct file inspection, two governing rules quoted.

## Note: Agent B's proposed fix for compliance-auditor is the weaker option
- Agent B recommended deleting `effort: high` from
  `agents/04-quality-security/compliance-auditor.md:6` because Haiku rejects
  the effort param (400). That is correct on the API facts, but deleting
  effort silently *downgrades* a compliance audit to fix a symptom.
  The better fix is `model: sonnet` + keep `effort: high`, which resolves
  the API error AND the routing mismatch above. Verified: it is the only
  haiku+effort pairing among the 18 agents that set effort.
- **Confidence**: High (90).

## Observation: `paths:` support VERIFIED — 4-audit finding is now actionable
- **Context**: `rules/prompting-quality.md:54-55` recommends `paths:` frontmatter
  to scope domain rules. Four consecutive audits (2026-06-20, 06-22, 07-01,
  07-24) flagged it unused; none ever verified the mechanism EXISTS, so it was
  deferred every time.
- **Finding**: Agent A confirmed via https://code.claude.com/docs/en/memory
  ("Path-specific rules"): the key is `paths` (YAML list of globs); rules
  without it "are loaded unconditionally and apply to all files". It applies to
  the `.claude/rules/*.md` file class, and the same page's "User-level rules"
  subsection confirms `~/.claude/rules/` uses the identical format.
- **Impact**: The blocker is removed. All 23 rule files currently load every
  session (~62KB resident, per prompting-quality.md's own note). Domain-specific
  rules are the obvious candidates to scope: api-design, environment,
  retry-idempotency, logging, observability, error-handling, testing,
  testability, naming-conventions, diagrams. Rules that should stay
  unconditional: security, code-principles, commits, pr-workflow, parallelism,
  diagnosis, memory, prompting-quality, autonomous-execution.
- **Caveat to carry**: the docs never restate `paths` per-scope explicitly, so
  user-level applicability is inferred from the shared format, not stated
  verbatim. Pilot on ONE low-risk rule file and confirm the scoping actually
  fires before converting all ten.
- **Quantified** (measured 2026-08-01): rules/ is 23 files / 72,367 bytes
  (~18k tokens) resident every session. The 10 domain-specific candidates
  (observability, diagrams, retry-idempotency, error-handling, testability,
  naming-conventions, api-design, testing, logging, environment) total 21,857
  bytes = **30% of the resident footprint, ~5,460 tokens/session**.
  For scale: Agent H's entire tightening axis yields ~105 tokens/session.
  Path-scoping is ~50x larger than every prose-compression fix combined.
  This should be the top-priority finding of the run.
- **Confidence**: High (85) — Tier-1 doc, quoted.

## Observation: CLAUDE.md is at 95% of its own documented 4KB cap
- **Context**: verifying Agent H's size audit.
- **Finding**: CLAUDE.md is 3,921 bytes against the 4,096-byte cap set by
  `rules/prompting-quality.md:31-33`. 175 bytes of headroom.
- **Mechanism**: the established pattern is one index line per new rule file.
  I added such a line for `diagrams.md` earlier in this same session
  (commit 73837bd), consuming ~60 bytes. The next one or two rule additions
  breach the documented cap.
- **Impact**: not yet a violation, but the trend line crosses the limit within
  ~2 more rule files. Better addressed now than as an emergency edit later.
- **Proposed fix**: collapse the `## Rules` index — it currently spends ~700
  bytes listing all 23 files by name in themed groups. A single pointer
  ("All rules live in `~/.claude/rules/`; read the one relevant to the task")
  plus the 3-4 genuinely load-bearing entries would reclaim ~400 bytes.
  Note this interacts with the `paths:` work above — if rules become
  path-scoped, the index matters less, not more.
- **Confidence**: High (95) — direct byte count.

## Correction to Agent H: rules/ staleness is partly self-inflicted this session
- `rules/prompting-quality.md:35-38` claims "22 files, ~62KB, ~10.3k words /
  ~14k tokens". Actual: 23 files, 72,367 bytes, ~18k tokens. H scored this 90
  and is correct. Worth noting the drift arrived via commit 73837bd earlier in
  THIS session (adding diagrams.md) — i.e. the config's own self-description
  goes stale the moment a rule file is added, with nothing to catch it.
- **Proposed fix**: beyond correcting the numbers, drop the precise counts
  entirely and state the constraint qualitatively ("all rule files are injected
  verbatim every session; the aggregate is the binding cost"). A number that
  requires manual upkeep on every rule addition will be wrong again by the next
  run. Alternatively add a hook that recomputes it.
- **Confidence**: High (95).

## Observation: research-urls.md candidate promotion pipeline is broken
- **Context**: Counting registry entries after Agent X added 34 candidates.
- **Finding**: candidate table growth 31 (2026-06-10) → 36 → 57 (2026-07-24)
  → 91 after this run. Only 6 entries have EVER been promoted to active;
  18 active URLs total. Candidates accumulate monotonically.
- **Mechanism**: SKILL.md Phase 6 step 1 promotes only URLs "fetched this run
  that passed the thin-content bar". But Agents A, B, and C are each instructed
  to fetch their OWN active list — no agent is ever told to fetch a candidate.
  Promotion therefore only happens by accident, when an agent independently
  stumbles onto a candidate URL. This run promoted zero and added 34.
- **Impact**: The discovery machinery works (Agent X dedups well) but feeds a
  queue nothing drains. The registry accrues research debt that reads as
  coverage. Left alone it will pass 100 entries next run.
- **Proposed fix**: add a step to Phase 1 — one agent fetches the top N (say 5)
  candidates by relevance each run and promotes or demotes them; or cap the
  candidate table and require Agent X to evict the lowest-relevance rows it is
  displacing. Prefer the former.
- **Confidence**: High (90) — counts are from git history of the file itself.

## Bookkeeping gap: prior task file checkboxes never ticked
- `code-review-tasks.md` (2026-07-24) shows every item `[ ]` unchecked, but
  ~25 commits between 3fba52a and 1927c9e implemented them. Spot-verified:
  template serena perms (1927c9e), cp/mv + opus default (f00b982), Required
  Rules across 126/128 agents, Explore/Plan pinned to haiku (77c58b4).
- **Impact**: Phase 0's regression gate has to reconstruct state from git
  each run. Future runs may re-derive already-fixed findings.
- **Proposed fix**: whoever implements a task file ticks the box in the same
  commit; or self-improve Phase 0 reconciles and rewrites the file.
- **Confidence**: High (95).
