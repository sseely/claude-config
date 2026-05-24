# Code Navigation with LSP

LSP plugins are installed: typescript-lsp, pyright-lsp, rust-analyzer-lsp.
These provide semantic navigation that is faster and more precise than
text search. Prefer them over Grep/Glob for all symbol-level tasks.

> **Scope:** This rule governs the orchestrator (main Claude Code session) only.
> Subagents use **Serena MCP tools** (`mcp__serena__find_symbol`,
> `mcp__serena__find_referencing_symbols`, etc.) as the equivalent for code
> navigation. Agents do not have the `LSP` tool in their frontmatter and should
> not attempt to use it.

## When to use LSP (not Grep)

Use LSP for any task where you know the symbol name:

| Task | Use LSP | NOT Grep |
|------|---------|----------|
| Find where a function is defined | go to definition | Grep for function name |
| Find all callers of a function | find references | Grep for function name |
| Find where a variable is declared | go to definition | Grep for var name |
| Find all usages of a variable | find references | Grep for var name |
| Find all implementations of an interface | find implementations | Grep |
| Get type signature of a symbol | hover info | Read the file |
| List all symbols in a file | symbol listing | Read + scan manually |
| Trace a call chain | call hierarchy | Grep repeatedly |

## When to use Grep/Glob (not LSP)

Use Grep/Glob only when you don't have a specific symbol to look up:

- Searching for a string literal or pattern in content
- Discovering which files contain a topic or term
- Finding config values, comments, or non-code text
- Initial discovery when you don't yet know the symbol name

## Diagnostics

After every file edit, LSP automatically reports type errors and
warnings. Do not run a separate build step to check for type errors —
read the diagnostics that LSP already pushed. Fix all reported errors
before moving on.

In subagent context (when dispatched via the Agent tool), rely on Serena for
symbol lookup rather than LSP diagnostics. After edits, run the project's
typecheck command (`tsc --noEmit`, `mypy`, etc.) as the quality bar instead.
