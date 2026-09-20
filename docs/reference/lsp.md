# LSP / ast-grep lookup tables — reference

Lookup material for `rules/lsp.md`. The binding priority order (LSP,
then ast-grep, then Grep/Glob) lives in that rule file; these tables are
the detailed task-by-task mapping.

## When to use LSP (not Grep)

Use LSP for any task where you know the symbol name:

| Task | Use LSP | Avoid |
|------|---------|-------|
| Find where a function is defined | go to definition | Grep or ast-grep for function name |
| Find all callers of a function | find references | Grep or ast-grep for function name |
| Find where a variable is declared | go to definition | Grep or ast-grep for var name |
| Find all usages of a variable | find references | Grep or ast-grep for var name |
| Find all implementations of an interface | find implementations | Grep or ast-grep |
| Get type signature of a symbol | hover info | Read the file |
| List all symbols in a file | symbol listing | Read + scan manually |
| Trace a call chain | call hierarchy | Grep repeatedly |

## When to use ast-grep (not Grep)

`ast-grep` understands code structure via tree-sitter. Use `ast-grep`,
not Grep, for any search that involves code shape rather than exact
text. Claude Code does not detect these cases on its own — invoke
`ast-grep` explicitly:

| Task | Use ast-grep | NOT Grep |
|------|-------------|----------|
| Find all `await` calls not inside `try/catch` | structural pattern | regex guess |
| Find function calls with a specific argument shape | `ast-grep run -p 'fn($A, null)'` | brittle regex |
| Find all `if` statements missing an `else` | structural query | impossible cleanly |
| Detect interpolated SQL / command injection patterns | AST pattern | regex false-positives |
| Find deprecated API call patterns | pattern with wildcards | text search |
| Locate all `catch` blocks that swallow errors silently | structural match | noisy regex |

**Quick reference:**
```bash
# Search for a pattern in a language
ast-grep run -p 'console.log($$$)' --lang ts

# Run a named rule file
ast-grep scan --rule rules/no-promise-all-settled.yaml

# Rewrite: rename a function call
ast-grep run -p 'foo($A)' -r 'bar($A)' --lang ts
```

Wildcards: `$VAR` matches a single node; `$$$ARGS` matches zero-or-more
nodes.
