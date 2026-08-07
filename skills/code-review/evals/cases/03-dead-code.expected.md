# Expected findings — 03-dead-code

Dimension: **Dead code / style**

## MUST

- **Warning — lines 6-8.** `formatMoney` is dead. It is neither exported nor
  called anywhere in the file, and its own comment says it was superseded by
  `formatCurrency`. Per `rules/pr-workflow.md`, dead code in a file being
  modified is removed in the same commit — after grepping for references,
  since "looks unused" is not "is unused".

- **Warning — lines 3, 10-12.** `applyLegacyTax` and the `LEGACY_RATE`
  constant it is the only consumer of are both dead. Removing the function
  without the constant leaves a second orphan.

## SHOULD

- **Suggestion — lines 15-31.** Three near-identical `Intl.NumberFormat`
  branches differing only in locale and currency code. A currency-to-locale
  map collapses them to one call site, and adding a fourth currency then
  costs a map entry rather than a branch.

- **Suggestion — line 32.** The fallback returns a bare number as a string
  with no currency indication, silently producing "10.5" where every other
  path produces a formatted amount. An unsupported currency should be an
  error, not an unlabeled number.

- **Suggestion — lines 36-39.** The index loop is a `reduce` or a
  `for...of`. Style only; no behavioral defect.

## Notes for the grader

This case tests whether low-severity findings are reported *as* low
severity. Flagging the dead code as Critical is a NOISE result — the scale
has to discriminate for the report to be actionable. Reporting the loop
style while missing the dead functions is also a MISS: the fixture's
primary defects are the two unreachable functions.
