# Self-Improve Research URLs

Maintained by the self-improve skill. Agents A, B, and C pull their fetch
targets from the relevant section below. After each run, the skill updates
`last-verified` and `status` for each URL that was fetched.

Unreachable or thin URLs are added to `code-review-tasks.md` with a
replacement recommendation. Do not remove entries mid-run — set status to
`unreachable` and let the task file drive the update.

**Status values:** `active` | `unreachable` | `deprecated` | `unknown`

Last full verification: 2026-06-05

---

## Agent A — Claude Code ecosystem

| URL | Purpose | Last Verified | Status |
|-----|---------|--------------|--------|
| https://www.anthropic.com/blog | Scan for recent Claude Code posts (last 90 days) | 2026-06-05 | active |
| https://docs.anthropic.com/en/docs/claude-code/overview | Core feature overview | 2026-06-05 | active |
| https://docs.anthropic.com/en/docs/claude-code/hooks | Hook events and configuration | 2026-06-05 | active |
| https://docs.anthropic.com/en/docs/claude-code/settings | Settings reference | 2026-06-05 | active |
| https://docs.anthropic.com/en/docs/claude-code/memory | Memory system docs | 2026-06-05 | active |
| https://docs.anthropic.com/en/docs/claude-code/mcp | MCP integration docs | 2026-06-05 | active |
| https://docs.anthropic.com/en/docs/claude-code/sub-agents | Sub-agent docs | 2026-06-05 | active |

---

## Agent B — Model version and API surface

| URL | Purpose | Last Verified | Status |
|-----|---------|--------------|--------|
| https://code.claude.com/docs/en/model-config | Model aliases and effort levels | 2026-06-05 | active |
| https://docs.anthropic.com/en/docs/about-claude/models/overview | Current model IDs and deprecations | 2026-06-05 | active |

---

## Agent C — Prompt structure and instruction design

| URL | Purpose | Last Verified | Status |
|-----|---------|--------------|--------|
| https://www.anthropic.com/research | Recent Anthropic papers on instruction-following and agent orchestration | 2026-06-05 | active |

---

## Candidate URLs (not yet verified — promote to a section above after one successful fetch)

| URL | Purpose | Suggested by | Date Added |
|-----|---------|-------------|------------|
| https://modelcontextprotocol.io/docs | MCP protocol spec and server SDK docs | human | 2026-06-05 |
| https://github.com/punkpeye/awesome-mcp-servers | Community catalog of MCP servers by category | human | 2026-06-05 |
| https://semgrep.dev/docs | Semgrep rule-based static analysis — offloads security pattern matching from LLM | human | 2026-06-05 |
| https://ast-grep.github.io/guide/introduction.html | ast-grep structural search beyond current lsp.md coverage | human | 2026-06-05 |
| https://stryker-mutator.io/docs | Mutation testing (JS/TS/Python) — tells LLM which tests are structurally weak | human | 2026-06-05 |
| https://hypothesis.readthedocs.io/en/latest | Property-based testing for Python — offloads edge-case discovery | human | 2026-06-05 |
| https://fast-check.dev | Property-based testing for JS/TS — offloads edge-case discovery | human | 2026-06-05 |
| https://docs.anthropic.com/en/docs/claude-code/tutorials | Claude Code tutorials — may surface patterns not in the overview docs | human | 2026-06-05 |

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
- `site:docs.anthropic.com "Claude Code"`
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
