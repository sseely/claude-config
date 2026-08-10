# Fleet Charter

This is the "why" document for the 130 agents, 29 skills, 12 hooks, and 24
rule files under `~/.claude` (baseline captured 2026-08-09). It exists
because `docs/nist-ai-rmf/crosswalk.md` carried three rows — MAP 1.3, MAP
1.4, MAP 3.4 — that named the same gap three ways: nothing stated the
mission for this AI tooling, what it's expected to deliver, or how anyone
would know if it wasn't delivering. This is that statement.

## Why this repo uses AI agents

Not a generic AI-adoption story. This is a single operator's Claude Code
configuration repo — one person authoring rules, agents, and skills for
their own use, with no workforce, no committee, no adoption curve to climb.
The reason for 130 agents and 29 skills is leverage: a solo operator cannot
review every dependency bump, run every security audit, and re-derive every
architectural pattern from scratch on every task. Specialist agents and
codified rules substitute for a team that doesn't exist. That's the entire
premise — not "AI transformation," not compliance theater. If an agent or
rule doesn't save the operator time or catch something they'd otherwise
miss, it doesn't belong here.

## What the configuration is expected to deliver, and how each claim is checked

Every claim below carries exactly one label: **checkable** (names the gate
or hook that verifies it) or **unverified intention** (no check exists yet).

**Checkable, and currently checked:**

- All 159 agent/skill frontmatter files parse as valid YAML — checked live
  by the frontmatter parse gate: `hooks/.venv/bin/python -c "import
  yaml,glob,sys;[...]"` parsing every `agents/**/*.md` and `skills/*/SKILL.md`
  frontmatter, run after every batch in autonomous missions. Write-time
  enforcement by `hooks/check-frontmatter.py` (a blocking `PostToolUse`
  hook on `Write`/`Edit`, FD-3) is planned but not yet built — until that
  hook lands, this claim is gate-checked only, not write-blocked.
- Generated and hand-written code stays under a fixed complexity ceiling —
  enforced by `hooks/check-complexity.py`, blocking on `Write`/`Edit`:
  500-line file cap, 30-NLOC function cap, cyclomatic complexity ≤10,
  ≤5 parameters (`rules/code-principles.md`).
- `rules/` stays under its 2020-line cap — checked by `test $(cat rules/*.md
  | wc -l) -le 2020`.
- No rule file adds `paths:` frontmatter — checked by `! grep -rln
  '^paths:' rules/` (AD-1; a prior pilot of scoped loading came back RED).
- `skills/self-improve/SKILL.md` stays within its 150-line / 10,240-byte
  budget — checked by `test $(wc -l < skills/self-improve/SKILL.md) -le 150
  && test $(wc -c < skills/self-improve/SKILL.md) -le 10240`.
- The fleet inventory doesn't drift from the files it describes — once
  `docs/fleet/inventory.md` lands, checked by regenerating it with
  `scripts/gen-fleet-inventory.py --check` and failing on any diff (FD-7).
  It is committed, not gitignored, specifically so it can rot visibly
  instead of silently — the crosswalk's own agent count was wrong the day
  it was committed, which is the failure this gate exists to prevent.
- The NIST crosswalk stays complete — checked by its own completeness count
  (72/72 subcategories, each carrying a disposition; see
  `docs/nist-ai-rmf/crosswalk.md`'s "Completeness" section).
- A batch's file changes match what it declared it would touch — checked by
  `git diff --name-only` against the declared write-set.

**Unverified intention (no check exists yet):**

- That the 130 agents actually save the operator time, or reduce defect
  rate, versus doing the same work by hand. The eval harness (`evals/`)
  now measures format and adherence conformance, but nothing measures
  time saved or defect rate — this benefit-magnitude claim remains
  unverified (the gap MAP 3.1 names in the crosswalk).
- That agent output is reliable and repeatable across invocations of the
  same task. One baseline run exists (`evals/results.jsonl`); repeatability
  across runs has not been measured.
- That the forthcoming risk register (`docs/fleet/risk-register.md`, once
  it lands) correctly ranks which agents carry the most risk. It becomes
  checkable once built, because the eval-target selection is derived from
  it rather than named up front (FD-9) — until then, ranking is an
  unverified intention, not a checked one.
- That specialist agents outperform a generalist prompt on the same task.
  No comparison has been run.

## The working arrangement, stated plainly (FD-10)

A single operator governs this configuration: writes the rules, authors the
agents, and merges every change to `~/.claude` alone. There is no second
reviewer for this repo, and no mechanism requires one — no branch
protection, no `CODEOWNERS`, nothing that blocks a merge.

A second developer does review work — but what she reviews is **downstream
products this configuration produces**, not `~/.claude` itself. That review
is a working agreement between two people, not a control on this repo. It
does not gate any change here, and nothing in this repo enforces it
mechanically. Say this precisely, because it's easy to conflate: "a second
developer exists and reviews things" does not mean "this repo has two-person
review." It doesn't. The solo basis holds for every governance decision made
in `~/.claude` — what changes is that code this configuration outputs now
reaches a second party before it goes further, and that boundary is honored
by convention, not enforced by tooling.

## Third-party AI constraints (GOVERN 6.1, MAP 4.1)

This configuration depends on third-party AI components it does not control:

- **Anthropic's models**, invoked per agent via that agent's `model:`
  frontmatter field. Model behavior, availability, and version lifecycle are
  Anthropic's to change; this repo names which model each agent targets but
  cannot govern how that model behaves. `rules/parallelism.md`'s routing
  table documents which model each role uses and why — that's a cost and
  capability decision, not a control over the model itself.
- **The Serena MCP server**, registered at user scope so its semantic
  navigation tools (`find_symbol`, `find_referencing_symbols`, and related)
  are available to every project on this machine, not just `~/.claude`.
  `rules/lsp.md` documents the tool surface and the subagent-scope carve-out
  — agents dispatched via the Agent tool use Serena's MCP tools instead of
  the orchestrator's LSP tool, because they don't have LSP in their
  frontmatter. Governance here is documentation of intended use, not a
  control over Serena's own behavior or availability.

Both are named explicitly because GOVERN 6.1 and MAP 4.1 ask for exactly
that: an approach to third-party AI risk that is in place and documented.
Neither is a control this repo can enforce — that boundary is the honest
answer, not a gap to paper over.
