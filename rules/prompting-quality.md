# Prompting Quality

## Constraint keywords

Use at least one constraint keyword per non-trivial request:
- Scope: "only", "limit to", "restrict to", "just"
- Prohibitions: "do not", "avoid", "never", "without"
- Requirements: "must", "always", "ensure", "require"
- Format: "in under N lines", "as a table", "no prose"

Examples:
- Weak: "Update the auth handler"
- Strong: "Update the auth handler to accept Bearer tokens — do not change
  the session logic or touch any other handler"

> **On Claude 4.6+/Opus 4.8:** Prefer scoping keywords (`only`, `limit to`, `do not`) over intensity escalation (`CRITICAL`, `MUST`, `ALWAYS`). Blanket intensity words can overtrigger on these models and reduce output quality. Scoping keywords remain effective on all model tiers.

## Specificity

Include in the prompt:
- The file or symbol being changed (if known)
- The reason for the change (the "why")
- What must not change (the boundary)

## Instruction bloat

Custom instructions (CLAUDE.md, system prompts) are prepended to every
request. Keep them under 4KB. Every kilobyte beyond that is dead weight
on every token budget in every session.

Audit periodically: remove instructions that are no longer relevant,
consolidate duplicates, and move project-specific rules to project-level
CLAUDE.md files rather than the global one.

## File context discipline

Attaching large numbers of files to a prompt is a lazy substitute for
understanding the codebase. Prefer:
- `grep` / Serena symbol lookup to find the exact lines relevant to the task
- Reading only the file sections that bear on the change
- Passing precise line ranges in the read-set, not whole files

Attaching 30+ files to a single prompt floods the context window, reduces
cache hit rates, and makes it harder for the model to attend to what matters.

## Agent context budget

Research (arxiv:2509.21361) demonstrates attention dilution as a general principle
with added context. Apply this when constructing agent prompts:

- Cap file inventory at 20-30 files per agent; split larger inventories across multiple agents
- Pass line ranges, not whole files: `src/api/subscribe.js:15-40` not the full file
- If the read-set exceeds 30 files, that is a signal to split the task into two agents

## Constraint budget

Per MOSAIC research (arxiv:2601.18554), the number of hard constraints per
section directly affects compliance:

- **1–6 constraints**: Reliable compliance
- **7–15 constraints**: Unpredictable — partial compliance, constraint blending
- **>15 constraints**: Degraded — constraints are ignored or averaged together

Keep each section of a rule file, agent prompt, or skill phase to **≤6 hard
prescriptive constraints**. If a section needs more, split it into named
sub-sections, each with ≤6 items. Numbered sequential steps (procedures) are
exempt — the limit applies to parallel prescriptive rules, not ordered steps.

## Register shifting

The verb used in a prompt determines how thoroughly the model processes the
request. Match verb strength to intent (validated empirically):

**Tier 1 — Systematic scan** (use when thoroughness is required):
`audit`, `verify`, `critically analyse`, `enumerate`, `identify all`

**Tier 2 — Standard processing** (routine tasks):
`review`, `check`, `describe`, `summarize`

**Tier 3 — Advisory** (often ignored under context pressure):
`look at`, `note`, `consider`, `mention`

In agent prompts and skill phases that require complete coverage — security
audits, architecture reviews, test plans — use Tier 1 verbs. Reserve Tier 2
for standard implementation guidance. Never use Tier 3 when you need the
result acted on.

## Scale-aware brevity constraints

Per arxiv:2604.00025 (Hakim, 2026 — preprint): brevity constraints yield up to
26pp accuracy gain on math/science benchmarks across 31 general LLMs (preprint,
not validated on planning tasks or Opus-tier agents specifically). Opus-tier
models over-elaborate without explicit constraint.

- Every Opus agent prompt must include: "Return only the structured result —
  no preamble, no trailing summary."
- Specify output shape explicitly (bullet list, table, schema). "Report findings"
  is weaker than "Report as a bullet list, one line per finding, no prose."
- Replace "explain X" / "summarize Y" with "state X" / "list Y" in rules and phases.

**Exception:** when reasoning trace is the deliverable (architecture proposals,
extended thinking tasks) — verbosity is appropriate there.

## Session work-type boundaries

A session that mixes unrelated task types (bug fix → feature design →
refactor → docs) degrades context quality over time. The model accumulates
stale context from earlier tasks that is irrelevant to later ones.

Start a new session when switching between substantially different domains.
Within a session, finish one logical unit of work before starting another.
