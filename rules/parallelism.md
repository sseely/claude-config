# Multi-Agent Parallelism

Before executing any task that involves multiple agents or multiple independent workstreams, always produce an execution plan and present it for review before proceeding:

1. **List the subtasks** — what needs to happen
2. **Mark dependencies** — which subtasks require output from another before they can start
3. **Assign file ownership** — for each subtask, list the files it will write; if two agents would write the same file, collapse them into one agent with combined instructions
4. **Batch independent work** — invoke all dependency-free subtasks with non-overlapping write sets as parallel agent calls in a single response
5. **Sequence dependent work** — only after a batch completes, start the next dependent batch

**Trigger this planning step when:**
- More than one file, module, or component needs the same type of work (analysis, refactoring, test writing)
- A feature spans multiple domains (e.g., backend + frontend + tests)
- A task has a research phase and an implementation phase that can be split

**File ownership rules:**
- Each file may only be written by one agent at a time
- If two planned agents would write the same file, collapse them into a single agent with the combined instructions
- Related changes across multiple files that must stay consistent (e.g., an interface change + all its call sites) are assigned to one agent as a logical unit
- Read-only access is unrestricted — multiple agents may read the same file concurrently
- If the plan produces a write conflict that can't be resolved by collapsing, that's a signal the subtasks aren't actually independent and should be a single agent

**Default rule:** If subtasks don't share write targets and don't depend on each other's output, run them in parallel. Don't serialize work that can be parallelized.
