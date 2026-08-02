# Self-Improve Research URLs

Maintained by the self-improve skill. Agents A, B, and C pull their fetch
targets from the relevant section below. After each run, the skill updates
`last-verified` and `status` for each URL that was fetched.

Unreachable or thin URLs are added to `code-review-tasks.md` with a
replacement recommendation. Do not remove entries mid-run — set status to
`unreachable` and let the task file drive the update.

**Status values:** `active` | `unreachable` | `deprecated` | `unknown`

**Thin-content bar (applies to both active retention AND candidate promotion):**
- Agent A URLs: response ≥ 1000 chars, not a redirect stub / login wall / paywall teaser
- Agent B / C URLs: response ≥ 500 chars, same exclusions
A 200 status alone is not sufficient for either retention or promotion.

**Staleness threshold:** `active` entries with `last-verified` older than 90 days
decay to `unknown` on the next run. An `unknown` entry is re-verified before use;
it is not removed. This prevents the trusted set from silently accumulating sources
that were valid once and have since rotted.

Last full verification: 2026-08-01 (PARTIAL — Agent A fetched 9 of 13 Agent-A
URLs and deliberately skipped 4 as already-active: overview, mcp, tutorials,
worktrees; those retain last-verified 2026-07-24. Agent B fetched all 3,
Agent C 1, Agent X ran 76 of 84 discovery queries -> 34 candidates added.
The 2026-07-24 same-day staleness on models/overview did NOT reproduce —
the page correctly shows Opus 5 as current.).
CAVEAT: on 2026-07-24 the Agent-B models/overview + model-config pages returned
200/rich but STALE content — they did NOT reflect the same-day Claude Opus 5
launch (confirmed live via WebSearch). The fetch-guard cannot detect same-day
staleness; on model-launch days, cross-check the "current model" list against a
fresh WebSearch before trusting these pages.
2026-07-01 scoped delta run: re-verified changelog, model-config, models/overview,
and the new Fable 5 doc (all 200, rich); other Agent A doc pages NOT re-fetched.
Note: platform.claude.com/docs/en/docs/claude-code/* URLs verified 404 on 2026-06-09.
Claude Code docs now live at code.claude.com/docs/en/.
Note: platform.claude.com/docs/en/models/overview verified 404 on 2026-06-10.

---

## Agent A — Claude Code ecosystem

| URL                                                       | Purpose                                          | Last Verified | Status |
| --------------------------------------------------------- | ------------------------------------------------ | ------------- | ------ |
| https://code.claude.com/docs/en/changelog                 | PRIMARY: scan for new/changed/deprecated Claude Code features (last 90 days) | 2026-08-01    | active |
| https://www.anthropic.com/blog                            | SECONDARY/optional: occasional Claude Code launch posts; thin (press newsroom) — use only if the changelog misses a topic | 2026-06-20    | active |
| https://platform.claude.com/docs/en/docs/claude-code/overview   | Core feature overview                            | 2026-06-10    | unreachable |
| https://platform.claude.com/docs/en/docs/claude-code/hooks      | Hook events and configuration                    | 2026-06-10    | unreachable |
| https://platform.claude.com/docs/en/docs/claude-code/settings   | Settings reference                               | 2026-06-10    | unreachable |
| https://platform.claude.com/docs/en/docs/claude-code/memory     | Memory system docs                               | 2026-06-10    | unreachable |
| https://platform.claude.com/docs/en/docs/claude-code/mcp        | MCP integration docs                             | 2026-06-10    | unreachable |
| https://platform.claude.com/docs/en/docs/claude-code/sub-agents | Sub-agent docs                                   | 2026-06-10    | unreachable |
| https://code.claude.com/docs/en/overview                  | Core feature overview — replaces unreachable platform.claude.com URL | 2026-07-24 | active |
| https://code.claude.com/docs/en/hooks                     | Hook events and configuration — replaces unreachable platform.claude.com URL | 2026-08-01 | active |
| https://code.claude.com/docs/en/settings                  | Settings reference — replaces unreachable platform.claude.com URL | 2026-08-01 | active |
| https://code.claude.com/docs/en/memory                    | Memory system docs — replaces unreachable platform.claude.com URL | 2026-08-01 | active |
| https://code.claude.com/docs/en/mcp                       | MCP integration docs — replaces unreachable platform.claude.com URL | 2026-07-24 | active |
| https://code.claude.com/docs/en/sub-agents                | Sub-agent docs — replaces unreachable platform.claude.com URL | 2026-08-01 | active |
| https://code.claude.com/docs/en/tutorials                 | Common workflows / tutorials — replaces unreachable platform.claude.com URL | 2026-07-24 | active |
| https://code.claude.com/docs/en/skills                    | Skills config: context: fork, run-in-subagent, disable-model-invocation, frontmatter — PROMOTED 2026-07-24 (Agent A fetched 200/rich) | 2026-08-01 | active |
| https://code.claude.com/docs/en/agent-teams               | Agent teams: parallel teammates, independent context, SendMessage — PROMOTED 2026-07-24 | 2026-08-01 | active |
| https://code.claude.com/docs/en/agent-view                | Background agents: run/monitor many parallel sessions — PROMOTED 2026-07-24 | 2026-08-01 | active |
| https://code.claude.com/docs/en/routines                  | Routines: hosted scheduled/cron + GitHub-event-triggered runs — PROMOTED 2026-07-24 | 2026-08-01 | active |
| https://code.claude.com/docs/en/worktrees                 | Worktree isolation for subagents (isolation: worktree), base-branch selection — PROMOTED 2026-07-24 | 2026-07-24 | active |

---

## Agent B — Model version and API surface

| URL                                                             | Purpose                            | Last Verified | Status |
| --------------------------------------------------------------- | ---------------------------------- | ------------- | ------ |
| https://code.claude.com/docs/en/model-config                    | Model aliases and effort levels    | 2026-08-01    | active |
| https://platform.claude.com/docs/en/about-claude/models/overview | Current model IDs and deprecations — WARNING: served STALE (pre-Opus-5) content on 2026-07-24 despite 200/rich; cross-check against WebSearch on launch days | 2026-08-01    | active |
| https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5 | Fable 5 / Mythos 5 facts: retention, thinking, positioning | 2026-08-01 | active |

**Standing instruction:** if a model launch is suspected (announcement, user
mention, version bump elsewhere), cross-check the current-model list against
a fresh `WebSearch` — a 200/rich fetch from these docs pages can still be stale.

---

## Agent C — Prompt structure and instruction design

| URL                                | Purpose                                                                  | Last Verified | Status |
| ---------------------------------- | ------------------------------------------------------------------------ | ------------- | ------ |
| https://www.anthropic.com/research | Recent Anthropic papers on instruction-following and agent orchestration | 2026-08-01    | active |

---

## Candidate URLs (not yet promoted — promote to an active section after one fetch that passes the thin-content bar above; 200 status alone is not sufficient)

| URL                                                                                       | Purpose                                                                                    | Suggested by    | Date Added |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------- | ---------- |
| https://modelcontextprotocol.io/docs                                                      | MCP protocol spec and server SDK docs                                                      | human           | 2026-06-05 |
| https://github.com/punkpeye/awesome-mcp-servers                                           | Community catalog of MCP servers by category                                               | human           | 2026-06-05 |
| https://semgrep.dev/docs                                                                  | Semgrep rule-based static analysis — offloads security pattern matching from LLM           | human           | 2026-06-05 |
| https://ast-grep.github.io/guide/introduction.html                                        | ast-grep structural search beyond current lsp.md coverage                                  | human           | 2026-06-05 |
| https://stryker-mutator.io/docs                                                           | Mutation testing (JS/TS/Python) — tells LLM which tests are structurally weak              | human           | 2026-06-05 |
| https://hypothesis.readthedocs.io/en/latest                                               | Property-based testing for Python — offloads edge-case discovery                           | human           | 2026-06-05 |
| https://fast-check.dev                                                                    | Property-based testing for JS/TS — offloads edge-case discovery                            | human           | 2026-06-05 |
| https://platform.claude.com/docs/en/docs/claude-code/tutorials                                  | Claude Code tutorials — unreachable 2026-06-09; replaced by code.claude.com/docs/en/tutorials (promoted 2026-06-10) | human           | 2026-06-05 |
| https://platform.claude.com/docs/en/models/overview                                       | FAIL: 404 on 2026-06-10 — corrected URL candidate still unreachable; find replacement for model IDs at platform.claude.com or docs.anthropic.com | Agent A         | 2026-06-09 |
| https://code.claude.com/docs/en/changelog                                                 | PROMOTED 2026-06-21 to Agent A primary (passed thin-content bar) — see Agent A section      | Discovery agent | 2026-06-05 |
| https://github.com/anthropics/claude-code                                                 | Official Claude Code GitHub repo — issues, discussions, example configs                    | Discovery agent | 2026-06-05 |
| https://registry.modelcontextprotocol.io/                                                 | Official MCP Registry for server discovery by category                                     | Discovery agent | 2026-06-05 |
| https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/              | MCP 1-year anniversary: spec maturity, tool patterns, protocol evolution                   | Discovery agent | 2026-06-05 |
| https://smartscope.blog/en/generative-ai/claude/claude-code-best-practices-advanced-2026/ | Claude Code advanced best practices 2026: hooks, subagents, context management             | Discovery agent | 2026-06-05 |
| https://ofox.ai/blog/claude-code-hooks-subagents-skills-complete-guide-2026/              | Claude Code complete guide: hooks, subagents, skills configuration                         | Discovery agent | 2026-06-05 |
| https://beam.ai/agentic-insights/multi-agent-orchestration-patterns-production            | 6 multi-agent orchestration patterns for production systems                                | Discovery agent | 2026-06-05 |
| https://arxiv.org/abs/2512.12688                                                          | Theoretical foundations of prompt engineering — formal constraint specification (Dec 2025) | Discovery agent | 2026-06-05 |
| https://arxiv.org/abs/2509.17548                                                          | Prompts as software engineering artifacts — versioning, testing, maintenance               | Discovery agent | 2026-06-05 |
| https://arxiv.org/html/2501.15000v1                                                       | MDEval: evaluating and enhancing markdown awareness in LLMs — format effectiveness         | Discovery agent | 2026-06-05 |
| https://arxiv.org/html/2411.10541v1                                                       | Does prompt formatting impact LLM performance? Empirical study (Nov 2024)                  | Discovery agent | 2026-06-05 |
| https://arxiv.org/abs/2505.02133                                                          | Enhancing LLM code generation via multi-agent collaboration and runtime debugging          | Discovery agent | 2026-06-05 |
| https://arxiv.org/html/2508.00083v1                                                       | Survey: code generation with LLM-based agents — patterns and failure modes                 | Discovery agent | 2026-06-05 |
| https://arxiv.org/html/2601.00509                                                         | LLM-assisted secure code generation via RAG and multi-tool feedback                        | Discovery agent | 2026-06-05 |
| https://arxiv.org/pdf/2504.18985                                                          | Tracking LLM test generation maturity in industry — continuous evaluation                  | Discovery agent | 2026-06-05 |
| https://arxiv.org/html/2511.21382v1                                                       | LLMs for unit test generation: achievements, challenges, defect rates                      | Discovery agent | 2026-06-05 |
| https://arxiv.org/pdf/2604.03196                                                          | From claims to reality: code review agents in pull requests — empirical                    | Discovery agent | 2026-06-05 |
| https://arxiv.org/pdf/2509.21361                                                          | Maximum effective context window for real-world LLM applications (~20K tokens)             | Discovery agent | 2026-06-05 |
| https://arxiv.org/pdf/2604.08290                                                          | Tokalator: context engineering toolkit for AI coding assistants                            | Discovery agent | 2026-06-05 |
| https://arxiv.org/abs/2510.05748                                                          | Communication enables cooperation in LLM multi-agent systems                               | Discovery agent | 2026-06-05 |
| https://arxiv.org/pdf/2506.02943                                                          | Multi-agent LLMs for JUnit test generation — hallucination to consensus                    | Discovery agent | 2026-06-05 |
| https://arxiv.org/pdf/2603.15911                                                          | Human-AI synergy in agentic code review — collaboration patterns                           | Discovery agent | 2026-06-05 |
| https://www.anthropic.com/research/building-effective-agents                              | Anthropic: foundational agent design patterns — workflows vs autonomous agents, ACI design | Discovery agent | 2026-07-24 |
| https://www.anthropic.com/engineering/writing-tools-for-agents                            | Anthropic: designing/evaluating tools for agents — prototyping, eval-driven tool description quality | Discovery agent | 2026-07-24 |
| https://www.anthropic.com/research/long-running-Claude                                    | Anthropic: CLAUDE.md special-file handling for long-running autonomous science agents      | Discovery agent | 2026-07-24 |
| https://code.claude.com/docs/en/hooks-guide                                               | Official Claude Code hooks how-to guide (companion to /hooks reference)                    | Discovery agent | 2026-07-24 |
| https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more         | Anthropic blog: when to use CLAUDE.md vs rules vs skills vs hooks vs subagents              | Discovery agent | 2026-07-24 |
| https://martinfowler.com/articles/reliable-llm-bayer.html                                 | Martin Fowler/Thoughtworks (Jun 2026): context + harness engineering for production multi-agent reliability | Discovery agent | 2026-07-24 |
| https://blog.jetbrains.com/research/2025/12/efficient-context-management/                 | JetBrains research: observation masking beats LLM summarization for agent context management | Discovery agent | 2026-07-24 |
| https://semgrep.dev/blog/2026/comparing-open-source-ai-code-security-harnesses/            | Semgrep (Jul 2026): comparing LLM-led vs SAST-hybrid open-source AI security scanning approaches | Discovery agent | 2026-07-24 |
| https://zenity.io/blog/security/hard-boundaries-agentic-ai                                | Zenity: case for deterministic code-level "hard boundaries" over probabilistic guardrails in agentic AI | Discovery agent | 2026-07-24 |
| https://partnershiponai.org/wp-content/uploads/2025/09/agents-real-time-failure-detection.pdf | Partnership on AI (Sep 2025): framework for real-time AI agent failure detection           | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2605.10039                                                          | PREPRINT: factorial study of coding agent config file structure (CLAUDE.md/AGENTS.md) vs instruction adherence | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2601.20404                                                          | PREPRINT: AGENTS.md files cut agent runtime 28.6% and token use 16.6% without hurting task success | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2606.25257                                                          | PREPRINT: empirical study of how developers maintain/evolve agent context files (CLAUDE.md-style) | Discovery agent | 2026-07-24 |
| https://arxiv.org/html/2606.22528                                                         | PREPRINT: context compaction silently erases in-context safety constraints ("governance decay") | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2605.23574                                                          | PREPRINT: PushBench — agents complete plausible steps but fail to persist to verified completion | Discovery agent | 2026-07-24 |
| https://arxiv.org/html/2604.09443v3                                                       | PREPRINT: ManyIH — frontier models manage only ~40% accuracy resolving many-tier instruction hierarchies | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2507.13334                                                          | PREPRINT: survey systematizing context engineering (retrieval, processing, management) for LLMs | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2502.04295                                                          | PREPRINT: CFPO — joint content+format prompt optimization beats content-only optimization   | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2502.12197                                                          | PREPRINT: current techniques fall short of ensuring system prompt robustness under adversarial input | Discovery agent | 2026-07-24 |
| https://arxiv.org/html/2605.10481                                                         | PREPRINT: "constraint drift" in multi-agent systems — proposes signed, verifiable constraint state | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2510.18892                                                          | PREPRINT: 20-prompt framework testing instruction adherence across 256 LLMs, common failure modes | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2509.25370                                                          | PREPRINT: AgentDebug — root-cause isolation framework for cascading LLM agent failures      | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2601.06112                                                          | PREPRINT: ReliabilityBench — consistency/robustness/fault-tolerance benchmark; rate limiting most damaging fault | Discovery agent | 2026-07-24 |
| https://arxiv.org/html/2606.11672v1                                                       | PREPRINT: open-source LLM agents underperform Bandit SAST tool (recall <0.25, high false-positive) | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2508.14419                                                          | PREPRINT: iterative static-analysis feedback (Bandit/Pylint) cuts LLM code security issues 40%->13% | Discovery agent | 2026-07-24 |
| https://arxiv.org/abs/2607.01903                                                          | PREPRINT: HECATE — complexity metrics spanning prompt layer + code layer for LLM-integrated apps | Discovery agent | 2026-07-24 |
| https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | (rel: 97) Anthropic official: how to shape agent context — write/select/compress/isolate; directly informs context-mgmt and compaction rule design | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2607.25398 | (rel: 92) PREPRINT: HANDBOOK.md — benchmark for long-context agentic instruction following; no model exceeds 25% strict pass@1, directly tests CLAUDE.md-style files | Agent X | 2026-08-01 |
| https://dl.acm.org/doi/10.1145/3786304.3787891 | (rel: 88) Offscript (CHIIR 2026, peer-reviewed): agentic auditing methodology for instruction adherence to behavioral guidelines | Agent X | 2026-08-01 |
| https://arxiv.org/abs/2606.10209 | (rel: 88) PREPRINT: Less Context, Better Agents — efficient context engineering for long-horizon tool-using agents; more context ≠ better | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2603.24755 | (rel: 87) PREPRINT: SlopCodeBench — benchmarks how coding agents degrade over long-horizon iterative tasks; directly relevant to autonomous-execution quality gates | Agent X | 2026-08-01 |
| https://arxiv.org/html/2603.20432v1 | (rel: 86) PREPRINT: Coding Agents are Effective Long-Context Processors — agents externalize context via files/tools instead of raw context stuffing | Agent X | 2026-08-01 |
| https://www.anthropic.com/research/trustworthy-agents | (rel: 85) Anthropic official research on trustworthy agent design in production | Agent X | 2026-08-01 |
| https://dl.acm.org/doi/10.1145/3748302 | (rel: 84) ACM TOIS (peer-reviewed): survey on memory mechanisms of LLM-based agents | Agent X | 2026-08-01 |
| https://dl.acm.org/doi/10.1145/3728894 | (rel: 84) ACM PACMSE (peer-reviewed): LLM hallucinations in practical code generation — phenomena, mechanism, mitigation | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2604.03515 | (rel: 83) PREPRINT: Inside the Scaffold — source-code taxonomy of coding agent architectures (harness design patterns) | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2601.10343 | (rel: 83) PREPRINT: OctoBench — benchmarking scaffold-aware instruction following in repository-grounded agentic coding | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2603.06847 | (rel: 82) PREPRINT: Characterizing Faults in Agentic AI — taxonomy of failure types/symptoms/root causes; feeds diagnosis.md / error-handling.md | Agent X | 2026-08-01 |
| https://www.anthropic.com/research/measuring-agent-autonomy | (rel: 82) Anthropic official research on measuring AI agent autonomy in practice | Agent X | 2026-08-01 |
| https://arxiv.org/html/2606.20683 | (rel: 81) PREPRINT: From Question Answering to Task Completion — survey on agent system and harness design | Agent X | 2026-08-01 |
| https://dl.acm.org/doi/abs/10.1145/3806007.3810961 | (rel: 80) ACM workshop (peer-reviewed): MCP-SecLint — open-source static analyzer for vulnerabilities in LLM tool integrations | Agent X | 2026-08-01 |
| https://ast-grep.github.io/advanced/prompting.html | (rel: 80) Official ast-grep docs: using ast-grep with AI tools/agents — extends existing lsp.md ast-grep coverage with agent-specific guidance | Agent X | 2026-08-01 |
| https://www.anthropic.com/research/prompt-injection-defenses | (rel: 79) Anthropic official research: mitigating prompt injection risk in browser/agent use | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2512.03549 | (rel: 78) PREPRINT: PARC — autonomous self-reflective coding agent for robust execution of long-horizon tasks | Agent X | 2026-08-01 |
| https://arxiv.org/abs/2601.19752 | (rel: 77) PREPRINT: Agentic Design Patterns — system-theoretic framework for engineering robust AI agents | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2607.01640 | (rel: 76) PREPRINT: AgentFlow — building agent dependency graphs for static analysis of agent programs | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2510.18893 | (rel: 76) PREPRINT: CodeCRDT — observation-driven coordination for multi-agent LLM code generation; relevant to parallelism.md | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2603.27277 | (rel: 75) PREPRINT: Codebase-Memory — tree-sitter-based knowledge graphs for LLM code exploration via MCP | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2603.29231 | (rel: 74) PREPRINT: Beyond pass@1 — reliability science framework for long-horizon LLM agents | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2606.19135 | (rel: 73) PREPRINT: A Technical Taxonomy of LLM Agent Communication Protocols | Agent X | 2026-08-01 |
| https://mlsec.org/docs/2026-icse.pdf | (rel: 73) ICSE 2026 (peer-reviewed): LLM-based vulnerability discovery through the lens of code metrics | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2606.22741 | (rel: 72) PREPRINT: GRADE — graph representation of LLM agent dependency and execution; dependency layer predicts agent failure | Agent X | 2026-08-01 |
| https://doi.org/10.1145/3696630.3728702 | (rel: 72) ACM FSE 2025 (peer-reviewed): From Prompts to Properties — rethinking LLM code generation with property-based testing | Agent X | 2026-08-01 |
| https://arxiv.org/abs/2506.18315 | (rel: 70) PREPRINT: using property-based testing to bridge LLM code generation and validation | Agent X | 2026-08-01 |
| https://www.anthropic.com/research/agentic-misalignment | (rel: 70) Anthropic official research: how LLM agents could become insider threats under autonomy | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2601.07190 | (rel: 70) PREPRINT: Active Context Compression — autonomous memory management in LLM agents (Focus agent, 22.7% token reduction) | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2607.00692 | (rel: 69) PREPRINT: Self-GC — self-governing context for long-horizon LLM agents | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2605.23135 | (rel: 68) PREPRINT: The Impact of AI Coding Assistants on Software Engineering — longitudinal study | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2607.05677 | (rel: 66) PREPRINT: From Conversation to Contribution — characterizing coding agents in open-source software | Agent X | 2026-08-01 |
| https://arxiv.org/pdf/2507.15003 | (rel: 65) PREPRINT: The Rise of AI Teammates in Software Engineering 3.0 | Agent X | 2026-08-01 |

---

## Discovery Queries

Organized by theme. The discovery agent runs all of these each pass via
WebSearch, evaluates results against `research-sources.md` tier criteria,
fetches the top candidates to assess content quality, and adds qualifying
new entries to **Candidate URLs** above. Queries are maintained here so they
are versioned and curated independently of the skill logic.

Speed is not a criterion for self-improve runs. Breadth is. Add queries
freely; remove only if a theme is fully saturated in the active URL list.

### Claude Code and Anthropic

- `"Claude Code" new features 2025 2026`
- `site:platform.claude.com "Claude Code"`
- `site:anthropic.com/research agent instruction-following`
- `"Claude Code" hooks settings agents best practices`
- `Anthropic model capabilities limitations coding 2026`

### Agentic coding and AI-assisted development

- `agentic coding patterns best practices 2025 2026`
- `AI coding assistant workflow integration research`
- `LLM code generation quality techniques research`
- `AI pair programming patterns developer experience`
- `autonomous coding agent design research`

### Context management

- `LLM context window management strategies research`
- `long context LLM agent techniques 2025`
- `conversation context preservation LLM`
- `"context window" coding assistant optimization`
- `LLM working memory agent architecture research`

### Staying on task and instruction following

- `LLM instruction following research 2025 2026`
- `agent task completion multi-step execution research`
- `LLM task drift focus system prompt research`
- `"instruction following" system prompt structure effectiveness`
- `LLM goal persistence agent research`

### Compaction and summarization

- `LLM context compaction summarization agent research`
- `conversation summarization LLM memory research`
- `LLM memory hierarchies agent architecture`
- `"context compression" LLM agent research 2025`

### Expressing constraints

- `LLM constraint specification prompt engineering research`
- `system prompt guardrails constraint satisfaction research`
- `instruction adherence LLM agent study`
- `"constraint keywords" LLM prompt effectiveness`
- `hard vs soft constraints LLM agent behavior`

### Human-AI collaboration

- `human-AI collaboration software development research`
- `developer AI workflow integration best practices 2025`
- `interactive programming AI assistant research`
- `human in the loop agent design research`
- `"co-pilot" programming patterns effectiveness`

### Multi-agent orchestration

- `multi-agent orchestration patterns research 2025`
- `LLM agent coordination communication research`
- `"agentic systems" design patterns evaluation`
- `parallel agent execution coordination research`
- `multi-agent task decomposition research`

### Prompt engineering and system prompt design

- `prompt engineering research arxiv 2025 2026`
- `system prompt structure LLM effectiveness research`
- `"chain of thought" agent reasoning prompt research`
- `LLM prompt design principles empirical research`
- `instruction format markdown LLM response quality`

### Reliability and error handling

- `LLM agent reliability robustness research`
- `error recovery agentic systems research`
- `LLM hallucination mitigation coding context`
- `agent failure modes detection recovery research`

### Code quality and testing with LLMs

- `LLM test generation quality research`
- `AI code review effectiveness research`
- `LLM refactoring code quality research 2025`
- `test-driven development AI assistant research`

### Tool-augmented LLMs — offloading to specialized tools

The key question per query: what tasks are LLMs structurally bad at that a
deterministic or specialized tool does reliably? Look for accuracy improvement
evidence, not just integration tutorials.

**Research and paradigms:**
- `"tool augmented" LLM code generation accuracy research 2025 2026`
- `"tool use" LLM agent developer tools coding accuracy improvement`
- `LLM specialized tool integration research ReAct coding`
- `"function calling" LLM code analysis accuracy research`
- `tool-calling LLM agent correctness improvement empirical`

**MCP ecosystem — practical catalog:**
- `"model context protocol" MCP server tools catalog 2025`
- `awesome MCP servers developer tools list`
- `site:github.com "awesome-mcp" OR "mcp-servers" list`
- `MCP server static analysis linting code intelligence`
- `"modelcontextprotocol" developer tools integration`

**Static analysis and security offloading:**
- `semgrep LLM code review integration accuracy`
- `"static analysis" LLM agent integration developer tools`
- `AST tree-sitter LLM code understanding accuracy`
- `"language server protocol" LLM agent integration accuracy`
- `ShellCheck bandit trivy LLM security agent integration`

**Code intelligence beyond LSP:**
- `code search semantic LLM agent accuracy tools`
- `symbol indexing LLM agent ctags universal-ctags`
- `"code intelligence" tools LLM developer agent 2025`
- `ripgrep ast-grep LLM agent structural search tools`

**Test quality and coverage offloading:**
- `mutation testing LLM agent code quality stryker mutmut`
- `"property based testing" LLM agent code generation`
- `code coverage analysis LLM integration accuracy`
- `"test quality" automated tools LLM agent integration`

**Dependency, vulnerability, and schema tools:**
- `dependency analysis tools LLM agent accuracy`
- `SBOM vulnerability scanning LLM agent integration`
- `OpenAPI schema validation LLM agent accuracy`
- `"json schema" validator LLM agent contract testing`
- `secret detection gitleaks LLM agent security`

**Architecture and complexity tools:**
- `cyclomatic complexity tools LLM agent code review`
- `dependency graph visualization LLM coding agent`
- `"code metrics" automated tools LLM agent integration`
- `architecture fitness functions automated LLM agent`
