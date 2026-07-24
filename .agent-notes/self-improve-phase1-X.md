## Observation: Discovery run 2026-07-24

- Queries run: 84 (all queries across the 11 themes + tool-augmented
  subsections in research-urls.md Discovery Queries section).
- Results evaluated: ~84 WebSearch result sets (~700 individual links
  scanned); 27 candidate URLs fetched to verify thin-content bar and
  score relevance/tier.
- Candidates added: 26, across themes:
  - Claude Code / Anthropic official (5): building-effective-agents,
    writing-tools-for-agents, long-running-Claude, hooks-guide,
    steering-claude-code blog post.
  - Tier-3 practitioner (5): Martin Fowler/Thoughtworks (Jun 2026, agent
    reliability), JetBrains research (context management), Semgrep
    (Jul 2026, AI security harnesses), Zenity (hard boundaries vs
    guardrails), Partnership on AI (real-time failure detection).
  - Tier-4 arxiv preprints, AI/ML (16): coding-agent config file
    structure studies (2605.10039, 2601.20404, 2606.25257 — directly
    relevant to CLAUDE.md/AGENTS.md design), context compaction/
    governance decay (2606.22528), goal persistence (2605.23574),
    instruction hierarchy (2604.09443, 2510.18892), context engineering
    survey (2507.13334), prompt format optimization (2502.04295,
    2502.12197), constraint drift (2605.10481), agent failure/reliability
    (2509.25370, 2601.06112), tool-augmentation vs SAST (2606.11672,
    2508.14419), complexity metrics (2607.01903).
- Confidence: High — all 26 fetched directly and passed the thin-content
  bar (≥500 chars, no stub/login-wall/paywall) before being added.
- Themes with nothing new to add (saturated or no tier 1-3/4 hits above
  relevance 65 not already covered):
  - "Human-AI collaboration" — results were general/survey-level,
    redundant with tier-5 background already excluded by policy.
  - "Code quality and testing with LLMs" (general queries) — results
    largely overlapped with arxiv papers already in the candidate table
    from the prior run (2504.18985, 2511.21382, 2603.15911, etc.).
  - "Multi-agent orchestration patterns" — the MAST (NeurIPS 2025
    Multi-Agent System Failure Taxonomy) result was referenced
    repeatedly by secondary sources but no canonical arxiv/proceedings
    URL surfaced directly in search results; flagging as a gap for a
    future run to chase down by name.
- No writes made outside research-urls.md Candidate URLs table and this
  notes file. No active-section or Discovery Queries edits made.
