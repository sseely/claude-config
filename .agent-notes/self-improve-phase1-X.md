# self-improve phase 1 — Agent X (Discovery), 2026-10-08

## Discovery Summary
- Queries run: 84 of 84 (all themes in research-urls.md `## Discovery Queries`); ~750 results evaluated (~9/query).
- Candidates added: 10 (cap), all fetched 200 with abstract/article >=1000 chars, rel 78-92:
  instruction-following/constraints x4 (Harness-IF, Instruction Stacking, Symbolic Guardrails, Aging of Prompt Techniques),
  context/goal-drift x2 (ACON, Goal Drift), multi-agent x3 (OrchestraBench, constraint-evasive fabrication, Google Research scaling),
  human-AI/practitioner x1 (Fowler reduce-friction).
- Queue drain: 20 fetched -> 18 Promote, 2 Demote (arXiv PDF URLs returned unreadable binary), 0 expired (oldest candidate 2026-06-05, 125 days).
- Saturated/unproductive: site:platform.claude.com and site:anthropic.com/research queries ignore the site: operator (no domain hits); MCP-catalog, ctags, SBOM, OpenAPI/JSON-schema, gitleaks, complexity-tool, code-intelligence queries returned only vendor/skill-directory tier-5 pages (nothing addable).
- Qualified-but-capped (rel>=75, not added): arXiv 2605.23296 parallel compaction, 2601.00821 CogCanvas, 2510.11967 Context-Folding, 2608.10934 coding-agent architecture, 2606.19616 parallel duplicate-work (unverified), 2605.08717 failure-anchored recovery, 2606.14061 SeeRepo, 2609.04208 agent-code debt.
- Signal: arXiv-heavy; Tier 1-3 yield was thin (Google Research, Fowler). Aug-Sep 2026 preprints on instruction stacking and harness-level instruction following map directly onto rules/ bloat and constraint-budget guidance.

## Drained candidates (top 20 by relevance)
| # | URL | Outcome | Reason |
|---|-----|---------|--------|
| 1 | platform.claude.com/.../prompting-claude-opus-5 | Promote (Agent B) | full official guide, >10K chars |
| 2 | anthropic.com/research/multiagent-systems | Promote (Agent A) | ~38K chars |
| 3 | arxiv.org/abs/2608.01326 | Promote (Agent C) | abstract ~2.5K |
| 4 | anthropic.com/research/claude-code-expertise | Promote (Agent A) | ~28K chars |
| 5 | arxiv.org/abs/2607.05139 | Promote (Agent C) | abstract ~1.9K |
| 6 | arxiv.org/pdf/2607.25398 | Demote | PDF binary, no readable text via fetch |
| 7 | arxiv.org/abs/2606.10209 | Promote (Agent C) | abstract ~2K |
| 8 | arxiv.org/pdf/2603.24755 | Demote | PDF binary, no readable text via fetch |
| 9 | arxiv.org/html/2603.20432v1 | Promote (Agent C) | full paper ~65K |
| 10 | arxiv.org/abs/2606.11213 | Promote (Agent C) | abstract ~1.3K |
| 11 | arxiv.org/abs/2505.16944 | Promote (Agent C) | abstract + metadata |
| 12 | arxiv.org/abs/2608.02645 | Promote (Agent C) | abstract ~1K |
| 13 | code.claude.com/docs/en/whats-new | Promote (Agent A) | rich weekly digest, current to Week 37 |
| 14 | arxiv.org/abs/2605.17304 | Promote (Agent C) | abstract ~1.6K |
| 15 | arxiv.org/abs/2510.22251 | Promote (Agent C) | abstract ~1.5K |
| 16 | anthropic.com/engineering/effective-harnesses-for-long-running-agents | Promote (Agent A) | ~11K chars |
| 17 | code.claude.com/docs/en/hooks-guide | Promote (Agent A) | ~60K chars |
| 18 | claude.com/blog/steering-claude-code-... | Promote (Agent A) | ~17K chars |
| 19 | anthropic.com/research/building-effective-agents | Promote (Agent A) | ~25K chars (tooling section dated per publisher) |
| 20 | anthropic.com/engineering/writing-tools-for-agents | Promote (Agent A) | ~15K chars |

Notes: arXiv abs pages carry abstract only (Agent B/C-class bar 500 met). Opus 5 guide confirms: remove explicit verification/double-check instructions, constrain scope, cap subagents via CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH / MAX_CONCURRENT_SUBAGENTS.
