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

### Auto-install tools

The session-start hook checks for `ast-grep` on every start.
To enable automatic installation:

```sh
export CLAUDE_AUTO_INSTALL_TOOLS=true
```

Without this flag, missing tools are reported but not installed.

## What's included

### `CLAUDE.md`

Global instructions loaded at the start of every Claude Code session. Covers
interaction style, when to use agents, commit conventions, and pointers to
the rules files. Kept under 200 lines (the load limit).

### `rules/`

Instruction files loaded every session alongside `CLAUDE.md`.

| File | Content |
|------|---------|
| `api-design.md` | REST/HTTP conventions — resource naming, envelopes, versioning, status codes. Stub; body in `docs/reference/api-design.md` |
| `architecture.md` | Blast-radius analysis, ADRs, fitness functions, reversibility, migration patterns |
| `autonomous-execution.md` | Mission-brief protocol for unattended multi-hour sessions. Stub; body in `docs/reference/autonomous-execution.md` |
| `code-principles.md` | SOLID, no magic literals, prefer native `fetch` over HTTP libraries |
| `commits.md` | Conventional Commits spec — subject format, body criteria, `BREAKING CHANGE` footer, examples |
| `diagnosis.md` | Diagnosis-mode protocol for observed discrepancies — mechanism, origin, causal chain, ruled-out evidence before any fix |
| `diagrams.md` | PlantUML-by-default diagramming rubric. Stub with `paths:` frontmatter (the mission's one pilot); body in `docs/reference/diagrams.md` |
| `environment.md` | Env-var naming, startup validation, logging redaction. Stub; body in `docs/reference/environment.md` |
| `error-handling.md` | Throw vs. return, module-boundary wrapping, async errors, cancellation and shared-state races |
| `extended-thinking.md` | When to request deeper reasoning, self-refine passes, the autonomous self-assessment trigger |
| `logging.md` | Structured JSON logs, level semantics, no PII/secrets, error-log content requirements |
| `lsp.md` | Code-navigation priority order — LSP, then ast-grep, then Grep/Glob; Serena tools for subagents |
| `memory.md` | `.agent-notes/` session-observation discipline — what to write, what not to |
| `model-routing.md` | Model-to-task routing table, Opus/Fable behavioral compensation, anti-patterns |
| `naming-conventions.md` | Folder layout, file naming, symbol case, DB naming. Stub; body in `docs/reference/naming-conventions.md` |
| `observability.md` | SLO-first design, RED metrics, distributed tracing, alerting, on-call readiness |
| `parallelism.md` | Multi-agent planning rules — file ownership (one writer per file), agent prompt structure, when to parallelize vs. serialize |
| `pr-workflow.md` | Branch naming, PR size, merge strategy, pre-existing-violation handling |
| `prompting-quality.md` | Constraint keywords, specificity, agent context budget, constraint-budget ceiling, register shifting |
| `research-sources.md` | Tier 1–5 source hierarchy and confidence-declaration rules. Stub; body in `docs/reference/research-sources.md` |
| `retry-idempotency.md` | Retry policy (max attempts, backoff, jitter), idempotency keys; worked example in `docs/reference/retry-idempotency.md` |
| `security.md` | Input validation, secrets management, error response hygiene, auth/authz checklist, injection prevention |
| `string-formatting.md` | Templates over concatenation, accumulation-in-a-loop builders; per-language verdicts in `docs/reference/string-formatting.md` |
| `testability.md` | Pure functions, functional core/imperative shell, observe-don't-mock, eliminate temporal coupling |
| `testing.md` | TDD (red-green-refactor), 90/90/90 coverage floor, shared test helpers in `test/helpers/` |

Several rules (`api-design`, `autonomous-execution`, `diagrams`,
`environment`, `naming-conventions`, `research-sources`) are ≤15-line
resident stubs whose full body lives in `docs/reference/<name>.md` —
this keeps the per-session resident footprint down while the detail
stays one Read away. If a rule's row above says "Stub", follow its
pointer before assuming the file is the whole rule.

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
| `session-start.sh` | `SessionStart`, `ConfigChange` | Prints working directory and checks CLI tool availability (git, node, python3, gh, docker, ast-grep, lizard) |
| `record-turn-start.sh` | `UserPromptSubmit` | Writes a Unix timestamp to `~/.claude/.runtime/claude-turn-start` |
| `project-init.sh` | `UserPromptSubmit` | Initializes memory and Serena for the current project (idempotent, async) |
| `guard-bash.py` | `PreToolUse` (matcher: `Bash`) | Blocks catastrophic Bash commands — recursive deletes aimed at a protected root |
| `nudge-search-tool.py` | `PreToolUse` (matcher: `Grep`) | Nudges toward LSP/Serena/ast-grep on symbol-shaped Grep calls; never blocks |
| `check-complexity.py` | `PostToolUse` (matcher: `Write\|Edit`) | Blocks a Write/Edit that introduces or worsens a code-complexity violation |
| `check-frontmatter.py` | `PostToolUse` (matcher: `Write\|Edit`) | Validates agent/skill YAML frontmatter after Write/Edit |
| `log-instructions-loaded.sh` | `InstructionsLoaded` | Appends one JSON line per event to `logs/instructions-loaded.jsonl` so `paths:`-scoped rules can be proven to fire |
| `notify-on-stop.sh` | `Stop` | macOS notification with elapsed time if the turn took >30 seconds |
| `quality-gate.sh` | Manual | Runs project-specific quality checks — reads `.claude-quality-gates` or auto-detects (Node, Python, Go, Rust, .NET) |
| `autonomous-toggle.sh` | Manual | Copies autonomous permissions into a project's `.claude/settings.json` (with backup/restore) for unattended sessions |
| `log-hook-event.sh` | `PermissionDenied`, `PostToolUseFailure`, `SubagentStop`, `PostModelSwitch` | Generic append-only logger for events without a dedicated script; appends to `logs/hook-events.jsonl` |

### `templates/`

| File | Description |
|------|-------------|
| `autonomous-settings.json` | Broad permission set for autonomous execution — copied into projects by `autonomous-toggle.sh` |

### `agents/`

112 specialist agents across 10 categories (109 categorized + 3
uncategorized at the repo root: `explore`, `plan`,
`plantuml-visual-qa`). Invoked automatically by Claude Code when a task
matches their domain, or explicitly via the `Agent` tool. Counts are
generated by `python3 scripts/gen-fleet-inventory.py`; see
`docs/fleet/inventory.md` for the full per-agent breakdown.

Model assignments:
- `opusplan`/`opus` — architecture and highest-judgment review agents
- `sonnet` — implementation agents (default workhorse)
- `haiku` — review/audit/research agents (read-only, fast, cheap)

**01-core-development** (10 agents)
`api-designer`, `backend-developer`, `electron-pro`, `frontend-developer`,
`fullstack-developer`, `graphql-architect`\*, `microservices-architect`,
`mobile-developer`, `ui-designer`, `websocket-engineer`

**02-language-specialists** (27 agents)
`angular-architect`, `cpp-pro`, `csharp-developer`, `django-developer`,
`dotnet-framework-4.8-expert`, `elixir-expert`,
`flutter-expert`, `golang-pro`, `java-architect`\*, `javascript-pro`,
`kotlin-specialist`, `laravel-specialist`, `nextjs-developer`, `php-pro`,
`powershell-5.1-expert`, `powershell-7-expert`, `python-pro`, `rails-expert`,
`react-specialist`, `ruby-2-7-specialist`, `ruby-specialist`, `rust-engineer`,
`spring-boot-engineer`, `sql-pro`, `swift-expert`, `typescript-pro`,
`vue-expert`

**03-infrastructure** (15 agents)
`azure-infra-engineer`, `cloud-architect`\*, `database-administrator`,
`deployment-engineer`, `devops-engineer`,
`docker-expert`, `incident-responder`, `kubernetes-specialist`,
`network-engineer`, `platform-engineer`, `security-engineer`, `sre-engineer`,
`terraform-engineer`, `terragrunt-expert`, `windows-infra-admin`

**04-quality-security** (15 agents)
`accessibility-tester`, `ad-security-reviewer`\*\*, `ai-risk-auditor`,
`architect-reviewer`, `chaos-engineer`, `code-reviewer`, `compliance-auditor`,
`debugger`, `error-detective`, `penetration-tester`, `performance-engineer`,
`powershell-security-hardening`\*\*, `qa-expert`, `security-auditor`,
`test-automator`

**05-data-ai** (11 agents)
`ai-engineer`, `data-analyst`, `data-engineer`, `data-scientist`,
`database-optimizer`, `llm-architect`\*,
`ml-engineer`, `mlops-engineer`, `nlp-engineer`, `postgres-pro`,
`prompt-engineer`

**06-developer-experience** (12 agents)
`build-engineer`, `cli-developer`, `dependency-manager`,
`documentation-engineer`, `git-workflow-manager`,
`legacy-modernizer`, `mcp-developer`, `powershell-module-architect`,
`powershell-ui-architect`, `refactoring-specialist`, `slack-expert`,
`tooling-engineer`

**07-specialized-domains** (6 agents)
`api-documenter`, `forge-app-developer`, `m365-admin`,
`mobile-app-developer`, `payment-integration`, `risk-manager`

**08-business-product** (7 agents)
`business-analyst`, `content-marketer`,
`legal-advisor`, `product-manager`, `project-manager`,
`technical-writer`, `ux-researcher`

**09-meta-orchestration** (2 agents)
`agent-installer`, `it-ops-orchestrator`

**10-research-analysis** (4 agents)
`data-researcher`, `market-intelligence-analyst`,
`research-analyst`, `search-specialist`

\* `opusplan` model  \*\* `opus` model

## Dependencies

The following agents are sourced from external repos and should be
updated when those repos change:

| Agent | Source repo |
|-------|-------------|

## Updating

```bash
cd ~/.claude && git pull
```
