#!/usr/bin/env bash
# project-init.sh — Initialize memory + Serena for the current project.
# Runs as an async UserPromptSubmit hook; all operations are idempotent.

set -euo pipefail

PROJECT_DIR="$(pwd)"

# Only act inside git repos
if ! git -C "$PROJECT_DIR" rev-parse --git-dir > /dev/null 2>&1; then
  exit 0
fi

# ── 1. .agent-notes/ ──────────────────────────────────────────────────────────
if [ ! -d "$PROJECT_DIR/.agent-notes" ]; then
  mkdir -p "$PROJECT_DIR/.agent-notes"
  touch "$PROJECT_DIR/.agent-notes/.gitkeep"
fi

# ── 2. .mcp.json ──────────────────────────────────────────────────────────────
SERENA_DIR="${SERENA_HOME:-$HOME/git/serena}"
if [ ! -f "$PROJECT_DIR/.mcp.json" ]; then
  cat > "$PROJECT_DIR/.mcp.json" << EOF
{
  "mcpServers": {
    "mem0": {
      "type": "sse",
      "url": "http://localhost:8765/mcp/claude-code/sse/default"
    },
    "serena": {
      "command": "uv",
      "args": [
        "--directory", "$SERENA_DIR",
        "run", "serena", "start-mcp-server",
        "--context", "claude-code",
        "--project", "$PROJECT_DIR"
      ]
    }
  }
}
EOF
fi

# ── 3. Language detection (for Serena) ────────────────────────────────────────
DETECTED_LANGS=()
if [ -f "$PROJECT_DIR/package.json" ]; then
  DETECTED_LANGS+=(javascript typescript)
fi
if [ -f "$PROJECT_DIR/pyproject.toml" ] || [ -f "$PROJECT_DIR/requirements.txt" ] || [ -f "$PROJECT_DIR/setup.py" ]; then
  DETECTED_LANGS+=(python)
fi
if [ -f "$PROJECT_DIR/Cargo.toml" ]; then
  DETECTED_LANGS+=(rust)
fi
if [ -f "$PROJECT_DIR/go.mod" ]; then
  DETECTED_LANGS+=(go)
fi
if [ -f "$PROJECT_DIR/pom.xml" ] || [ -f "$PROJECT_DIR/build.gradle" ] || [ -f "$PROJECT_DIR/build.gradle.kts" ]; then
  DETECTED_LANGS+=(java)
fi
if find "$PROJECT_DIR" -maxdepth 3 -name "*.csproj" 2>/dev/null | grep -q .; then
  DETECTED_LANGS+=(csharp)
fi

LANGS_YAML="[]"
if [ ${#DETECTED_LANGS[@]} -gt 0 ]; then
  joined=$(printf '%s, ' "${DETECTED_LANGS[@]}")
  joined="${joined%, }"
  LANGS_YAML="[$joined]"
fi

# ── 4. .serena/project.yml ────────────────────────────────────────────────────
if [ ! -f "$PROJECT_DIR/.serena/project.yml" ]; then
  mkdir -p "$PROJECT_DIR/.serena"
  PROJECT_NAME="$(basename "$PROJECT_DIR")"
  printf "project_name: \"%s\"\nencoding: \"utf-8\"\nlanguages: %s\n" \
    "$PROJECT_NAME" "$LANGS_YAML" > "$PROJECT_DIR/.serena/project.yml"
fi

# ── 5. .gitignore — ensure .serena/cache/ is excluded ─────────────────────────
GITIGNORE="$PROJECT_DIR/.gitignore"
if [ -f "$GITIGNORE" ]; then
  if ! grep -qF '.serena/cache' "$GITIGNORE"; then
    printf '\n.serena/cache/\n' >> "$GITIGNORE"
  fi
else
  printf '.serena/cache/\n' > "$GITIGNORE"
fi
