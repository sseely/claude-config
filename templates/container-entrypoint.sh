#!/bin/bash
set -euo pipefail

# ── Required env var validation ─────────────────────────────────────────────
required_vars=(REPO_URL TASK_PROMPT GITHUB_ORG_TOKEN)
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "[entrypoint] ERROR: required env var $var is not set" >&2
    exit 1
  fi
done

# Atlassian/Jira integration is optional: only validate its vars when a
# ticket is actually supplied.
if [[ -n "${JIRA_TICKET:-}" ]]; then
  atlassian_vars=(ATLASSIAN_API_TOKEN ATLASSIAN_EMAIL ATLASSIAN_BASE_URL)
  for var in "${atlassian_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      echo "[entrypoint] ERROR: JIRA_TICKET is set but required env var $var is not set" >&2
      exit 1
    fi
  done
fi

# At least one AI credential set must be present
if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" || -z "${AWS_DEFAULT_REGION:-}" ]]; then
    echo "[entrypoint] ERROR: must set ANTHROPIC_API_KEY or AWS_ACCESS_KEY_ID+AWS_SECRET_ACCESS_KEY+AWS_DEFAULT_REGION" >&2
    exit 1
  fi
fi

# ── Configure gh CLI ─────────────────────────────────────────────────────────
echo "$GITHUB_ORG_TOKEN" | gh auth login --with-token

# ── Clone or resume ───────────────────────────────────────────────────────────
WORK_DIR="${VOLUME_DIR:-/workspace}"
mkdir -p /workspace-meta

if [[ -d "$WORK_DIR/.git" ]]; then
  echo "[entrypoint] Resuming from existing workspace at $WORK_DIR"
  git -C "$WORK_DIR" pull --ff-only || echo "[entrypoint] pull failed (dirty state?), continuing"
else
  echo "[entrypoint] Cloning $REPO_URL into $WORK_DIR"
  git clone "$REPO_URL" "$WORK_DIR"
fi

# ── Invoke claude ─────────────────────────────────────────────────────────────
cd "$WORK_DIR"
set +e
claude --dangerously-skip-permissions -p "$TASK_PROMPT" \
  2>&1 | tee -a /workspace-meta/sandbox.log
EXIT_CODE=${PIPESTATUS[0]}
set -e

exit $EXIT_CODE
