# claude-config

Personal Claude Code configuration: agents, rules, skills, and settings.

## Credits

The agents in this repo are derived from
[VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents).
Modifications include: stripped boilerplate (fake JSON communication protocols,
workflow phases, MCP tool sections), corrected tool lists to real Claude Code
tools only, added `model:` assignments (`opusplan` / `sonnet` / `haiku`),
added `disallowedTools:` on read-only agents, and added `memory: user` on
select agents.

The `/fix` and `/upgrade-deps` skills are adapted from
[sseely-experity/claude-config](https://github.com/sseely-experity/claude-config).

Several skills (`changelog-generator`, `video-downloader`, `file-organizer`,
`internal-comms`, `webapp-testing`) are adapted from
[ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills).
Modifications include: fixed macOS compatibility issues, corrected skill `name`
fields to match directory names, trimmed preamble and padding sections, removed
vendor-specific infrastructure requirements, and added missing prerequisites.

The document skills (`doc-pdf`, `doc-docx`, `doc-pptx`, `doc-xlsx`) are also
sourced from that repo but are excluded from this public repo — they carry a
proprietary Anthropic license (© 2025 Anthropic, PBC) that prohibits
redistribution.

## Installation

### New machine

```bash
# Prerequisites: Claude Code installed, gh authenticated
git clone https://github.com/sseely/claude-config.git ~/.claude
```

Claude Code reads `~/.claude/` directly — no symlinks or additional setup needed.

### Existing `~/.claude/`

If you already have a `~/.claude/` directory with content you want to keep,
merge selectively:

```bash
git clone https://github.com/sseely/claude-config.git /tmp/claude-config
cp -r /tmp/claude-config/agents ~/.claude/
cp -r /tmp/claude-config/rules ~/.claude/
cp -r /tmp/claude-config/skills ~/.claude/
cp -r /tmp/claude-config/hooks ~/.claude/
cp -r /tmp/claude-config/templates ~/.claude/
cp /tmp/claude-config/CLAUDE.md ~/.claude/CLAUDE.md
```

### Post-install

Two files are excluded from the repo and must be created manually:

**`~/.claude/settings.json`** — machine-local settings (permissions, hooks).
See `templates/` for examples.

**`~/.claude/.mcp.json`** — MCP server config (paths are machine-specific).

## What's included

### `CLAUDE.md`

Global instructions loaded at the start of every Claude Code session. Covers
interaction style, when to use agents, commit conventions, and pointers to
the rules files. Kept under 200 lines (the load limit).

### `rules/`

Instruction files loaded every session alongside `CLAUDE.md`.

| File | Content |
|------|---------|
| `autonomous-execution.md` | Mission-brief protocol for unattended multi-hour sessions — startup sequence, batch execution, quality gates, decision-making rules, compaction recovery |
| `code-principles.md` | YAGNI, SOLID, no magic literals, prefer native `fetch` over HTTP libraries |
| `commits.md` | Conventional Commits spec — subject format, body criteria, `BREAKING CHANGE` footer, examples |
| `parallelism.md` | Multi-agent planning rules — file ownership (one writer per file), agent prompt structure, when to parallelize vs. serialize |
| `security.md` | Input validation, secrets management, error response hygiene, auth/authz checklist, injection prevention |
| `testing.md` | TDD (red-green-refactor), 90/90/90 coverage floor, shared test helpers in `test/helpers/` |

### `skills/`

Slash-command workflows invoked as `/skillname`.

| Skill | Usage | Description |
|-------|-------|-------------|
| `code-review` | `/code-review [scope]` | Parallel 10-agent review (correctness, security, linting, error handling, deps, tests, logging, types, perf, API contracts). Defaults to staged changes; pass "full project", a path, or a glob |
| `commit` | `/commit` | Stage files, draft Conventional Commits message, commit |
| `explore` | `/explore` | Map an unfamiliar codebase — clones related repos from the same GitHub org, generates architecture diagrams and component maps in `architecture-temp/` |
| `fix` | `/fix [error]` | Drive a failing test or build error to green. Loops debugger → language agent → test runner (max 5 iterations). Accepts a test name, error message, or file:line |
| `plan-mission` | `/plan-mission [feature]` | Turn a feature description into a mission brief for 1-4 hours of autonomous execution — blast radius analysis, architecture decisions, batched task specs with Given/When/Then acceptance criteria |
| `review-pr` | `/review-pr [PR]` | Fetch a GitHub PR diff, run the full `/code-review` checklist, then post findings as inline review comments via the GitHub API. Accepts a PR URL, bare number, or infers from the current branch. Never auto-approves — the human submits |
| `sandbox` | `/sandbox [name] [repo] [prompt]` | Run a task or mission brief inside an isolated Docker container. Auto-detects languages, assembles a multi-layer Dockerfile, injects secrets from macOS Keychain at runtime, and uses named volumes for resumability |
| `upgrade-deps` | `/upgrade-deps [scope]` | Parallel dependency audit + security scan across all detected languages. Simple upgrades execute directly; complex ones (breaking changes, multi-language) route to `/plan-mission` |

### `hooks/`

Shell scripts triggered by Claude Code lifecycle events.

| Hook | Event | Description |
|------|-------|-------------|
| `record-turn-start.sh` | `UserPromptSubmit` | Writes a Unix timestamp to `~/.claude/.runtime/claude-turn-start` |
| `notify-on-stop.sh` | `Stop` | macOS notification with elapsed time if the turn took >30 seconds |
| `quality-gate.sh` | Manual | Runs project-specific quality checks — reads `.claude-quality-gates` or auto-detects (Node, Python, Go, Rust, .NET) |
| `autonomous-toggle.sh` | Manual | Copies autonomous permissions into a project's `.claude/settings.json` (with backup/restore) for unattended sessions |

### `templates/`

| File | Description |
|------|-------------|
| `autonomous-settings.json` | Broad permission set for autonomous execution — copied into projects by `autonomous-toggle.sh` |

### `agents/`

128 specialist agents across 10 categories. Invoked automatically by Claude
Code when a task matches their domain, or explicitly via the `Agent` tool.

Model assignments:
- `opusplan` — architecture agents (complex reasoning, plan-then-execute)
- `sonnet` — implementation agents (default workhorse)
- `haiku` — review/audit/research agents (read-only, fast, cheap)

**01-core-development** (10 agents)
`api-designer`, `backend-developer`, `electron-pro`, `frontend-developer`,
`fullstack-developer`, `graphql-architect`\*, `microservices-architect`\*,
`mobile-developer`, `ui-designer`, `websocket-engineer`

**02-language-specialists** (29 agents)
`angular-architect`, `cpp-pro`, `csharp-developer`, `django-developer`,
`dotnet-core-expert`, `dotnet-framework-4.8-expert`, `elixir-expert`,
`flutter-expert`, `golang-pro`, `java-architect`\*, `javascript-pro`,
`kotlin-specialist`, `laravel-specialist`, `nextjs-developer`, `php-pro`,
`powershell-5.1-expert`, `powershell-7-expert`, `python-pro`, `rails-expert`,
`react-specialist`, `ruby-2-7-specialist`, `ruby-specialist`, `rust-engineer`,
`spring-boot-engineer`, `sql-pro`, `swift-expert`, `typescript-pro`,
`vue-expert`, `wordpress-master`

**03-infrastructure** (16 agents)
`azure-infra-engineer`, `cloud-architect`\*, `database-administrator`,
`deployment-engineer`, `devops-engineer`, `devops-incident-responder`,
`docker-expert`, `incident-responder`, `kubernetes-specialist`,
`network-engineer`, `platform-engineer`, `security-engineer`, `sre-engineer`,
`terraform-engineer`, `terragrunt-expert`, `windows-infra-admin`

**04-quality-security** (14 agents)
`accessibility-tester`, `ad-security-reviewer`, `architect-reviewer`,
`chaos-engineer`, `code-reviewer`, `compliance-auditor`, `debugger`,
`error-detective`, `penetration-tester`, `performance-engineer`,
`powershell-security-hardening`, `qa-expert`, `security-auditor`,
`test-automator`

**05-data-ai** (13 agents)
`ai-engineer`, `data-analyst`, `data-engineer`, `data-scientist`,
`database-optimizer`, `llm-architect`\*, `machine-learning-engineer`,
`ml-engineer`, `mlops-engineer`, `nlp-engineer`, `postgres-pro`,
`prompt-engineer`

**06-developer-experience** (13 agents)
`build-engineer`, `cli-developer`, `dependency-manager`,
`documentation-engineer`, `dx-optimizer`, `git-workflow-manager`,
`legacy-modernizer`, `mcp-developer`, `powershell-module-architect`,
`powershell-ui-architect`, `refactoring-specialist`, `slack-expert`,
`tooling-engineer`

**07-specialized-domains** (12 agents)
`api-documenter`, `blockchain-developer`, `embedded-systems`,
`fintech-engineer`, `game-developer`, `iot-engineer`, `m365-admin`,
`mobile-app-developer`, `payment-integration`, `quant-analyst`,
`risk-manager`, `seo-specialist`

**08-business-product** (11 agents)
`business-analyst`, `content-marketer`, `customer-success-manager`,
`legal-advisor`, `product-manager`, `project-manager`, `sales-engineer`,
`scrum-master`, `technical-writer`, `ux-researcher`

**09-meta-orchestration** (3 agents)
`agent-installer`, `it-ops-orchestrator`, `memory-curator`

**10-research-analysis** (7 agents)
`competitive-analyst`, `data-researcher`, `market-researcher`,
`research-analyst`, `scientific-literature-researcher`, `search-specialist`,
`trend-analyst`

\* `opusplan` model

## Dependencies

The following agents are sourced from external repos and should be
updated when those repos change:

| Agent | Source repo |
|-------|-------------|
| `agents/09-meta-orchestration/memory-curator.md` | [sseely/claude-memory](https://github.com/sseely/claude-memory) |

## Updating

```bash
cd ~/.claude && git pull
```
