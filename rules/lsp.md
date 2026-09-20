# Code Navigation with LSP

LSP plugins are installed: typescript-lsp, pyright-lsp, rust-analyzer-lsp,
csharp-lsp, jdtls-lsp, clangd-lsp. No LSP is installed for Go, PHP,
Ruby, or PowerShell — use Serena or ast-grep there. These provide
semantic navigation that is faster and more precise than text search.

**Priority order for code search:**
1. **LSP** — symbol is known; use go-to-definition, find-references, hover
2. **ast-grep** — pattern is structural; use when shape matters, not
   just text
3. **Grep/Glob** — last resort: non-code content, unknown symbol name,
   unsupported file type

> **Subagent scope:** This rule governs the orchestrator only. Subagents
> use Serena MCP tools — see the Subagent note section below.

## When to use LSP vs. ast-grep vs. Grep

Full task-by-task tables (which LSP action for which task, which
ast-grep pattern for which structural search) live in
`docs/reference/lsp.md`. Use Grep/Glob only for non-code content or
file types ast-grep doesn't support: string literals in comments/docs,
discovering which files mention a topic, or initial discovery when the
symbol name is unknown.

## Diagnostics

After every file edit, LSP automatically reports type errors and
warnings. Do not run a separate build step to check for type errors —
read the diagnostics that LSP already pushed. Fix all reported errors
before moving on.

## Subagent note

Agents lack the LSP tool. Use Serena MCP tools instead: `find_symbol`,
`get_symbols_overview`, `find_referencing_symbols`, `find_file`,
`search_for_pattern`, `replace_symbol_body`, `insert_after/before_symbol`,
`safe_delete_symbol`, `rename_symbol`. Use `ast-grep` (not Grep) for
structural searches. After edits, run the project's typecheck command
(`tsc --noEmit`, `mypy`, etc.) as the quality bar. Serena is registered
at user scope, so it's available in every project — if `find_symbol` is
missing, verify with `claude mcp list` before falling back to Grep.
