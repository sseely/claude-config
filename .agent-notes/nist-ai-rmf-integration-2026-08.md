# Observations — NIST AI RMF integration mission (2026-08-09)

## Observation: system `python3` has no pyyaml; `hooks/.venv` does
- **Context**: Running the mission's YAML-validation quality gate,
  `python3 -c "import yaml; yaml.safe_load(...)"`.
- **Finding**: `/opt/homebrew/bin/python3` (and bare `python3`) raise
  `ModuleNotFoundError: No module named 'yaml'`. The repo's own
  `hooks/.venv/bin/python` carries pyyaml 6.0.3 — it is created by
  `hooks/setup-complexity.sh` for the complexity hook. `yq` (v4.53.3) and
  system `ruby -ryaml` are also available as parsers.
- **Impact**: Any gate, hook, or skill that shells out to `python3` for YAML
  will fail with an import error that *looks* like a validation failure. The
  distinction matters: the command exits non-zero either way, so a naive
  reader concludes the file is malformed when the parser was never reached.
  Use `hooks/.venv/bin/python` for YAML work in this repo.
- **Confidence**: High — reproduced directly, cross-checked against three
  interpreters.

## Observation: Agent-tool subagents get heterogeneous toolsets
- **Context**: Dispatching 12 subagents across four batches, several with
  instructions to self-verify sizes (`wc -c`) and run a validation command.
- **Finding**: Toolsets vary by `subagent_type` and are narrower than the
  agent definition implies. `technical-writer` and `prompt-engineer` agents
  had no Bash, so they could not run `wc`, `pdftotext`, or the YAML gate.
  They reported estimates or explicitly flagged the gap. One agent
  (`technical-writer` on B4) returned no summary at all despite writing a
  correct file.
- **Impact**: Do not delegate a *measurement* to an agent whose toolset may
  lack the measuring tool — it will estimate, and an estimate reported in a
  PASS/FAIL table reads as a measurement. Either grant Bash explicitly or
  keep verification in the orchestrator. A silent return is also not a
  failure signal: verify the artifact rather than re-dispatching.
- **Confidence**: High — observed across 12 dispatches in one session.

## Observation: agents lacking Bash substituted the Read tool's PDF renderer
- **Context**: Tasks A2/A2b needed Tables 1–4 of `NIST.AI.100-1.pdf` and were
  told to use `pdftotext`.
- **Finding**: With no Bash, both used the Read tool's `pages` parameter
  instead. Extracted text was header-intact, and subcategory counts
  (19/18/22/13) cross-checked against the brief's independent baseline.
- **Impact**: Read-with-`pages` is a viable substitute for `pdftotext` on
  table-bearing PDFs, and worth naming as the primary instruction when the
  target agent may not have Bash.
- **Confidence**: Medium — one document, counts corroborated by a second
  source, but no systematic comparison against `pdftotext` output.

## Observation: `plans/` is gitignored, so committed files must not link into it
- **Context**: A batch-1 reference under `skills/` linked to
  `plans/nist-ai-rmf-integration/decisions.md` for a rationale.
- **Finding**: `.gitignore:15` ignores `plans/`. The link resolved locally
  and would dangle for anyone cloning the repo.
- **Impact**: Mission briefs are working documents, not durable references.
  When a task file tells an agent to cite a decision, the agent should inline
  the reasoning rather than link to the brief. Worth stating in task prompts
  for any mission whose write-set includes tracked files.
- **Confidence**: High — confirmed with `git check-ignore -v`.
