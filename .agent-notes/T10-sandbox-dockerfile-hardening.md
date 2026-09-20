# T10 — sandbox Dockerfile hardening

## Observation: node:20/24-slim reserves uid/gid 1000 for a built-in "node" user
- **Context**: Adding a non-root `sandbox` user to `templates/Dockerfile.base`
  per D9, using the task spec's literal `--gid 1000`/`--uid 1000`.
- **Finding**: `docker build` failed with `groupadd: GID '1000' already
  exists` (exit 4). `docker run node:24-slim cat /etc/passwd` shows
  `node:x:1000:1000::/home/node:/bin/bash` — the official Node image
  pre-creates this account. Used uid/gid 1001 for `sandbox` instead.
- **Impact**: Any future Dockerfile change on a `node:*-slim` base that
  hardcodes uid/gid 1000 for a new account will hit the same conflict.
- **Confidence**: High (reproduced via `docker build`).

## Observation: appending language fragments after Dockerfile.base's final USER breaks root-owned installs
- **Context**: `skills/sandbox/SKILL.md` Phase 4 concatenates
  `Dockerfile.go`/`.rust`/`.dotnet` onto the end of `Dockerfile.base`,
  including everything after its `ENTRYPOINT` line. Once `Dockerfile.base`
  ends on `USER sandbox` (this task, D9), every appended fragment now runs
  as the non-root `sandbox` user instead of root.
- **Finding**: Reproduced two distinct failures before fixing:
  1. `Dockerfile.go`'s `tar -C /usr/local -xzf ...` failed with `Permission
     denied` (root-owned `/usr/local`).
  2. `Dockerfile.rust`'s rustup install succeeded (rustup installs under
     `$HOME`, which resolves to `/home/sandbox` for the named `USER`), but
     the fragment's `ENV PATH="$PATH:/root/.cargo/bin"` pointed at the
     wrong (root-owned, inaccessible) location — `cargo`/`rustc` were
     unreachable via `PATH` even though installed correctly.
  Fixed within this task's write-set: `Dockerfile.go` and `Dockerfile.dotnet`
  now bracket their installer `RUN` with `USER root` / `USER sandbox`
  (both install into root-owned `/usr/local`); `Dockerfile.rust` needed no
  USER change, just corrected its `ENV PATH` to `/home/sandbox/.cargo/bin`.
  All three verified by building `Dockerfile.base` + each fragment
  concatenated (matching SKILL.md's actual assembly) and running the
  resulting tool (`go version`, `dotnet --version`, `cargo --version`)
  inside the container.
- **Impact**: Without this fix, every `/sandbox` run detecting Go or a
  language needing `/usr/local` install would fail to build; Rust support
  would silently ship with an unusable `cargo`/`rustc`. This is a direct,
  provable consequence of adding non-root `USER` to the shared base layer.
- **Confidence**: High (reproduced and fixed via `docker build` + `docker
  run`, see command history in T10's task transcript).

## Observation: Dockerfile.dotnet's .NET SDK aborts — missing libicu (pre-existing, out of scope)
- **Context**: Verifying `dotnet --version` works post-fix in the combined
  base+dotnet image.
- **Finding**: `dotnet --version` aborts with `Couldn't find a valid ICU
  package installed on the system` (`libicu`/`icu-libs` not installed by
  `Dockerfile.base`'s apt layer). Reproduced identically on the
  **original, pre-T10** `Dockerfile.base` + `Dockerfile.dotnet` (channel
  8.0, node:20-slim, root) via `git show HEAD:...` — so this predates T10
  and is unrelated to F052/F016/F017/F018/F115/F116.
- **Impact**: `.NET` language support in `/sandbox` is currently
  non-functional regardless of SDK channel. Needs a follow-up finding: add
  `libicu-dev` (or set `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true`) to
  `Dockerfile.base` or `Dockerfile.dotnet`.
- **Confidence**: High (reproduced on both old and new Dockerfiles).
