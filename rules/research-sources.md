# Research Sources

Use this hierarchy when researching technical claims, CVEs, patterns,
or design decisions. Start at tier 1; only descend when the higher
tier has no answer.

## Tier 1 — Authoritative (trust directly)

Use for: CVEs, vulnerability data, runtime behavior, standards.

### Vulnerability and security data
- **NVD** (`nvd.nist.gov`) — CVE database with CVSS scores
- **OSV** (`osv.dev`) — open-source vulnerability database
- **CISA** (`cisa.gov/known-exploited-vulnerabilities`) — actively exploited
- **Vendor security advisories** — GitHub Security Advisories, AWS Bulletins

### Standards and official documentation
- **Official language/framework documentation** — MDN, Python docs, Rust reference, Go spec
- **RFCs** — IETF RFCs for protocol behavior (`rfc-editor.org`)
- **W3C specifications** — web platform standards

## Tier 2 — Peer-reviewed (high confidence, cite the paper)

Use for: algorithm selection, data structure choices, protocol design,
security technique evaluation.

- **USENIX** — OSDI, SOSP, NSDI, USENIX Security, ATC
- **ACM** — CCS, SIGOPS, PLDI, SOCC, SIGMOD
- **IEEE** — S&P (Oakland), IEEE Transactions on Software Engineering
- **NDSS** — Network and Distributed System Security

When citing, include: author(s), title, venue, year.

## Tier 3 — High-quality practitioner (trust with verification)

Use for: implementation patterns, architecture decisions, operational
practices. Cross-reference when the claim is non-obvious.

- **Google SRE** — `sre.google/sre-book` and `sre.google/workbook`
- **Netflix Tech Blog** — `netflixtechblog.com`
- **Cloudflare Blog** — `blog.cloudflare.com`
- **AWS Architecture Center** — `aws.amazon.com/architecture`
- **Stripe Engineering** — `stripe.com/blog/engineering`
- **Martin Fowler** — `martinfowler.com` (patterns, refactoring, DDD)
- **High Scalability** — `highscalability.com`

These sources have production credibility but are not peer-reviewed.
Treat as strong evidence, not ground truth.

## Tier 4 — arxiv (preprints — AI/ML only)

Use **only** for AI, ML, and LLM topics, where the field moves faster
than journal timelines.

- Always flag the finding as: "preprint, not peer-reviewed"
- Prefer papers from established research groups (Anthropic, DeepMind,
  Google Brain, CMU, MIT, Stanford, Berkeley, ETH Zürich)
- For empirical claims (benchmark numbers, capability evaluations),
  wait for replication or use with explicit uncertainty

Do not use arxiv as a source for:
- Security vulnerability claims
- Production system design decisions
- Performance characteristics of specific runtimes or databases

## Tier 5 — General web (background context only)

Use for: orienting to a topic, finding the right vocabulary, locating
tier 1–4 sources. Never as the sole source for a technical decision.

- Stack Overflow: useful for identifying common patterns; verify against
  official docs before relying on
- Wikipedia: background and terminology; always follow citations to
  primary sources
- Personal/corporate tech blogs (outside tier 3): treat as anecdote,
  not evidence

## How to cite in code and docs

When a non-obvious design decision is based on external research:

```
// Per USENIX Security '14 (Hüls et al.): constant-time comparison
// prevents timing attacks on HMAC verification.
```

```
// Per Google SRE Book §19: alert on burn rate, not error count.
// Fast-burn: 2% budget in 1h; slow-burn: 5% budget in 6h.
```

Citing sources in code comments serves future maintainers who need to
understand why a non-obvious approach was chosen.
