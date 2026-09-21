## Observation: security-auditor case reliably fails under the harness's --permission-mode plan
- **Context**: T9, running the new `security-auditor-accuracy-finding-fields`
  case (evals/cases/security-auditor/format-finding-fields.json) through
  `evals/run_evals.py`, twice (targeted run and full-suite re-run).
- **Finding**: Both runs produced outcome "fail" -- not because the
  grade_accuracy() judge misfired, but because security-auditor's own
  system prompt reacts to `--permission-mode plan` (which run_evals.py
  always passes) by emitting a "plan mode requires output via ExitPlanMode"
  preamble instead of its actual findings, then never gets to the content.
  ad-security-reviewer's pre-existing case shows the same class of failure
  in results.jsonl (an "error" row then a "fail" row with a plan-mode-style
  trailing question instead of a clean bullet list).
- **Impact**: Any new judgment-graded case for an agent whose prompt
  contains plan-mode-aware branching will likely score "fail"/"ungraded"
  for this reason rather than a real content defect, understating those
  agents' eval scores. Out of scope for T9 (which only adds the grader and
  cases per the task file); worth a follow-up finding against run_evals.py's
  `--permission-mode plan` choice or against the affected agents' prompts.
- **Confidence**: High (reproduced identically across two independent runs).
