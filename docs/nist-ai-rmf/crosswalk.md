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
  ]
last-verified: 2026-08-09
status: active
---

# NIST AI RMF crosswalk — GOVERN and MAP

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

<!-- A2b (batch-3) appends MEASURE and MANAGE sections below this line,
     following the same category/table structure used for GOVERN and MAP
     above. Do not restructure the sections above to accommodate it. -->
