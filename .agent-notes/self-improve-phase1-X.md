# Self-Improve Phase 1 — Agent X (Discovery) — 2026-09-02

## Discovery Summary

Ran all 84 discovery queries (via 5 parallel read-only forks covering the 13
themes) against `research-sources.md` tier criteria. ~530 distinct search
results evaluated across the forks; ~46 pages fetched to score
relevance/novelty/actionability. 25 candidates added, spanning: Claude
Code/Anthropic official docs (4: Opus 5 prompting guide, multiagent failure
modes, Claude Code expertise study, `whats-new` digest), context
compaction theory (3 arxiv), constraint expression/instruction-following (4:
AGENTIF benchmark, compact constraint encoding, prompting inversion, prompt
defect taxonomy), reliability/error-recovery (3: Snorkel error-recovery
study, LLM-judge stability trap, proactive-assistant design), testing/code
review (5: test-after-fault-injection risk, agentic PBT at scale, mutation
testing practitioner guide, legacy-refactor case study, agentic review
lifecycle), and tool-offloading (4: idempotent tool calls, agentic fitness
functions, ast-grep Claude Code skill, task-aware MCP server selection),
plus cross-language refactoring eval. Themes returning nothing useful: pure
multi-agent-orchestration queries (fully saturated — every qualifying hit
duplicated an existing candidate or fell below tier-3), MCP-catalog queries
(only tier-5 awesome-lists, already represented), and "co-pilot programming
patterns effectiveness" (near-100% tier-5 vendor content).

## Candidates added

25 rows appended to the Candidate URLs table (all `Agent X`, `2026-09-02`).
Full purposes are in the file; summary by relevance:

| URL | rel | Theme |
|---|---|---|
| platform.claude.com/.../prompting-claude-opus-5 | 95 | Claude Code/Anthropic |
| anthropic.com/research/multiagent-systems | 90 | Claude Code/Anthropic |
| arxiv.org/abs/2608.01326 | 90 | Compaction |
| anthropic.com/research/claude-code-expertise | 88 | Claude Code/Anthropic |
| arxiv.org/abs/2607.05139 | 88 | Testing |
| arxiv.org/abs/2606.11213 | 85 | Compaction |
| arxiv.org/abs/2505.16944 (AGENTIF) | 85 | Constraints |
| arxiv.org/abs/2608.02645 | 85 | Tool-offloading |
| code.claude.com/docs/en/whats-new | 85 | Claude Code/Anthropic |
| arxiv.org/abs/2605.17304 | 84 | Compaction |
| arxiv.org/abs/2510.22251 | 83 | Prompt structure |
| arxiv.org/pdf/2604.07192 | 80 | Constraints |
| arxiv.org/abs/2601.13118 | 80 | Prompt structure |
| infoq.com/.../agentic-fitness-functions | 80 | Tool-offloading |
| arxiv.org/html/2509.14404v1 | 79 | Prompt structure |
| snorkel.ai/blog/.../recover | 78 | Reliability |
| arxiv.org/abs/2604.03135 | 76 | Testing |
| github.com/ast-grep/agent-skill | 76 | Tool-offloading |
| arxiv.org/pdf/2601.11783 | 74 | Reliability |
| arxiv.org/abs/2605.17548 | 74 | Testing |
| arxiv.org/pdf/2604.17234 | 73 | Tool-offloading |
| testdouble.com/.../mutation-testing | 72 | Testing |
| arxiv.org/abs/2410.04596 | 70 | Human-AI collaboration |
| arxiv.org/pdf/2510.09907 | 70 | Testing |
| arxiv.org/abs/2511.21788 | 68 | Testing |

## Queue drain

Selected top 5 by relevance, weighted toward official Anthropic pages and
peer-reviewed entries per instruction (skipped three same-tier arxiv
preprints in favor of lower-scored ACM/Anthropic rows):

| URL | Fetched chars | Verdict | Reason | Destination |
|---|---|---|---|---|
| anthropic.com/engineering/effective-context-engineering-for-ai-agents (rel 97) | ~12,500 | Promote | Rich, on-topic (context rot, altitude, JIT retrieval, compaction/note-taking/subagents) | Agent A — Claude Code ecosystem |
| anthropic.com/research/trustworthy-agents (rel 85) | ~7,800 | Promote | Rich; 5 trustworthy-agent principles, Plan Mode, prompt-injection defenses | Agent A — Claude Code ecosystem |
| dl.acm.org/doi/10.1145/3786304.3787891 — Offscript (rel 88) | 0 | Demote | HTTP 403 Forbidden (paywall) | left in candidate table, demoted note appended |
| dl.acm.org/doi/10.1145/3748302 — ACM TOIS memory survey (rel 84) | 0 | Demote | HTTP 403 Forbidden (paywall) | left in candidate table, demoted note appended |
| dl.acm.org/doi/10.1145/3728894 — ACM PACMSE hallucinations (rel 84) | 0 | Demote | HTTP 403 Forbidden (paywall) | left in candidate table, demoted note appended |

Note: `arxiv.org/pdf/2607.25398` (rel 92, HANDBOOK.md) and `arxiv.org/abs/2606.10209`
(rel 88, Less Context Better Agents) were passed over for the drain in favor
of the Anthropic/peer-reviewed weighting instruction, despite higher raw
relevance scores. All three ACM dl.acm.org DOIs hit the same paywall
failure mode this run — future drains should prefer an arxiv/author-preprint
mirror when one exists rather than the canonical ACM DOI (as Fork 3 did
successfully for arxiv:2410.04596/CHI 2025).

## Fetch-guard warnings

- `resources.anthropic.com/hubfs/2026 Agentic Coding Trends Report.pdf` (Fork 1) —
  fetched at 834.5KB but WebFetch could not extract readable text from the
  PDF binary; content unverified, not added.
- `dl.acm.org/doi/10.1145/3786304.3787891`, `.../10.1145/3748302`,
  `.../10.1145/3728894` (queue drain, this agent) — all HTTP 403 Forbidden
  (ACM paywall); demoted with reason recorded in the candidate table.
- `dl.acm.org/doi/10.1145/3788284` (Fork 5, ACM Computing Surveys,
  "Function Calling in LLMs: Industrial Practices") — HTTP 403, tier-2 and
  topically strong but unverifiable; not added.
- `arxiv.org/pdf/2502.04498` (Fork 4, "Verifiable Format Control for LLM
  Generations") — returned unparseable PDF binary via WebFetch; excluded
  rather than added on a thin/unverified basis.
- `dl.acm.org/doi/10.1145/3706598.3714002` (Fork 3, canonical ACM CHI page) —
  HTTP 403; substituted the author's arxiv preprint (2410.04596), which
  fetched cleanly and was added instead.
- `simonwillison.net/2026/Feb/23/agentic-engineering-patterns/` (Fork 1) —
  Tier 3 but only a ~2,800-char stub previewing unwritten future chapters;
  demoted on inspection, not added.
