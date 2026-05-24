# Prompting Quality

## Constraint keywords

Prompts without explicit constraints produce lower-quality output. Every
non-trivial request should include at least one constraint keyword:

- **Scope limiters**: "only", "limit to", "restrict to", "just"
- **Prohibitions**: "do not", "avoid", "never", "without"
- **Requirements**: "must", "always", "ensure", "require"
- **Format controls**: "in under N lines", "as a table", "no prose"

Constraint-free prompts invite scope creep, unnecessary refactoring, and
outputs that are technically correct but not what was wanted.

Examples:
- Weak: "Update the auth handler"
- Strong: "Update the auth handler to accept Bearer tokens — do not change
  the session logic or touch any other handler"

## Specificity

Prompts under ~40 characters almost never contain enough information for
non-trivial work. Before sending a short prompt, ask: does the AI have
enough context to make the right trade-offs without guessing?

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

## Session work-type boundaries

A session that mixes unrelated task types (bug fix → feature design →
refactor → docs) degrades context quality over time. The model accumulates
stale context from earlier tasks that is irrelevant to later ones.

Start a new session when switching between substantially different domains.
Within a session, finish one logical unit of work before starting another.
