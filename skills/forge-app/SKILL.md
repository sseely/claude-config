---
name: forge-app
description: >
  Work on an Atlassian Forge app (Confluence, Jira, Bitbucket) — manifest
  modules, UI Kit or Custom UI surfaces, resolvers, permissions, deploy,
  install, and tunnel debugging. Use when a task touches manifest.yml, a Forge
  module, the @forge/* SDKs, or the forge CLI. Routes platform decisions
  through Atlassian's official Forge MCP server.
disable-model-invocation: false
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, Agent, TodoWrite
---

# Forge App

Interactive Forge work: deploying, installing, tunnelling, and debugging
against a live Atlassian site.

## The knowledge lives in the agent, not here

**Do not restate how to build a Forge app in this file.** That content lives in
the `forge-app-developer` agent
(`~/.claude/agents/07-specialized-domains/forge-app-developer.md`) — one copy,
so the two cannot drift apart. This skill covers only the interactive loop that
a subagent cannot run, because it needs the user's browser and their eyes.

**Delegate implementation to `forge-app-developer`** via the Agent tool:
writing modules, resolvers, UI surfaces, manifest changes, tests. Its context
starts clean and its tools include the Forge MCP, which is the whole point —
the failure mode this exists to prevent is writing platform code from memory
inside a crowded main context.

Keep in the main loop only what genuinely needs the human: reading their
screenshots and console pastes, driving the tunnel, and deciding what to try
next.

## Before anything else

Confirm the Forge MCP is reachable. It is configured globally in
`~/.claude/.mcp.json` as `forge` →
`https://mcp.atlassian.com/v1/forge/mcp` (no authentication).

If its tools are absent, say so plainly rather than proceeding from memory, and
fall back to `https://developer.atlassian.com/platform/forge/llms.txt` — an
index mapping every Forge doc to a direct `.md` URL. Any doc page becomes clean
Markdown by appending `.md`.

## Setup, once per app

1. Pin a Node version the Forge CLI supports; check what the CLI actually runs
   under, not just the project pin
2. `forge login` — the user runs this; it needs an API token
3. `forge register "<App Name>"` — the user runs this; it accepts terms and
   creates a permanent app record. It rewrites `manifest.yml` **and strips
   comments from the `app:` block**
4. `forge deploy -e development`
5. `forge install --site <site>.atlassian.net --product <product>`

Module keys are embedded in stored page content. Renaming one after real
content exists orphans every placed macro — settle naming before anyone saves
anything.

## The debugging loop

```
forge tunnel          # backend runs locally against the real site
```

Restart the tunnel after any manifest change or backend rebuild — it bundles at
startup and otherwise serves a stale build.

Watch its output with the Monitor tool rather than polling. Filter to lines you
would act on: real errors, CSP violations, and your own probe markers. Match
`^ERROR` at line start rather than the substring, or every log carrying an
error *code* wakes you.

**When a failure reason is ambiguous, instrument before hypothesising.** If one
code covers several causes — a status, a parse failure, and a shape mismatch
all reporting "unavailable" — add a probe that varies one thing at a time and
reports each result. Guessing between them wastes a deploy cycle per guess.

Two hard-won rules about probes:

- **Never gate a probe on something unverified.** A probe that silently
  no-ops is indistinguishable from a code path that did not run, and will send
  you chasing the wrong thing.
- **A probe can lie.** Check the encoding before trusting a negative: scanning
  JSON-embedded XML for `attr="` finds nothing, because the real characters are
  `attr=\"`. An empty result is a claim about your instrument until proven
  otherwise.

## What only the human can do

Some things never reach the backend and cannot be observed from the tunnel:

- Anything the frontend sends straight to the platform (`view.submit()`)
- Whether a surface actually renders, and whether it looks right
- Export pipelines (PDF, Word)

For these, ask for a screenshot or a browser-console paste. Say exactly which
action to take and what to send back.

## Before finishing

- Project typecheck, lint, and tests
- `forge lint` clean
- The emitted bundle loads:
  `node --input-type=module -e "import('./<bundle>.js')"`
- Remove temporary probes, and check `forge eligibility` if Marketplace
  distribution matters
