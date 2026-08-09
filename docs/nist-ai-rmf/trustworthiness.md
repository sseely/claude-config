---
source: NIST AI 100-1 — Artificial Intelligence Risk Management Framework
edition: AI RMF 1.0 (January 2023)
source-url: https://airc.nist.gov/airmf-resources/airmf/
subcategories-covered: [MEASURE 2.5, MEASURE 2.6, MEASURE 2.7, MEASURE 2.8,
  MEASURE 2.9, MEASURE 2.10, MEASURE 2.11, MANAGE 1.1]
last-verified: 2026-08-09
status: active
---

# Trustworthiness characteristics of AI systems

§3 of NIST AI 100-1 articulates seven characteristics of trustworthy AI:
approaches that enhance them reduce negative AI risk. Figure 4 gives them
structure, not a flat list — **Valid and Reliable** is the necessary base
condition the others sit on; **Accountable and Transparent** is drawn as a
vertical band because it relates to all six others rather than standing
beside them. All seven are socio-technical attributes: properties of the
system's use in context, not properties an algorithm alone can hold.

## 1. Valid and Reliable

The base condition. *Validity* is confirmation, through objective evidence,
that requirements for a specific intended use have been fulfilled (ISO
9000:2015). *Reliability* is the ability to perform as required, without
failure, under given conditions for a given interval (ISO/IEC TS 5723:2022).
Accuracy and robustness both contribute to validity and **can be in tension
with one another**: accuracy measurements must pair with a clearly defined,
representative test set and documented methodology, while robustness
(generalizability) is the ability to hold performance across circumstances
not initially anticipated — a different, sometimes competing, goal from
tuning for accuracy on the expected-use distribution. MEASURE 2.5 requires
the deployed system be demonstrated valid and reliable, with generalizability
limits beyond training conditions documented.

## 2. Safe

AI systems should not, under defined conditions, lead to a state
endangering human life, health, property, or the environment (ISO/IEC TS
5723:2022). Safety improves through responsible design and deployment
practices, clear information to deployers on responsible use, responsible
decision-making by deployers and end users, and documentation of risk from
empirical incident evidence. Risks of serious injury or death call for the
most urgent risk-management prioritization. MEASURE 2.6 ties safety
evaluation to residual-risk tolerance and to the system's ability to fail
safely when operated beyond its knowledge limits.

## 3. Secure and Resilient

Related but **distinct** — do not collapse them. *Resilience* is the
ability to withstand unexpected adverse events or changes, or to maintain
function and degrade safely and gracefully when necessary. *Security*
**includes** resilience and adds protocols to avoid, protect against,
respond to, and recover from attacks. Resilience relates to robustness and
extends beyond data provenance to unexpected or adversarial use, abuse, or
misuse of the model or data. §3.3 names adversarial examples, data
poisoning, and exfiltration of models, training data, or IP through system
endpoints as common security concerns. MEASURE 2.7 evaluates and documents
security and resilience as identified in MAP.

## 4. Accountable and Transparent

Accountability presupposes transparency. *Transparency* is the extent to
which information about a system and its outputs is available to
individuals interacting with it — regardless of whether they are aware of
it — tailored to the AI actor's role and stage in the lifecycle. A
transparent system is **not necessarily** accurate, privacy-enhanced,
secure, or fair; but it is difficult to establish whether an opaque system
holds any of those properties. Accountability is proportional: when
consequences are severe, such as life or liberty at stake, developers and
deployers should proactively adjust transparency and accountability
upward. MEASURE 2.8 examines and documents transparency and accountability
risk as identified in MAP.

## 5. Explainable and Interpretable

A three-way distinction, and all three must survive together:
**transparency** answers *what happened*; **explainability** answers *how*
a decision was made — a representation of the mechanisms underlying the
system's operation; **interpretability** answers *why* a decision was made
and what it means to the user, in context of the system's designed
functional purpose. §3.5's premise: perceptions of negative risk stem from
an inability to make sense of, or contextualize, system output. Explainable
systems are easier to debug, monitor, audit, and govern. MEASURE 2.9
requires the model be explained, validated, and documented, and its output
interpreted within context, to inform responsible use and governance.

## 6. Privacy-Enhanced

Privacy covers the norms and practices safeguarding human autonomy,
identity, and dignity — freedom from intrusion, limiting observation, and
an individual's agency to consent to disclosure or control of facets of
identity. Privacy-related risk influences security, bias, and transparency,
and trades off against each. Privacy-enhancing technologies and
data-minimizing methods (de-identification, aggregation) support design for
this characteristic, but under conditions such as data sparsity they can
cost accuracy — which in turn affects fairness elsewhere in the system.
MEASURE 2.10 examines and documents the privacy risk identified in MAP.

## 7. Fair — with Harmful Bias Managed

Fairness addresses equality and equity, including harmful bias and
discrimination; standards of fairness are complex because perceptions of
fairness differ by culture and shift by application. Mitigating harmful
bias does **not** by itself make a system fair — predictions balanced
across demographic groups can still be inaccessible to individuals with
disabilities, or exacerbate the digital divide or existing systemic
disparities.

NIST names three bias categories, and each can occur **without prejudice
or discriminatory intent**:

- **Systemic** — in datasets, organizational norms and processes across
  the lifecycle, and the broader society that uses the system.
- **Computational and statistical** — in datasets and algorithmic
  processes, often from systematic errors due to non-representative
  samples.
- **Human-cognitive** — how an individual or group perceives system
  information to decide or fill in missing information; omnipresent
  across design, implementation, operation, and maintenance.

MEASURE 2.11 requires fairness and bias, as identified in MAP, to be
evaluated and documented.

## Trade-offs are inherent

§3 is explicit this is not a checklist to clear item by item. Tensions
named directly: interpretability against privacy, predictive accuracy
against interpretability, and privacy-enhancing techniques against accuracy
under data sparsity (which then reaches fairness). Analysis can establish
that a trade-off exists and characterize its extent — it **cannot** resolve
it. Resolution depends on the values at play in the relevant context and
must be reached transparently and justifiably. Different AI actors —
designer, developer, deployer — can reasonably weigh the same trade-off
differently by role. MANAGE 1.1 is where the weighing becomes an
organizational determination: whether the system achieves its intended
purpose and whether development or deployment should proceed.

## Trustworthiness is only as strong as its weakest characteristic

Addressing the seven individually will not, on its own, produce a
trustworthy system. Trustworthiness is a social concept that ranges across
a spectrum, and is only as strong as its weakest characteristic. §3 names
its own failure examples — a highly secure but unfair system; an accurate
but opaque and uninterpretable system; an inaccurate but secure,
privacy-enhanced, transparent system — as all undesirable, despite each
satisfying some subset of the seven cleanly. Balancing trade-offs among
characteristics is the joint responsibility of all AI actors, not a
property any single characteristic can deliver alone.
