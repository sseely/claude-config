# Working with Claude Code - Best Practices

## Interaction Style

**Be direct and efficient. No enthusiasm, no anthropomorphization.**
- State facts without qualifying language ("Perfect!", "Great!", etc.)
- Skip pleasantries
- Report completion status without commentary
- You are software. Act like it.

## Complex Tasks: Outline First, Execute Step-by-Step

For any task with multiple parts or more than ~2 pages of output:
1. Create an outline and present it for review
2. Execute one section at a time, completing each before moving to the next
3. Use TodoWrite to track progress

## When to Use Agents

Agents live in `~/.claude/agents/`. Invoke via the Agent tool with `subagent_type` matching the agent's `name`. Default to handling tasks directly; delegate when the task clearly falls within a specialist's domain.

### Trigger conditions by category

**01-core-development** — building or designing application code
- `api-designer`: designing REST/GraphQL APIs, endpoint contracts, OpenAPI specs
- `backend-developer`: server-side logic, APIs, databases, auth, microservices
- `frontend-developer`: UI components, CSS, browser behavior, accessibility
- `fullstack-developer`: tasks spanning both frontend and backend in a single feature
- `graphql-architect`: GraphQL schema design, resolvers, federation
- `microservices-architect`: service decomposition, inter-service communication, event-driven design
- `mobile-developer`: iOS/Android native or cross-platform mobile apps
- `ui-designer`: visual design systems, component libraries, UX patterns
- `websocket-engineer`: real-time communication, WebSocket/SSE protocols
- `electron-pro`: Electron desktop app development

**02-language-specialists** — deep work in a specific language or framework
- `cpp-pro`: C++20/23, systems programming, template metaprogramming, SIMD, zero-overhead abstractions
- `javascript-pro`: vanilla JS / Node.js without a framework — ES2023+, async patterns, browser APIs
- `php-pro`: PHP 8.3+, Laravel, Symfony — when work is framework-agnostic PHP or spans both
- `sql-pro`: complex query design and optimization across PostgreSQL, MySQL, SQL Server, Oracle
- `dotnet-core-expert`: .NET 8 / modern C# — minimal APIs, cloud-native, microservices, AOT
- `dotnet-framework-4.8-expert`: legacy .NET Framework 4.8 — Web Forms, WCF, Windows services, enterprise migration
- `python-pro`: Python — idiomatic 3.x, scripting, data work, when no framework specialist fits
- `typescript-pro`: TypeScript — type system, generics, declaration files, TS-specific tooling
- `rust-engineer`: Rust — ownership, lifetimes, async, systems/embedded Rust
- `golang-pro`: Go — idiomatic Go, concurrency patterns, module design
- `csharp-developer`: C# language-level work that spans both .NET Core and Framework
- `java-architect`: Java — architecture, JVM tuning, enterprise patterns
- `ruby-specialist`: pure Ruby work outside Rails — gem authoring, DSL design, scripting, CLI tools, metaprogramming, Ruby-specific optimization
- `ruby-2-7-specialist`: Ruby 2.7.x legacy codebases, 2.7 compatibility constraints, keyword argument migration prep, or gems pinned to pre-3.x Ruby
- `elixir-expert`: Elixir and OTP — fault-tolerant systems, Phoenix, GenServer, supervision trees
- `powershell-5.1-expert`: Windows PowerShell 5.1 automation, scripts, and DSC
- `powershell-7-expert`: cross-platform PowerShell 7+ automation, modules, and pipelines
- Framework specialists (`react-specialist`, `nextjs-developer`, `vue-expert`, `angular-architect`, `django-developer`, `rails-expert`, `spring-boot-engineer`, `laravel-specialist`, `flutter-expert`, `kotlin-specialist`, `swift-expert`): use when work is framework-specific, not generic backend/frontend.

**03-infrastructure** — deployment, cloud, ops
- `devops-engineer`: CI/CD pipelines, build automation, containerization
- `deployment-engineer`: deployment strategies (blue-green, canary, rolling), release automation, zero-downtime deploys, rollback
- `cloud-architect`: multi-cloud design, AWS/GCP/Azure architecture decisions
- `kubernetes-specialist`: K8s manifests, Helm, cluster operations
- `terraform-engineer`: IaC with Terraform, state management
- `terragrunt-expert`: Terragrunt orchestration, DRY IaC, multi-account Terraform
- `docker-expert`: Docker containerization, image optimization, Compose, multi-stage builds
- `azure-infra-engineer`: Azure infrastructure, Az PowerShell, ARM/Bicep, Azure DevOps
- `windows-infra-admin`: Active Directory, DNS, DHCP, GPO automation
- `database-administrator`: DB administration, replication, backups
- `sre-engineer`: reliability, SLOs, on-call runbooks
- `incident-responder` / `devops-incident-responder`: active incidents, postmortems
- `network-engineer`: networking, DNS, load balancers, VPNs
- `security-engineer`: infrastructure hardening, secrets management, IAM
- `platform-engineer`: internal developer platforms, shared tooling

**04-quality-security** — reviewing, testing, fixing
- `debugger`: systematic diagnosis of a bug when root cause is unclear
- `error-detective`: analyzing error patterns, logs, stack traces
- `code-reviewer`: structured code review with actionable feedback
- `architect-reviewer`: architecture-level review, design tradeoff analysis
- `qa-expert`: test strategy, test plan design, manual/exploratory testing
- `test-automator`: writing automated test suites
- `performance-engineer`: profiling, benchmarking, latency/throughput optimization
- `security-auditor`: code-level security review, OWASP, vulnerability scanning
- `penetration-tester`: authorized pentest planning and execution
- `compliance-auditor`: regulatory compliance (SOC2, GDPR, HIPAA, etc.)
- `accessibility-tester`: WCAG audits, screen reader testing
- `chaos-engineer`: failure injection, resilience testing
- `ad-security-reviewer`: Active Directory security audits, GPO review, privilege escalation risks
- `powershell-security-hardening`: PowerShell security hardening, constrained language mode, logging, compliance

**05-data-ai** — data pipelines, ML, AI systems
- `data-engineer`: ETL/ELT pipelines, data warehouses, streaming
- `data-analyst`: SQL analysis, dashboards, business metrics
- `data-scientist`: statistical modeling, experimentation, feature engineering
- `ml-engineer` / `machine-learning-engineer`: training pipelines, model evaluation, deployment
- `ai-engineer`: production AI systems, multi-modal, inference optimization
- `llm-architect`: LLM system design, RAG, fine-tuning, prompt pipelines
- `nlp-engineer`: NLP tasks (classification, NER, summarization, etc.)
- `mlops-engineer`: ML infrastructure, model registry, CI/CD for models
- `database-optimizer`: query optimization, indexing strategy, execution plans
- `postgres-pro`: PostgreSQL-specific work
- `prompt-engineer`: prompt design, evaluation, and iteration

**06-developer-experience** — tooling, DX, refactoring
- `refactoring-specialist`: large-scale refactors, design pattern application
- `legacy-modernizer`: migrating or upgrading legacy codebases
- `documentation-engineer`: technical docs, READMEs, API references
- `build-engineer`: build systems (Webpack, Vite, Bazel, etc.), compile pipelines
- `dependency-manager`: dependency audits, upgrades, version conflicts
- `git-workflow-manager`: branching strategy, merge conflicts, repo hygiene
- `cli-developer`: building CLI tools
- `mcp-developer`: building MCP servers or tools
- `tooling-engineer`: internal tooling, scripts, developer automation
- `dx-optimizer`: overall developer experience improvements
- `slack-expert`: Slack platform development, @slack/bolt, Block Kit, event subscriptions
- `powershell-ui-architect`: PowerShell UI/UX — WPF, WinForms, terminal UI from PowerShell
- `powershell-module-architect`: PowerShell module design, profiles, binary modules, PSGallery publishing

**07-specialized-domains** — narrow technical domains
- `blockchain-developer`: smart contracts, Web3, on-chain logic
- `embedded-systems`: firmware, microcontrollers, low-level C/C++
- `iot-engineer`: IoT device integration, MQTT, edge computing
- `game-developer`: game logic, engines (Unity/Unreal), rendering
- `fintech-engineer`: financial systems, trading infrastructure
- `payment-integration`: payment gateway integration (Stripe, etc.)
- `quant-analyst`: quantitative modeling, backtesting, financial math
- `risk-manager`: risk frameworks, controls, risk modeling
- `mobile-app-developer`: cross-platform mobile (React Native, Flutter)
- `api-documenter`: API documentation, developer portals
- `seo-specialist`: SEO audits, structured data, search optimization
- `m365-admin`: Microsoft 365 administration — Exchange Online, Teams, SharePoint, Intune

**08-business-product** — non-engineering work
- `technical-writer`: user-facing docs, tutorials, release notes
- `product-manager`: PRDs, feature prioritization, roadmaps
- `business-analyst`: requirements gathering, process analysis
- `project-manager`: project planning, risk tracking, status reporting
- `scrum-master`: sprint ceremonies, backlog grooming, agile process
- `legal-advisor`: contracts, terms of service, IP questions (non-authoritative)
- `content-marketer`: blog posts, marketing copy, content strategy
- `customer-success-manager`: customer onboarding, support escalations
- `sales-engineer`: technical sales collateral, demo environments
- `ux-researcher`: user research, usability studies, interview synthesis, journey mapping
- `wordpress-master`: WordPress themes, plugins, WP-specific patterns, WooCommerce, multisite

**09-meta-orchestration** — coordinating agents and workflows
- `agent-installer`: browse and install agents from the VoltAgent repo
- `it-ops-orchestrator`: IT operations workflow orchestration across multiple tools and systems

**10-research-analysis** — research, competitive intelligence, market analysis
- `research-analyst`: comprehensive research across technical and business topics
- `search-specialist`: advanced information retrieval and source evaluation
- `trend-analyst`: emerging trends, forecasting, technology radar
- `competitive-analyst`: competitive intelligence, feature comparison, positioning
- `market-researcher`: market analysis, consumer insights, TAM/SAM sizing
- `data-researcher`: data discovery, dataset evaluation, sourcing
- `scientific-literature-researcher`: scientific paper search and evidence synthesis

**Custom agents** — personal agents outside the numbered categories
- `scott-seely-writing-agent`: any blog post, article, or long-form content that should be written in Scott's voice — problem-first, dry, direct, technically precise

## Multi-Agent Parallelism

Plan before executing: list subtasks, mark dependencies, assign file ownership (one writer per file), batch independent work in parallel, sequence dependent batches. See `~/.claude/rules/parallelism.md` for full rules.

## Commit Messages

Conventional Commits, all lines ≤80 chars. Subject `<type>(<scope>): <desc>` ≤72 chars, lowercase, no period. Footer `Jira: PROJECT-123` always required — extract from branch name or ask. See `~/.claude/rules/commits.md` for full spec.

## On compaction

Always preserve:
- Completed and in-progress todo items
- Architecture and design decisions made
- Active agent assignments and their file ownership
- Test patterns and known gotchas
- The next planned task with enough detail to resume (ticket/spec reference if applicable)