---
name: explore
description: Explore an unfamiliar codebase. Creates a temporary architecture-temp/ folder (gitignored), identifies related repos in the same GitHub org, clones them locally, then produces architecture diagrams, component maps, and an overview doc using Mermaid and Markdown.
disable-model-invocation: false
context: fork
---

Perform a full architecture exploration of the current project and its related repositories within the same GitHub organization.

## Setup

1. Create `architecture-temp/` in the current working directory if it doesn't exist.
2. Add `architecture-temp/` to `.gitignore` if not already present (append, don't overwrite).
3. Detect the GitHub org by running `gh repo view --json owner --jq '.owner.login'` in the current project. Store the result as `ORG`.

## Identify related repositories

4. Use `gh repo list $ORG --limit 200 --json name,description` to list repos in the org.
5. Read the current project's name, dependencies, and any service references (imports, config files, docker-compose, README) to infer which other repos in the org are directly related.
6. For each related repo that isn't already cloned locally alongside the current project:
   - Clone it into `architecture-temp/repos/<repo-name>` using `gh repo clone $ORG/<repo-name> architecture-temp/repos/<repo-name>`

## Analyze each repository (current + cloned)

For each repo, identify and record in `architecture-temp/inventory.md`:

- **Runtime versions**: language version, framework version, runtime (Node, .NET, JVM, etc.)
- **Languages used**: primary + any secondary
- **Key components**: services, workers, schedulers, CLI tools
- **Databases**: type, ORM/client used
- **External services**: queues, caches, third-party APIs, auth providers
- **Entry points**: main executable, API surface, exposed ports

Invoke the appropriate language/framework specialist agents to help with unfamiliar stacks. Announce each agent before invoking.

## Produce deliverables in `architecture-temp/`

### `overview.md`
- What the system does
- How the repos relate to each other
- Key data flows
- Tech stack summary table (repo | language | runtime | framework | database | external deps)

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
- Files produced in `architecture-temp/`
- Any repos referenced in code but not found in the org (may be external dependencies or private)
