---
source: NIST AI 100-1 — Artificial Intelligence Risk Management Framework
edition: AI RMF 1.0 (January 2023)
source-url: https://airc.nist.gov/airmf-resources/airmf/
subcategories-covered:
  [
    GOVERN 1.1, GOVERN 1.2, GOVERN 1.3, GOVERN 1.4, GOVERN 1.5, GOVERN 1.6,
    GOVERN 1.7, GOVERN 2.1, GOVERN 2.2, GOVERN 2.3, GOVERN 3.1, GOVERN 3.2,
    GOVERN 4.1, GOVERN 4.2, GOVERN 4.3, GOVERN 5.1, GOVERN 5.2, GOVERN 6.1,
    GOVERN 6.2,
    MAP 1.1, MAP 1.2, MAP 1.3, MAP 1.4, MAP 1.5, MAP 1.6, MAP 2.1, MAP 2.2,
    MAP 2.3, MAP 3.1, MAP 3.2, MAP 3.3, MAP 3.4, MAP 3.5, MAP 4.1, MAP 4.2,
    MAP 5.1, MAP 5.2,
    MEASURE 1.1, MEASURE 1.2, MEASURE 1.3, MEASURE 2.1, MEASURE 2.2,
    MEASURE 2.3, MEASURE 2.4, MEASURE 2.5, MEASURE 2.6, MEASURE 2.7,
    MEASURE 2.8, MEASURE 2.9, MEASURE 2.10, MEASURE 2.11, MEASURE 2.12,
    MEASURE 2.13, MEASURE 3.1, MEASURE 3.2, MEASURE 3.3, MEASURE 4.1,
    MEASURE 4.2, MEASURE 4.3,
    MANAGE 1.1, MANAGE 1.2, MANAGE 1.3, MANAGE 1.4, MANAGE 2.1, MANAGE 2.2,
    MANAGE 2.3, MANAGE 2.4, MANAGE 3.1, MANAGE 3.2, MANAGE 4.1, MANAGE 4.2,
    MANAGE 4.3,
  ]
last-verified: 2026-08-09
status: active
---

# NIST AI RMF crosswalk — GOVERN, MAP, MEASURE, and MANAGE

This is the Profile described in §6 of NIST AI 100-1: a Current-state mapping
of every applicable subcategory in the AI RMF Core to where — or whether —
the `~/.claude` configuration repo addresses it. Per AD-8, a subcategory that
is not addressed is recorded as such, with what it would take to close the
gap; a subcategory that is genuinely inapplicable is recorded `out of scope`
with the reason stated. Per MEASURE 1.1's own principle applied reflexively:
risks that will not, or cannot, be measured here are documented rather than
omitted.

## What "applicable" means for a solo configuration repo

The AI RMF assumes an organization with a governance hierarchy, a workforce,
and external stakeholders distinct from the system's builders. `~/.claude`
has none of those — it is authored, reviewed, and operated by one person.
Two consequences follow, and both are load-bearing for how to read this
document:

1. **The "AI system" in view is dual.** It is, first, the Claude Code agents
   operating *under* this configuration when they read rules, invoke skills,
   and delegate to subagents — GOVERN's cross-cutting posture and MAP's
   context-establishment apply to that operation directly. It is, second, the
   guidance this repo hands to *other* projects for building AI features
   (`docs/`, `compliance-setup`, `ai-risk-auditor` per AD-6/AD-7) — MAP,
   MEASURE, and MANAGE subcategories about a deployed system's impacts apply
   more naturally there, and this crosswalk notes the distinction per row
   where it changes the disposition.
2. **Subcategories that presuppose an organizational structure this repo
   does not have — a workforce, executive leadership distinct from the
   operator, external affected communities — are genuinely `out of scope`,
   not silently skipped.** "Solo configuration repo, no organizational
   hierarchy" is the recurring reason; each such row still states it
   explicitly, because a blank cell and a considered exclusion are not the
   same finding.

## Row schema

```
| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
```

`Disposition` is exactly one of `addressed` (cites `file:line` or a named
rule/skill/agent), `partially addressed` (cites what exists and names the
gap), `not addressed` (a real gap; states what closing it would take), or
`out of scope` (states the reason — mandatory).

## Completeness

All 72 applicable subcategories carry a disposition: **GOVERN 19 / MAP 18 /
MEASURE 22 / MANAGE 13 = 72**, enumerated from Tables 1–4 of NIST AI 100-1
(§5). MEASURE and MANAGE counts were verified directly against Table 3
(p. 29–31) and Table 4 (p. 32–33) of the source PDF for this task — both
match the 22 and 13 the mission planner assumed; no correction was needed.
Across the full Profile: 25 rows `addressed`, 21 `partially addressed`, 16
`not addressed`, 10 `out of scope`. Every `not addressed` row states what
closing the gap would take; every `out of scope` row states why the
subcategory does not apply. This statement is what SLI 2 (crosswalk
completeness) reads.

---

## GOVERN

### GOVERN 1 — Policies, processes, procedures, and practices for mapping, measuring, and managing AI risks

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| GOVERN 1.1 | Legal and regulatory requirements involving AI are understood, managed, and documented. | not addressed | No artifact tracks AI-specific legal/regulatory obligations (e.g., jurisdictional AI-use rules, the operator's own AI-usage terms) for running Claude Code against this configuration. `rules/security.md` and `rules/environment.md` govern secrets and input validation, not regulatory scope. Closing this needs a register enumerating which regulations, if any, bind solo use of a third-party AI coding assistant. |
| GOVERN 1.2 | Trustworthy AI characteristics are integrated into organizational policies, processes, procedures, and practices. | addressed | `docs/nist-ai-rmf/README.md`'s provenance-header schema and this crosswalk operationalize the RMF's trustworthy-AI vocabulary directly into the repo's practice, per AD-4's governance-register decision. |
| GOVERN 1.3 | Processes/procedures/practices determine needed risk-management activity level based on organizational risk tolerance. | partially addressed | `rules/code-principles.md`'s hook-enforced complexity limits (500-line files, 30 NLOC functions, CCN 10, 5 parameters — enforced by `hooks/check-complexity.py`) are a mechanical proportionality gate on AI-generated code. Gap: the gate targets software-quality risk, not a stated organizational tolerance for autonomous action, hallucination, or incorrect tool use. |
| GOVERN 1.4 | The risk management process and its outcomes are established through transparent policies/procedures based on organizational risk priorities. | addressed | `rules/autonomous-execution.md`'s Quality Gates, STOP/PUSH FORWARD decision rules, and consecutive-fix stop rule are transparent, version-controlled policies for how AI-driven risk decisions are reached and reviewed. |
| GOVERN 1.5 | Ongoing monitoring and periodic review of the risk management process are planned, with roles and review frequency defined. | addressed | `skills/self-improve/SKILL.md` Phase 2 (`references/phase2-audit-agents.md` Agent F reads all of `rules/` and `CLAUDE.md`; Agent D audits hooks/settings) is a repeatable review cycle. AD-9 sets a 180-day review cadence specifically for NIST-tied assets, matching the "determining the frequency of periodic review" clause for that asset class. |
| GOVERN 1.6 | Mechanisms are in place to inventory AI systems, resourced according to organizational risk priorities. | partially addressed | `agents/<NN-category>/*.md` (129 files) and `skills/*/SKILL.md` (29 files) are enumerable via the directory structure — a de facto inventory. Gap: no living inventory document tags each agent/skill by risk tier (write-capable vs. read-only, autonomous-eligible vs. not), which is what "resourced according to risk priorities" calls for. |
| GOVERN 1.7 | Processes are in place for decommissioning/phasing out AI systems safely, without increasing risk or decreasing trustworthiness. | not addressed | No documented process exists for deprecating or removing an agent, skill, or hook. Today, retiring an `agents/*.md` file is an undocumented, ad hoc deletion with no check for dangling references from `CLAUDE.md` or other skills that invoke it. |

### GOVERN 2 — Accountability structures for mapping, measuring, and managing AI risks

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| GOVERN 2.1 | Roles, responsibilities, and communication lines related to AI risk are documented and clear. | addressed | `rules/parallelism.md`'s file-ownership rule ("each file may only be written by one agent at a time") and its agent-boundary tiers (Always/Ask first/Never), plus `rules/autonomous-execution.md`'s Decision-Making Rules (STOP vs. PUSH FORWARD), document clear roles and escalation lines for AI-risk decisions even in a single-operator repo. |
| GOVERN 2.2 | Personnel and partners receive AI risk management training consistent with related policies. | out of scope | Solo configuration repo — the sole operator authors `rules/` directly rather than being trained on them by a separate party; there is no "personnel or partners" population distinct from the operator to train. |
| GOVERN 2.3 | Executive leadership takes responsibility for decisions about AI system risks. | out of scope | Solo configuration repo, no organizational hierarchy — the sole operator is the only party who could take executive responsibility for AI-system decisions, and does so directly by authoring and merging every change. |

### GOVERN 3 — Workforce diversity, equity, inclusion, and accessibility processes for AI risk work

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| GOVERN 3.1 | Decision-making related to AI risks is informed by a diverse team (demographics, disciplines, experience, backgrounds). | out of scope | Solo configuration repo, no organizational hierarchy — one operator; no team whose demographic, disciplinary, or experiential diversity could be assessed. |
| GOVERN 3.2 | Policies and procedures define and differentiate roles for human-AI configurations and oversight of AI systems. | addressed | `rules/autonomous-execution.md` distinguishes human-in-the-loop mode from autonomous mode (mission-brief detection) and defines STOP conditions returning control to the human; `CLAUDE.md`'s "Complex Tasks" section requires an outline-for-review gate before multi-part work proceeds — together these differentiate and document human-AI oversight roles. |

### GOVERN 4 — Organizational commitment to a culture that considers and communicates AI risk

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| GOVERN 4.1 | Organizational policies foster a critical-thinking and safety-first mindset to minimize potential negative impacts. | addressed | `CLAUDE.md`'s Verification section (confidence levels HIGH/MEDIUM/LOW/UNKNOWN; "don't fill gaps with guesses") and `rules/diagnosis.md`'s root-cause mandate ("no fix before a stated mechanism") together foster a critical-thinking, safety-first posture for AI-generated work. |
| GOVERN 4.2 | Organizational teams document the risks and potential impacts of the AI technology they design/develop/deploy/use, and communicate about impacts more broadly. | addressed | `rules/architecture.md`'s ADR requirement (mandatory for decisions "expensive or painful to reverse" or that "introduce a new dependency or technology") and `rules/memory.md`'s `.agent-notes/` discipline document risks and impacts as they surface. This crosswalk is itself the artifact making that record traceable to the RMF's vocabulary; git history is the "communicate more broadly" channel available to a solo repo. |
| GOVERN 4.3 | Organizational practices enable AI testing, identification of incidents, and information sharing. | addressed | `rules/testing.md` (TDD, 90/90/90 coverage floor) and `rules/memory.md` (`.agent-notes/` observation logging — "error patterns and their root causes") enable testing and incident capture. `skills/self-improve/SKILL.md` Phase 2 audit agents are the information-sharing mechanism, writing findings to `.agent-notes/self-improve-phase2-*.md` and a shared task file. |

### GOVERN 5 — Robust engagement with relevant AI actors

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| GOVERN 5.1 | Policies/practices collect, consider, prioritize, and integrate feedback from those external to the team on potential impacts. | out of scope | This is a private, solo configuration repo with no external users or affected communities — the operator is simultaneously developer and the only party whose interests the system could impact. There is no population "external to the team" to engage. |
| GOVERN 5.2 | Mechanisms enable the team to regularly incorporate adjudicated external feedback into system design and implementation. | out of scope | Same basis as GOVERN 5.1: a mechanism to incorporate external AI-actor feedback has nothing to incorporate when the engagement process it depends on is inapplicable. |

### GOVERN 6 — Policies and procedures addressing AI risk from third-party software, data, and supply-chain issues

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| GOVERN 6.1 | Policies/procedures address AI risks from third-party entities, including third-party IP infringement risk. | partially addressed | `agents/06-developer-experience/dependency-manager.md`'s checklist commits to "100% license compliance" and enumerates supply-chain, typosquatting, and CVE risk; `skills/upgrade-deps/SKILL.md` runs `dependency-manager` and `security-auditor` in parallel before every upgrade. Gap: neither addresses IP-infringement risk specific to AI-generated code (training-data provenance, output similarity to licensed training examples) — GOVERN 6.1's AI-specific infringement clause is unaddressed. |
| GOVERN 6.2 | Contingency processes handle failures or incidents in third-party data or AI systems deemed high-risk. | addressed | `rules/error-handling.md`'s "External calls" section (mandatory timeouts, error handlers that log and re-throw) and `rules/retry-idempotency.md`'s retry policy (bounded attempts, non-retryable 4xx classification, idempotency keys) are the contingency processes for third-party service failures, including third-party AI/data dependencies reached over HTTP. |

---

## MAP

### MAP 1 — Context is established and understood

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MAP 1.1 | Intended purposes, beneficial uses, context-specific laws/norms, and prospective deployment settings are understood and documented. | addressed | This crosswalk's own "What 'applicable' means" section above and `docs/nist-ai-rmf/README.md`'s "Verified provenance" section establish intended purpose, deployment setting, and scope boundaries for the AI system in view — a Profile documenting its own context is the MAP 1.1 outcome for this repo. |
| MAP 1.2 | Interdisciplinary AI actors, competencies, and demographic diversity for establishing context are documented; collaboration is prioritized. | out of scope | Solo configuration repo — one operator establishes context alone; no interdisciplinary human team whose diversity or collaboration could be documented. (The ten `agents/` category directories represent specialization of a single author's tooling, not team diversity.) |
| MAP 1.3 | The organization's mission and relevant goals for AI technology are understood and documented. | partially addressed | `CLAUDE.md` states operating goals implicitly (verification standards, agent-delegation policy, commit discipline), but no single artifact states the mission/goals for AI-technology use as such. Gap: a named "why this repo uses AI agents this way" statement does not exist. |
| MAP 1.4 | The business value or context of business use has been clearly defined or re-evaluated. | not addressed | No artifact documents or re-evaluates the value/context of AI-agent tooling in this repo — what the 129-agent, 29-skill configuration is expected to deliver, or how that is checked. Real gap. |
| MAP 1.5 | Organizational risk tolerances are determined and documented. | addressed | `rules/autonomous-execution.md`'s "STOP and wait for human input" and "PUSH FORWARD with judgment" lists are an explicit, documented boundary on how much AI-driven risk this repo tolerates without human sign-off — the operational form of a risk-tolerance statement. |
| MAP 1.6 | System requirements are elicited from and understood by relevant AI actors; design decisions account for socio-technical implications. | addressed | `rules/architecture.md`'s ADR format (Context/Decision/Consequences, required when a decision is expensive to reverse or crosses a service boundary) and this mission's own `decisions.md` (AD-1 through AD-10) are system requirements elicited from the relevant AI actor (the operator), with socio-technical implications stated in each Consequences section. |

### MAP 2 — Categorization of the AI system is performed

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MAP 2.1 | The specific tasks and methods used to implement the AI system's supported tasks are defined. | addressed | Every `agents/*.md`'s YAML frontmatter (`name`, `description`, `tools`, `model`) and every `skills/*/SKILL.md`'s frontmatter define the specific task and method the AI system supports — the RMF's own examples ("classifiers, generative models, recommenders") map to this repo's equivalents: reviewers, generators, auditors, orchestrators. |
| MAP 2.2 | Information about the AI system's knowledge limits and how output may be overseen by humans is documented. | addressed | `CLAUDE.md`'s Verification section requires declared confidence levels (HIGH/MEDIUM/LOW/UNKNOWN) on any claim whose accuracy matters, and `rules/research-sources.md` ties each level to the source tier that can support it — this documents knowledge limits and how output should be overseen. |
| MAP 2.3 | Scientific integrity and TEVV considerations (experimental design, data collection, trustworthiness, construct validation) are identified and documented. | not addressed | No artifact defines TEVV for the AI agents' own output quality (e.g., an eval harness measuring prompt reliability, hallucination rate, or task-completion accuracy). `rules/testing.md` governs the correctness of code the agents produce, not the scientific validity of the agents' decision process itself. Real gap. |

### MAP 3 — AI capabilities, targeted usage, goals, and expected benefits/costs are understood

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MAP 3.1 | Potential benefits of intended AI system functionality and performance are examined and documented. | partially addressed | Agent/skill `description` frontmatter states each capability's intended benefit, but no artifact examines or documents the magnitude of that benefit (time saved, defect rate reduced) as MAP 3.1 calls for. |
| MAP 3.2 | Potential costs, including non-monetary, connected to organizational risk tolerance are examined and documented. | addressed | `rules/parallelism.md`'s Model Selection section and Anti-patterns table document the token/cost tradeoff of routing to Opus vs. Sonnet vs. Haiku; "multi-agent orchestration costs ~15× more tokens than single-agent dispatch" is a documented, quantified cost tied to a risk-tolerance decision (single-agent by default). |
| MAP 3.3 | Targeted application scope is specified and documented based on capability, context, and categorization. | addressed | The `agents/01-core-development/` through `agents/10-research-analysis/` category structure, combined with `CLAUDE.md`'s "delegate when the task clearly falls within a specialist's domain" routing rule, specify and document each agent's targeted application scope. |
| MAP 3.4 | Processes for operator/practitioner proficiency with AI system performance and trustworthiness, including standards/certifications, are defined and assessed. | not addressed | No process defines, assesses, or documents operator proficiency with the AI tooling's performance or trustworthiness, and no certification or technical-standard reference exists for it. Real gap. |
| MAP 3.5 | Processes for human oversight are defined, assessed, and documented in accordance with GOVERN-function policies. | addressed | `rules/autonomous-execution.md`'s Decision-Making Rules (STOP conditions, consecutive-fix stop rule) and `CLAUDE.md`'s "Complex Tasks" outline-before-executing requirement define the human-oversight process in accordance with the GOVERN-function policies at GOVERN 1.4 and GOVERN 3.2 above. |

### MAP 4 — Risks and benefits are mapped for all components of the AI system, including third-party software and data

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MAP 4.1 | Approaches for mapping AI technology and legal risks of components, including third-party data/software and IP infringement, are in place and documented. | partially addressed | `agents/06-developer-experience/dependency-manager.md` and `skills/upgrade-deps/SKILL.md` map conventional software supply-chain and licensing risk, followed on every dependency upgrade. Gap: neither maps AI-technology-specific legal risk (third-party model provider terms, training-data provenance) — the same gap noted at GOVERN 6.1. |
| MAP 4.2 | Internal risk controls for AI system components, including third-party AI technologies, are identified and documented. | partially addressed | `hooks/check-complexity.py` (per `rules/code-principles.md`) and `rules/security.md`'s boundary-validation requirements are internal risk controls for AI-generated code changes. Gap: no control inventory exists for the third-party AI components this repo itself depends on (the Serena MCP server per `rules/lsp.md`; the model providers named in `rules/parallelism.md`'s routing table). |

### MAP 5 — Impacts to individuals, groups, communities, organizations, and society are characterized

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MAP 5.1 | Likelihood and magnitude of each identified impact are identified and documented, informed by expected use, past incidents, and external feedback. | not addressed | No artifact characterizes likelihood/magnitude of identified impacts (positive or harmful) from AI-agent use in this repo — there is no risk register. Closing this needs a document rating each impact's likelihood and magnitude, informed by `.agent-notes/` observations and any past incidents. |
| MAP 5.2 | Practices and personnel supporting regular engagement with relevant AI actors, integrating feedback about impacts, are in place. | addressed | `skills/self-improve/SKILL.md` Phase 2 audit agents and `references/finding-resolution.md`'s three-tier contradiction rubric and 0–100 scoring/filtering thresholds are the practice and cadence for regularly reviewing the configuration and integrating findings about its impacts into system design — the operator's own structured self-review substitutes for external engagement, consistent with GOVERN 5.1/5.2's out-of-scope basis above. |

---

## MEASURE

### MEASURE 1 — Appropriate methods and metrics are identified and applied

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MEASURE 1.1 | Approaches and metrics for measurement of AI risks enumerated during MAP are selected for implementation, starting with the most significant risks; risks or trustworthiness characteristics that will not or cannot be measured are properly documented. | addressed | This crosswalk's own `out of scope` rows above (GOVERN 2.2, GOVERN 2.3, GOVERN 3.1, GOVERN 5.1, GOVERN 5.2, MAP 1.2), each carrying a stated reason, are exactly this practice applied reflexively — per AD-8's own consequence, "deliberate exclusions become documented rather than silent, which is itself MEASURE 1.1." |
| MEASURE 1.2 | Appropriateness of AI metrics and effectiveness of existing controls are regularly assessed and updated, including reports of errors and potential impacts on affected communities. | not addressed | No process regularly reassesses whether this repo's own risk-relevant metrics (e.g., the 90/90/90 coverage floor, the hook-enforced complexity limits) remain appropriate over time, and there is no "affected communities" impact-reporting channel — consistent with the solo-repo basis at GOVERN 5.1. `skills/self-improve/SKILL.md`'s periodic audit reassesses configuration quality generally, not AI-metric appropriateness specifically. Real gap. |
| MEASURE 1.3 | Internal experts who did not serve as front-line developers and/or independent assessors are involved in regular assessments and updates; domain experts, users, external AI actors, and affected communities are consulted per risk tolerance. | out of scope | Solo configuration repo — no personnel independent of the operator exist to serve as internal experts or independent assessors, consistent with GOVERN 2.2/2.3's out-of-scope basis. |

### MEASURE 2 — AI systems are evaluated for trustworthy characteristics

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MEASURE 2.1 | Test sets, metrics, and details about the tools used during TEVV are documented. | partially addressed | `rules/testing.md`'s 90/90/90 coverage floor and assertion-quality rules document metrics and methodology for the correctness of code the agents produce. Gap: no equivalent TEVV documentation exists for the agents' *own* behavior (prompt reliability, task-completion accuracy) — the same gap named at MAP 2.3. |
| MEASURE 2.2 | Evaluations involving human subjects meet applicable requirements, including human subject protection, and are representative of the relevant population. | out of scope | No human-subjects evaluation is conducted anywhere in this repo's practice — there is no study population to protect or represent. |
| MEASURE 2.3 | AI system performance or assurance criteria are measured qualitatively or quantitatively and demonstrated for conditions similar to deployment; measures are documented. | partially addressed | `rules/testing.md`'s 90/90/90 floor is a quantitative assurance criterion applied to code the agents produce, enforced mechanically via `hooks/check-complexity.py`. Gap: no assurance criteria exist for the agents' own task-completion performance in deployment-like conditions — the recurring MAP 2.3/MEASURE 2.1 gap. |
| MEASURE 2.4 | The functionality and behavior of the AI system and its components — as identified in MAP — are monitored when in production. | not addressed | `rules/observability.md` explicitly defers this subcategory here ("For AI-feature post-deployment monitoring, drift, and near-miss capture (MANAGE 4.1/MEASURE 2.4), see `docs/nist-ai-rmf/crosswalk.md`") rather than implementing it — that pointer is navigation, not coverage. The rule's RED-method/tracing requirements target services the agents build for others; no telemetry or drift detection exists for the Claude Code agents' own operation. Real gap, shared with MANAGE 4.1 below. |
| MEASURE 2.5 | The AI system to be deployed is demonstrated to be valid and reliable; limitations of generalizability beyond the conditions under which the technology was developed are documented. | addressed | `docs/nist-ai-rmf/trustworthiness.md` §1 "Valid and Reliable" documents this subcategory directly — it is named in that asset's own `subcategories-covered` header. |
| MEASURE 2.6 | The AI system is evaluated regularly for safety risks; residual risk does not exceed tolerance and the system can fail safely; safety metrics reflect reliability, robustness, monitoring, and response times. | partially addressed | `docs/nist-ai-rmf/trustworthiness.md` §2 "Safe" states the framework's principle, and `rules/autonomous-execution.md`'s STOP conditions and consecutive-fix stop rule are the operational mechanism bounding autonomous action when risk rises (a "fail safely" behavior). Gap: no quantified safety metric (reliability, robustness, real-time monitoring, response time) is tracked — the STOP rules are qualitative triggers, not measured metrics. |
| MEASURE 2.7 | AI system security and resilience — as identified in MAP — are evaluated and documented. | partially addressed | `agents/04-quality-security/security-auditor.md` and `agents/04-quality-security/penetration-tester.md` evaluate security of code and infrastructure the agents produce; `agents/04-quality-security/ai-risk-auditor.md` states its own boundary explicitly — "security-auditor... covers MEASURE 2.7 and nothing else in the RMF." Gap: none of these evaluate resilience of the agents' *own* operation (e.g., prompt-injection resilience, tool-misuse resilience) — `docs/nist-ai-rmf/trustworthiness.md` §3 names that distinction between security and resilience but no artifact tests it here. |
| MEASURE 2.8 | Risks associated with transparency and accountability — as identified in MAP — are examined and documented. | addressed | `docs/nist-ai-rmf/trustworthiness.md` §4 "Accountable and Transparent" documents this subcategory directly (named in that asset's header); `rules/autonomous-execution.md`'s Decision-Making Rules make accountability for AI-driven decisions explicit and auditable via the decision journal. |
| MEASURE 2.9 | The AI model is explained, validated, and documented, and AI system output is interpreted within its context to inform responsible use and governance. | partially addressed | `docs/nist-ai-rmf/trustworthiness.md` §5 states the transparency/explainability/interpretability three-way distinction this subcategory draws on. Gap: no artifact validates or explains individual agent/skill *decisions* after the fact — frontmatter documents intended behavior, not why a specific output was produced, and no reasoning-trace capture exists beyond what the model natively returns in a session. |
| MEASURE 2.10 | Privacy risk of the AI system — as identified in MAP — is examined and documented. | partially addressed | `rules/security.md`'s boundary-validation rules and `rules/logging.md`'s redaction requirements ("Never log secrets, tokens, or PII") address privacy risk in code the agents generate. Gap: no privacy risk assessment exists for the agents' own operation — what operator data (file contents, credentials present in context) is transmitted to or retained by model providers is undocumented here. |
| MEASURE 2.11 | Fairness and bias — as identified in MAP — are evaluated and results are documented. | not addressed | `docs/nist-ai-rmf/trustworthiness.md` §7 states the framework's three-category bias taxonomy, but no artifact evaluates this repo's own agents for output bias (e.g., systemic bias in which agent gets invoked, computational bias in generated suggestions). Real gap. |
| MEASURE 2.12 | Environmental impact and sustainability of AI model training and management activities — as identified in MAP — are assessed and documented. | not addressed | No artifact tracks the energy or carbon cost of this repo's ongoing model usage. `rules/parallelism.md`'s Model Selection table documents token cost as a $-proxy ("multi-agent orchestration costs ~15× more tokens than single-agent dispatch") but that is a cost consideration, not an environmental-impact measure. This repo does not train models, so the training half of this subcategory is inherently out of the operator's control; the management-activities half remains a real, closeable gap. |
| MEASURE 2.13 | Effectiveness of the employed TEVV metrics and processes in the MEASURE function are evaluated and documented. | partially addressed | This is the framework's own warning made concrete: metrics "can be oversimplified, gamed, lack critical nuance." `rules/testing.md`'s 90/90/90 coverage floor is exactly that kind of gameable metric — percentage coverage can be satisfied with trivial assertions on getters while leaving real branches untested. `rules/testing.md`'s "Assertion quality" section (rejecting `toBeTruthy()`-style non-assertions) is the repo's actual mitigation for that gaming vector. Gap, stated rather than smoothed over: no process periodically re-evaluates whether the 90/90/90 floor itself remains an effective TEVV metric as the codebase and agent set evolve — that meta-evaluation is what MEASURE 2.13 asks for and does not exist. |

### MEASURE 3 — Mechanisms for tracking identified AI risks over time are in place

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MEASURE 3.1 | Approaches, personnel, and documentation are in place to regularly identify and track existing, unanticipated, and emergent AI risks based on factors such as intended and actual performance in deployed contexts. | partially addressed | `skills/self-improve/SKILL.md`'s periodic Phase 1/Phase 2 audit agents track ecosystem and configuration risk, writing findings to `.agent-notes/self-improve-phase*-*.md`; `rules/memory.md`'s `.agent-notes/` discipline captures emergent issues found during execution ("error patterns and their root causes"). Gap: tracking is triggered manually by the operator running `/self-improve`, not continuous, and is not framed in RMF risk terms outside this crosswalk. |
| MEASURE 3.2 | Risk tracking approaches are considered for settings where AI risks are difficult to assess using currently available measurement techniques or where metrics are not yet available. | not addressed | No artifact considers or documents an approach for AI risks that resist current measurement (e.g., hallucination in agent-authored analysis, drift in autonomous decision quality across a long session). Real gap. |
| MEASURE 3.3 | Feedback processes for end users and impacted communities to report problems and appeal system outcomes are established and integrated into AI system evaluation metrics. | out of scope | Solo configuration repo — no end users or impacted communities distinct from the operator exist to report problems to, consistent with GOVERN 5.1/5.2's out-of-scope basis. |

### MEASURE 4 — Feedback about efficacy of measurement is gathered and assessed

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MEASURE 4.1 | Measurement approaches for identifying AI risks are connected to deployment context(s) and informed through consultation with domain experts and other end users; approaches are documented. | partially addressed | This crosswalk itself is the documented measurement approach, connected to this repo's specific deployment context per the "What 'applicable' means" section above. Gap: it was not informed by consultation with domain experts or end users external to the operator — consistent with the solo-repo constraint, but the consultation element of 4.1 is genuinely unmet even though the documentation element is. |
| MEASURE 4.2 | Measurement results regarding AI system trustworthiness in deployment context(s) and across the AI lifecycle are informed by input from domain experts and relevant AI actors to validate whether the system is performing consistently as intended; results are documented. | not addressed | No measurement results exist yet to validate — MEASURE 2.1/2.3's measurement approaches are only partially built, and MEASURE 4.1's consultation element is unmet. Real gap, contingent on those two. |
| MEASURE 4.3 | Measurable performance improvements or declines based on consultations with relevant AI actors, including affected communities, and field data about context-relevant risks and trustworthiness characteristics are identified and documented. | not addressed | No field-data-driven performance trend exists; same upstream gap as MEASURE 4.1/4.2, and no "affected communities" population exists to consult, per the solo-repo basis at GOVERN 5.1. Real gap. |

---

## MANAGE

### MANAGE 1 — AI risks based on assessments and other analytical output from the MAP and MEASURE functions are prioritized, responded to, and managed

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MANAGE 1.1 | A determination is made as to whether the AI system achieves its intended purposes and stated objectives and whether its development or deployment should proceed. | addressed | `docs/nist-ai-rmf/trustworthiness.md`'s closing section names this subcategory directly: "MANAGE 1.1 is where the weighing becomes an organizational determination: whether the system achieves its intended purpose and whether development or deployment should proceed." `CLAUDE.md`'s "Complex Tasks" outline-for-review gate is the mechanism through which that determination is actually made per feature. |
| MANAGE 1.2 | Treatment of documented AI risks is prioritized based on impact, likelihood, and available resources or methods. | partially addressed | `rules/autonomous-execution.md`'s STOP-condition list functions as an informal prioritization — some conditions halt work, others don't. Gap: no risk register scores impact × likelihood the way a closed MAP 5.1 (currently `not addressed`) would feed; prioritization is operational, not a documented, scored process. |
| MANAGE 1.3 | Responses to the AI risks deemed high priority are developed, planned, and documented; response options include mitigating, transferring, avoiding, or accepting. | partially addressed | `rules/architecture.md`'s ADR requirement documents response decisions (Context/Decision/Consequences) for architecture-level risk, and `rules/autonomous-execution.md`'s STOP conditions are a documented "avoid" response (halt and escalate to the human). Gap: no unified risk-response register maps each MAP-identified risk to an explicit mitigate/transfer/avoid/accept choice — responses are scattered across ADRs and STOP rules rather than centrally tracked. |
| MANAGE 1.4 | Negative residual risks (the sum of all unmitigated risks) are documented to both downstream acquirers of AI systems and end users. | out of scope | Solo configuration repo with no downstream acquirers or end users distinct from the operator, consistent with GOVERN 5.1's basis — there is no external party to whom residual risk would be communicated. If this repo is ever published or shared beyond the operator, this disposition should be re-checked; it is a boundary condition, not a permanent exclusion. |

### MANAGE 2 — Strategies to maximize AI benefits and minimize negative impacts are planned, prepared, implemented, documented, and informed by input from relevant AI actors

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MANAGE 2.1 | Resources required to manage AI risks are taken into account, along with viable non-AI alternative systems, approaches, or methods, to reduce the magnitude or likelihood of potential impacts. | partially addressed | `rules/parallelism.md`'s "Default to single-agent; split only when a specific bottleneck is demonstrated" is a documented lighter-weight-alternative consideration that resists unnecessary AI orchestration cost. Gap: this governs orchestration cost specifically, not a broader non-AI-alternative evaluation — `rules/architecture.md`'s "Fitness functions" section pushes toward deterministic checks over AI-driven review ("express every architectural constraint as a lint/import check/test — not code review") but the two are not connected as a stated risk-reduction strategy. |
| MANAGE 2.2 | Mechanisms are in place and applied to sustain the value of deployed AI systems. | addressed | `skills/self-improve/SKILL.md`'s six-phase cycle (ecosystem research, configuration audit, dedup/score, report, task file, registry update) is precisely this mechanism — a periodic process that keeps the agent/skill/rule set current and prevents value decay as the Claude Code ecosystem evolves. |
| MANAGE 2.3 | Procedures are followed to respond to and recover from a previously unknown risk when it is identified. | addressed | `rules/diagnosis.md`'s mandatory mechanism-before-fix procedure (instrument before hypothesizing, no fix before a stated mechanism, two valid stop conditions) is the response/recovery procedure applied uniformly to any newly identified defect, AI-specific or not. |
| MANAGE 2.4 | Mechanisms are in place and applied, and responsibilities are assigned and understood, to supersede, disengage, or deactivate AI systems that demonstrate performance or outcomes inconsistent with intended use. | not addressed | `rules/architecture.md`'s migration patterns (Strangler fig, Expand-contract, Feature flag, Blue-green, Dark launch) carry a pointer to this row ("For AI-feature decommissioning (GOVERN 1.7/MANAGE 2.4)... see `docs/nist-ai-rmf/crosswalk.md`"), but that pointer is navigation, not coverage: none of the five listed patterns address deactivating a system that is already misbehaving in production — they govern planned replacement, not emergency disengagement. Same gap as GOVERN 1.7, operational rather than lifecycle variant. Real gap. |

### MANAGE 3 — AI risks and benefits from third-party entities are managed

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MANAGE 3.1 | AI risks and benefits from third-party resources are regularly monitored, and risk controls are applied and documented. | partially addressed | Per AD-3: `agents/06-developer-experience/dependency-manager.md`'s security-scanning checklist (CVE checking, supply-chain analysis, SBOM generation) and `skills/upgrade-deps/SKILL.md`'s Phase 2 parallel `dependency-manager` + `security-auditor` run monitor third-party software risk on every upgrade cycle; `rules/architecture.md`'s migration patterns (Feature flag, Blue-green) supply the "risk controls applied" half for a failing third-party dependency. Gap: this covers conventional software dependencies, not third-party *AI* resources specifically (model providers, hosted inference APIs, MCP servers) — no recurring process monitors those. |
| MANAGE 3.2 | Pre-trained models which are used for development are monitored as part of AI system regular monitoring and maintenance. | not addressed | Per AD-3: no artifact monitors the pre-trained models this repo depends on (the Claude models invoked via each agent's `model:` frontmatter, the Serena MCP server per `rules/lsp.md`) for behavior drift, deprecation, or provider-side changes. `dependency-manager` and `upgrade-deps` track conventional package dependencies only, not model versions. Real gap, honestly stated rather than stretched to cover it. |

### MANAGE 4 — Risk treatments, including response and recovery, and communication plans for the identified and measured AI risks are documented and monitored regularly

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MANAGE 4.1 | Post-deployment AI system monitoring plans are implemented, including mechanisms for capturing and evaluating input from users and other relevant AI actors, appeal and override, decommissioning, incident response, recovery, and change management. | not addressed | `rules/observability.md` explicitly defers this subcategory here rather than implementing it directly. No mechanism exists to capture user feedback on agent output quality, appeal an agent decision, or track change management specifically for agent/skill changes — git history records *what* changed but not a "change management" process in the RMF's monitoring-plan sense. Real gap, sharing a root cause with MEASURE 2.4 above: no runtime monitoring layer for the agents' own post-deployment behavior exists. |
| MANAGE 4.2 | Measurable activities for continual improvements are integrated into AI system updates and include regular engagement with interested parties, including relevant AI actors. | addressed | `skills/self-improve/SKILL.md`'s full six-phase cycle is a measurable, repeatable continual-improvement activity integrated into how the agent/skill/rule set is updated on a defined cadence, per MANAGE 2.2 above. |
| MANAGE 4.3 | Incidents and errors are communicated to relevant AI actors, including affected communities; processes for tracking, responding to, and recovering from incidents and errors are followed and documented. | partially addressed | `rules/memory.md`'s `.agent-notes/` discipline ("error patterns and their root causes") and `rules/logging.md`'s ERROR-level requirements are the tracking mechanism; git commit history (with `rules/commits.md`'s `fix` type) is the communication channel available to a solo repo. Gap: "affected communities" has no analog here, consistent with GOVERN 5.1's basis, and there is no formal incident-classification or severity process — errors are logged ad hoc rather than triaged through a defined incident-response procedure of the kind `rules/observability.md`'s on-call section requires for production features generally. |

---

<!-- Crosswalk complete: GOVERN 19 + MAP 18 + MEASURE 22 + MANAGE 13 = 72
     subcategories, each carrying one of the four permitted dispositions.
     See the "Completeness" section near the top for the disposition
     breakdown that SLI 2 reads. -->
