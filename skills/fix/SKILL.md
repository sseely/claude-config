---
name: fix
description: >
  Fix a failing test, build error, or runtime error. Takes an error
  message, failing test name, or file:line as $ARGUMENTS. Loops
  debugger → language agent → test runner until green or 5 iterations
  exhausted. Escalates to user if it cannot converge.
disable-model-invocation: false
---

# Fix

Drive a failing test, build error, or runtime error to green.

**Input:** `$ARGUMENTS` — one of:
- A failing test name or pattern (e.g. `test_user_login`, `auth.test.ts`)
- An error message or stack trace (paste directly)
- A `file:line` reference
- Empty — will run the full test suite and fix the first failure found

## Phase 1 — Establish baseline

Run the test suite (or targeted test if $ARGUMENTS is a test name).
Capture the full error output.

If $ARGUMENTS is empty and the test suite is green, stop:
> "No failures found. Nothing to fix."

Detect the project stack (same language detection as `/upgrade-deps`)
to know which agent to use for fixes and which commands to run.

Identify the test/build command:
- `pytest` / `python -m pytest`
- `npm test` / `vitest` / `jest`
- `dotnet test`
- `go test ./...`
- `cargo test`
- `./gradlew test` / `mvn test`
- `bundle exec rspec`
- `ng test`

If no test command is detectable, ask the user before proceeding.

## Phase 2 — Diagnose

Invoke the `debugger` agent with a self-contained prompt:

```
Context: [project name, stack, test framework]
Error output:
[full error message, stack trace, or test failure output]

Relevant files: [files mentioned in the stack trace or test output]

Task: Diagnose the root cause of this failure. Do NOT make any
changes. Identify:
1. The root cause (not just the symptom)
2. The specific file(s) and line(s) that need to change
3. What the fix should be (describe it — don't implement it)
4. Whether this is likely a test bug or an implementation bug
5. Any related code that may need to change as a consequence

Read-set: all files mentioned in the error, their imports/dependencies
  one level deep, and any test fixtures or factories they use.
Write-set: none
```

Present the diagnosis to the user as a one-paragraph summary before
proceeding. If the debugger identifies it as a test bug (the test is
wrong, not the code), confirm with the user before fixing the test.

## Phase 3 — Fix loop (max 5 iterations)

### Each iteration:

**Step A — Implement fix**

Select the appropriate language agent based on the file(s) to change:
- `.py` → `python-pro`
- `.ts`/`.tsx` → `typescript-pro`
- `.js`/`.jsx` → `javascript-pro`
- `.cs` → `csharp-developer`
- `.go` → `golang-pro`
- `.rs` → `rust-engineer`
- `.rb` → `ruby-specialist`
- `.java` → `java-architect` or `spring-boot-engineer`
- `.kt` → `kotlin-specialist`
- `.swift` → `swift-expert`
- `.php` → `php-pro`
- `.sql` or migration file → `sql-pro`
- multiple languages → select agent for the primary failing file;
  if fixes span languages, run agents in parallel with non-overlapping
  write-sets

Agent prompt:
```
Context: [project name, stack]
Diagnosis: [debugger findings from Phase 2, plus any new error output
  from prior iterations]

Task: Fix the failure described above. Apply the minimum change
needed — do not refactor surrounding code or fix unrelated issues.
If the diagnosis says it's a test bug, fix the test. Otherwise fix
the implementation.

Write-set: [specific files identified by debugger]
Read-set: [those files plus their direct dependencies]
Quality bar: do not run the tests yourself — just make the change
  and report exactly what you changed and why.
```

**Step B — Run tests**

Run the same test command from Phase 1. Capture full output.

**Step C — Evaluate**

- If green → proceed to Phase 4
- If still failing:
  - If the error is the SAME as the previous iteration → the fix
    didn't work; pass the new output back to the debugger agent for
    re-diagnosis before the next fix attempt
  - If the error is DIFFERENT → the fix made progress; pass the new
    error directly to the language agent for the next fix attempt
    (skip re-diagnosis if the new error is straightforward)
  - Increment iteration count

**After 5 iterations without green:**

Present to the user:
> "Could not resolve the failure after 5 iterations. Here is the
> current state:
> - Last error: [error output]
> - Changes made: [list of file:line changes across all iterations]
> - Debugger's last diagnosis: [summary]
> Please advise on how to proceed."

Stop and wait for user input.

## Phase 4 — Confirm and report

Run the full test suite (not just the targeted test) to verify no
regressions were introduced.

If regressions are found, treat them as new failures and loop back
to Phase 2 for each one — but cap the total iteration budget across
all failures at 10.

Report:
- What was broken and why (root cause)
- What was changed (file:line with brief description)
- How many iterations it took
- Test suite status (pass count before and after)

## Rules

- Never mark a fix complete until the test command exits 0
- Never fix more than what the diagnosis identified — minimum
  change principle
- If the debugger says "test is wrong" and you are not sure, confirm
  with the user before modifying test files
- Do not run the full suite in Phase 3 loops if a targeted test
  command is available — targeted runs are faster and reduce noise
- Never use `--ignore` flags or `skip`/`xfail` markers to make
  tests "pass" — that is not a fix
