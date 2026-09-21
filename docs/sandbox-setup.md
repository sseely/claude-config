# Sandbox Setup Guide

This guide covers everything required to run the `/sandbox` skill: Docker,
credentials, and a smoke test for each component.

## Prerequisites

- **Docker Desktop** — installed and running (`docker info` should succeed)
- **`gh` CLI** — installed and authenticated (`gh auth status` shows active login)
- **macOS** — Keychain is required for secret storage

## Secrets setup

All secrets are stored in macOS Keychain. Each entry uses `$USER` as the
account name and a fixed service name as the key. Commands below use shell
substitution — run them in a terminal where `$USER` is set (it always is on
macOS).

### 1. ANTHROPIC_API_KEY

Your Anthropic API key. Required if you are using Anthropic direct instead of
AWS Bedrock.

**Get it:** [Anthropic Console](https://console.anthropic.com) → API Keys →
Create key.

```bash
security add-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w "sk-ant-..."
```

**Verify:**

```bash
security find-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w
```

### 2. AWS_ACCESS_KEY_ID

AWS IAM access key ID. Required if you are using AWS Bedrock instead of
Anthropic direct.

**Get it:** AWS IAM Console → Users → (your user) → Security credentials →
Create access key → select "Other" use case.

```bash
security add-generic-password -a "$USER" -s "AWS_ACCESS_KEY_ID" -w "AKIA..."
```

**Verify:**

```bash
security find-generic-password -a "$USER" -s "AWS_ACCESS_KEY_ID" -w
```

### 3. AWS_SECRET_ACCESS_KEY

The secret half of the IAM key pair. Required if using Bedrock.

**Get it:** Same IAM page as above. AWS shows this value only once at
creation — copy it then.

```bash
security add-generic-password -a "$USER" -s "AWS_SECRET_ACCESS_KEY" -w "..."
```

**Verify:**

```bash
security find-generic-password -a "$USER" -s "AWS_SECRET_ACCESS_KEY" -w
```

### 4. AWS_DEFAULT_REGION

The AWS region where your Bedrock Claude model is available. Required if using
Bedrock.

**Get it:** Choose the region where Claude models are enabled in your Bedrock
console (e.g. `us-east-1`).

```bash
security add-generic-password -a "$USER" -s "AWS_DEFAULT_REGION" -w "us-east-1"
```

**Verify:**

```bash
security find-generic-password -a "$USER" -s "AWS_DEFAULT_REGION" -w
```

### 5. GITHUB_ORG_TOKEN

GitHub personal access token used to clone repositories and create pull
requests from within the sandbox container.

**Get it:** GitHub → Settings → Developer settings → Personal access tokens →
Fine-grained tokens → Generate new token. Required permissions:

- **Contents** — read and write
- **Pull requests** — read and write
- **Metadata** — read (automatically included)

```bash
security add-generic-password -a "$USER" -s "GITHUB_ORG_TOKEN" -w "github_pat_..."
```

**Verify:**

```bash
security find-generic-password -a "$USER" -s "GITHUB_ORG_TOKEN" -w
```

### 6. ATLASSIAN_API_TOKEN

**Optional — only needed if you pass `JIRA_TICKET`.** Jira API token used
to post comments and update labels on tickets.

**Get it:** [Atlassian account settings](https://id.atlassian.com/manage-profile/security/api-tokens)
→ Security → Create and manage API tokens → Create API token.

```bash
security add-generic-password -a "$USER" -s "ATLASSIAN_API_TOKEN" -w "ATATT3x..."
```

**Verify:**

```bash
security find-generic-password -a "$USER" -s "ATLASSIAN_API_TOKEN" -w
```

### 7. ATLASSIAN_EMAIL

**Optional — only needed if you pass `JIRA_TICKET`.** The email address for
your Atlassian account. Used together with the API token for Basic
authentication.

**Get it:** Your Atlassian login email.

```bash
security add-generic-password -a "$USER" -s "ATLASSIAN_EMAIL" -w "you@example.com"
```

**Verify:**

```bash
security find-generic-password -a "$USER" -s "ATLASSIAN_EMAIL" -w
```

### 8. ATLASSIAN_BASE_URL

**Optional — only needed if you pass `JIRA_TICKET`.** Your Jira Cloud
instance URL.

**Get it:** The base URL visible in your browser when logged in to Jira, e.g.
`https://yourorg.atlassian.net`.

```bash
security add-generic-password -a "$USER" -s "ATLASSIAN_BASE_URL" -w "https://yourorg.atlassian.net"
```

**Verify:**

```bash
security find-generic-password -a "$USER" -s "ATLASSIAN_BASE_URL" -w
```

## AWS vs Anthropic

You can store both sets of credentials — there is no conflict. The `/sandbox`
skill checks for `ANTHROPIC_API_KEY` first. If set and non-empty, it uses
Anthropic direct. If not set or empty, it falls back to AWS Bedrock using
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_DEFAULT_REGION`. If
neither is available, the skill stops with an error before launching the
container.

## Verify setup

Run these checks before your first `/sandbox` invocation.

```bash
# Test Docker base image build (2-3 minutes on first run, cached after)
docker build -f templates/Dockerfile.base -t claude-sandbox-test ~/.claude \
  && echo "Build OK" && docker rmi claude-sandbox-test
```

## First run

```bash
/sandbox my-session https://github.com/org/repo.git "fix the login bug"
```

Expected sequence:

1. Secrets retrieved from Keychain (fast, no output)
2. Language detection in the target repository
3. Docker build output — 2-3 minutes on first run; subsequent runs use the
   layer cache and are much faster
4. Container starts — watch for `[entrypoint]` log lines confirming the agent
   is running
