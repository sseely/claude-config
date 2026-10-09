# Orchestrator findings — self-improve run 2026-10-08

Findings made by the orchestrator directly while dispatching, not by a
Phase 1/2 agent. Feed into Phase 3 dedup.

## Observation: model aliases changed mid-fleet; long-lived session pinned the old one
- **Context**: User saw Sonnet 5 at 46% of 7-day tokens alongside Sonnet 5.5.
- **Finding**: Transcripts split cleanly by binary version — 2.1.284 resolved
  `sonnet`→claude-sonnet-5 (27,538 msgs, one plantuml-ts session Sep 30–Oct 7);
  2.1.285+ resolved `sonnet`→claude-sonnet-5-5. `opus`→claude-opus-5-5 from
  2.1.280 (no 2.1.279 data). No config pinned sonnet-5.
- **Impact**: rules/model-routing.md fixed today (cac3209). Other files restating
  alias resolution drift silently — see next entry.
- **Confidence**: High (95) — transcript `version`/`message.model` fields.

## Observation: phase1 spec pre-seeds stale model resolution
- **Finding**: skills/self-improve/references/phase1-research-agents.md:75-85
  says installed v2.1.278, `opus`→Opus 5, `sonnet`→Sonnet 5. Both stale.
  Overridden in this run's Agent B prompt.
- **Fix**: replace the restatement with a pointer to rules/model-routing.md
  (single source of truth), keep only the alias-validity table.
- **Confidence**: High (95).

## Observation: Phase 1 spec has a write conflict on research-urls.md
- **Finding**: phase1-research-agents.md:19-24 tells Agent A to add Candidate
  URLs to research-urls.md; :292-297 tells Agent X (launched in parallel) to
  write the same section and promote/demote entries. Violates
  rules/parallelism.md file-ownership ("each file may only be written by one
  agent at a time"). This run: A/B/C report candidates in their notes; X is
  sole writer.
- **Fix**: make X (or Phase 6) the single writer; A/B/C emit a Candidate URLs
  section in their note files.
- **Confidence**: High (90).

## Observation: Agent E read-set exceeds the per-agent context budget
- **Finding**: phase2-audit-agents.md:49-52 has one agent read ALL skills +
  references: 764 KB (~190k tokens) incl. gitignored skills/synced (389 KB)
  and vendored skills/doc-*. rules/prompting-quality.md caps 20-30 files per
  agent and flags recall loss past ~128k tokens. This run: split E1/E2 and
  excluded synced + doc-*.
- **Fix**: spec E as two agents (workflow vs scaffolding) and exclude
  gitignored skill dirs; Agent I must read E1+E2.
- **Confidence**: High (90).

## Observation: Agent D file list stale
- **Finding**: phase2-audit-agents.md:14-26 omits 9 hook files
  (session-start.sh, guard-bash.py, check-complexity.py, check-frontmatter.py,
  nudge-search-tool.py, log-*.sh, _hooklib.*) and two .claude/settings.*.json.
  The highest-enforcement hooks are the ones not audited.
- **Fix**: replace the enumerated list with a glob (`hooks/*.{sh,py}` minus
  test_*).
- **Confidence**: High (90).

## Note: Phase 2 barrier is stricter than needed
- **Finding**: Only Agent G consumes Phase 1 output (Agent C's principles).
  D/E/F/H were launched at Phase 1 start this run with no dependency issue.
- **Fix**: gate only G on Agent C; launch D/E/F/H with Phase 1.
- **Confidence**: Medium (70) — one run of evidence.

## Observation: block HTML comments in rules are stripped before injection
- **Context**: Agent H reported model-routing.md:15-18 (PerspectiveGap
  `<!-- Code review -->` comment) still on disk; the orchestrator's brief had
  said it was removed, based on the session-start reload of model-routing.md.
- **Finding**: The comment IS on disk (verified sed + git: unchanged since
  cac3209), but the instruction text injected into this session at session
  start omits it. Claude Code strips block HTML comments from rule files
  before loading them.
- **Impact**: `<!-- -->` comments in rules/ and CLAUDE.md cost ~0 resident
  tokens. Discount any Phase 2 token-savings estimate that counts them (Agent
  H's CLAUDE.md:47 and model-routing.md comment items). Staleness still
  matters for human readers. Unverified for post-compact-context.md, which a
  hook injects as raw text — assume comments there DO cost tokens.
- **Confidence**: High (85) — direct comparison of disk vs injected text,
  one file. Confirm against the memory docs in Phase 3.

## Observation: `paths:` scoping fires for user-level rules — "pilot RED" is stale
- **Context**: rules/diagrams.md has `paths: ["**/*.puml", "**/*.md"]`.
- **Finding**: diagrams.md was absent from this session's initial instruction
  load and was injected mid-session ("Contents of rules/diagrams.md") right
  after a tool call that read .md files. Path-scoped loading of
  ~/.claude/rules/ works on 2.1.292.
- **Impact**: rules/prompting-quality.md:36 says the pilot "came back RED and
  review enforces its absence" — contradicted by commit 771e555 (T16), which
  recorded the pilot GREEN on 2.1.278 with logs/instructions-loaded.jsonl
  evidence and made diagrams.md the charter's single AD-1 exception, and by
  observed behavior this session. The rule text is wrong, not the pilot. The 2026-08-01 orchestrator estimate (~5.4k
  tokens/session from scoping 10 domain rules) is back on the table, ~7x
  Agent H's whole tightening axis (~750 tokens).
- **Fix**: update prompting-quality.md; re-pilot on 2-3 domain rules
  (api-design, observability, retry-idempotency) with globs keyed to source
  files; measure.
- **Confidence**: High (80) — observed in this session; glob choice for
  rules that apply to "any code" is the open design question.

## Observation: promotion rule contradicts itself across two references
- **Finding**: phase1-research-agents.md:332 "Never delete a candidate";
  url-registry.md §1 says on promotion "move the row ... and remove it from
  Candidate URLs". Agent X followed the former (promoted rows stay in the
  candidate table with a PROMOTED note), so 18 URLs now appear twice.
- **Fix**: pick one — recommend url-registry.md's move semantics with a
  `Promoted:` note left only in git history, or define "never delete" as
  "never delete unpromoted candidates". Then dedupe research-urls.md.
- **Confidence**: High (90).

## Observation: discovery queries using `site:` return nothing
- **Finding**: Agent X reports `site:platform.claude.com` and
  `site:anthropic.com/research` queries ignore the operator (0 on-domain hits).
- **Fix**: rewrite those Discovery Queries to use WebSearch allowed_domains,
  or drop them.
- **Confidence**: Medium (70) — agent report, not orchestrator-verified.

## Verified against Tier-1 docs (orchestrator, 2026-10-08, curl of code.claude.com/docs/en/*.md)
- **PostCompact restore is a no-op — CONFIRMED (Agent D #1).** hooks.md:786:
  "For most events, Claude Code writes stdout to the debug log ... The exceptions
  are UserPromptSubmit, UserPromptExpansion, SessionStart, and PostModelSwitch".
  settings.json PostCompact = `cat ~/.claude/post-compact-context.md` (plain
  stdout). session-start.sh has no `source == compact` branch. So
  post-compact-context.md has never reached context after compaction, and
  CLAUDE.md "On Compaction" describes behavior that does not happen. Fix: move
  the cat to a SessionStart hook with matcher `compact`. Confidence 95.
- **HTML comments stripped — CONFIRMED.** memory.md:150: block-level HTML
  comments in CLAUDE.md files are stripped before injection. Observed for
  rules/ too. Confidence 90.
- **Haiku 5.5 — CONFIRMED.** model-config.md:46,64: Haiku 5.5 on the Anthropic
  API, needs v2.1.293+; :600 supports low..max effort; :609 defaults to medium.
  Note: this session runs 2.1.292, so `haiku` here still resolves to 4.5 until
  restart. Confidence 95.
- **Opus 5.5 ignores top-level effortLevel — CONFIRMED.** model-config.md:613,
  settings-reference.md:967. Also :609 — Opus 5.5 / Sonnet 5.5 / Haiku 5.5
  default to `medium`. Net: orchestrator AND every `sonnet` agent without an
  `effort:` field now runs at medium. Confidence 95.
