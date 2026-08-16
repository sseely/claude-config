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
Across the full Profile: 29 rows `addressed`, 30 `partially addressed`, 7
`not addressed`, 6 `out of scope`. Every `not addressed` row states what
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
| GOVERN 1.3 | Processes/procedures/practices determine needed risk-management activity level based on organizational risk tolerance. | partially addressed | Per fleet decision FD-9, `docs/fleet/risk-register.md`'s "Selection rule (T11's interface contract)" ties a real risk-management activity — TEVV evaluation effort — mechanically to the register's Score: T11 selects its top-5 eval targets by sorting Score descending, not by a name asserted up front. Gap narrows but persists: only *evaluation* effort is tier-differentiated; other controls (complexity limits, review discipline) apply flatly regardless of risk tier. |
| GOVERN 1.4 | The risk management process and its outcomes are established through transparent policies/procedures based on organizational risk priorities. | addressed | `rules/autonomous-execution.md`'s Quality Gates, STOP/PUSH FORWARD decision rules, and consecutive-fix stop rule are transparent, version-controlled policies for how AI-driven risk decisions are reached and reviewed. |
| GOVERN 1.5 | Ongoing monitoring and periodic review of the risk management process are planned, with roles and review frequency defined. | addressed | `skills/self-improve/SKILL.md` Phase 2 (`references/phase2-audit-agents.md` Agent F reads all of `rules/` and `CLAUDE.md`; Agent D audits hooks/settings) is a repeatable review cycle. AD-9 sets a 180-day review cadence specifically for NIST-tied assets, matching the "determining the frequency of periodic review" clause for that asset class. |
| GOVERN 1.6 | Mechanisms are in place to inventory AI systems, resourced according to organizational risk priorities. | addressed | `docs/fleet/inventory.md` (generated by `scripts/gen-fleet-inventory.py`, drift-gated via `--check` per FD-7) tags every agent's Capability tier and Model pinning across `agents/<NN-category>/*.md` (127 files) plus 3 loose at `agents/` root (`explore.md`, `plan.md`, `plantuml-visual-qa.md`) — 130 total; `docs/fleet/risk-register.md` scores all 130 agents on Likelihood × Magnitude × Score × Tier. The named gap — "no living inventory document tags each agent/skill by risk tier" — is closed: both documents are generated/derived, not hand-maintained prose that can silently go stale. |
| GOVERN 1.7 | Processes are in place for decommissioning/phasing out AI systems safely, without increasing risk or decreasing trustworthiness. | partially addressed | `docs/fleet/lifecycle.md`'s Procedure section defines a search/confirm/delete/verify sequence for retiring an agent, skill, or hook, backed by `scripts/check-references.py`. Capped at partial: per FD-8, `check-references.py` is report-only and always exits `0` — nothing blocks a retirement that skips the procedure or leaves a dangling reference. |

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
| GOVERN 5.1 | Policies/practices collect, consider, prioritize, and integrate feedback from those external to the team on potential impacts. | not addressed | Per FD-10 (`docs/fleet/charter.md`, "The working arrangement, stated plainly"), a second developer is now a real party external to the operator, reviewing downstream products this configuration produces. That makes a policy to collect her feedback on potential impacts of this configuration conceivable — no longer structurally inapplicable — but no such policy exists. Real gap, distinct from the pre-FD-10 basis at GOVERN 2.2/2.3/3.1. |
| GOVERN 5.2 | Mechanisms enable the team to regularly incorporate adjudicated external feedback into system design and implementation. | not addressed | Tracks GOVERN 5.1 above: per FD-10 (`docs/fleet/charter.md`), an external party now exists, so the prior out-of-scope basis no longer holds. A mechanism to incorporate her feedback has nothing to incorporate while GOVERN 5.1's collection policy remains unbuilt. Real gap, contingent on GOVERN 5.1. |

### GOVERN 6 — Policies and procedures addressing AI risk from third-party software, data, and supply-chain issues

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| GOVERN 6.1 | Policies/procedures address AI risks from third-party entities, including third-party IP infringement risk. | partially addressed | `agents/06-developer-experience/dependency-manager.md`'s checklist commits to "100% license compliance" and enumerates supply-chain, typosquatting, and CVE risk for conventional dependencies; `skills/upgrade-deps/SKILL.md` runs `dependency-manager` and `security-auditor` in parallel before every upgrade. `docs/fleet/charter.md`'s "Third-party AI constraints (GOVERN 6.1, MAP 4.1)" section now adds real content on AI-specific third-party risk: Anthropic's models and the Serena MCP server are named explicitly, though the section states plainly it is "documentation of intended use, not a control." Gap narrows but persists: none of these address IP-infringement risk specific to AI-generated code (training-data provenance, output similarity to licensed training examples) — GOVERN 6.1's AI-specific infringement clause remains unaddressed. |
| GOVERN 6.2 | Contingency processes handle failures or incidents in third-party data or AI systems deemed high-risk. | addressed | `rules/error-handling.md`'s "External calls" section (mandatory timeouts, error handlers that log and re-throw) and `rules/retry-idempotency.md`'s retry policy (bounded attempts, non-retryable 4xx classification, idempotency keys) are the contingency processes for third-party service failures, including third-party AI/data dependencies reached over HTTP. |

---

## MAP

### MAP 1 — Context is established and understood

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MAP 1.1 | Intended purposes, beneficial uses, context-specific laws/norms, and prospective deployment settings are understood and documented. | addressed | This crosswalk's own "What 'applicable' means" section above and `docs/nist-ai-rmf/README.md`'s "Verified provenance" section establish intended purpose, deployment setting, and scope boundaries for the AI system in view — a Profile documenting its own context is the MAP 1.1 outcome for this repo. |
| MAP 1.2 | Interdisciplinary AI actors, competencies, and demographic diversity for establishing context are documented; collaboration is prioritized. | out of scope | Solo configuration repo — one operator establishes context alone; no interdisciplinary human team whose diversity or collaboration could be documented. (The ten `agents/` category directories represent specialization of a single author's tooling, not team diversity.) |
| MAP 1.3 | The organization's mission and relevant goals for AI technology are understood and documented. | addressed | `docs/fleet/charter.md`'s "Why this repo uses AI agents" section states the mission directly: leverage for a solo operator who "cannot review every dependency bump, run every security audit, and re-derive every architectural pattern from scratch on every task." The named gap — no single artifact stating why this repo uses AI agents this way — is closed. |
| MAP 1.4 | The business value or context of business use has been clearly defined or re-evaluated. | addressed | `docs/fleet/charter.md`'s "What the configuration is expected to deliver, and how each claim is checked" section defines business value directly — every claim about what the 130-agent, 29-skill configuration is expected to deliver is labeled `checkable` (naming the gate) or `unverified intention` (no check exists yet), stating how each would be falsified. Real gap closed. |
| MAP 1.5 | Organizational risk tolerances are determined and documented. | addressed | `rules/autonomous-execution.md`'s "STOP and wait for human input" and "PUSH FORWARD with judgment" lists are an explicit, documented boundary on how much AI-driven risk this repo tolerates without human sign-off — the operational form of a risk-tolerance statement. |
| MAP 1.6 | System requirements are elicited from and understood by relevant AI actors; design decisions account for socio-technical implications. | addressed | `rules/architecture.md`'s ADR format (Context/Decision/Consequences, required when a decision is expensive to reverse or crosses a service boundary) and this mission's own `decisions.md` (AD-1 through AD-10) are system requirements elicited from the relevant AI actor (the operator), with socio-technical implications stated in each Consequences section. |

### MAP 2 — Categorization of the AI system is performed

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MAP 2.1 | The specific tasks and methods used to implement the AI system's supported tasks are defined. | addressed | Every `agents/*.md`'s YAML frontmatter (`name`, `description`, `tools`, `model`) and every `skills/*/SKILL.md`'s frontmatter define the specific task and method the AI system supports — the RMF's own examples ("classifiers, generative models, recommenders") map to this repo's equivalents: reviewers, generators, auditors, orchestrators. |
| MAP 2.2 | Information about the AI system's knowledge limits and how output may be overseen by humans is documented. | addressed | `CLAUDE.md`'s Verification section requires declared confidence levels (HIGH/MEDIUM/LOW/UNKNOWN) on any claim whose accuracy matters, and `rules/research-sources.md` ties each level to the source tier that can support it — this documents knowledge limits and how output should be overseen. |
| MAP 2.3 | Scientific integrity and TEVV considerations (experimental design, data collection, trustworthiness, construct validation) are identified and documented. | partially addressed | `docs/fleet/tevv.md` defines TEVV for the agents' own decision process: a case schema, four categories (`format`, `adherence`, `accuracy`, `refusal`), pass/fail criteria, and a cadence (after every `/self-improve` cycle, ad hoc). `evals/results.jsonl` records a first real run against the risk register's top 5 (5 cases: 1 pass, 4 fail counting the retried case's final verdict; 7 records including 2 retry attempts). Capped at partial: `tevv.md` states plainly that `accuracy` and `refusal` grading requires a grader that "does not exist yet" — those categories are specified but unscored. |

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
| MAP 4.1 | Approaches for mapping AI technology and legal risks of components, including third-party data/software and IP infringement, are in place and documented. | partially addressed | `agents/06-developer-experience/dependency-manager.md` and `skills/upgrade-deps/SKILL.md` map conventional software supply-chain and licensing risk, followed on every dependency upgrade. `docs/fleet/charter.md`'s "Third-party AI constraints (GOVERN 6.1, MAP 4.1)" section adds real content specifically for AI-technology legal/dependency risk — Anthropic's models and the Serena MCP server, both named and their governance boundary stated plainly ("documentation of intended use, not a control"). Still doesn't reach IP infringement or training-data provenance, which MAP 4.1's outcome text names explicitly — the same gap noted at GOVERN 6.1. |
| MAP 4.2 | Internal risk controls for AI system components, including third-party AI technologies, are identified and documented. | partially addressed | `hooks/check-complexity.py` (per `rules/code-principles.md`) and `rules/security.md`'s boundary-validation requirements are internal risk controls for AI-generated code changes. `hooks/check-frontmatter.py` adds a genuine new blocking `PostToolUse` control, validating agent/skill frontmatter against `docs/fleet/schema/*.frontmatter.schema.json` before a write completes. Gap: no control inventory exists for the third-party AI components this repo itself depends on (the Serena MCP server per `rules/lsp.md`; the model providers named in `rules/parallelism.md`'s routing table) — untouched by either control. |

### MAP 5 — Impacts to individuals, groups, communities, organizations, and society are characterized

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MAP 5.1 | Likelihood and magnitude of each identified impact are identified and documented, informed by expected use, past incidents, and external feedback. | partially addressed | `docs/fleet/risk-register.md` scores Likelihood × Magnitude × Score × Tier for all 130 agents in `docs/fleet/inventory.md`. Capped at partial: the register scopes itself to agents only — "skills are out of scope for this pass" by its own statement — and its Magnitude proxy (tool count ≥15) is a self-labeled judgment call, not derived from incident history or external feedback. |
| MAP 5.2 | Practices and personnel supporting regular engagement with relevant AI actors, integrating feedback about impacts, are in place. | addressed | `skills/self-improve/SKILL.md` Phase 2 audit agents and `references/finding-resolution.md`'s three-tier contradiction rubric and 0–100 scoring/filtering thresholds are the practice and cadence for regularly reviewing the configuration and integrating findings about its impacts into system design — the operator's own structured self-review substitutes for external engagement, consistent with GOVERN 5.1/5.2's out-of-scope basis above. |

---

## MEASURE

### MEASURE 1 — Appropriate methods and metrics are identified and applied

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MEASURE 1.1 | Approaches and metrics for measurement of AI risks enumerated during MAP are selected for implementation, starting with the most significant risks; risks or trustworthiness characteristics that will not or cannot be measured are properly documented. | addressed | This crosswalk's own `out of scope` rows above (GOVERN 2.2, GOVERN 2.3, GOVERN 3.1, MAP 1.2, MEASURE 1.3, MEASURE 2.2), each carrying a stated reason, are exactly this practice applied reflexively — per AD-8's own consequence, "deliberate exclusions become documented rather than silent, which is itself MEASURE 1.1." |
| MEASURE 1.2 | Appropriateness of AI metrics and effectiveness of existing controls are regularly assessed and updated, including reports of errors and potential impacts on affected communities. | partially addressed | `docs/fleet/monitoring.md`'s "MEASURE 1.2" section names two metrics under active review (the 90/90/90 coverage floor, the hook-enforced complexity limits), reassessed via `skills/self-improve` audits; `skills/self-improve/references/fleet-monitoring-drift.md`'s Agent B flags any monitoring signal `monitoring.md` presents as already-defined but lacking `.agent-notes/` measurement evidence as a Should-fix task. Gap persists, stated by `monitoring.md` itself: "'Periodic' today means 'whenever the operator decides to invoke it'" — no scheduler exists. |
| MEASURE 1.3 | Internal experts who did not serve as front-line developers and/or independent assessors are involved in regular assessments and updates; domain experts, users, external AI actors, and affected communities are consulted per risk tolerance. | out of scope | Solo configuration repo — no personnel independent of the operator exist to serve as internal experts or independent assessors, consistent with GOVERN 2.2/2.3's out-of-scope basis. |

### MEASURE 2 — AI systems are evaluated for trustworthy characteristics

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MEASURE 2.1 | Test sets, metrics, and details about the tools used during TEVV are documented. | addressed | `docs/fleet/tevv.md` comprehensively documents test sets (the `evals/cases/<agent>/<category>-<slug>.json` schema), metrics (four categories: `format`, `adherence`, `accuracy`, `refusal`), and tooling (`evals/run_evals.py`, `evals/checks.py`) — exactly what the outcome text asks for ("documented," not "fully implemented for every category"). The named gap — no equivalent TEVV documentation for the agents' own behavior — is closed. |
| MEASURE 2.2 | Evaluations involving human subjects meet applicable requirements, including human subject protection, and are representative of the relevant population. | out of scope | No human-subjects evaluation is conducted anywhere in this repo's practice — there is no study population to protect or represent. |
| MEASURE 2.3 | AI system performance or assurance criteria are measured qualitatively or quantitatively and demonstrated for conditions similar to deployment; measures are documented. | partially addressed | `rules/testing.md`'s 90/90/90 floor is a quantitative assurance criterion applied to code the agents produce, enforced mechanically via `hooks/check-complexity.py`. `evals/results.jsonl` now adds real assurance-criteria measurement for actual headless agent invocations under deployment-like conditions. Held at partial: only 5 of 159 fleet files have been tested, across one run, and only the `format`/`adherence` categories are graded — task-completion accuracy remains `ungraded` per `docs/fleet/tevv.md`. |
| MEASURE 2.4 | The functionality and behavior of the AI system and its components — as identified in MAP — are monitored when in production. | partially addressed | `docs/fleet/monitoring.md`'s "MEASURE 2.4" section names three concrete drift signals — frontmatter parse rate, inventory divergence (via `scripts/gen-fleet-inventory.py --check`, FD-7), and the `rules/*.md` line-count budget — checked by `skills/self-improve/references/fleet-monitoring-drift.md`'s Agent B pass each cycle. Gap: these are configuration-file drift signals, not runtime behavioral drift of the agents' actual decisions in production. |
| MEASURE 2.5 | The AI system to be deployed is demonstrated to be valid and reliable; limitations of generalizability beyond the conditions under which the technology was developed are documented. | addressed | `docs/nist-ai-rmf/trustworthiness.md` §1 "Valid and Reliable" documents this subcategory directly — it is named in that asset's own `subcategories-covered` header. |
| MEASURE 2.6 | The AI system is evaluated regularly for safety risks; residual risk does not exceed tolerance and the system can fail safely; safety metrics reflect reliability, robustness, monitoring, and response times. | partially addressed | `docs/nist-ai-rmf/trustworthiness.md` §2 "Safe" states the framework's principle, and `rules/autonomous-execution.md`'s STOP conditions and consecutive-fix stop rule are the operational mechanism bounding autonomous action when risk rises (a "fail safely" behavior). `evals/results.jsonl`'s `duration_ms` field now adds a real quantified metric — response time per case, recorded on every run. Gap narrows but persists: reliability and robustness remain unquantified beyond this single baseline run, and the STOP-rule triggers themselves are still qualitative, not measured metrics. |
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
| MEASURE 3.1 | Approaches, personnel, and documentation are in place to regularly identify and track existing, unanticipated, and emergent AI risks based on factors such as intended and actual performance in deployed contexts. | partially addressed | `skills/self-improve/SKILL.md`'s periodic Phase 1/Phase 2 audit agents track ecosystem and configuration risk, writing findings to `.agent-notes/self-improve-phase*-*.md`; `rules/memory.md`'s `.agent-notes/` discipline captures emergent issues found during execution ("error patterns and their root causes"). `docs/fleet/risk-register.md` now adds a dedicated risk-tracking document — Likelihood × Magnitude × Score × Tier for all 130 agents — with `skills/self-improve/references/fleet-monitoring-drift.md`'s Agent B wired to check it each cycle. Gap: both mechanisms remain operator-triggered, not continuous, and nothing tracks drift in the risk scores themselves over time — only in the config files the scores derive from. |
| MEASURE 3.2 | Risk tracking approaches are considered for settings where AI risks are difficult to assess using currently available measurement techniques or where metrics are not yet available. | partially addressed | `docs/fleet/tevv.md`'s "Pass/fail criteria" section names and preserves the class of risk that resists mechanical measurement: cases graded `judgment` (covering `accuracy`, `refusal`, and any `adherence` case that can't reduce to a mechanical check) are recorded as `ungraded` rather than silently dropped, pending a grader that "does not exist yet." The pathway is designed but unexercised — no `accuracy`/`refusal` cases have been written or scored. |
| MEASURE 3.3 | Feedback processes for end users and impacted communities to report problems and appeal system outcomes are established and integrated into AI system evaluation metrics. | not addressed | Per FD-10 (`docs/fleet/charter.md`, "The working arrangement, stated plainly"), a population external to the operator now exists — the second developer who reviews downstream products. This is no longer structurally inapplicable, but nothing routes her findings on those downstream products back into this repo's own risk tracking (`.agent-notes/`, `docs/fleet/risk-register.md`). A real, closeable gap, not a non-applicable subcategory. |

### MEASURE 4 — Feedback about efficacy of measurement is gathered and assessed

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MEASURE 4.1 | Measurement approaches for identifying AI risks are connected to deployment context(s) and informed through consultation with domain experts and other end users; approaches are documented. | partially addressed | This crosswalk itself is the documented measurement approach, connected to this repo's specific deployment context per the "What 'applicable' means" section above. Gap: it was not informed by consultation with domain experts or end users external to the operator — consistent with the solo-repo constraint, but the consultation element of 4.1 is genuinely unmet even though the documentation element is. |
| MEASURE 4.2 | Measurement results regarding AI system trustworthiness in deployment context(s) and across the AI lifecycle are informed by input from domain experts and relevant AI actors to validate whether the system is performing consistently as intended; results are documented. | partially addressed | `evals/results.jsonl` now holds actual measurement results to validate against — a first run against the risk register's top-5 agents (5 cases; 7 records including retries: 1 pass, 4 fail, 2 error), where previously none existed. Gap: MEASURE 4.2's consultation-with-domain-experts element remains unmet (solo-repo basis), and one snapshot doesn't demonstrate consistency "across the AI lifecycle." |
| MEASURE 4.3 | Measurable performance improvements or declines based on consultations with relevant AI actors, including affected communities, and field data about context-relevant risks and trustworthiness characteristics are identified and documented. | partially addressed | `evals/results.jsonl` is append-only and git-committed (per fleet decision FD-4), so version history is the future trend record MEASURE 4.3 asks for. Capped at partial: a first run is a baseline, not a trend — one data point per case exists as of this writing, and no "affected communities" population exists to consult, per the solo-repo basis at GOVERN 5.1. |

---

## MANAGE

### MANAGE 1 — AI risks based on assessments and other analytical output from the MAP and MEASURE functions are prioritized, responded to, and managed

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MANAGE 1.1 | A determination is made as to whether the AI system achieves its intended purposes and stated objectives and whether its development or deployment should proceed. | addressed | `docs/nist-ai-rmf/trustworthiness.md`'s closing section names this subcategory directly: "MANAGE 1.1 is where the weighing becomes an organizational determination: whether the system achieves its intended purpose and whether development or deployment should proceed." `CLAUDE.md`'s "Complex Tasks" outline-for-review gate is the mechanism through which that determination is actually made per feature. |
| MANAGE 1.2 | Treatment of documented AI risks is prioritized based on impact, likelihood, and available resources or methods. | partially addressed | `docs/fleet/risk-register.md` now scores Likelihood × Magnitude × Score for all 130 agents in `docs/fleet/inventory.md`, and per fleet decision FD-9, T11's eval-target selection is tied mechanically to that Score — a documented, scored resourcing decision where none existed before. `rules/autonomous-execution.md`'s STOP-condition list remains an additional, informal prioritization layer. Held at partial: broader risk-treatment choices (mitigate/transfer/avoid/accept, per MANAGE 1.3) are not score-driven — only eval-resourcing is. |
| MANAGE 1.3 | Responses to the AI risks deemed high priority are developed, planned, and documented; response options include mitigating, transferring, avoiding, or accepting. | partially addressed | `rules/architecture.md`'s ADR requirement documents response decisions (Context/Decision/Consequences) for architecture-level risk, and `rules/autonomous-execution.md`'s STOP conditions are a documented "avoid" response (halt and escalate to the human). Gap: no unified risk-response register maps each MAP-identified risk to an explicit mitigate/transfer/avoid/accept choice — responses are scattered across ADRs and STOP rules rather than centrally tracked. |
| MANAGE 1.4 | Negative residual risks (the sum of all unmitigated risks) are documented to both downstream acquirers of AI systems and end users. | partially addressed | Per FD-10 (`docs/fleet/charter.md`, "The working arrangement, stated plainly"), a downstream reviewer now exists. `docs/fleet/charter.md`'s delivery section is the standing disclosure: it states openly that this configuration is AI-operated, and labels every claim about what it delivers either `checkable` (naming the gate that verifies it) or `unverified intention` — a written record of what has *not* been established, readable by any downstream party. Gap: that disclosure is repo-wide and static, not per-change. Nothing surfaces residual risk at the point a specific output is handed off — what the model did not verify in *that* work, or what was accepted without independent check. Commit-trailer authorship disclosure was previously cited here and has been retired by operator decision (`rules/commits.md`, "No tool attribution"); it disclosed authorship, never residual risk, so its removal does not change this row's gap. |

### MANAGE 2 — Strategies to maximize AI benefits and minimize negative impacts are planned, prepared, implemented, documented, and informed by input from relevant AI actors

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MANAGE 2.1 | Resources required to manage AI risks are taken into account, along with viable non-AI alternative systems, approaches, or methods, to reduce the magnitude or likelihood of potential impacts. | partially addressed | `rules/parallelism.md`'s "Default to single-agent; split only when a specific bottleneck is demonstrated" is a documented lighter-weight-alternative consideration that resists unnecessary AI orchestration cost. Gap: this governs orchestration cost specifically, not a broader non-AI-alternative evaluation — `rules/architecture.md`'s "Fitness functions" section pushes toward deterministic checks over AI-driven review ("express every architectural constraint as a lint/import check/test — not code review") but the two are not connected as a stated risk-reduction strategy. |
| MANAGE 2.2 | Mechanisms are in place and applied to sustain the value of deployed AI systems. | addressed | `skills/self-improve/SKILL.md`'s six-phase cycle (ecosystem research, configuration audit, dedup/score, report, task file, registry update) is precisely this mechanism — a periodic process that keeps the agent/skill/rule set current and prevents value decay as the Claude Code ecosystem evolves. |
| MANAGE 2.3 | Procedures are followed to respond to and recover from a previously unknown risk when it is identified. | addressed | `rules/diagnosis.md`'s mandatory mechanism-before-fix procedure (instrument before hypothesizing, no fix before a stated mechanism, two valid stop conditions) is the response/recovery procedure applied uniformly to any newly identified defect, AI-specific or not. |
| MANAGE 2.4 | Mechanisms are in place and applied, and responsibilities are assigned and understood, to supersede, disengage, or deactivate AI systems that demonstrate performance or outcomes inconsistent with intended use. | partially addressed | `docs/fleet/lifecycle.md`'s Procedure section (search/confirm/delete/verify, backed by `scripts/check-references.py`) is mechanically applicable to disengaging a misbehaving agent, not just planned retirement. Gap: purely reactive and manually triggered — no detection mechanism tells the operator an agent is misbehaving in the first place; same gap as GOVERN 1.7, operational rather than lifecycle variant. |

### MANAGE 3 — AI risks and benefits from third-party entities are managed

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MANAGE 3.1 | AI risks and benefits from third-party resources are regularly monitored, and risk controls are applied and documented. | partially addressed | Per AD-3: `agents/06-developer-experience/dependency-manager.md`'s security-scanning checklist (CVE checking, supply-chain analysis, SBOM generation) and `skills/upgrade-deps/SKILL.md`'s Phase 2 parallel `dependency-manager` + `security-auditor` run monitor third-party software risk on every upgrade cycle; `rules/architecture.md`'s migration patterns (Feature flag, Blue-green) supply the "risk controls applied" half for a failing third-party dependency. `docs/fleet/lifecycle.md`'s "Model and API-surface monitoring (MANAGE 3.2)" section documents a recurring mechanism: `skills/self-improve`'s Phase 1 Agent B compares deprecated model/alias guidance against every agent's `model:` frontmatter field each cycle, writing findings to `.agent-notes/self-improve-phase1-B.md`. Gap narrows but persists: the Serena MCP server — named in the original gap text — remains unmonitored by this or any mechanism. |
| MANAGE 3.2 | Pre-trained models which are used for development are monitored as part of AI system regular monitoring and maintenance. | partially addressed | `docs/fleet/lifecycle.md`'s "Model and API-surface monitoring (MANAGE 3.2)" section and `skills/self-improve/references/fleet-monitoring-drift.md` together define a real recurring mechanism: Agent B compares deprecated-model guidance against every agent's `model:` frontmatter field each self-improve cycle; a hit produces a Must-fix task in `code-review-tasks.md`. Gap: the Serena MCP server remains unmonitored, and the cadence is operator-triggered (`/self-improve`), not scheduled. |

### MANAGE 4 — Risk treatments, including response and recovery, and communication plans for the identified and measured AI risks are documented and monitored regularly

| Subcategory | Outcome (abbreviated) | Disposition | Where / Why |
|---|---|---|---|
| MANAGE 4.1 | Post-deployment AI system monitoring plans are implemented, including mechanisms for capturing and evaluating input from users and other relevant AI actors, appeal and override, decommissioning, incident response, recovery, and change management. | partially addressed | `docs/fleet/monitoring.md`'s "MANAGE 4.1" section documents real near-miss capture via `.agent-notes/{task-id}.md` per `rules/memory.md` — structured entries recording unexpected behavior, error patterns, and root causes before a task finishes. Held at partial by the artifact's own honesty: it states there is no appeal path "beyond the operator revising a decision," and no feedback channel exists beyond the operator reviewing agent output directly. |
| MANAGE 4.2 | Measurable activities for continual improvements are integrated into AI system updates and include regular engagement with interested parties, including relevant AI actors. | addressed | `skills/self-improve/SKILL.md`'s full six-phase cycle is a measurable, repeatable continual-improvement activity integrated into how the agent/skill/rule set is updated on a defined cadence, per MANAGE 2.2 above. |
| MANAGE 4.3 | Incidents and errors are communicated to relevant AI actors, including affected communities; processes for tracking, responding to, and recovering from incidents and errors are followed and documented. | partially addressed | `docs/fleet/monitoring.md`'s "MANAGE 4.3" section names where errors surface (quality-gate failures, `.agent-notes/` entries, commit history); `skills/self-improve/references/fleet-monitoring-drift.md`'s "The two drift conditions" section defines a real severity taxonomy — Must-fix for a deprecated model reference, Should-fix for an unmeasured monitoring signal. Gap narrowed for those two specific failure classes only, not closed fleet-wide: no general incident-classification or severity process exists for errors outside self-improve's drift check. |

---

<!-- Crosswalk complete: GOVERN 19 + MAP 18 + MEASURE 22 + MANAGE 13 = 72
     subcategories, each carrying one of the four permitted dispositions.
     See the "Completeness" section near the top for the disposition
     breakdown that SLI 2 reads. -->
