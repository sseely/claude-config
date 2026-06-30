# Diagnosis Mode

## When this applies
Engage diagnosis mode the moment an **observed discrepancy** appears: a failing
test, an oracle/reference mismatch, a reported symptom, or behavior that
contradicts stated intent. Diagnosis mode is **per-activity**, not per-task — if
a discrepancy surfaces while authoring a feature, enter diagnosis for that
discrepancy, then return to authoring once it is resolved.

Do **not** apply diagnosis mode when building new behavior with no observed
defect. There, reasonable defaults and iteration are correct; demanding a root
cause for a non-defect is a category error.

## The success condition
The task is **find the root cause**, not "make the symptom go away." You are not
done when the symptom disappears. You are done when you can state the mechanism.

A fix is complete only when you can produce this artifact:
- **Mechanism:** the specific cause, in one or two sentences.
- **Origin:** the `file:line` where it originates.
- **Causal chain:** why the observed symptom follows from that cause.
- **Ruled out:** what you eliminated to get here, and the evidence that
  eliminated it. An empty "ruled out" on a non-trivial defect means you guessed
  the cause rather than isolating it.

This artifact cannot be produced by guessing. If you cannot produce it, you are
not finished.

## Method (non-negotiable)
- **Instrument before hypothesizing.** Read the source, add temporary/gated
  tracing, capture actual values. Confirm the mechanism against evidence before
  proposing any change.
- **No fix before a stated mechanism.** A proposed change offered before the
  mechanism is identified is incomplete work. Do not propose it.
- **Do not guess to make progress.** If the cause is not yet certain, that is a
  valid in-progress state. Report what you have **ruled out** and what you will
  **instrument next** — do not paper over uncertainty with a candidate fix.
- **The reference is the spec.** Where a reference/oracle exists, trace the
  divergence to where your behavior first departs from it, not to where the
  symptom surfaces.

## Valid stop conditions (only these two)
1. **Root cause identified and fixed** — mechanism known, change applied, verified.
2. **Root cause identified and proven irreducible** — the cause is a constraint
   below the code (platform/runtime/hardware behavior you cannot reproduce), and
   you have documented it with evidence (a controlled experiment isolating the
   variable, not an assertion).

**"This is hard," "this looks like enough," or "should we call it good enough?"
are NOT stop conditions.** Do not offer them. If you are tempted to, that is the
signal to instrument further, not to stop.

## Scope of change
When you do apply a fix, prefer the change that addresses the **mechanism at its
origin** over a broader edit that suppresses the symptom downstream. A targeted
fix at the root is correct; a spread-out change that adjusts multiple symptom
sites is a sign the root has not actually been found. If the root genuinely is a
shared primitive (one cause, many call sites), say so explicitly and state why
the change must be broad.
