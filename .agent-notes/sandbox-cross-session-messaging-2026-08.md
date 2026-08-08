# sandbox × cross-session messaging — 2026-08-08

## Observation: /sandbox runs cannot participate in cross-session messaging

- **Context**: Evaluating whether cross-session messaging
  (`code.claude.com/docs/en/cross-session-messaging`, Claude Code
  v2.1.224+) should be wired into `rules/parallelism.md`,
  `skills/plan-mission/`, or `settings.json`. Checked how
  `skills/sandbox/` launches Claude inside its container.

- **Finding**: Three independent conditions each block messaging for a
  `/sandbox` run, and all three hold simultaneously:

  1. **Filesystem isolation.** Same-machine delivery works by each
     session registering itself in files on disk and binding an inbox
     socket there. Two sessions reach each other only if they see the
     same files. A container has its own filesystem, so a session
     inside it and a host session cannot reach each other at all.
     Neither appears in the other's `/list-agents`.
  2. **bypassPermissions holds inbound.** A receiving session that
     bypasses permission prompts holds *every* inbound message for
     explicit approval, delivering only if the sender also identifies
     as bypassing. `templates/container-entrypoint.sh:53` invokes
     `claude --dangerously-skip-permissions`, so the sandbox is always
     in that class.
  3. **`-p` cannot show the approval dialog.** The same line uses
     `-p "$TASK_PROMPT"`. A `-p` session has no way to render the hold
     dialog, so a held message stays held indefinitely — it is not
     denied and not expired, just stuck.

  Conditions 2 and 3 compound: the sandbox both holds everything and
  can never clear the hold.

- **Impact**: Do not design any workflow that assumes a sandboxed run
  can report status back to, or take direction from, the host session
  via `SendMessage`. The existing channel — `sandbox.log` on the
  `-meta` volume, read back with the `docker run ... tail` command in
  `skills/sandbox/SKILL.md` Phase 8 — remains the only one. This is
  also why cross-session messaging was deliberately *not* added to
  `rules/autonomous-execution.md` or `skills/plan-mission/`.

  If a future sandbox variant ever needs to receive messages, the
  documented lever is `crossSessionInbound: "accept"` passed via the
  run's `--settings`, and it only helps for a sender *inside the same
  container* — it does not defeat condition 1.

- **Confidence**: High. Conditions verified against the official doc;
  the invocation verified by reading
  `templates/container-entrypoint.sh:53`.

## Observation: entrypoint writes settings.json into a read-only mount

- **Context**: Noticed while tracing the remediation path above, which
  would need to modify the sandbox's `settings.json`.

- **Finding**: `skills/sandbox/SKILL.md:160` mounts
  `$HOME/.claude` at `/root/.claude` with `readonly`, while
  `templates/container-entrypoint.sh:25-28` does
  `mkdir -p /root/.claude` followed by
  `cat > /root/.claude/settings.json`. A write to a path inside a
  read-only bind mount should fail.

- **Impact**: Either the sandbox's `permissions.allow: ["*"]` settings
  block is not actually taking effect, or the real run differs from
  the command shape documented in SKILL.md. Worth resolving before
  anyone relies on writing settings into the container — including the
  `crossSessionInbound` lever noted above, and the `sandbox.credentials`
  suggestion already parked in SKILL.md Notes.

- **Confidence**: Medium. Both lines read directly from source, but
  not verified by executing a sandbox run — the failure is inferred
  from Docker mount semantics, not observed. Instrument before acting.
