# URL registry maintenance

The five-step procedure `SKILL.md`'s Phase 6 runs against
`~/.claude/skills/self-improve/research-urls.md`, split out to keep
`SKILL.md` under Anthropic's 500-line skill ceiling. The two-line
hand-off message to the user, and the `phase-6: done` marker append/
delete, stay inline in `SKILL.md` — this file covers only the registry
update.

This file (`research-urls.md`) is **operational metadata, not a config
file** — updating it during the run is correct behavior. That is
different from source files, which are read-only during review; do not
"fix" this file's mid-run edits as if they violated that rule.

## 1. Promotion and re-verification

For every URL (active or candidate) that was fetched this run and
passed the thin-content bar:

- **Thin-content bar:** response ≥ 1000 chars for Agent A context,
  ≥ 500 chars for Agent B/C context, excluding a redirect stub, login
  wall, or paywall teaser.
- If the URL is already in an active section: set `last-verified` to
  today and confirm `status: active`.
- If the URL was in the **Candidate URLs** section: move the row to
  the appropriate active section (Agent A, B, or C) and remove it from
  Candidate URLs.

**A 200 status alone does not qualify for promotion.** The response
must also clear the thin-content bar above.

## 2. Staleness decay

For every `status: active` entry whose `last-verified` date is older
than **90 days** from today, change `status` to `unknown`.

- Do **not** remove the entry.
- An `unknown` URL is re-verified before it is used as a source on a
  future run.

This is the generic decay threshold that applies to every entry in
this registry.

## 3. Unreachable handling

For every URL the fetch guard flagged as unreachable or thin:

- Set `status` to `unreachable`.
- Do **not** delete the entry.
- Let the task file (`code-review-tasks.md`) carry the replacement
  recommendation — the registry entry itself just records the status.

## 4. Candidate handling

If Agent A or Agent B discovered new documentation pages worth
tracking, they will have already added entries to the **Candidate
URLs** section.

- Confirm those entries are present.
- Do **not** promote unfetched candidates this run — a candidate has
  not yet been fetched and verified against the thin-content bar, so
  it cannot satisfy step 1's promotion rule until a future run fetches
  it.

## 5. `Last full verification:` header

Update the `Last full verification:` line at the top of the file to
today's date **only if every entry was actually checked** this run.

If Agent A ran partial (blocked at the Phase 1 barrier), note
"Partial verification — Agent A incomplete." instead of advancing the
date — a partial run must not be recorded as a full one.

## After this procedure

`SKILL.md` appends `phase-6: done` to
`~/.claude/.self-improve-progress.md`, then deletes that progress file
(the run is complete and a fresh run starts from Phase 0), and hands
off to the user with the task-file and registry-location summary.
