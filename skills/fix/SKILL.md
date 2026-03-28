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

1. Run the test suite (or targeted test from $ARGUMENTS); capture error
2. If empty and all green, stop: "No failures found."
3. Detect project stack and test command (pytest, npm test, dotnet
   test, go test, cargo test, etc.)
4. If no test command detectable, ask the user

## Phase 2 — Diagnose

Invoke `debugger` agent. Prompt per `parallelism.md` structure with:
- **Context:** project name, stack, test framework
- **Task:** Diagnose root cause (not symptom). Identify files/lines
  to change, describe the fix, flag whether test or implementation
  bug. Do NOT make changes.
- **Read-set:** files in stack trace + their imports one level deep
- **Write-set:** none

Present the diagnosis to the user. If flagged as a test bug, confirm
before modifying tests.

## Phase 3 — Fix loop (max 5 iterations)

### Each iteration:

**Step A — Implement fix**

Select the language agent by file extension (same mapping as
`/upgrade-deps` Phase 1). If fixes span languages, run agents in
parallel with non-overlapping write-sets.

Agent prompt per `parallelism.md` structure with:
- **Task:** Fix the failure. Minimum change — no refactoring.
- **Write-set:** files identified by debugger
- **Quality bar:** don't run tests; report what changed and why

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
