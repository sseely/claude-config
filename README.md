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

## Installation

### New machine

```bash
# Prerequisites: Claude Code installed, gh authenticated
git clone https://github.com/sseely-experity/claude-config.git ~/.claude
```

Claude Code reads `~/.claude/` directly — no symlinks or additional setup needed.

### Existing `~/.claude/`

If you already have a `~/.claude/` directory with content you want to keep,
merge selectively:

```bash
git clone https://github.com/sseely-experity/claude-config.git /tmp/claude-config
cp -r /tmp/claude-config/agents ~/.claude/
cp -r /tmp/claude-config/rules ~/.claude/
cp -r /tmp/claude-config/skills ~/.claude/
cp /tmp/claude-config/CLAUDE.md ~/.claude/CLAUDE.md
```

### Post-install

Two files are excluded from the repo and must be created manually:

**`~/.claude/settings.json`** — machine-local settings (permissions, hooks):

```json
{
  "model": "opusplan",
  "attribution": { "commit": "" },
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "osascript -e 'display notification \"Claude Code finished\" with title \"Claude Code\" sound name \"Glass\"'",
        "async": true
      }]
    }]
  },
  "permissions": {
    "allow": []
  }
}
```

**`~/.claude/.mcp.json`** — MCP server config (paths are machine-specific):

```json
{
  "mcpServers": {
    "atlassian-confluence": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/sse"
    }
  }
}
```

## What's included

### `CLAUDE.md`

Global instructions loaded at the start of every Claude Code session. Covers
interaction style, when to use agents, and pointers to the rules files.
Kept under 200 lines (the load limit).

### `rules/`

Instruction files loaded every session, extracted from `CLAUDE.md` to stay
within the 200-line limit.

| File | Content |
|------|---------|
| `commits.md` | Conventional Commits spec with mandatory Jira footer |
| `parallelism.md` | Multi-agent parallelism planning rules |

### `skills/`

Slash-command workflows invoked as `/skillname`.

| Skill | Usage | Description |
|-------|-------|-------------|
| `commit` | `/commit` | Stage, draft Conventional Commits message, commit |
| `review` | `/review [files]` | Structured code review via `code-reviewer` agent |
| `jira` | `/jira TICKET-123` | Summarize or transition a Jira ticket |

### `agents/`

127 specialist agents across 10 categories. Invoked automatically by Claude
Code when a task matches their domain, or explicitly via the `Agent` tool.

Model assignments:
- `opusplan` — architecture agents (complex reasoning, plan-then-execute)
- `sonnet` — implementation agents (default workhorse)
- `haiku` — review/audit/research agents (read-only, fast, cheap)

**01-core-development** (10 agents)
`api-designer`, `backend-developer`, `electron-pro`, `frontend-developer`,
`fullstack-developer`, `graphql-architect`\*, `microservices-architect`\*,
`mobile-developer`, `ui-designer`, `websocket-engineer`

**02-language-specialists** (19 agents)
`angular-architect`, `cpp-pro`, `csharp-developer`, `django-developer`,
`dotnet-core-expert`, `dotnet-framework-4.8-expert`, `elixir-expert`,
`flutter-expert`, `golang-pro`, `java-architect`\*, `javascript-pro`,
`kotlin-specialist`, `laravel-specialist`, `nextjs-developer`, `php-pro`,
`powershell-5.1-expert`, `powershell-7-expert`, `python-pro`, `rails-expert`,
`react-specialist`, `ruby-2-7-specialist`, `ruby-specialist`, `rust-engineer`,
`spring-boot-engineer`, `sql-pro`, `swift-expert`, `typescript-pro`,
`vue-expert`

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

**05-data-ai** (12 agents)
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
`scrum-master`, `technical-writer`, `ux-researcher`, `wordpress-master`

**09-meta-orchestration** (2 agents)
`agent-installer`, `it-ops-orchestrator`

**10-research-analysis** (7 agents)
`competitive-analyst`, `data-researcher`, `market-researcher`,
`research-analyst`, `scientific-literature-researcher`, `search-specialist`,
`trend-analyst`

\* `opusplan` model

## Updating

```bash
cd ~/.claude && git pull
```
