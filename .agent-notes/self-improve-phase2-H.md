# Phase 2 Agent H — Tightening Audit (2026-10-08)

Not re-derived (already in code-review-tasks.md): F067 CLAUDE.md/post-compact pointer replacement (done), F009 dual thresholds, F164 F/H merge, F198 lsp.md subagent note.

## Measurements (wc)
| File | Lines | Bytes | ~tokens (B/4) | Bar | Verdict |
|---|---|---|---|---|---|
| CLAUDE.md | 79 | 3716 | 930 | <200 | OK |
| post-compact-context.md | 47 | 2579 | 645 | <=120 | OK (but sections over 6 lines, see below) |
| rules/ (26 files) | 1398 | 61382 | ~15,350 | aggregate cap 2020 lines | OK; largest: prompting-quality 117/5256B, model-routing 93/4640B, parallelism 90/4592B, code-principles 99/4324B |
| any rule >200 lines | none | | | | OK |
| agents sampled (5) | 22-115 | | | >300 | OK |
| skills: plan-mission 401, code-review 330, self-improve 119 | | | | 500 ceiling | OK; plan-mission at 80% |
Resident per session = CLAUDE.md + rules = ~16,300 tokens.

## Bloat
- None over limit. Note: plan-mission/SKILL.md 401 lines (was 389 on 2026-09-02) — growing 12 lines/5 weeks; watch. Severity Note, conf 60.

## Redundancy
1. **Warning** CLAUDE.md:25-31, 33-35, 58-60, 62-64, 66-68 vs rules/ — five CLAUDE.md sections are pure pointers into rules that auto-load (rules/ loads "automatically" per CLAUDE.md:27). Line 35 (45 words) restates diagnosis.md's definition; line 68 restates commits.md:3-9 subject spec; line 60 and 64 are headers+one pointer each. Fix: delete "Multi-Agent Parallelism" (58-60) and "Session Notes" (62-64; memory.md auto-loads) sections entirely; cut "Rules" (25-31) to one sentence; cut line 35 to "On an observed discrepancy, enter diagnosis mode before any fix (rules/diagnosis.md)." and line 68 to "Conventional Commits, <=80 cols (rules/commits.md)." Saves ~190 tokens/session. Conf 70. (Counter: "Check .agent-notes before any task" is a behavior trigger worth keeping — keep as one line.)
2. **Suggestion** CLAUDE.md:17-23 vs rules/research-sources.md:5-11 — confidence-level definitions stated twice (HIGH/MEDIUM/LOW/UNKNOWN) at near-equal verbosity (~85 words each; research-sources adds a "backing" column). Single source: research-sources.md (has the tier mapping). Fix: CLAUDE.md:17-23 -> "Declare HIGH/MEDIUM/LOW/UNKNOWN when accuracy matters; definitions in rules/research-sources.md." Saves ~75 tokens. Conf 75.
3. **Suggestion** post-compact-context.md:25-27 vs rules/commits.md:3-5 vs CLAUDE.md:68 — no-attribution rule stated in commit rules and post-compact (~45 words, `🤖` emoji line included). Single source commits.md. Fix: post-compact line 25-27 -> "No attribution lines (rules/commits.md)." Saves ~40 tokens per compaction. Conf 65.
4. **Suggestion** post-compact-context.md:36-37 vs rules/model-routing.md "Opus behavioral compensation" — Opus restraint bullets duplicated verbatim in spirit. It is injected for all models, including non-Opus sessions (Fable is told the opposite in model-routing). Fix: delete 36-37 (or limit to "Scope discipline: simplest interpretation"). ~35 tokens/compaction. Conf 55.
5. **Suggestion** rules/lsp.md:15-16 ("Subagent scope" callout) vs :34-43 ("Subagent note") — same fact twice; callout is a forward pointer to the section below it in the same 43-line file. Fix: delete the callout (2 lines, ~35 tokens). Conf 70.
6. **Note** rules/extended-thinking.md:16-22 ("Thinking depth") restates model-routing.md's effort note (model-routing.md:29-32) and says "See model-routing.md". Fix: keep a single sentence; delete the first two clauses. ~30 tokens. Conf 50.

## Verbose prose (>50% compression, <40 words)
1. rules/prompting-quality.md:25-39 ("Instruction bloat", ~170 words) -> 
   "Keep CLAUDE.md under 200 lines. The larger cost is the aggregate rules/ footprint (injected verbatim each session): mitigate by cross-file dedup and moving lookup depth to docs/reference/ — not paths: scoping (pilot RED). Cap: docs/fleet/charter.md, enforced in hooks/quality-gate.sh." (~45 words; trim "Anthropic's guidance..." URL). Saves ~160 tokens. Conf 70. Note: slightly over 40 words but 74% compression; nuance preserved.
2. rules/prompting-quality.md:111-117 ("Session work-type boundaries", ~55 words) -> "Start a new session when switching between unrelated task types (bug fix, feature design, refactor, docs); finish one logical unit before starting another." (24 words, -56%). Saves ~40 tokens. Conf 70.
3. rules/prompting-quality.md:94-100 (brevity preamble, ~45 words incl. "operational heuristic, not a finding") -> "Preprint arxiv:2604.00025 (open models only): brevity constraints gave up to 26pp on math/science. For Opus-tier agents this is a heuristic." (~22 words). Saves ~35 tokens. Conf 60.
4. rules/extended-thinking.md:3-8 (intro, ~55 words) -> "Use extended thinking when decision quality outweighs latency: architecture trade-offs, ambiguous bugs, mission planning, threat modeling, multi-cause performance analysis. Skip for routine or obvious-cause work." (28 words, -49%, borderline). Saves ~40 tokens. Conf 45.
5. CLAUDE.md:70-79 ("On Compaction", ~75 words) -> "CLAUDE.md reloads from disk after compaction. A PostCompact hook injects post-compact-context.md (condensed rules/ content)." (17 words, -77%). Also removes the section-count claim that is stale (see Dead #3). Saves ~85 tokens/session. Conf 80.
6. post-compact-context.md:1-5 header (intro 2 sentences + `---`) -> "# Post-Compaction Context" only; the hook's purpose is known to the reader of CLAUDE.md. Saves ~25 tokens/compaction. Conf 55.

## Dead / stale content
1. **Warning** rules/model-routing.md:36-37 "**Sonnet 5**" / "**Opus 5**" cost-quality claims, :17 "Opus 5 untested", :30 "Sonnet 5 (400)" — aliases now resolve to 5.5 (:12-13,24-25); claims about "Opus 5" as the current opus are stale or at least unverified for 5.5. Fix: relabel to "Sonnet 5.x/Opus 5.x" only if the data carries over, else mark as "measured on 5.0". Conf 80. Also :24-27 (Version gate) keeps the full history `Opus 5 on v2.1.219–2.1.278` — compress to "opus -> 5.5 on v2.1.280+, sonnet -> 5.5 on v2.1.285+; restart long sessions after upgrading." Saves ~35 tokens. Conf 65.
2. **Warning** rules/model-routing.md:15-18 — the `<!-- Code review (2026-08-01): PerspectiveGap ... -->` comment is STILL PRESENT on disk (read this run), contrary to the brief that it was removed today. It is also stale ("Opus 5 untested"; opus is now 5.5). HTML comments are injected verbatim. Fix: delete lines 15-18 (move to code-review-tasks.md if the revisit matters). Saves ~60 tokens. Conf 90 (verify uncommitted-vs-disk state before acting).
3. **Warning** CLAUDE.md:76-79 — says post-compact "restores 5 sections"; post-compact-context.md has 6 (adds Write-Set Discipline at :45-47). Fix: drop the count/list (see Verbose #5). Conf 95.
4. **Suggestion** CLAUDE.md:47 — open `<!-- Code review (2026-09-02): /claude-api cost-optimize ... -->` comment, 5+ weeks old, resident every session. Fix: delete; record in .agent-notes or code-review-tasks.md. Saves ~40 tokens. Conf 85.
5. **Suggestion** post-compact-context.md:19-21 — `<!-- Kept 2026-09-20 (T15): /context unavailable ... -->` decision-log comment injected on every compaction. Fix: move to .agent-notes/ or decision journal; delete. Saves ~55 tokens/compaction. Conf 85.
6. **Suggestion** rules/prompting-quality.md:15 "Claude 4.6+/Fable 5/Opus 4.8" and :59 "Sonnet 5 tokenizer ~1.3x of Sonnet 4.6" — pre-5.5 model names; tokenizer claim unverified for Sonnet 5.5 (current default). Fix: state "re-measure on 5.5" or drop the clause. Conf 55.
7. **Note** rules/prompting-quality.md:36 says `paths:` pilot RED and "review enforces its absence", yet rules/diagrams.md:1-5 carries `paths:` frontmatter. Contradiction; fix: either remove frontmatter from diagrams.md (and accept ~170 tokens resident) or amend prompting-quality.md:36 to name the exception. Not proposing path-scoping as footprint fix. Conf 75.

## post-compact calibration
Target <=4 lines/rule, flag >6. Total 47 lines, 6 sections.
- **Warning** :18-27 Commit Format = 10 lines (incl. 3-line HTML comment + 4-line attribution). Fix: "One commit per task; subject `feat(T3): add confirm endpoint`; Conventional Commits, <=72 chars (rules/commits.md). No attribution lines." = 3 lines. Saves ~110 tokens/compaction. Conf 80.
- **Warning** :29-37 Autonomous Restraint = 9 lines. Fix: keep the two-counter distinction (3x same location vs 2 gate-fix attempts) in 4 lines; drop the Opus restraint pair (see Redundancy #4). Saves ~55 tokens. Conf 70.
- **Suggestion** :39-43 Batch Close-Out = 5 lines but overlaps Autonomous Restraint's "two counters" content and diagnosis.md "Under autonomous execution". Fix: merge into the Restraint section as 2 lines: "Between batches run quality gates; after 2 failed fixes on one gate stop editing, keep investigating, then STOP with the full diagnosis artifact (rules/diagnosis.md)." Saves ~40 tokens. Conf 65.
- **Suggestion** :13-16 Model Routing restates model-routing.md table at lower fidelity (no aliases/effort); keep (4 lines, genuinely needed post-compaction) but note it will drift when aliases change. Conf 40.
- **Note** 5 `---` separators (:5,12,17,28,38,44) cost ~10 tokens; harmless. Dropped.
- Autonomous Recovery (:6-11, 6 lines) and Write-Set Discipline (3 lines) are well-calibrated; no change.
- Resulting file: ~47 -> ~27 lines, ~645 -> ~380 tokens (saves ~265 per compaction event).

## Total
Estimated resident tokens saved per session if all fixes land: ~750 (CLAUDE.md ~420, rules/ ~330), plus ~265 per compaction event.
