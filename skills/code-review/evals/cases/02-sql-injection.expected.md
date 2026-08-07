# Expected findings — 02-sql-injection

Dimension: **Security**

## MUST

- **Critical — line 15.** SQL injection. `email` is interpolated straight
  into the query with an f-string. An `email` of `' OR '1'='1' --` returns
  the first user in the table, and `authenticate` then proceeds against that
  row. Note that `_stored_token` on line 36 uses a parameterized query
  correctly, so the fix is to match it: `cur.execute(..., (email,))`.

- **Critical — line 27.** The auth token is written to the log in cleartext.
  `rules/logging.md` forbids logging tokens, and `rules/security.md` repeats
  it for secrets. Anyone with log access can replay the session.

- **Warning — line 28.** `stored == token` is a non-constant-time comparison
  on a secret, leaking length and prefix through timing. Needs
  `hmac.compare_digest`.

## SHOULD

- **Warning — line 44.** `except Exception` returns `str(e)` to the caller,
  leaking the SQL statement, schema names, and file paths in the error text.
  Log the detail server-side and return a generic message.

- **Suggestion — line 36.** `_stored_token` returns `""` when no session
  row exists. Combined with an empty `token` parameter, an empty-string
  comparison succeeds — the falsy default becomes an auth bypass on the
  no-session path.

## Notes for the grader

Three Criticals/Warnings must all appear; catching the injection while
missing the logged token is a partial result, not a pass. The
`_stored_token` contrast on line 36 is deliberate — a review that flags all
database access as unsafe, rather than the one interpolated query, is
producing NOISE.
