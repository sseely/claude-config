# Fleet Risk Register

Every agent in `docs/fleet/inventory.md` (130 total), scored on Likelihood ×
Magnitude and ranked by Score. This is the risk register MAP 5.1 was
missing — no prior artifact characterized likelihood or magnitude of impact
for anything in the fleet. Per **FD-9**, this register is load-bearing: T11
picks its evaluation target from the table below by mechanical rule, not by
a name asserted in this prose, so every score here must trace to a column
in `inventory.md`.

## Scoring scale

Re-derivable from `inventory.md` alone — no mission document required.

### Likelihood (1–3) — capability tier

| Value | Tier | Inventory signal |
|---|---|---|
| 1 | Low | Capability tier = `read-only` |
| 2 | Medium | Capability tier = `write/exec-capable` (explicit `tools:` allowlist) |
| 3 | High | Capability tier = `inherits-all` (no `tools` key — the FD-1 ceiling tier) |

### Magnitude (1–3) — blast radius if the agent acts wrongly

| Value | Tier | Rule |
|---|---|---|
| 1 | Low | `read-only` tier, always — no write capability, so no blast radius regardless of tool count |
| 2 | Medium | `write/exec-capable` with Tool count 4–14 |
| 3 | High | `write/exec-capable` with Tool count ≥15, **or** `inherits-all` (unconditional) |

**Why tool count is the Magnitude proxy for write/exec-capable agents:**
`inventory.md` carries no per-agent path-scoping field — nothing records
whether a given agent's `tools:` list is restricted to a subtree away from
`hooks/`, `settings.json`, or `rules/`. Every write/exec-capable agent's
`Write`/`Edit`/`Bash` entries are unscoped by path, so the
"can reach security/governance-sensitive paths" trigger in the original
scale is, on the data actually in the inventory, indistinguishable across
the whole write/exec-capable tier. Tool count is used instead, as the one
inventory-visible proxy for standing breadth of capability: the ≥15
threshold falls in a natural gap in the observed distribution (values
cluster at 3–14 and again at 15–22, split cleanly at that point) and
separates general-toolchain agents (compilers, formatters, deploy tooling,
the full Serena symbolic-edit suite) from narrower domain-scoped agents
carrying the same nominal `Write`/`Edit`/`Bash` trio. This is a stated
judgment call, not a fact recoverable from the inventory schema — a future
scorer could reasonably draw the line elsewhere and should say so if they
do.

The scale's other Magnitude-2 trigger — "invoked by an `allowed-tools`
skill" — is a **skills** signal (`inventory.md`'s Skills table), not an
agents one; the inventory carries no agent-to-skill invocation mapping, so
it is not applied here. This register scores the 130 **agents** only, per
the task scope; skills are out of scope for this pass.

### Score and tiers

**Score = Likelihood × Magnitude**, range 1–9. In a 3×3 multiplicative
grid, 5, 7, and 8 are structurally unreachable — do not read their absence
as a transcription error. **Tiers:** Low 1–2, Medium 3–4, High 6–9.

## Selection rule (T11's interface contract)

**N = 5.** Sort the full table by Score descending; break ties by
Magnitude descending, then Agent name ascending (alphabetical) for
determinism. T11 reads the first 5 data rows — this table is the
machine-readable interface, no separate data file (FD-2).

Applying that sort to the table below (Score 9 tier has exactly 2 rows —
both inherits-all agents; the next 3 seats are decided entirely by the
name-ascending tie-break inside the Score-6/Magnitude-3 tier), the
mechanical result is:

**Explore, Plan, ad-security-reviewer, angular-architect, api-designer.**

Nothing here asserts that list independently — re-run the sort against the
table and it reproduces.

## Register

Sorted Score descending. The top tier is small enough to stay fully
individual; below it, agents sharing identical (Likelihood, Magnitude) —
and therefore identical Score, Tier, and scoring rationale — are grouped
into one row per inventory path-category, so every agent still appears
exactly once and every group's factors trace to the same two inventory
columns (Capability tier, Tool count).

| Agent | Likelihood | Magnitude | Score | Tier | Blast-radius notes |
|---|---|---|---|---|---|
| Explore | 3 | 3 | 9 | High | `agents/explore.md`, no `tools:` key — inherits every tool the invoking session has. |
| Plan | 3 | 3 | 9 | High | `agents/plan.md`, no `tools:` key — inherits every tool the invoking session has. |
| ad-security-reviewer | 2 | 3 | 6 | High | Tool count 17 (≥15) — write/exec-capable, full Serena edit suite. |
| angular-architect | 2 | 3 | 6 | High | Tool count 17 (≥15) — write/exec-capable, full Serena edit suite. |
| api-designer | 2 | 3 | 6 | High | Tool count 20 (≥15) — write/exec-capable, full Serena edit suite. |
| backend-developer, electron-pro, frontend-developer, fullstack-developer, graphql-architect, microservices-architect, mobile-developer, ui-designer, websocket-engineer | 2 | 3 | 6 | High | `01-core-development` remainder. Tool count 15–20 (≥15); same capability class as the top-5 core-development picks — excluded from top-5 only by the name-ascending tie-break. |
| cpp-pro, csharp-developer, django-developer, elixir-expert, flutter-expert, golang-pro, java-architect, javascript-pro, kotlin-specialist, laravel-specialist, nextjs-developer, php-pro, powershell-5.1-expert, powershell-7-expert, python-pro, rails-expert, react-specialist, ruby-2-7-specialist, ruby-specialist, rust-engineer, spring-boot-engineer, sql-pro, swift-expert, typescript-pro, vue-expert | 2 | 3 | 6 | High | `02-language-specialists` remainder (excludes angular-architect, above; excludes dotnet-core-expert / dotnet-framework-4.8-expert, which are read-only). Tool count 17–22 (≥15). |
| chaos-engineer, debugger, powershell-security-hardening, test-automator | 2 | 3 | 6 | High | `04-quality-security` remainder (excludes ad-security-reviewer, above; excludes the six read-only agents in this category, scored separately below). Tool count 17 (≥15). |
| build-engineer, cli-developer, dependency-manager, documentation-engineer, dx-optimizer, git-workflow-manager, legacy-modernizer, mcp-developer, powershell-module-architect, powershell-ui-architect, refactoring-specialist, slack-expert, tooling-engineer | 2 | 3 | 6 | High | `06-developer-experience`. Tool count 15–22 (≥15). |
| azure-infra-engineer, cloud-architect, database-administrator, deployment-engineer, devops-engineer, devops-incident-responder, docker-expert, incident-responder, kubernetes-specialist, network-engineer, platform-engineer, security-engineer, sre-engineer, terraform-engineer, terragrunt-expert, windows-infra-admin | 2 | 2 | 4 | Medium | `03-infrastructure`. Tool count 4–11 (4–14 band) — write/exec-capable against ordinary repo files, below the 15-tool threshold. |
| accessibility-tester, compliance-auditor, penetration-tester, performance-engineer | 2 | 2 | 4 | Medium | `04-quality-security` partial. Tool count 10 (4–14 band). |
| ai-engineer, data-analyst, data-engineer, data-scientist, database-optimizer, llm-architect, machine-learning-engineer, ml-engineer, mlops-engineer, nlp-engineer, postgres-pro, prompt-engineer | 2 | 2 | 4 | Medium | `05-data-ai`. Tool count 4–11 (4–14 band). |
| api-documenter, blockchain-developer, embedded-systems, fintech-engineer, forge-app-developer, game-developer, iot-engineer, m365-admin, mobile-app-developer, payment-integration, quant-analyst, risk-manager, seo-specialist | 2 | 2 | 4 | Medium | `07-specialized-domains`. Tool count 4–14 — forge-app-developer sits at 14, one short of the ≥15 High threshold; its tool list is Forge-MCP domain tools, not a general toolchain. |
| business-analyst, customer-success-manager, sales-engineer, technical-writer, wordpress-master | 2 | 2 | 4 | Medium | `08-business-product` partial (excludes ux-researcher, read-only, scored below; excludes the five Tool-count-3 agents, scored below). Tool count 4–9 (4–14 band). |
| agent-installer, it-ops-orchestrator | 2 | 2 | 4 | Medium | `09-meta-orchestration`. Tool count 5–6 (4–14 band). |
| competitive-analyst, data-researcher, market-researcher, research-analyst, search-specialist, trend-analyst | 2 | 2 | 4 | Medium | `10-research-analysis` (excludes scientific-literature-researcher, read-only, scored below). Tool count 5 (4–14 band). |
| plantuml-visual-qa | 2 | 2 | 4 | Medium | Root-level, not part of a numbered category. Tool count 5 (4–14 band). |
| content-marketer, legal-advisor, product-manager, project-manager, scrum-master | 2 | 1 | 2 | Low | `08-business-product` partial. Tool count 3 — below the Magnitude-2 floor; write-capable but minimal standing capability. |
| ai-risk-auditor, architect-reviewer, code-reviewer, dotnet-core-expert, dotnet-framework-4.8-expert, error-detective, qa-expert, scientific-literature-researcher, security-auditor, ux-researcher | 1 | 1 | 1 | Low | Capability tier = read-only across `04-quality-security`, `02-language-specialists`, `08-business-product`, `10-research-analysis`. No write path exists to score against. |

### Tier counts

| Tier | Agent count |
|---|---|
| High (6–9) | 56 (2 at Score 9, 54 at Score 6) |
| Medium (3–4) | 59 |
| Low (1–2) | 15 (5 at Score 2, 10 at Score 1) |

## Mitigating control (context only, not a scoring input)

This repo's convention of second-developer review on agent frontmatter
changes is a real mitigating factor for the agents above, but per **FD-10**
it is recorded here in prose only — it is not folded into any Likelihood
or Magnitude value in this register and must not be treated as
compensating for or implicitly lowering any score above.
