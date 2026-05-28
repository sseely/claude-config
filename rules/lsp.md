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

## When to use ast-grep (not Grep)

`sg` (ast-grep) understands code structure via tree-sitter. Prefer it over
Grep for any search that involves code shape rather than exact text:

| Task | Use ast-grep | NOT Grep |
|------|-------------|----------|
| Find all `await` calls not inside `try/catch` | structural pattern | regex guess |
| Find function calls with a specific argument shape | `sg run -p 'fn($A, null)'` | brittle regex |
| Find all `if` statements missing an `else` | structural query | impossible cleanly |
| Detect interpolated SQL / command injection patterns | AST pattern | regex false-positives |
| Find deprecated API call patterns | pattern with wildcards | text search |
| Locate all `catch` blocks that swallow errors silently | structural match | noisy regex |

**Quick reference:**
```bash
# Search for a pattern in a language
sg run -p 'console.log($$$)' --lang ts

# Run a named rule file
sg scan --rule rules/no-promise-all-settled.yaml

# Rewrite: rename a function call
sg run -p 'foo($A)' -r 'bar($A)' --lang ts
```

Wildcards: `$VAR` matches a single node; `$$$ARGS` matches zero-or-more nodes.

## When to use Grep/Glob (not LSP or ast-grep)

Use Grep/Glob only for non-code content or when ast-grep doesn't support
the file type:

- Searching for a string literal in comments, docs, or config files
- Discovering which files contain a topic or term (initial orientation)
- File types without tree-sitter grammar support in ast-grep
- Initial discovery when you don't yet know the symbol name

## Diagnostics

After every file edit, LSP automatically reports type errors and
warnings. Do not run a separate build step to check for type errors —
read the diagnostics that LSP already pushed. Fix all reported errors
before moving on.

In subagent context (when dispatched via the Agent tool), rely on Serena for
symbol lookup rather than LSP diagnostics. After edits, run the project's
typecheck command (`tsc --noEmit`, `mypy`, etc.) as the quality bar instead.
