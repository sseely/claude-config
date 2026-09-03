# Observations — code-review-tasks-2026-09 mission (2026-09-02)

## Observation: `git commit -- <pathspec>` drops staged deletions when the file still exists on disk
- **Context**: Committing T4's `git rm -r --cached skills/doc-pdf skills/doc-xlsx` with an explicit pathspec to keep parallel agents' edits out of the commit.
- **Finding**: With a pathspec, `git commit` snapshots the *working tree* for the named paths, not the index. The gitignored files were present on disk, so the commit recorded them unchanged and the staged deletions were silently discarded. `git ls-files` read 0 before the commit (index) and 2 after. Fixed in 3ba1b48.
- **Impact**: Never use a pathspec commit for index-only removals. Verify commits with `git diff-tree --no-commit-id --name-status -r <sha>`, not with `git ls-files` or `git diff` against the working tree.
- **Confidence**: High

## Observation: zsh does not word-split an unquoted `$VAR` holding several paths
- **Context**: `git add $F` where `F="a.md b.md c.md"` in the Bash tool (which runs zsh on this machine).
- **Finding**: zsh passed the whole string as one pathspec; git reported "did not match any files". Bash would have split it.
- **Impact**: In this environment pass paths explicitly or use an array (`F=(a b c); git add "${F[@]}"`).
- **Confidence**: High

## Observation: `plans/` is gitignored, so mission briefs and decision journals are untracked
- **Context**: T2 and the five spikes had `decision-journal.md` / `spike/*.md` as their only write-set.
- **Finding**: `.gitignore:15` ignores `plans/`; STOP 6 forbids `git add -f`. Those tasks cannot produce a commit; the journal row is the only record.
- **Impact**: A brief that wants durable, reviewable journal history must track `plans/<mission>/` deliberately or store the journal elsewhere.
- **Confidence**: High
