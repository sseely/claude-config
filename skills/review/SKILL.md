---
name: review
description: Run a structured code review on recent changes or specified files. Delegates to the code-reviewer agent. Use when you want explicit review feedback before committing or merging.
disable-model-invocation: true
context: fork
agent: code-reviewer
---

Review the code specified in $ARGUMENTS (or recent git diff if no argument given).

## Review process

1. If $ARGUMENTS specifies files or a PR, review those. Otherwise run `git diff HEAD` to see recent changes.
2. Check out the diff and all touched files in full.
3. Apply the full review checklist:

### Security
- Input validation present
- No hardcoded secrets or credentials
- Authentication/authorization checks correct
- SQL injection, XSS, command injection vectors absent
- Sensitive data not logged

### Correctness
- Logic is correct for the stated purpose
- Error paths handled
- Edge cases covered (nulls, empty collections, boundary values)
- No obvious race conditions

### Quality
- Functions/variables named clearly
- No duplicated logic (DRY)
- Complexity is justified
- No dead code left in

### Tests
- New behavior has test coverage
- Tests verify behavior, not implementation details
- Failure cases tested

### Performance
- No N+1 query patterns
- No unbounded loops over large collections
- Appropriate caching where needed

## Output format

Organize findings as:

**Critical** (must fix before merge)
**Warning** (should fix)
**Suggestion** (consider improving)
**Positive** (good practices worth noting)

For each finding: location (file:line), what the issue is, and a concrete fix suggestion.

End with a one-line summary verdict: APPROVE, APPROVE WITH NITS, or REQUEST CHANGES.
