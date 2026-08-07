# Expected findings — 01-off-by-one

Dimension: **Correctness**

## MUST

- **Critical — line 21.** `const start = page * size` is off by one against
  the stated 1-indexed contract in the comment directly above it. With
  `page = 1` the first item returned is `items[size]`, so the entire first
  page is unreachable and every page is shifted by one. Correct expression:
  `(page - 1) * size`.

- **Warning — line 33.** `lastPage` uses `Math.floor`, so a total that is an
  exact multiple of `pageSize` reports one page too few (100 items at 20 per
  page returns 5 when pages are 1-indexed, and the remainder case is wrong
  in the other direction). Needs `Math.ceil` and consistency with whichever
  indexing base `paginate` settles on.

## SHOULD

- **Suggestion — line 18.** `Math.min(pageSize, MAX_PAGE_SIZE)` silently
  clamps an out-of-range request rather than rejecting it, and does not
  guard `pageSize <= 0`. A zero or negative size yields an empty or reversed
  slice with no error.

- **Suggestion — line 14.** `page` is unvalidated. A negative page produces a
  negative `start`, and `Array.slice` interprets that as an offset from the
  end — returning data from the wrong end of the set rather than an error.

## Notes for the grader

The line-21 defect is the primary one. A review that reports "pagination
logic should be tested" without naming the off-by-one is a MISS, not a HIT —
it identifies a category, not the defect.
