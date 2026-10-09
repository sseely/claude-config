# Self-improve Phase 1 — Agent C (2026-10-08)

Scope: prompt-structure / instruction-design research + NIST AI RMF refresh.
Balance: prompt-structure ran fuller (~14 fetches/searches); NIST ran at the cap
(3 fetches) and is thin by design. No GitHub clones made (no repo with a
substantially different structure surfaced; provenance gate not triggered).
All arxiv items are PREPRINTS (Tier 4, LOW ceiling unless corroborated by Tier 1).
Dedup: grepped code-review-tasks.md. F143 (2026-09-20) already spot-checked the 5
cited papers; F069/F140 already fixed constraint-budget overruns. Not re-derived.

---

## Findings

### C1. Anthropic Tier-1: Opus 5 guide says remove explicit verification / re-check instructions
- **Finding**: Opus 5 self-verifies; prompts such as "include a final verification step" or "double-check your answer" cause over-verification (wasted tokens, no quality gain). Also: "only report high-severity / be conservative" review prompts are followed literally and under-report (ask for everything, filter in a second pass). Also: prompts asking the model to write out its reasoning verbatim may trigger `reasoning_extraction` refusals; ask for a short explanation instead.
- **Source**: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5 (Tier 1, fetched this run, 200/rich)
- **Evidence strength**: High (vendor behavioral documentation for the exact model)
- **Applies to Claude**: High — Opus 5 / 5.5 is the configured `opus` alias.
- **Config alignment**: Mostly Aligned (`rules/model-routing.md:45-47` scope-discipline bullets match the guide's scope advice). Partial Misaligned:
  - `rules/extended-thinking.md:25-30` Self-refine section instructs "critically evaluate ... then refine", 2-3 passes. Guide says re-check instructions compound with the model's own behavior on Opus 5. Change: scope the self-refine paragraph to Sonnet/Haiku-tier or non-self-verifying contexts; say "do not add explicit re-check passes on Opus 5+; use effort instead".
  - `skills/doc-docx/SKILL.md:147` "Final verification: comprehensive check" (imported third-party skill; likely benign, low priority).
  - Review-agent prompts: `skills/code-review/SKILL.md` Step 4 confidence scoring is a separate filter pass (that is the guide's recommended pattern) — Aligned. Spot-check agents/ for "only report high-severity" phrasing found none via grep.
- Note: docs fetch cannot detect same-day staleness (research-urls.md caveat); page names Opus 5 and 5.5 consistently with the best-practices page lineup, so treated current.

### C2. Anthropic Tier-1: dial back emphatic language; prefer positive framing and stated rationale
- **Finding**: Claude 4.5+/4.6+ models are more system-prompt-responsive; "CRITICAL: You MUST..." overtriggers. Use normal phrasing. Also: tell Claude what to do instead of what not to do; explain why; put queries at the end of long-context prompts (up to ~30% better in Anthropic tests); remove legacy anti-laziness prompting.
- **Source**: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices (Tier 1; large page, key lines verified via grep of saved output)
- **Evidence strength**: High (vendor docs); the 30% figure is Anthropic's own internal test, uncited externally.
- **Applies to Claude**: High.
- **Config alignment**:
  - Aligned: `rules/prompting-quality.md:14-18` already says prefer scoping keywords over `CRITICAL`/`MUST` on 4.6+/Fable 5/Opus 4.8. Zero CRITICAL/MUST/NEVER hits across agents/*/*.md and ~0 in rules/ outside that note — good.
  - Misaligned (imported skills): `skills/doc-pptx/SKILL.md:53,155,179,218,307,319` (6x **CRITICAL**), `skills/webapp-testing/SKILL.md:67`, `skills/doc-docx/SKILL.md` (heavy capitalised emphasis). Change: reword to plain imperatives with the reason; low blast radius (third-party-derived skills).
  - Misaligned (minor): `rules/prompting-quality.md:10-12` still lists "Prohibitions: do not, avoid, never" as constraint keywords and "Weak/Strong" example uses a negative ("do not change the session logic"). Guide prefers positive framing with rationale. Change: add one line "pair each prohibition with the positive alternative and the reason". Also `rules/model-routing.md:45-47` "Do NOT ..." x3 could be restated positively ("implement the simplest interpretation"), but Opus 5 guide itself uses negative scoping text, so treat as optional.
  - Not applied: no explicit placement guidance for long prompts (queries/instructions last). `CLAUDE.md` is loaded as system context so low relevance.

### C3. MOSAIC (arxiv:2601.18554) — tiers ARE in the paper body (qualitative); config caveat is slightly too harsh, but model coverage is stale
- **Finding**: Section 4.3 / Fig 3 describes ~1-6 constraints as most dependable, ~7-15 as "less predictable", >15 as a distinct compliance drop (strongest for reasoning models). Authors attribute the 7-15 variability to constraint type/interaction rather than count. Primacy effect for Llama/Qwen/DeepSeek; **recency effect for Claude 3.7 Sonnet, Gemini, Mixtral**. Tested: Llama 3.3 70B, Llama 3.1 8B, DeepSeek-R1 8B, Qwen3 8B, Mixtral 8x7B, Gemini 2.5 Flash, Claude 3.7 Sonnet. Abstract says five LLMs; body lists seven (internal inconsistency).
- **Source**: https://arxiv.org/html/2601.18554v1 (Tier 4 preprint; fetched via summarizer, not verbatim — MEDIUM)
- **Evidence strength**: Medium-Low (preprint, small/old models, qualitative figure reading)
- **Applies to Claude**: Low-Medium — only Claude 3.7 Sonnet tested; two generations behind.
- **Config alignment**: Config is slightly conservative. `rules/prompting-quality.md:64-76` says tiers are "interpolated ... (LOW-MEDIUM traceability)"; the paper does use these three bands qualitatively. Change: reword to "qualitative bands read from MOSAIC Fig 3 (models <= Claude 3.7; authors attribute 7-15 variance to constraint interaction)". Also add the Claude-specific finding: constraints placed later were followed better (recency) — implies put hard constraints late in a section; config currently has no placement guidance. Keep the ≤6 budget (nothing contradicts it) but it remains a heuristic, not a measured threshold for Opus/Sonnet 5.

### C4. 2607.19257 "Prompt Design at Scale" — still holds; recall-cliff claim needs scoping
- **Finding**: Perfect-response rate hits 0 by N=80 rules for every model/format/placement; placement effect >= format effect at N=160 (direction model-dependent); no reliable markdown advantage; recall high to ~64-128k tokens then sharp drop; refusals rise near each model's context ceiling. Models include Claude Sonnet 5, Haiku, Gemini Flash, two Qwen sizes. Single author, one synthetic corpus ("Book of Veyra"), v1.
- **Source**: https://arxiv.org/abs/2607.19257 (Tier 4 preprint)
- **Evidence strength**: Low-Medium
- **Applies to Claude**: Medium — includes a Claude Sonnet 5 arm, but recall cliff is the 1M-context-model claim that Anthropic docs contradict in part (see C5).
- **Config alignment**: Aligned on rule-count restraint. Slight overreach at `rules/prompting-quality.md:61-62` ("Recall degrades sharply past ~128k tokens ... compact or split"): Anthropic's Opus 5 guide states "instruction following, tool calling, and reasoning stay consistent throughout the window" (1M). Tier 1 beats a single preprint -> Config should soften: "one preprint reports a 64-128k cliff on some models; Anthropic documents consistent behavior to 1M for Opus 5; split on evidence, not on a fixed 128k trigger". Supports the (correct) absence of format mandates: config never mandates markdown vs XML for rules, so Aligned. NOTE this paper does not validate the ≤6 threshold (lowest N tested = 10).

### C5. 2509.21361 "Maximum effective context window" — likely superseded for current Claude models
- **Finding**: Paper claims effective context far below advertised (~20K tokens in the discovery-candidate description). Tested older models. Anthropic's Opus 5 doc states consistent behavior across 1M; Anthropic's context-engineering post still advocates context rot mitigation (n^2 attention, just-in-time retrieval).
- **Source**: https://arxiv.org/pdf/2509.21361 (not re-fetched this run; judged from F143 + research-urls entry) ; Tier 1 contrast above.
- **Evidence strength**: Low (preprint, older models)
- **Applies to Claude**: Low-Medium for Opus 5/Fable.
- **Config alignment**: `rules/prompting-quality.md:52-60` cites it at MEDIUM already. Config is reasonable (the 20-30 file cap is a cost/focus heuristic and Anthropic's engineering post supports it independently). Change (optional): attach the Anthropic engineering post (https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents, Tier 3) as the primary citation and demote the preprint to supporting.

### C6. 2604.00025 (brevity) — still unreplicated; Anthropic Tier-1 independently confirms the operational advice
- **Finding**: Paper itself: open models only, math/science. Anthropic's Opus 5 guide independently says Opus 5 default replies run longer, effort does NOT shorten visible output, and "prompt for length explicitly" (with a short reminder near the end of a long prompt). Also recommends length calibration for written deliverables and explicit guidance on progress-narration cadence (lead with outcome).
- **Source**: Opus 5 guide above (Tier 1); arxiv 2604.00025 (Tier 4, not re-fetched; F143 verified HIGH previously)
- **Evidence strength**: High for the operational advice (Tier 1), Low for the paper
- **Applies to Claude**: High
- **Config alignment**: Aligned in text: `rules/prompting-quality.md:94-107` mandates the "no preamble, no trailing summary" line for Opus agent prompts. Coverage gap: of 6 `model: opus` agents, only `agents/03-infrastructure/cloud-architect.md` lacks any brevity/structured-result phrase (grep); of 132 agent files overall ~80 lack it (mostly sonnet — rule only requires Opus). Change: add the one-line brevity sentence to cloud-architect.md; and re-cite the Opus 5 guide as the primary basis in prompting-quality.md:96 so the rule no longer rests on a math-benchmark preprint. Optional: add the guide's "lead with the outcome" progress-update snippet for agentic roles.

### C7. 2510.22251 "Prompting Inversion" — weak evidence; config usage is correct (heuristic only)
- **Finding**: "Sculpting" rule-prompts helped gpt-4o (+4) but hurt gpt-5 (-2.4) on GSM8K; authors' "guardrail-to-handcuff" explanation untested causally. Only OpenAI models, one benchmark, single-author independent preprint.
- **Source**: https://arxiv.org/abs/2510.22251 (Tier 4)
- **Evidence strength**: Low
- **Applies to Claude**: Low (no Claude tested, math only)
- **Config alignment**: Config is better — it does not cite this paper; its "scoping over intensity" rule rests on Anthropic Tier-1 docs (C2). Do NOT cite Prompting Inversion in rules. Candidate URL entry should be annotated "low relevance; superseded by Tier-1 C2".

### C8. AGENTIF (2505.16944) and MOSAIC agree: constraint count/instruction length degrade compliance; condition and tool constraints worst
- **Finding**: 707 instructions, avg 1,723 words, 11.9 constraints; best CSR 59.8%, ISR <30%; GPT-4o drops 87.0 (IFEval) -> 58.5; instructions >6,000 words -> ISR ~0; >30% of condition-constraint failures are wrong condition-checks; tool constraints (disallowed/omitted tools) weak. Models: GPT-4o, Claude 3.5 Sonnet, o1-mini, DeepSeek, etc.
- **Source**: https://arxiv.org/html/2505.16944v1 (Tier 4; published May 2025 — older than the 12-month window, used as corroboration of MOSAIC)
- **Evidence strength**: Medium (benchmark, multiple models, but pre-Claude-4 and no Opus/Sonnet 5)
- **Applies to Claude**: Medium
- **Config alignment**: Corroborates `prompting-quality.md:64-76` (two independent sources -> meets "two or more independent sources agree"). Implication not currently in config: conditional rules ("when X do Y, unless Z") are the failure-prone constraint class — rules like `parallelism.md` and `autonomous-execution.md` are heavily conditional. Change (suggestion): in the constraint-budget section, note that conditional constraints count ~double and prefer decision tables for them (config already uses tables in model-routing.md — Aligned there).

### C9. Config-file structure study (2605.10039): file size/position/architecture/contradiction showed no detectable effect; within-session decay did
- **Finding**: 1,650 Claude Code CLI sessions (16,050 observations), Sonnet 4.6 primary, Opus 4.6 check, Opus 4.7 descriptive. Four structural variables (size, position, split-vs-single file, adjacent contradictions): no effect after correction. Each additional generated function lowers odds of compliance ~5.6% (OR 0.944) — compliance decays within a session. Task is a single trivial annotation; two TypeScript repos; position/architecture nulls not Bayes-supported; the decay effect was post hoc.
- **Source**: https://arxiv.org/abs/2605.10039 (Tier 4; abstract page only)
- **Evidence strength**: Medium-Low (large n but trivial task, post-hoc main finding)
- **Applies to Claude**: High on subject (Claude Code CLI + CLAUDE.md), Low on generalizing to complex rules.
- **Config alignment**: Mixed / mildly challenging. (a) Config invests heavily in file-splitting and size caps (`prompting-quality.md:32-50` "under 200 lines", rule dedup). The study finds size/architecture did not change compliance for a trivial rule — it does NOT say bloat is harmless for complex rules or for token cost; cost justification (every rule injected every session) stands independently. (b) Within-session decay supports the config's existing "start a new session when switching work types" (`prompting-quality.md` Session work-type boundaries) and PostCompact re-injection hook — Aligned. (c) Suggest: do not claim in the rules that file-structure choices improve adherence; frame caps as cost/maintenance controls. Check wording of rules claiming adherence benefits (none found beyond the 200-line cost framing).

### C10. HANDBOOK.md (2607.25398): no model sustains long binding policy docs under strict grading
- **Finding**: 65 tasks, 824 programmatic criteria, handbooks of 20-124 pages. Strongest model 36.2% strict pass; most frontier <25%. Failure patterns: accepting a plausible unauthorized in-environment request over standing policy (prompt-injection-adjacent); running a required check then acting against its result; forgetting rule details over long horizons; reporting compliance that was not achieved. Models unnamed in abstract.
- **Source**: https://arxiv.org/abs/2607.25398 (Tier 4 preprint, abstract fetched; PDF is binary-compressed and unreadable via fetch)
- **Evidence strength**: Medium-Low (benchmark released, deterministic grading, but models/versions unknown)
- **Applies to Claude**: Medium
- **Config alignment**: Config is directionally better, not proven. Mechanisms already present: hook-enforced limits (`code-principles.md` complexity hook), `diagnosis.md` "Audit progress claims against tool results" (model-routing Fable section), `autonomous-execution.md` quality gates and decision journal. Gap: "reporting compliance that wasn't achieved" maps to `CLAUDE.md` "Verification" section, which is advisory text; deterministic checks (hooks) are the stronger lever — consistent with the Zenity hard-boundary candidate. No config change required; use as support for moving advisory rules to hooks where cheap.

### C11. ManyIH (2604.09443) — layered rule precedence is fragile; keep hierarchy shallow
- **Finding**: With up to 12 privilege tiers, frontier models ~40% accuracy (best Gemini 3.1 Pro 42.7%, GPT-5.4 39.5%, Opus 4.6 / Sonnet 4.6 also tested; exact scores not given in summary). Accuracy falls with more tiers (11/12 transitions); switching ordinal to scalar labels cost ~8% for GPT-5.4 and Opus 4.6. Standard 2-tier hierarchy is >99% for GPT-5.4.
- **Source**: https://arxiv.org/html/2604.09443v3 (Tier 4 preprint)
- **Evidence strength**: Medium (benchmark, 11 models incl. Claude 4.6)
- **Applies to Claude**: Medium (Claude 4.6 tested)
- **Config alignment**: Mostly Aligned by shallow design — user global CLAUDE.md > rules > project CLAUDE.md > agent prompt is ~3-4 layers, below the failure regime. Risk area: the config has many precedence statements ("this overrides parallelism.md" in model-routing.md Fable section; "per-model guidance overrides rules/parallelism.md"). Subagents start blank and are told to read named rules, which adds layers. Suggest: a periodic check that no two rule files assert override precedence over one another except via one documented chain; currently found only the Fable-over-parallelism override (`rules/model-routing.md`), acceptable.

### C12. Anthropic multiagent-systems research (Aug 2026): prescribed roles/hierarchies did not fix coordination; diversity and verification matter
- **Finding**: Older models (Sonnet 4.6, Opus 4.6) produced overlapping conflicting code; newer models avoided conflict mostly by not sharing work. Homogenized behavior: 18/30 agents chose the same branch name. Prescribed roles and CEO-style hierarchies made little difference; recommend deliberate diversity, accountability/verification, deference to humans when ambiguous.
- **Source**: https://www.anthropic.com/research/multiagent-systems (Tier 3 Anthropic research; high-quality practitioner/vendor study)
- **Evidence strength**: Medium (vendor study, simulated environments)
- **Applies to Claude**: High
- **Config alignment**: Config is better on the concrete failure the study shows: `rules/parallelism.md` file-ownership rule (one writer per file, collapse overlapping writes, separate worktrees) is a structural fix, not a role-prompt fix, matching the study's implication. Supporting secondary evidence (blogs, unverified): practitioner guidance to give each agent a write-set manifest; CooperBench (Jan 2026, 30% success drop with two agents, unverified secondary) and AgentRoom/claim-plane proposals. Gap: the study's "diversity" point suggests parallel review/audit agents given identical prompts converge — `/self-improve` and code-review fan-out agents use differentiated dims already (Aligned). Add nothing.

### C13. Anthropic harness post: JSON feature lists, progress file, startup sequence
- **Finding**: Initializer prompt creates init.sh, progress log, git baseline; coding sessions start by reading git log/progress/feature list, run a baseline e2e check, work one feature, commit + note. Feature list is JSON because models corrupt it less than Markdown; instruction "It is unacceptable to remove or edit tests."
- **Source**: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents (Tier 3 Anthropic Engineering)
- **Evidence strength**: Medium (single vendor engineering write-up)
- **Applies to Claude**: High
- **Config alignment**: Aligned — `rules/autonomous-execution.md` mission brief + startup/compaction sequence + decision-journal + `.agent-notes/` mirror this. Minor idea: mission-brief task status as JSON rather than Markdown checkboxes (reduces accidental edits of task text) — check `docs/reference/autonomous-execution.md` before changing; not verified here.

### C14. Instruction-count-agnostic note on self-refine citation (2303.17651)
- **Finding**: Self-Refine (NeurIPS 2023) is peer-reviewed (Tier 2) but tested GPT-3.5/4-era models; the "~20% improvement" is task-average. Opus 5 guide (C1) says extra self-check instructions are redundant on that model.
- **Source**: arxiv:2303.17651 not re-fetched (citation already verified in F143); Opus 5 guide (Tier 1).
- **Evidence strength**: Medium for older models; superseded for Opus 5 by Tier 1.
- **Applies to Claude**: Low for Opus 5+, Medium for Haiku/Sonnet tiers.
- **Config alignment**: Misaligned in scope only — `rules/extended-thinking.md:25-30` — see C1 change.

### Searched, nothing actionable
- 2026 arxiv search for system-prompt-specific/agent-prompt benchmarks that count constraints returned only MOSAIC, AdvancedIF (ACL 2026, system-level instructions), MCJudgeBench, LexInstructEval. No newer paper found that supersedes or contradicts the five cited papers on their own terms. AdvancedIF is the one benchmark worth a fetch next run (peer-reviewed ACL 2026 -> Tier 2 if confirmed).
- Anthropic research page (https://www.anthropic.com/research) as fetched shows only Sep-Oct 2026 posts; relevant: "Project Swap" (Sep 24, 2026, multi-agent market). Older posts hidden behind "See more"; April-August window could not be checked from the fetch. Treat as coverage gap.

---

## NIST Refresh Result

Fetches used: 3 of 3 (airmf page, audit-log, airc home). Asset provenance read from `docs/nist-ai-rmf/{README,crosswalk,trustworthiness}.md` headers (local, not NIST fetches).

| Check | Live value | Stamped value | Result |
|---|---|---|---|
| AI RMF edition string | "AI RMF 1.0" | "AI RMF 1.0 (January 2023)" (all 3 assets) | No edition move (condition 2 not triggered) |
| Playbook audit-log, newest entry | August 2023 (search tags / formatting / crosswalk docs / PDF) | n/a | No new revisions since the stamp |
| Staleness (180-day) | last-verified 2026-08-09 -> 60 days | threshold 180 | Not stale (condition 1 not triggered); becomes stale ~2027-02-05 |
| Structural change (Core subcategories) | not detectable by procedure (edition unchanged) | | Not triggered |

New signal (informational, not a drift condition): both the AIRMF page and airc.nist.gov home now state "AI RMF 1.0 is being revised / a revised version is in progress" and "The Playbook will be updated after the AI RMF 1.0 is revised"; no version number, date, or comment period given. WebSearch (secondary, vendor blogs) found no 1.1/2.0 announcement; NIST issued a critical-infrastructure profile concept note on Apr 7, 2026 and published NIST AI 700-2 ARIA pilot report (Nov 2025). `docs/nist-ai-rmf/README.md:14` says no new edition "has published yet" — still accurate.

Proposed `code-review-tasks.md` entries: none for the three drift conditions. Optional Consider-level task: add a "revision in progress" watch note to `docs/nist-ai-rmf/README.md` provenance and re-check the airmf page each run, because a published 1.1/2.0 would trigger the Must-fix path immediately (confidence: MEDIUM that the revision lands within 6 months; no date given by NIST).

Confidence: HIGH on edition/audit-log result (Tier 1, retrieved this run). WebFetch is summarizer-mediated, so exact page wording not verified verbatim. Audit-log "newest = Aug 2023" matches the prior run's assumption; no contradiction.

---

## Fetch Log

Guard: <500 chars or non-200 = Warning. Summarizer-returned answers are not raw byte counts; judged by content richness.

| URL | Result | Notes |
|---|---|---|
| https://airc.nist.gov/airmf-resources/airmf/ | OK (short but substantive; edition + revision note) | NIST fetch 1/3 |
| https://airc.nist.gov/airmf-resources/playbook/audit-log/ | OK | NIST fetch 2/3 |
| https://airc.nist.gov/ | OK | NIST fetch 3/3 (chosen over oldest-asset check: all assets share 2026-08-09) |
| https://www.anthropic.com/research | OK but THIN for window: only Sep-Oct 2026 visible, older posts behind "See more" | WARNING-lite (coverage gap, not <500 chars) |
| https://www.anthropic.com/research/multiagent-systems | OK | |
| https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | OK | |
| https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5 | OK, rich | |
| https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices | OK, 66 KB, lists Fable 5.1 / Opus 5.5 / Sonnet 5.5 lineup (current) | read via grep of saved output |
| https://arxiv.org/abs/2605.10039 | OK (abstract only) | |
| https://arxiv.org/html/2601.18554v1 | OK | |
| https://arxiv.org/abs/2510.22251 | OK (abstract) | |
| https://arxiv.org/abs/2607.19257 | OK (abstract-level) | |
| https://arxiv.org/pdf/2607.25398 | WARNING: PDF binary-compressed, body unreadable; fell back to abs page (OK) | |
| https://arxiv.org/abs/2505.16944 | OK but abstract-only; full numbers from html v1 | |
| https://arxiv.org/html/2505.16944v1 | OK, 110k chars, read first 100k | |
| https://arxiv.org/html/2604.09443v3 | OK | |
| WebSearch x6 (arxiv instruction-following 2026; CLAUDE.md adherence; Anthropic prompting best practices; multi-agent coding conflicts; prompt format; NIST revision) | OK | secondary sources flagged inline |

Not re-fetched this run: arxiv 2509.21361, 2604.00025, 2303.17651, 2601.18554 abstract (F143 covered).

---

## Candidate URLs (not written to research-urls.md per deviation)

Promotion candidates (passed content bar this run; Agent C section):
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5 — Tier 1; already in Candidates (Agent X 2026-09-02), PROMOTE to Agent C active.
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices — Tier 1 canonical prompting guide for all current models (new; also lists per-model guides for Sonnet 5 and Opus 4.8).
- https://www.anthropic.com/research/multiagent-systems — already candidate; PROMOTE (fetched OK).
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — already candidate (Agent C 2026-09-02); PROMOTE (fetched OK).
- https://arxiv.org/abs/2605.10039 — already candidate; fetched OK.
- https://arxiv.org/html/2604.09443v3 — already candidate; fetched OK.
- https://arxiv.org/abs/2607.25398 — abstract page OK (prefer over the PDF URL currently listed: https://arxiv.org/pdf/2607.25398 is unreadable via fetch; swap).

New candidates:
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5 — per-model guide for the default implementation model (linked from best-practices page); not fetched.
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8 — older-generation guide, low priority.
- https://aclanthology.org/2026.acl-long.820/ — AdvancedIF (ACL 2026, system-level/multi-turn instruction rubrics; Tier 2 if venue confirmed); not fetched.
- https://arxiv.org/abs/2606.15376 — CoAgent concurrency control for multi-agent coding (June 2026), only seen via blog; verify before relying.
- https://www.nist.gov/itl/ai-risk-management-framework — NIST ITL parent page; best place to catch an AI RMF revision announcement (Tier 1), add to NIST table (counts toward the 3-fetch cap).

Demote/annotate:
- https://arxiv.org/abs/2510.22251 (Prompting Inversion) — Low relevance to Claude; note "OpenAI-only, GSM8K-only".
- https://arxiv.org/pdf/2509.21361 — annotate "older models; Anthropic documents consistent 1M-context behavior for Opus 5".
