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

# --- Pick free host ports for Postgres and stripe-mock -----------------------
# Fixed host ports (5432, 12111) can collide with another project's
# containers already running on this machine. Bind two ephemeral ports via
# the OS and release them for Docker to claim; exported so the bootstrapped
# project's generated docker-compose.yml / vitest.config.ts / globalSetup.ts
# (which default DATABASE_URL / STRIPE_BASE_URL from these same two
# variables -- see skills/testing-setup templates) and the tsc/vitest steps
# below all agree on the same ports for this run.
PORTS="$(python3 - <<'PY'
import socket
socks = [socket.socket(socket.AF_INET, socket.SOCK_STREAM) for _ in range(2)]
for s in socks:
    s.bind(("127.0.0.1", 0))
print(socks[0].getsockname()[1], socks[1].getsockname()[1])
for s in socks:
    s.close()
PY
)"
if [[ -z "$PORTS" ]]; then
    echo "Failed to allocate free host ports for Postgres/stripe-mock (python3 required)." >&2
    BOOTSTRAP_OUTCOME="failed (port allocation)"
    fail
fi
read -r TEST_PG_PORT TEST_STRIPE_MOCK_PORT <<< "$PORTS"
export TEST_PG_PORT TEST_STRIPE_MOCK_PORT
export DATABASE_URL="postgresql://dev:devpass@localhost:${TEST_PG_PORT}/myapp"
export STRIPE_BASE_URL="http://localhost:${TEST_STRIPE_MOCK_PORT}"
echo "Using TEST_PG_PORT=$TEST_PG_PORT TEST_STRIPE_MOCK_PORT=$TEST_STRIPE_MOCK_PORT"

# --- Reset the throwaway directory -----------------------------------------
rm -rf "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/src" "$PROJECT_DIR/ui/src"

# --- Write the minimal base prototype every *-setup skill assumes ----------
cat > "$PROJECT_DIR/CLAUDE.md" <<'PROTOEOF'
# scaffold-smoke throwaway project -- do not edit by hand.

## Headless smoke run -- answers for every /project-bootstrap question

This project is driven by `scripts/scaffold-smoke.sh` with no human present.
Do NOT stop to ask questions; treat the answers below as the user's replies
to Step 4 and to every sub-skill questionnaire, and execute all six skills
to completion. Tooling-driven edits to this project are authorized. Running
`git init` is fine. `src/db/client.ts` (pg client over TCP) and a
minimal Vite + React `ui/` are already present -- do not re-scaffold them.
If a question is not covered here, take the skill's documented default and
continue.

- Shared: `APP_URL` = `http://localhost:5173`; product / display name =
  `Scaffold Smoke`.
- i18n-setup: namespaces `common`; persist language server-side = yes;
  localStorage key `lang`.
- auth-setup: providers = Google only; store LinkedIn token = no;
  post-login redirect `/dashboard`; cookie `session`; KV binding
  `SESSION_STORE`; create `src/types.ts` and `src/constants.ts`.
- payments-setup: default pack pricing; default redirects; `is_admin` via
  DB trigger on email domain `example.com`; `POST /admin/coupons` behind
  `X-Admin-Secret` = yes; stripe-mock in integration tests = yes.
- compliance-setup: `PROJECT_NAME` `scaffold-smoke`; `NOREPLY_EMAIL`
  `noreply@example.com`; Termly ids `00000000-0000-0000-0000-000000000001`
  (cookie), `...0002` (privacy), `...0003` (terms); Canny = skip;
  `R2_SBOM_PREFIX` `sbom/latest`.
- analytics-setup: core action = "User completes a session-pack checkout";
  behaviour question = "Where do users drop off before their first
  purchase?"; acquisition channels = web only.
- testing-setup: Durable Objects = no; Python service = no; no extra env
  bindings; local DB creds default (`dev` / `devpass` / `myapp`).
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
  "dependencies": {
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250101.0",
    "@types/pg": "^8.15.5",
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
    "types": ["vitest/globals", "@cloudflare/workers-types"]
  },
  "include": ["src", "ui/src"]
}
PROTOEOF

cat > "$PROJECT_DIR/wrangler.toml" <<PROTOEOF
name = "scaffold-smoke"
main = "src/index.ts"
compatibility_date = "2026-01-01"
# Required for the \`pg\` client in src/db/client.ts to load inside workerd
# (it needs node:net / node:tls / node:stream).
compatibility_flags = ["nodejs_compat"]

[vars]
DATABASE_URL = "$DATABASE_URL"
PROTOEOF

mkdir -p "$PROJECT_DIR/src/db"
cat > "$PROJECT_DIR/src/db/client.ts" <<'PROTOEOF'
// Base-prototype database client every *-setup skill imports as
// `createDbClient` from "../db/client". `pg`'s Pool speaks raw TCP via
// pg-cloudflare in the Workers runtime -- unlike @neondatabase/serverless
// (WebSocket to a Neon proxy), it reaches a plain local Postgres directly,
// so no wsproxy shim is needed for local dev or tests. One Pool per request
// scope; callers pass `env` so the binding is never read globally.
import { Pool } from "pg";

export interface DbClient {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number }>;
  end(): Promise<void>;
}

export function createDbClient(env: { DATABASE_URL: string }): DbClient {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  return {
    async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
      const res = await pool.query(sql, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
    },
    end: () => pool.end(),
  };
}
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
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
PROTOEOF

cat > "$PROJECT_DIR/ui/index.html" <<'PROTOEOF'
<!doctype html>
<html><head><meta charset="utf-8" /><title>scaffold-smoke</title></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
PROTOEOF

cat > "$PROJECT_DIR/ui/vite.config.ts" <<'PROTOEOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()] });
PROTOEOF

cat > "$PROJECT_DIR/ui/src/main.tsx" <<'PROTOEOF'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
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
