---
name: sandbox
description: >
  Run a Claude Code mission brief or task prompt inside an isolated Docker
  container with --dangerously-skip-permissions. Retrieves secrets from
  macOS Keychain, assembles a task-specific Dockerfile, mounts ~/.claude/
  read-only, and uses a persistent named volume for resumability.
  Usage: /sandbox [session-name] [repo-url] [task-prompt or brief-path]
disable-model-invocation: false
allowed-tools: Bash, Read, Write, Glob
---

# Sandbox

Run a task or mission brief in an isolated Docker container with full Claude Code autonomy.

## Phase 1 — Parse arguments

Parse `$ARGUMENTS` which may contain 1-3 parts in any order:

- `SESSION_NAME` — optional identifier for this sandbox session. Any
  single token that is not a URL or file path (e.g. `auth-refactor`,
  `fix-payments`). If not present, default to `sandbox`.
- `REPO_URL` — a git clone URL (starts with `https://`, `git@`, or `ssh://`).
  If not present, run:
  ```bash
  git remote get-url origin
  ```
  Use that value. If the command fails, stop:
  > No repo URL provided and no git remote found in the current directory.
  > Usage: /sandbox [session-name] [repo-url] [task-prompt or brief-path]
- `TASK_PROMPT` — the remaining text after extracting SESSION_NAME and REPO_URL.
  If it ends in `.md` or `/README.md`, treat it as a file path: read the file
  and use its content as the prompt. If the file does not exist, stop:
  > Brief file not found: [path]

Document what was parsed before proceeding:
```
Parsed:
  SESSION_NAME: auth-refactor
  REPO_URL:     https://github.com/org/repo.git
  TASK_PROMPT:  [first 120 chars of prompt or "(from file: path)"]
```

## Phase 2 — Validate Keychain secrets

For each required secret, run:
```bash
security find-generic-password -a "$USER" -s "SECRET_NAME" -w 2>/dev/null
```

If a value is empty or the command returns non-zero, print the fix command and
STOP before running anything else:
```
Missing Keychain secret: SECRET_NAME
Fix: security add-generic-password -a "$USER" -s "SECRET_NAME" -w "your-value-here"
```

Always required — check and report all missing before stopping:
- `GITHUB_ORG_TOKEN`

At least one credential set required — check in this order:
1. `ANTHROPIC_API_KEY` — if non-empty, use Anthropic direct. Done.
2. Otherwise check all three: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
   `AWS_DEFAULT_REGION`. If all three are non-empty, use Bedrock. Done.
3. If neither set is complete, print fix commands for all missing keys and
   stop:
   ```
   Missing API credentials. Provide either ANTHROPIC_API_KEY or all three AWS keys.
   Fix: security add-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w "your-key"
   Fix: security add-generic-password -a "$USER" -s "AWS_ACCESS_KEY_ID" -w "your-key"
   Fix: security add-generic-password -a "$USER" -s "AWS_SECRET_ACCESS_KEY" -w "your-secret"
   Fix: security add-generic-password -a "$USER" -s "AWS_DEFAULT_REGION" -w "us-east-1"
   ```

Store all retrieved values as shell variables for use in Phase 7.

## Phase 3 — Detect languages in target repo

If `REPO_URL` is a remote URL, clone it to a temp directory:
```bash
git clone --depth=1 "$REPO_URL" "/tmp/claude-sandbox-detect-$$"
DETECT_DIR="/tmp/claude-sandbox-detect-$$"
```
If `REPO_URL` is a local path or the current directory was used, set
`DETECT_DIR` to that path. Do not re-clone.

Check for these files to detect languages (accumulate into `DETECTED_LANGS`):

| File(s) | Language token |
|---------|---------------|
| `pyproject.toml`, `requirements.txt`, `setup.py` | `python` |
| `package.json`, `tsconfig.json` | `node` |
| `*.csproj`, `*.sln` | `dotnet` |
| `go.mod` | `go` |
| `Cargo.toml` | `rust` |

Report detected languages:
```
Detected languages: node python
```

If no languages are detected, `DETECTED_LANGS` is empty and only the base
layer will be used.

## Phase 4 — Assemble Dockerfile

```bash
SESSION_NAME="${SESSION_NAME:-sandbox}"
DOCKERFILE="/tmp/claude-sandbox-${SESSION_NAME}.dockerfile"
cat ~/.claude/templates/Dockerfile.base > "$DOCKERFILE"
for lang in $DETECTED_LANGS; do
  if [[ -f ~/.claude/templates/Dockerfile.$lang ]]; then
    cat ~/.claude/templates/Dockerfile.$lang >> "$DOCKERFILE"
  fi
done
echo "Assembled Dockerfile with layers: base $(echo $DETECTED_LANGS | tr ' ' ',')"
```

If `~/.claude/templates/Dockerfile.base` does not exist, stop:
```
Missing template: ~/.claude/templates/Dockerfile.base
The sandbox requires this base template to build the container image.
```

## Phase 5 — Build image

```bash
docker build \
  -f "$DOCKERFILE" \
  -t "claude-sandbox-${SESSION_NAME}" \
  ~/.claude
```

The build context is `~/.claude/` so that `COPY templates/container-entrypoint.sh
/entrypoint.sh` (and any other template-relative COPY instructions) resolve
correctly.

If the build fails, stop immediately and print the full Docker error output. Do
not proceed to later phases.

## Phase 6 — Create or reuse volumes

```bash
docker volume create "claude-sandbox-${SESSION_NAME}" 2>/dev/null || true
docker volume create "claude-sandbox-${SESSION_NAME}-meta" 2>/dev/null || true
echo "Volumes ready: claude-sandbox-${SESSION_NAME}, claude-sandbox-${SESSION_NAME}-meta"
```

The `2>/dev/null || true` pattern means an already-existing volume is silently
reused — this is the resumability mechanism. Do not delete existing volumes.

## Phase 7 — Run container

Print the full `docker run` command before executing it. Redact all secret
values in the printed version, replacing each with `***`:

```
docker run --rm \
  -e REPO_URL="$REPO_URL" \
  -e TASK_PROMPT="(see below)" \
  -e GITHUB_ORG_TOKEN="***" \
  -e ANTHROPIC_API_KEY="***" \
  -e AWS_ACCESS_KEY_ID="***" \
  -e AWS_SECRET_ACCESS_KEY="***" \
  -e AWS_DEFAULT_REGION="***" \
  --mount type=bind,source="$HOME/.claude",target=/root/.claude,readonly \
  --mount type=volume,source="claude-sandbox-${SESSION_NAME}",target=/workspace \
  --mount type=volume,source="claude-sandbox-${SESSION_NAME}-meta",target=/workspace-meta \
  claude-sandbox-${SESSION_NAME}
```

Then run the actual command with real values:

```bash
docker run --rm \
  -e REPO_URL="$REPO_URL" \
  -e TASK_PROMPT="$TASK_PROMPT" \
  -e GITHUB_ORG_TOKEN="$GITHUB_ORG_TOKEN" \
  -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}" \
  -e AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-}" \
  --mount type=bind,source="$HOME/.claude",target=/root/.claude,readonly \
  --mount type=volume,source="claude-sandbox-${SESSION_NAME}",target=/workspace \
  --mount type=volume,source="claude-sandbox-${SESSION_NAME}-meta",target=/workspace-meta \
  "claude-sandbox-${SESSION_NAME}"
EXIT_CODE=$?
```

Capture the exit code in `EXIT_CODE`.

## Phase 8 — Report

Based on `EXIT_CODE`:

- **Exit 0:**
  ```
  Sandbox completed successfully.
  ```

- **Non-zero:**
  ```
  Sandbox failed (exit $EXIT_CODE). Check /workspace-meta volume for sandbox.log.
  ```
  Retrieve the last 50 lines of the log for inline display:
  ```bash
  docker run --rm \
    -v "claude-sandbox-${SESSION_NAME}-meta":/m \
    alpine \
    tail -n 50 /m/sandbox.log 2>/dev/null || echo "(sandbox.log not found)"
  ```

## Notes

- Re-run `/sandbox session-name` to resume an interrupted session — the named
  volume preserves workspace state.
- To start fresh: `docker volume rm claude-sandbox-SESSION_NAME`
- Full log: `docker run --rm -v claude-sandbox-SESSION_NAME-meta:/m alpine cat /m/sandbox.log`
- Secrets are never written to disk or baked into the image — they are injected
  at `docker run` time only.
