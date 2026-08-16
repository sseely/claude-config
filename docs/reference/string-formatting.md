# String formatting — per-language reference

Lookup material for `rules/string-formatting.md`. The binding rules —
templates over concatenation, use a builder in loops, never interpolate
across a trust boundary — live in that rule file and are always resident.
This file is what you consult when you need the specifics for a language.

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
