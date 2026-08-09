# NIST AI RMF assets — index

This directory holds durable, source-traceable extracts of the NIST AI Risk
Management Framework (AI RMF) for use across this configuration repo. Assets
here are written in RMF voice and cite subcategories explicitly — they are a
governance register, not this repo's usual terse engineering prose (AD-4).
Each sibling asset carries the provenance header defined below so staleness
and edition drift are mechanically checkable.

## Verified provenance (as of 2026-08-09)

**Edition:** AI RMF 1.0 (January 2023) is still the current edition. The
live site states plainly: "AI RMF 1.0 is being revised" — no new numbered
edition (1.1, 2.0) has published yet. Verified directly against
`https://airc.nist.gov/` and cross-checked at
`https://airc.nist.gov/airmf-resources/airmf/`. Do not assume this has not
changed by the time you read it — re-verify per the staleness rule below.

**Playbook revision:** the most recent entry in NIST's own Playbook audit
log is **August 2023** ("added tagging for search on AI Actors and Topics
content", formatting changes, added the Crosswalk Documents section, added
the PDF export). No later entry exists. Source:
`https://airc.nist.gov/airmf-resources/playbook/audit-log/`. NIST states the
Playbook "will be updated after the AI RMF is revised" — the Playbook and
the core Framework are revision-locked together.

**Why 180 days, not 90 (AD-9):** the Framework's own front matter (NIST AI
100-1, "Update Schedule and Versions") states Playbook comments are
"reviewed and integrated on a semi-annual basis." A 90-day generic decay
window would flag this asset stale twice as often as the publisher's own
cadence — 180 days matches the source, not the repo's default.

## Provenance header schema

Every asset under `docs/nist-ai-rmf/` opens with this block. Field names
reuse `last-verified` and `status` from
`skills/self-improve/research-urls.md` so one staleness convention governs
the whole repo — do not invent parallel names.

```yaml
---
source: NIST AI 100-1 — Artificial Intelligence Risk Management Framework
edition: AI RMF 1.0 (January 2023)
source-url: https://airc.nist.gov/airmf-resources/airmf/
subcategories-covered: [GOVERN 1.1, GOVERN 1.2, ...]
last-verified: 2026-08-09
status: active
---
```

| Field | Meaning |
|---|---|
| `source` | The NIST publication this asset draws from. |
| `edition` | The verified edition string — read from the live site, never assumed. |
| `source-url` | The canonical AIRC page or DOI backing this asset's content. |
| `subcategories-covered` | Which GOVERN/MAP/MEASURE/MANAGE items this specific asset addresses — varies per asset. |
| `last-verified` | Date this asset's content was last checked against the live source. |
| `status` | `active` or `unreachable` — never silently dropped when a source 404s. |

## Canonical AIRC URLs

| Label | URL | Status | Last verified |
|---|---|---|---|
| AIRC home | https://airc.nist.gov/ | active | 2026-08-09 |
| AI RMF Core (framework) | https://airc.nist.gov/airmf-resources/airmf/ | active | 2026-08-09 |
| AI RMF Playbook | https://airc.nist.gov/airmf-resources/playbook/ | active | 2026-08-09 |
| Playbook audit log (revision history) | https://airc.nist.gov/airmf-resources/playbook/audit-log/ | active | 2026-08-09 |
| Glossary | https://airc.nist.gov/glossary/ | active | 2026-08-09 |
| AI RMF 1.0 document (DOI) | https://doi.org/10.6028/NIST.AI.100-1 | active | 2026-08-09 |
| Generative AI Profile (NIST AI 600-1, companion) | https://doi.org/10.6028/NIST.AI.600-1 | active | 2026-08-09 |
| Crosswalk Documents (AIRC) | https://airc.nist.gov/airmf-resources/crosswalks/ | active | 2026-08-09 |

A 404, redirect-off-domain, or otherwise-failed URL is recorded here with
`status: unreachable` and kept — never silently removed — matching the
`research-urls.md` registry convention. `/self-improve` (AD-9) mirrors this
table into `research-urls.md` and re-checks it each run.

## Contents

- `README.md` — this file: provenance foundation, header schema, canonical
  URLs.
- `crosswalk.md` (forthcoming) — the central asset: maps applicable
  subcategories to where this configuration addresses them, per AD-8.
- Additional subcategory-scoped assets land here as later mission tasks
  complete, each carrying the header schema above.

Table 1–4 of NIST AI 100-1 (§5, AI RMF Core) are the authoritative source
for subcategory enumeration for every asset in this directory. The Playbook
PDF's extracted text drops headers and must not be used to enumerate
subcategories.
