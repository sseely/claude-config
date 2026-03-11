---
name: jira
description: Look up a Jira issue and summarize it, or transition its status. Use when you need to read ticket details, check acceptance criteria, or update ticket status.
disable-model-invocation: true
allowed-tools: Read
---

Interact with Jira for the ticket specified in $ARGUMENTS.

## Usage

- `/jira PROJECT-123` — summarize the ticket (title, status, description, acceptance criteria)
- `/jira PROJECT-123 in-progress` — transition the ticket to In Progress
- `/jira PROJECT-123 done` — transition the ticket to Done
- `/jira PROJECT-123 review` — transition the ticket to In Review

## Steps

1. Parse $ARGUMENTS: extract the ticket ID (e.g. `PROJECT-123`) and optional transition target.
2. Use the `mcp__atlassian__getJiraIssue` tool to fetch the issue.
3. If no transition was requested, output a structured summary:
   - **Ticket**: ID and URL
   - **Title**: issue summary
   - **Status**: current status
   - **Assignee**: who it's assigned to
   - **Priority**: priority level
   - **Description**: full description (trimmed if very long)
   - **Acceptance criteria**: extracted from description or custom field if present
4. If a transition was requested:
   - Use `mcp__atlassian__getTransitionsForJiraIssue` to get available transitions
   - Match the requested transition (case-insensitive partial match)
   - Use `mcp__atlassian__transitionJiraIssue` to apply it
   - Confirm the new status

## Notes

- If no ticket ID is found in $ARGUMENTS, check the current git branch name for a Jira pattern (e.g. `feat/PROJECT-123-description`) and use that ticket.
- If still no ticket ID found, ask: "Which Jira ticket should I look up?"
