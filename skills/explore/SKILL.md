---
name: explore
description: Explore an unfamiliar codebase. Creates a docs/architecture/ folder, identifies related repos in the same GitHub org, clones them locally, then produces architecture diagrams, component maps, and an overview doc using Mermaid and Markdown.
disable-model-invocation: false
context: fork
---

Model routing: Sonnet for implementation; Haiku for verification/scoring; Opus only for explicit architectural decisions.

Perform a full architecture exploration of the current project and its related repositories within the same GitHub organization.

## Model Routing

| Step | Agent role | Model |
|------|-----------|-------|
| Per-repo analysis agents | Code/architecture reading | `sonnet` |
| Diagram generation | Mermaid/doc writing | `sonnet` |
| Dedup / inventory passes | Pass/fail, counting | `haiku` |

## Step 0 — Resume check

Before doing anything else, check whether `docs/architecture/overview.md`
exists in the current working directory.

**If it exists:**
1. List all files present under `docs/architecture/`.
2. Print: `Existing architecture docs found: [list files]`
3. Ask the user: "Architecture docs already exist. Supplement (add missing
   sections) or regenerate from scratch?"
   - **Supplement**: skip Setup and re-run only the deliverable sections
     for files that are missing or stale.
   - **Regenerate**: proceed normally from Setup, overwriting all existing
     docs.

**If it does not exist:** continue to Setup as normal.

---

## Setup

1. Create `docs/architecture/` in the current working directory if it doesn't exist.
2. Detect the GitHub org by running `gh repo view --json owner --jq '.owner.login'` in the current project. Store the result as `ORG`.

## Identify related repositories

4. Use `gh repo list $ORG --limit 200 --json name,description` to list repos in the org.
5. Read the current project's name, dependencies, and any service references (imports, config files, docker-compose, README) to infer which other repos in the org are directly related.
6. Determine the parent directory of the current project: `PARENT=$(git rev-parse --show-toplevel | xargs dirname)`.
7. For each related repo that isn't already cloned as a sibling of the current project:
   - Clone it into `$PARENT/<repo-name>` using `gh repo clone $ORG/<repo-name> $PARENT/<repo-name>`
   - On a transient `gh`/clone/network failure (5xx, connection refused, read timeout), retry per `~/.claude/rules/retry-idempotency.md` (max 3 attempts, exponential backoff) before skipping that repo. Do not retry on 4xx (e.g. 404 repo not found) except 429.

## Analyze each repository (current + cloned)

For each repo, identify and record in `docs/architecture/inventory.md`:

- **Runtime versions**: language version, framework version, runtime (Node, .NET, JVM, etc.)
- **Languages used**: primary + any secondary
- **Key components**: services, workers, schedulers, CLI tools
- **Databases**: type, ORM/client used
- **External services**: queues, caches, third-party APIs, auth providers
- **Entry points**: main executable, API surface, exposed ports

Use this standard table schema for `inventory.md`:

| Repo | Language | Runtime | Framework | Database | Key Deps | Entry | Notes |
|------|----------|---------|-----------|----------|----------|-------|-------|

One row per repo. If a field is unknown, write `—`. Keep Notes short
(one phrase max). The schema must be consistent across all repos in
the inventory — do not add or remove columns.

Invoke the appropriate language/framework specialist agents to help with unfamiliar stacks. Announce each agent before invoking.

## Produce deliverables in `docs/architecture/`

### `overview.md`
- What the system does
- How the repos relate to each other
- Key data flows
- Tech stack summary table (repo | language | runtime | framework | database | external deps)

### `tech-health.md`

For each distinct runtime/framework version found in the inventory,
use WebSearch and WebFetch to check:

1. **EOL status**: Is this version still receiving security updates?
   Search `<runtime> <version> end of life date`.
2. **Known CVEs**: Search NVD (`nvd.nist.gov`) or OSV (`osv.dev`) for
   CVEs affecting this version. Record CVE ID, CVSS score, and summary.

Produce a table:

| Repo | Component | Version | EOL Date | CVEs (High+) | Action |
|------|-----------|---------|----------|--------------|--------|

Action column values: `OK`, `Update available`, `EOL — upgrade required`,
`CVE — patch required`.

Append `tech-health.md` to the index in `overview.md`.

### `architecture.md`
High-level system architecture diagram in Mermaid (`graph TD` or `C4Context`), showing:
- Services and their relationships
- Data stores
- External dependencies
- Inter-service communication (sync/async, protocol)

### `components.md`
Per-repo component diagrams in Mermaid (`graph TD`), showing internal structure:
- Major modules/namespaces
- Key classes or services
- Data flow within the repo

### `data-flow.md`
Sequence diagrams (`sequenceDiagram`) for the 2-3 most important user-facing or system-critical flows you can identify from the code.

## Finish

Print a summary listing:
- Repos analyzed
- Agents invoked
- Files produced in `docs/architecture/`
- Any repos referenced in code but not found in the org (may be external dependencies or private)
