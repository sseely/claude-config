# String Formatting

## Default: templates over concatenation

Where the language has a template / interpolation / format-string form,
use it instead of `+` concatenation. It reads better: the shape of the
output is visible in the source, and argument order can't silently drift.

Three cases override the default, all covered in the table below:

- The language has no template form (Java — theirs was withdrawn).
- The template form is the slow path (Go's `fmt.Sprintf`).
- You are accumulating in a loop (use a builder — see below).

Readability decides; performance is a tiebreaker, not a driver. In every
language surveyed the difference is nanoseconds per call. It only matters
inside a hot loop, and there the loop itself is the thing to fix.

## Per-language verdict

| Language | Template form | Performance vs. `+` |
|---|---|---|
| Python | `f"{x}"` | **Faster.** Dedicated opcode; beats both `+` and `.format()`. |
| C# / .NET | `$"{x}"` | **Wash to faster.** All-string holes lower to `String.Concat` — identical IL to `+`. Mixed types use `DefaultInterpolatedStringHandler`: no boxing, no intermediate strings. |
| TypeScript / JS | `` `${x}` `` | **Wash.** V8 optimizes both. Pick readability. |
| Kotlin | `"$x"` | **Wash.** Templates and `+` emit the same bytecode. |
| Swift | `"\(x)"` | **Faster.** Avoids the intermediate strings sequential `+` creates. |
| Ruby | `"#{x}"` | **Faster** for 3+ pieces; a wash for exactly two. |
| PHP | `"$x"`, heredoc | **Wash** on PHP 8 for simple cases; interpolation beats long concat chains. `sprintf` is the slowest option. |
| Rust | `format!("{x}")` | **Slower** than `push_str`, but clearest for composing a value once. Captured identifiers work since Rust 2021. |
| C++20 | `std::format` | **Prefer** over `ostringstream` and over `+` chains for mixed types. |
| PowerShell | `"$x"`, `"$($x.P)"` | **Unmeasured, and not inheritable from the C# row** — different compiler, different semantics; see below. Interpolation for substitution, `-f` for formatted numbers and dates. |
| Go | `fmt.Sprintf` | **Slower — the exception.** Reflection plus allocations. Use `+` for simple joins; reserve `Sprintf` for real formatting (padding, precision, hex). |
| Java | *(none)* | **String templates were withdrawn** — previewed in JDK 21/22, pulled before JDK 23; no replacement design. Use `+`, which is indified to `StringConcatFactory` and fast. `String.format` is the slowest option. |

Java and Go are the two languages where the readable-looking choice is the
wrong one. Everywhere else the readable choice is free or better.

## PowerShell is .NET, but only below the compiler

Everything at the BCL layer transfers from C# directly, and should be
learned once: `System.String` is the same immutable type, `StringBuilder`
is the same class, `-join` is `String.Join`, `-f` is `String.Format`, and
the `+=`-in-a-loop trap is identical for identical reasons.

The C# row above does not transfer, because its claims are about Roslyn
rather than about .NET:

- `DefaultInterpolatedStringHandler` is documented as a type for direct use
  by the *C# compiler* — a language lowering, not runtime behavior that
  other .NET languages inherit. PowerShell compiles its own
  `ExpandableStringExpressionAst` and never emits the handler.
- The semantics differ, so it is provably not the same code path.
  PowerShell stringifies with the **invariant** culture where C# uses the
  current one, joins collections with `$OFS` (default: a space) where C#
  gives you `System.String[]`, and unwraps `PSObject`.

That is extra per-value work the C# path never does, so neither the timing
nor the allocation profile carries over. Measure before optimizing here.

The invariant-culture rule is also a correctness trap worth knowing on its
own: `"$(Get-Date 1970-01-01)"` yields `01/01/1970 00:00:00` in any culture,
which is *not* what `(Get-Date 1970-01-01).ToString()` returns.

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

## Sources

- .NET lowering and handler benchmarks: Microsoft DevBlog, "String
  Interpolation in C# 10 and .NET 6" (Tier 1).
- Java string template withdrawal: JEP 430 / 459 previewed, JEP 465
  withdrawn; `JDK-8329949` removed the feature (Tier 1).
- Python, Go, Ruby, PHP, Kotlin, Rust, C++: practitioner benchmarks
  (Tier 3) — direction is consistent across sources, magnitudes are not.
- PowerShell: no benchmark located. Invariant-culture stringification and
  `$OFS` collection joining are documented on MS Learn; the handler being a
  C#-compiler lowering is documented on the `DefaultInterpolatedStringHandler`
  API page (both Tier 1). The cost profile itself remains unverified.
