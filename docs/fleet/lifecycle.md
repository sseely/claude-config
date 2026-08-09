# Fleet Lifecycle — Retiring an Agent, Skill, or Hook

Today, retiring `agents/*.md`, `skills/*/SKILL.md`, or `hooks/*.py` is an ad
hoc `rm` with no check for references from `CLAUDE.md`, `rules/`, other
skills, or `settings.json`. This document is the procedure that replaces
"just delete it" — a search step, a confirm step, and a verify step, backed
by `scripts/check-references.py`. It adds no new machinery beyond that
script: no hook, no gate, no CI job.

## Procedure

1. **Search.** Before deleting a file, search for references to it by both
   forms it can appear in:
   - **By filename** — grep the repo for the literal path
     (`agents/<subdir>/<name>.md`, `skills/<name>/SKILL.md`,
     `hooks/<name>.py`) and for the bare filename on its own.
   - **By `name:` value** — an agent is invoked by its frontmatter `name:`
     field via `subagent_type`, not by its filename. Grep for
     `subagent_type: "<name>"` (and the unquoted/`=` form) separately from
     the filename search; the two rarely match by accident but the field is
     the one that actually breaks the Agent tool if it goes dangling.
   - Run `python3 scripts/check-references.py`. It scans `CLAUDE.md`,
     `rules/*.md`, `agents/**/*.md`, `skills/*/SKILL.md`, and
     `settings.json` for exactly these two reference forms and reports
     anything pointing at a file path or `name:` value that already doesn't
     exist. Empty stdout means the fleet is currently self-consistent — it
     does not mean the file you're about to delete is unreferenced. Run it
     again after the deletion (step 4); that second run is the one that
     tells you whether you just created a dangling reference.
2. **Confirm.** For every hit from step 1, decide: does this reference need
   to be updated, or does it die with the file? Three places carry the
   overwhelming majority of references and get checked explicitly, even if
   grep came back empty (grep misses references phrased as prose without a
   path or `subagent_type` marker):
   - `settings.json` — hook entries under `hooks.*` reference `hooks/*.py`
     by literal command string. A retired hook's entry must be removed from
     every matcher block it appears in, not just the top-level list.
   - `rules/parallelism.md` — the model routing table and any worked
     examples that name a specific agent or skill by its identifier.
   - `CLAUDE.md` — the top-level pointers under "Agents" and "Rules"; a
     retired agent or skill mentioned there by name leaves a dangling
     pointer for the next session that reads it cold.
3. **Delete.** `rm` the file (and its directory, for a skill). This is a
   plain filesystem operation — see "Why this does not block" below for why
   that specific fact matters to this procedure's design.
4. **Verify.** Run `python3 scripts/check-references.py` again. Update
   whatever it reports, then run it a third time until stdout is empty.
   Empty stdout is the completion signal for this procedure — there is no
   other gate.

This procedure does not touch `.agent-notes/self-improve-phaseN-*` files or
the `phase-N: done` markers `skills/self-improve` writes to
`~/.claude/.self-improve-progress.md` (AD-10). Those are self-improve's own
run state, frozen so a partially-completed self-improve session can resume
correctly after compaction; a lifecycle retirement reads them only as input
to the monitoring section below, never renames or deletes them.

## Why this does not block

`check-references.py` is report-only and always exits `0`, including when
it finds dangling references. It is never wired into `settings.json` as a
hook, and no `PreToolUse`/`PostToolUse` hook wraps deletion — deliberately
(FD-8). The reason is mechanical, not a policy preference: retiring a file
is `rm`, a shell command, not a `Write` or `Edit` tool call. Claude Code's
`PostToolUse` hooks fire on tool calls; they have no hook point on a bare
shell command that removes a file. A hook that appeared to gate deletion
here would not actually see every deletion — it would see only the subset
of deletions that happened to route through a tool call the hook matches,
and silently miss any plain `rm`, `git rm`, or manual filesystem delete.
That's worse than no hook: a check that looks authoritative but has known
blind spots gives false assurance. Report-only, run-it-yourself is the
honest shape for a check that structurally cannot be made a gate.

## Model and API-surface monitoring (MANAGE 3.2)

Retiring a fleet file is one kind of drift. The other kind this document
is responsible for naming is content going stale in place — specifically,
model IDs, aliases, and pricing assumptions baked into agent frontmatter
and `rules/parallelism.md`'s routing table as Anthropic ships new models.
This lifecycle doc does not build a second mechanism to watch for that; one
already exists.

**Existing mechanism:** `skills/self-improve`'s Phase 1 roster includes
Agent B, scoped to "Model version and API surface changes"
(`skills/self-improve/references/phase1-research-agents.md:40`). Each
self-improve run, Agent B fetches `code.claude.com/docs/en/model-config`
and the current Anthropic model-migration guide and checks for new
aliases, effort levels, deprecated parameters, and tokenizer changes
against what the config currently assumes.

**Where the finding lands:** every Phase 1 agent, Agent B included, writes
its full output to `.agent-notes/self-improve-phase1-B.md` before returning
(`skills/self-improve/SKILL.md:44`). From there it is folded into the
Phase 3 dedup pass at `.agent-notes/self-improve-phase3.md` and surfaces in
the Phase 4 report at `~/.claude/code-review-tasks.md`. (The Agent B
section of `phase1-research-agents.md` itself doesn't restate this path —
the write-destination is defined once, in `SKILL.md`, for all four Phase 1
agents alike.) Agent B's own report line names the deliverable directly:
"recommended model routing table."

**The hazard, named plainly:** `rules/parallelism.md`'s model routing table
carries specific model IDs, aliases, and per-tier pricing commentary. That
content goes stale the moment Anthropic ships a model this repo hasn't
routed to yet — Agent B's job is to notice; updating the table from that
finding is a manual, judgment-driven edit, not something `scripts/
check-references.py` or any hook performs. This document intentionally
does not edit `rules/parallelism.md` — that edit belongs to whoever reviews
Agent B's next finding, informed by what changed, not to a retirement
procedure that has no basis for judging routing decisions.

Lifecycle wires to Agent B rather than duplicating it: no second research
agent, no second fetch of `model-config`, no second output file. The one
open gap is the same one `docs/fleet/monitoring.md` already names for
MEASURE 1.2 — self-improve runs are operator-triggered, not scheduled, so
"periodic" monitoring of model/API drift today means "whenever the
operator invokes it," not a calendar guarantee.
