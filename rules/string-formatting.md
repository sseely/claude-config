# String Formatting

## Default: templates over concatenation

Where the language has a template / interpolation / format-string form,
use it instead of `+` concatenation. It reads better: the shape of the
output is visible in the source, and argument order can't silently drift.

Three cases override the default:

- The language has no template form (Java — theirs was withdrawn).
- The template form is the slow path (Go's `fmt.Sprintf`).
- You are accumulating in a loop (use a builder — see below).

Readability decides; performance is a tiebreaker, not a driver. In every
language surveyed the difference is nanoseconds per call. It only matters
inside a hot loop, and there the loop itself is the thing to fix.

Per-language verdicts, and why PowerShell does not inherit the C# result,
are in `docs/reference/string-formatting.md`.

## Accumulation in a loop

Building a string with `+=` across iterations is the one string-performance
mistake that is worth avoiding on sight, in every language on the list. It
reallocates and copies the whole accumulated string each pass. Reach for the
builder instead:

| Language | Use |
|---|---|
| C#, Java, Kotlin, PowerShell | `StringBuilder` (PowerShell: or `-join`) |
| Go | `strings.Builder` |
| Rust | `String::with_capacity` + `push_str` |
| Python | `"".join(parts)` |
| C++ | `reserve()` then `append` / `+=` |
| Ruby | `<<` (mutates in place) |
| JS/TS, PHP | `+=` / `.=` is fine — both runtimes optimize it |

Pre-size the builder whenever the final length is known or estimable.

## Never interpolate across a trust boundary

A template is a formatting tool, not an escaping tool. Interpolating
untrusted input into SQL, a shell command, HTML, or a URL produces exactly
the injection bug the readable syntax makes easy to miss. Use parameterized
queries, argument arrays, and context-aware escaping — see `security.md`.

Log messages are the other exception: emit structured fields, not an
interpolated sentence, per `logging.md`.
