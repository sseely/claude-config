# Observations — fleet-governance mission (2026-08-09)

## Observation: venv re-exec detection must compare `sys.prefix`, not `sys.executable`
- **Context**: T6's inventory generator re-execs into `hooks/.venv/bin/python`
  to get PyYAML when launched under system `python3`.
- **Finding**: `python -m venv` symlinks its binary to the base interpreter,
  so `os.path.realpath(sys.executable)` is identical for system and venv
  Python. The first draft used executable identity, concluded it was already
  in the venv, and crashed with `ModuleNotFoundError`. Comparing `sys.prefix`
  against the venv directory works.
- **Impact**: Any future script in this repo that conditionally re-execs into
  `hooks/.venv` must gate on `sys.prefix` (or try-import), never on the
  executable path.
- **Confidence**: High — reproduced and fixed during T6.

## Observation: `update-config` is a built-in skill with no on-disk form
- **Context**: T7's `check-references.py` validating `Skill(...)` permission
  strings in `settings.json`.
- **Finding**: `settings.json` grants `Skill(update-config:*)` but no
  `skills/update-config/` exists — it's a Claude Code built-in. Any tooling
  that resolves skill names against `skills/*/SKILL.md` will false-positive
  on built-ins; there is no repo-local registry of which names are built in.
- **Impact**: Reference checkers must restrict themselves to repo-grounded
  reference forms (paths, `subagent_type` vs agent `name:`) or maintain a
  built-in allowlist that will rot. T7 chose the former.
- **Confidence**: High — confirmed against settings.json and skills/ listing.

## Observation: `agents/` root-level files are the recurring blind spot
- **Context**: T6 reproduced the planning baselines by measurement.
- **Finding**: `explore.md` and `plan.md` (both haiku-pinned) live loose at
  `agents/` root, not in `agents/NN-*/`. Hand counts that walk only the
  numbered subdirs undercount: caused both the crosswalk's "129 agents"
  error and the planning baseline's "haiku: 9" (real: 10).
- **Impact**: Any fleet-wide count must glob `agents/**/*.md` recursive
  including root level, or use `scripts/gen-fleet-inventory.py` instead of
  counting by hand.
- **Confidence**: High — two independent errors traced to the same cause.

## Observation: headless `claude -p` default system prompt inflates
eval cost ~30-60x
- **Context**: T11 building `evals/run_evals.py`, measuring cost of
  `claude -p` invocations to size the eval harness.
- **Finding**: A trivial `claude -p --model sonnet "reply PONG"` (no other
  flags) billed $0.43-$0.79 per call with 68k-131k `cache_creation_input_tokens`
  — the full CLAUDE.md/rules/hooks/user-scope-MCP-tool-schema stack is
  attached to every headless call's system prompt by default, even with
  `--permission-mode plan`. Adding `--strict-mcp-config --tools ""
  --setting-sources ""` (on top of `--system-prompt <replacement>`) dropped
  the same call to ~$0.01-0.02 (2-36k cache-creation tokens). `--bare` is
  not usable for this: it also skips keychain reads, so auth fails
  ("Not logged in") when Anthropic OAuth/keychain is the only credential
  source.
- **Impact**: Any headless/eval/CI use of `claude -p` in this repo should
  default to `--strict-mcp-config --tools "" --setting-sources ""` (plus an
  explicit `--system-prompt`) unless the invocation genuinely needs tools
  or repo settings — otherwise every call pays for the full session context
  it never uses.
- **Confidence**: High — measured directly, 6 comparative invocations.

## Observation: `--model haiku` alias silently resolves to claude-sonnet-5
- **Context**: Same T11 cost measurement; Explore/Plan are `model: haiku`
  in frontmatter, needed for eval invocation.
- **Finding**: `claude -p --model haiku ...` returned a response billed
  under `claude-sonnet-5` in `modelUsage` (2 separate invocations,
  confirmed via `--output-format json`), not haiku and not an error.
  `claude -p --model claude-haiku-4-5-20251001` (full canonical name)
  resolves correctly. `--model opus` and `--model sonnet` (aliases) both
  resolve correctly to their expected canonical models.
- **Impact**: Any script that needs to pin a specific model via the
  `haiku` alias must substitute the full canonical model name instead —
  the alias is not currently a safe way to route to Haiku from `-p`.
  `evals/run_evals.py`'s `MODEL_ALIAS_FIX` dict implements this
  workaround.
- **Confidence**: High — reproduced twice with distinct sentinel prompts;
  CLI version in use 2026-08-09, may be fixed in later releases.
