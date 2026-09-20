# Prompting Quality

## Constraint keywords

Use at least one constraint keyword per non-trivial request:
- Scope: "only", "limit to", "restrict to", "just"
- Prohibitions: "do not", "avoid", "never", "without"
- Requirements: "must", "always", "ensure", "require"
- Format: "in under N lines", "as a table", "no prose"

Weak: "Update the auth handler." Strong: "Update the auth handler to
accept Bearer tokens — do not change the session logic or touch any
other handler."

> **On Claude 4.6+/Fable 5/Opus 4.8:** prefer scoping keywords (`only`,
> `limit to`, `do not`) over intensity escalation (`CRITICAL`, `MUST`) —
> blanket intensity words can overtrigger on these models. Scoping
> keywords remain effective on all model tiers.

## Specificity

Include in the prompt: the file or symbol being changed (if known), the
reason for the change ("why"), and what must not change (the boundary).

## Instruction bloat

Custom instructions (CLAUDE.md, system prompts) are prepended to every
request. Keep CLAUDE.md **under 200 lines** (Anthropic's guidance at
code.claude.com/docs/en/memory) — everything beyond that is dead weight
on every token budget in every session. Audit periodically: drop stale
instructions, consolidate duplicates, push project-specific rules to
project-level CLAUDE.md files.

Per-file caps bound each file, but the **aggregate resident footprint**
of `rules/` is the larger cost — every rule file is injected verbatim at
session start. `paths:` frontmatter would scope loading, but a pilot came
back RED and review enforces its absence; the mitigations are dedup
across files and moving lookup depth to `docs/reference/`. The cap is
stated in `docs/fleet/charter.md`, checked in `hooks/quality-gate.sh`.

## File context discipline

Attaching large numbers of files to a prompt is a lazy substitute for
understanding the codebase. Prefer `grep`/Serena symbol lookup to find
the exact lines relevant to the task, read only the sections that bear
on the change, and pass precise line ranges in the read-set, not whole
files. Attaching 30+ files floods the context window and reduces cache
hit rates.

## Agent context budget

Per arxiv:2509.21361 (MEDIUM confidence — the paper shows a stronger
effect than "attention dilution" as a named mechanism; that phrase is
this rule's gloss, not the paper's):

- Cap file inventory at 20-30 files per agent; split larger inventories
- Pass line ranges, not whole files: `src/api/subscribe.js:15-40`
- If the read-set exceeds 30 files, split the task into two agents
- The Sonnet 5 tokenizer emits ~1.3× the tokens of Sonnet 4.6 for the
  same text — file-count caps hold, but budget tokens accordingly
- Recall degrades sharply past ~128k tokens (arxiv:2607.19257, preprint);
  compact or split when context passes that band

## Constraint budget

Per MOSAIC research (arxiv:2601.18554), the number of hard constraints
per section affects compliance. The tiers below are interpolated from
the paper's findings, not stated verbatim in its abstract (LOW-MEDIUM
traceability): **1–6** reliable compliance, **7–15** unpredictable
(partial compliance, blending), **>15** degraded (ignored or averaged).

Keep each section of a rule file, agent prompt, or skill phase to **≤6
hard prescriptive constraints**. If a section needs more, split it into
named sub-sections, each with ≤6 items. Numbered sequential steps
(procedures) are exempt — the limit applies to parallel rules, not
ordered steps.

## Register shifting

The verb used in a prompt determines how thoroughly the model processes
the request (validated empirically):

- **Tier 1 — systematic scan** (thoroughness required): `audit`,
  `verify`, `critically analyse`, `enumerate`, `identify all`
- **Tier 2 — standard processing** (routine tasks): `review`, `check`,
  `describe`, `summarize`
- **Tier 3 — advisory** (often ignored under context pressure): `look
  at`, `note`, `consider`, `mention`

Use Tier 1 for security audits, architecture reviews, test plans — work
that requires complete coverage. Never use Tier 3 when you need the
result acted on.

## Scale-aware brevity constraints

Per arxiv:2604.00025 (preprint, open models only, not validated on
planning tasks or Opus-tier agents): brevity constraints yield up to
26pp accuracy gain on math/science benchmarks. Opus-tier models
over-elaborate without explicit constraint — an operational heuristic,
not a finding.

- Every Opus agent prompt should include: "Return only the structured
  result — no preamble, no trailing summary."
- Specify output shape explicitly (bullet list, table, schema) —
  "Report findings" is weaker than "one line per finding, no prose"
- Replace "explain X" / "summarize Y" with "state X" / "list Y"

**Exception:** when reasoning trace is the deliverable (architecture
proposals, extended thinking tasks), verbosity is appropriate.

## Session work-type boundaries

A session that mixes unrelated task types (bug fix → feature design →
refactor → docs) degrades context quality — the model accumulates stale
context irrelevant to later tasks. Start a new session when switching
between substantially different domains; within a session, finish one
logical unit of work before starting another.
