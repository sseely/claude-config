---
name: mcp-builder
description: >
  Build a high-quality MCP (Model Context Protocol) server in Python
  (FastMCP) or TypeScript (MCP SDK) that integrates an external API or
  service. Covers agent-centric design, implementation, testing, and
  evaluation. Usage: /mcp-builder [service name or API description]
---

# MCP Builder

Build an MCP server that lets an LLM take real actions against an
external service.

## Design principles (read before writing any code)

**Build for workflows, not API endpoints.** Don't wrap individual REST
calls. Build tools that complete meaningful tasks — e.g.
`schedule_event` that checks availability AND creates the event in one
call.

**Treat context as a budget.** Return high-signal information only.
Offer `format: "concise" | "detailed"` options. Default human-readable
identifiers over internal IDs. Apply character limits (25,000 tokens
max per response) and truncate.

**Write actionable errors.** Errors should guide the agent: "No
results found. Try broadening the date range or removing the
`status='closed'` filter."

**Name tools for discoverability.** Use consistent prefixes for
related tools (`issues_list`, `issues_create`, `issues_close`). Names
should match how a human thinks about the task.

**Annotate every tool:**
- `readOnlyHint: true` for reads
- `destructiveHint: false` for safe writes
- `idempotentHint: true` if repeated calls are safe
- `openWorldHint: true` for external API calls

---

## Phase 1 — Research and plan

1. Fetch the MCP protocol spec:
   ```
   WebFetch: https://modelcontextprotocol.io/llms-full.txt
   ```
2. Fetch the SDK README for your target language:
   - Python: `https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/README.md`
   - TypeScript: `https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md`
3. Read ALL target API documentation (auth, rate limits, pagination,
   error codes, data models).
4. Produce a written plan covering:
   - Which tools to implement (focus on highest-value workflows)
   - Shared utilities needed (auth, pagination, response formatting)
   - Input validation approach (Pydantic for Python, Zod for TypeScript)
   - Error handling strategy

---

## Phase 2 — Implement

### Structure

**Python (FastMCP):**
```python
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

mcp = FastMCP("service-name")

@mcp.tool(
    description="...",
    annotations={"readOnlyHint": True}
)
async def tool_name(param: str = Field(description="...", examples=["value"])) -> str:
    ...
```

**TypeScript (MCP SDK):**
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

server.registerTool("tool_name", {
  description: "...",
  inputSchema: z.object({ param: z.string().describe("...") }).strict(),
  annotations: { readOnlyHint: true },
}, async ({ param }) => { ... });
```

### Build order

1. Core infrastructure first: auth helper, request wrapper, error
   handler, response formatter
2. Read-only tools next (lowest risk, verifiable)
3. Write tools last

### Per-tool requirements

- Comprehensive description: what it does, when to use it, example
  inputs, what it returns, how to handle errors
- Input validation with constraints (min/max length, enum values,
  regex where applicable)
- Async I/O throughout
- Graceful pagination (don't return 10,000 results unbounded)

---

## Phase 3 — Review

Before shipping, verify:

- [ ] No duplicated code — shared logic is extracted
- [ ] Every tool has a `description` that an LLM can act on
- [ ] All external calls have error handling
- [ ] No `any` types (TypeScript) / no untyped params (Python)
- [ ] Response sizes are bounded

**Testing caution:** MCP servers block on stdio. Don't run
`python server.py` or `node dist/index.js` directly — the process
will hang. Use `timeout 5s python server.py` to verify startup, or
run in tmux.

For Python, verify syntax first: `python -m py_compile server.py`
For TypeScript, build first: `npm run build`

---

## Phase 4 — Evaluations

Create 10 realistic test questions to validate the server works
correctly. Each question must be:
- Independent of the others
- Answered using only read-only tool calls
- Require 2+ tool calls to answer
- Have a single verifiable answer

Output as an XML file:

```xml
<evaluation>
  <qa_pair>
    <question>How many open issues are assigned to user "alice" in the repo?</question>
    <answer>7</answer>
  </qa_pair>
</evaluation>
```
