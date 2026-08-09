# NIST asset refresh procedure

Agent C runs this each `/self-improve` execution, in addition to its
generic URL-registry duties in
[url-registry.md](url-registry.md). Written in the RMF governance
register (AD-4): self-contained, readable without
`docs/nist-ai-rmf/crosswalk.md` open, traceable to the NIST source on
its own terms.

## What Agent C checks

Fetch `https://airc.nist.gov/airmf-resources/airmf/` and
`https://airc.nist.gov/airmf-resources/playbook/audit-log/` (two of
the run's 3-fetch cap below). Read the current AI RMF edition string
and the most recent Playbook audit-log entry from the live site.
Compare both against the `edition` field stamped in the provenance
header of every asset under `docs/nist-ai-rmf/` (schema defined in
`docs/nist-ai-rmf/README.md`).

## The 180-day staleness threshold

**This asset class uses 180 days, not the registry's generic 90-day
decay** (`url-registry.md` §2). The reason is stated in NIST AI 100-1's
own front matter, "Update Schedule and Versions": Playbook comments are
"reviewed and integrated on a semi-annual basis." A 90-day window would
flag these assets stale twice as often as the publisher itself commits
to revising them. 180 days matches the source's cadence, not this
repo's default — do not "harmonize" it back to 90.

## The three drift conditions

Each condition names its detection and the severity of the
`code-review-tasks.md` entry it produces:

1. **Stale** — an asset's `last-verified` exceeds 180 days from today.
   Detection: date arithmetic against the provenance header. Produces
   a **Should-fix** task: re-verify against the live source and
   re-stamp `last-verified`.
2. **Edition moved** — the live edition string (e.g. a new `AI RMF
   1.1` or `2.0`) differs from an asset's stamped `edition`.
   Detection: string compare against the fetch above. Produces a
   **Must-fix** task: re-derive every crosswalk row the moved edition
   affects — content, not just the header, may now be wrong.
3. **Structural change** — GOVERN/MAP/MEASURE/MANAGE subcategories
   renumbered, added, or removed in the live Core (Tables 1–4, §5 of
   NIST AI 100-1). Detection: the completeness diff below. Produces a
   **Must-fix** task *and* a recommendation to run `/plan-mission` —
   a structural change invalidates the crosswalk's row structure
   itself, which is re-planning work, not a single edit.

## The completeness diff

Enumerate subcategories from the live AI RMF Core and compare against
the `subcategories-covered` union across all `docs/nist-ai-rmf/`
assets. Report any live subcategory with no matching row anywhere as a
gap. This is the mechanical form of SLI 2 and the reason AD-8 made a
crosswalk the central asset — completeness is a diff, not a judgment
call.

## The 3-fetch-per-run cap

Agent C fetches at most 3 NIST URLs per run (AD-5), reusing the eight
canonical rows already tracked in `research-urls.md`'s Agent C section
(added by C3) rather than discovering new ones. Reason: Phase 1 is a
synchronization barrier — every other Phase 1 agent waits on Agent C's
completion — so an unbounded NIST check makes Agent C the long pole for
the entire run. Prioritize the edition and Playbook audit-log checks
above; spend the third fetch on whichever `docs/nist-ai-rmf/` asset has
the oldest `last-verified` date.

## What this procedure does not do

It never reads the source PDFs (NIST AI 100-1, NIST AI 600-1) at
runtime — the live HTML pages above carry the edition string and
revision log needed for every check here. PDF content changes are out
of scope for an automated run; a human re-derives crosswalk content
from the PDF when the completeness diff or an edition move flags a
need to.

## Outputs

Every drift condition above writes an entry to `code-review-tasks.md`
with its stated severity, following the same task-file conventions as
the rest of `/self-improve` (`references/output-formats.md`). Agent C
does not edit `docs/nist-ai-rmf/` assets directly — flagging, not
fixing, per this skill's read-only-during-review rule in `SKILL.md`.
