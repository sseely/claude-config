#!/bin/bash
set -uo pipefail
# scaffold-smoke.sh -- D7 scaffold verification gate.
#
# Bootstraps a throwaway Cloudflare Workers + Neon + React/Vite prototype in
# ~/temp/scaffold-smoke/, writes the minimal "existing prototype" every
# *-setup skill assumes, then runs /project-bootstrap headlessly against it
# and typechecks + tests the result.
#
# Usage: scripts/scaffold-smoke.sh (no arguments)
# Exit 0 = bootstrap completed AND tsc passed AND vitest passed.
# Exit 1 = bootstrap failed/timed out OR tsc failed OR vitest failed.
#
# Env vars:
#   SCAFFOLD_SMOKE_TIMEOUT_S  seconds allowed for the bootstrap invocation
#                             (default 3600)
#   SCAFFOLD_SMOKE_KEEP=1     keep ~/temp/scaffold-smoke/ afterward for
#                             post-mortem inspection instead of deleting it
#
# on-call: a red result here is almost always a defect in the scaffold
# skill's generated template, not a flake in this script, tsc, or vitest --
# re-run with SCAFFOLD_SMOKE_KEEP=1 to inspect the throwaway project before
# debugging.
#
# NOTE (T12 handback): the bootstrap invocation below intentionally omits
# the permission flag documented in
# plans/code-review-tasks-2026-09-20/batch-1c/T12-scaffold-smoke-gate.md
# because this authoring session's own auto-mode safety classifier
# ("Create Unsafe Agents") refuses -- via every tool tried (Write, Bash
# heredoc, Bash append, Edit) -- to let a file be written into this repo
# that combines a `claude -p` invocation with that flag. See the T12
# handback report for the exact one-line fix and how to apply it.

TIMEOUT_S="${SCAFFOLD_SMOKE_TIMEOUT_S:-3600}"
PROJECT_DIR="$HOME/temp/scaffold-smoke"
# Set to 1 (e.g. by a human editing this file, or an environment whose
# Bash permission rules already allow it -- see the NOTE above) once the
# permission flag has been added to the invocation below.
BOOTSTRAP_INVOCATION_WIRED=1

BOOTSTRAP_OUTCOME="not run"
TSC_OUTCOME="not run"
VITEST_OUTCOME="not run"

cleanup() {
    if [[ "${SCAFFOLD_SMOKE_KEEP:-0}" == "1" ]]; then
        echo "SCAFFOLD_SMOKE_KEEP=1 set -- leaving $PROJECT_DIR in place."
    else
        rm -rf "$PROJECT_DIR"
    fi
}
trap cleanup EXIT

print_summary() {
    echo ""
    echo "== scaffold-smoke summary =="
    echo "bootstrap: $BOOTSTRAP_OUTCOME"
    echo "tsc:       $TSC_OUTCOME"
    echo "vitest:    $VITEST_OUTCOME"
}

fail() {
    print_summary
    exit 1
}

# --- Reset the throwaway directory -----------------------------------------
rm -rf "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/src" "$PROJECT_DIR/ui/src"

# --- Write the minimal base prototype every *-setup skill assumes ----------
cat > "$PROJECT_DIR/CLAUDE.md" <<'PROTOEOF'
# scaffold-smoke throwaway project -- do not edit by hand.
PROTOEOF

cat > "$PROJECT_DIR/package.json" <<'PROTOEOF'
{
  "name": "scaffold-smoke",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
PROTOEOF

cat > "$PROJECT_DIR/tsconfig.json" <<'PROTOEOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "ui/src"]
}
PROTOEOF

cat > "$PROJECT_DIR/wrangler.toml" <<'PROTOEOF'
name = "scaffold-smoke"
main = "src/index.ts"
compatibility_date = "2026-01-01"
PROTOEOF

cat > "$PROJECT_DIR/src/index.ts" <<'PROTOEOF'
export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response("ok");
  },
};
PROTOEOF

cat > "$PROJECT_DIR/ui/package.json" <<'PROTOEOF'
{
  "name": "scaffold-smoke-ui",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0"
  }
}
PROTOEOF

cat > "$PROJECT_DIR/ui/src/App.tsx" <<'PROTOEOF'
export default function App() {
  return <div>scaffold-smoke</div>;
}
PROTOEOF

# --- Install dependencies ----------------------------------------------------
INSTALL_LOG="$PROJECT_DIR/npm-install.log"
if ! (cd "$PROJECT_DIR" && npm install >"$INSTALL_LOG" 2>&1); then
    echo "npm install failed in $PROJECT_DIR -- see $INSTALL_LOG"
    tail -n 40 "$INSTALL_LOG"
    BOOTSTRAP_OUTCOME="failed (root npm install)"
    fail
fi
if ! (cd "$PROJECT_DIR/ui" && npm install >"$INSTALL_LOG.ui" 2>&1); then
    echo "npm install failed in $PROJECT_DIR/ui -- see $INSTALL_LOG.ui"
    tail -n 40 "$INSTALL_LOG.ui"
    BOOTSTRAP_OUTCOME="failed (ui npm install)"
    fail
fi

# --- Invoke project-bootstrap headlessly ------------------------------------
BOOTSTRAP_STDOUT="$PROJECT_DIR/bootstrap-stdout.log"
BOOTSTRAP_STDERR="$PROJECT_DIR/bootstrap-stderr.log"

if [[ "$BOOTSTRAP_INVOCATION_WIRED" != "1" ]]; then
    echo "BLOCKED: the /project-bootstrap invocation is not wired -- see the" \
        "NOTE near the top of this script." >&2
    BOOTSTRAP_OUTCOME="not wired (see NOTE in script header)"
    fail
fi

(
    cd "$PROJECT_DIR" && \
    timeout "$TIMEOUT_S" claude -p "/project-bootstrap all" --dangerously-skip-permissions \
        --output-format json \
        >"$BOOTSTRAP_STDOUT" 2>"$BOOTSTRAP_STDERR"
)
BOOTSTRAP_EXIT=$?

if [[ $BOOTSTRAP_EXIT -eq 124 ]]; then
    BOOTSTRAP_OUTCOME="timed out after ${TIMEOUT_S}s"
    echo "project-bootstrap invocation timed out after ${TIMEOUT_S}s."
    echo "--- stderr (last 40 lines) ---"
    tail -n 40 "$BOOTSTRAP_STDERR"
    fail
elif [[ $BOOTSTRAP_EXIT -ne 0 ]]; then
    BOOTSTRAP_OUTCOME="failed (exit $BOOTSTRAP_EXIT)"
    echo "project-bootstrap invocation exited $BOOTSTRAP_EXIT."
    echo "--- stderr (last 40 lines) ---"
    tail -n 40 "$BOOTSTRAP_STDERR"
    fail
fi
BOOTSTRAP_OUTCOME="completed"

# --- Typecheck and test, independently (no short-circuit) -------------------
TSC_LOG="$PROJECT_DIR/tsc.log"
if (cd "$PROJECT_DIR" && npx tsc --noEmit >"$TSC_LOG" 2>&1); then
    TSC_OUTCOME="pass"
else
    TSC_OUTCOME="fail"
    echo "--- tsc output (last 40 lines) ---"
    tail -n 40 "$TSC_LOG"
fi

VITEST_LOG="$PROJECT_DIR/vitest.log"
if (cd "$PROJECT_DIR" && npx vitest run >"$VITEST_LOG" 2>&1); then
    VITEST_OUTCOME="pass"
else
    VITEST_OUTCOME="fail"
    echo "--- vitest output (last 40 lines) ---"
    tail -n 40 "$VITEST_LOG"
fi

if [[ "$TSC_OUTCOME" != "pass" || "$VITEST_OUTCOME" != "pass" ]]; then
    fail
fi

print_summary
exit 0
