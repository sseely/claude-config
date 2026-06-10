# /auth-setup

Model routing: Sonnet for implementation; Haiku for verification/scoring; Opus only for explicit architectural decisions.

Scaffold OAuth authentication (LinkedIn, Google, Microsoft) into a
Cloudflare Workers + Neon PostgreSQL + React/Vite project. Uses KV-backed
sessions and HMAC-signed stateless OAuth state.

---

## Step 1 — Gather inputs

Ask the following questions before doing any work. Collect all answers, then
proceed. Do not interleave questions with implementation.

1. **Which OAuth providers do you need?** (LinkedIn / Google / Microsoft —
   pick one or more)
2. **Store the LinkedIn access token?** Only say yes if you need to call the
   LinkedIn API on the user's behalf (e.g. one-click LinkedIn post). Yes/No.
3. **Default post-login redirect path?** (e.g. `/dashboard`) — used in
   `safeReturnTo`.
4. **Session cookie name?** Default: `session`. Change only if the project
   already uses a different name.
5. **KV namespace binding name?** Default: `SESSION_STORE`. Must match
   `wrangler.toml`.
6. **Does your `src/types.ts` already have a `User` interface and `Env`
   interface?** If yes, we merge fields. If no, we create them.
7. **Does your `src/constants.ts` already exist?** If yes, we append. If no,
   we create it.

---

## Step 2 — Read the template files

Read all template files in this skill directory. They contain ADAPT comments
marking every provider-specific or project-specific section.

Template files:
- `migrations/001_users_auth.sql`
- `backend/constants_auth.ts`
- `backend/types_auth.ts`
- `backend/utils_oauth.ts`
- `backend/middleware_auth.ts`
- `backend/routes_auth.ts`
- `frontend/OAuthProviderIcons.tsx`
- `frontend/LoginPage.tsx`
- `frontend/AuthContext.tsx`

---

## Step 3 — Database migration

Apply `migrations/001_users_auth.sql` adapted to the chosen providers:

- Remove the `UNIQUE` column and `CREATE INDEX` for each unused provider.
- Remove `linkedin_access_token` if the user said No in step 1 Q2.
- Add any project-specific columns the user mentioned.

Run the migration against Neon:

```bash
psql "$DATABASE_URL" -f migrations/001_users_auth.sql
```

If the users table already exists, convert the `CREATE TABLE IF NOT EXISTS`
block into `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements for each
missing column, plus `CREATE UNIQUE INDEX IF NOT EXISTS` / `CREATE INDEX IF
NOT EXISTS` for each missing index.

---

## Step 4 — Constants

Merge `backend/constants_auth.ts` into `src/constants.ts` (or create it):

- Remove the `OAUTH` entry for each unused provider.
- Remove `w_member_social` from the LinkedIn scope if LinkedIn access token
  is not being stored.
- Rename `COOKIE.SESSION` if the project uses a different cookie name.

---

## Step 5 — Types

Merge `backend/types_auth.ts` into `src/types.ts` (or create it):

- Remove provider ID fields from `User` for each unused provider.
- Remove `linkedin_access_token` from `User` if not storing it.
- Remove credential env vars from `EnvAuthFields` for each unused provider.
- Add `EnvAuthFields` to the project's `Env` interface. If `Env` already
  exists, add only the missing fields.

---

## Step 6 — OAuth utilities

Write `src/utils/oauth.ts` from `backend/utils_oauth.ts`. No provider-specific
adaptation needed — the utilities are provider-agnostic.

---

## Step 7 — Auth middleware

Write `src/middleware/auth.ts` from `backend/middleware_auth.ts`. No
adaptation needed.

---

## Step 8 — Auth routes

Write `src/routes/auth.ts` from `backend/routes_auth.ts`, adapting as follows:

- Delete the entire section (init handler + callback handler) for each unused
  provider. Each section is clearly bounded by:
  ```
  // ---------------------------------------------------------------------------
  // <Provider> — ADAPT: delete this section if not using <Provider>
  // ---------------------------------------------------------------------------
  ```
- Remove `linkedin_access_token` from `USER_COLS`, `PROVIDER_ID_FIELD`, and
  all `upsertUser` queries if not storing the token.
- Update `safeReturnTo` default path to the value given in step 1 Q3.
- Update `USER_COLS` to match the actual columns in the users table (including
  any project-specific columns added in step 3).

---

## Step 9 — Register routes in the Worker

Find the main router / request handler (usually `src/index.ts` or
`src/router.ts`) and add the auth routes. Register only the providers chosen
in step 1.

Pattern to add for each provider (example: LinkedIn):

```typescript
import {
  handleLinkedInAuth,
  handleLinkedInCallback,
  // handleGoogleAuth, handleGoogleCallback,
  // handleMicrosoftAuth, handleMicrosoftCallback,
  handleLogout,
} from './routes/auth';

// In the router/fetch handler:
if (path === '/auth/linkedin')          return handleLinkedInAuth(request, env);
if (path === '/auth/linkedin/callback') return handleLinkedInCallback(request, env, ctx);
// if (path === '/auth/google')          return handleGoogleAuth(request, env);
// if (path === '/auth/google/callback') return handleGoogleCallback(request, env, ctx);
// if (path === '/auth/microsoft')          return handleMicrosoftAuth(request, env);
// if (path === '/auth/microsoft/callback') return handleMicrosoftCallback(request, env, ctx);
if (path === '/auth/logout' && method === 'POST') return handleLogout(request, env);
```

---

## Step 10 — `/api/me` endpoint

`AuthContext.tsx` calls `GET /api/me` to fetch the logged-in user. Ensure
this endpoint exists and returns the fields in `AuthUser`:

```typescript
// Minimum shape required by AuthContext:
{
  id:          string;
  name:        string;
  email:       string;
  profile_url: string | null;
  is_admin:    boolean;
  // + any project-specific fields added to AuthUser
}
```

If the endpoint already exists, verify it returns these fields. If not, add:

```typescript
import { requireAuth } from './middleware/auth';

// In the router:
if (path === '/api/me' && method === 'GET') {
  const auth = await requireAuth(request, env);
  if (!auth.user) return new Response('Unauthorized', { status: 401 });
  return Response.json({
    id:          auth.user.id,
    name:        auth.user.name,
    email:       auth.user.email,
    profile_url: auth.user.profile_url,
    is_admin:    auth.user.is_admin,
  });
}
```

---

## Step 11 — Frontend components

Write the following frontend files:

**`ui/src/components/OAuthProviderIcons.tsx`** from
`frontend/OAuthProviderIcons.tsx`:
- Delete unused provider icon components.

**`ui/src/context/AuthContext.tsx`** (or `ui/src/contexts/AuthContext.tsx` —
match the project's existing directory) from `frontend/AuthContext.tsx`:
- Extend `AuthUser` with any project-specific fields that `/api/me` returns.
- No other adaptation needed.

**`ui/src/pages/LoginPage.tsx`** from `frontend/LoginPage.tsx`:
- Delete the `<a>` block for each unused provider.
- Update the `<h1>` app name.
- Remove the `LanguageSwitcher` import and usage if `/i18n-setup` has not
  been run.
- Remove the footer policy links if `/compliance-setup` has not been run.

---

## Step 12 — Wire `AuthProvider` into the app

Find the app root (`ui/src/main.tsx` or `ui/src/App.tsx`) and wrap the router
with `AuthProvider`:

```tsx
import { AuthProvider } from './context/AuthContext';

// Wrap your <RouterProvider> or <App> with:
<AuthProvider>
  {/* your existing root */}
</AuthProvider>
```

Add a `/login` route pointing to `LoginPage`. Add a protected route guard
using `useAuth()` that redirects to `/login?returnTo=<current-path>` when
`user` is null and `loading` is false.

---

## Step 13 — i18n keys

If `/i18n-setup` has been run, the `auth` namespace should already exist.
Ensure these keys are present in `locales/en/auth.json`:

```json
{
  "login": {
    "tagline": "Sign in to continue",
    "continueLinkedIn":  "Continue with LinkedIn",
    "continueGoogle":    "Continue with Google",
    "continueMicrosoft": "Continue with Microsoft",
    "footer": {
      "privacy": "Privacy Policy",
      "terms":   "Terms of Service",
      "cookies": "Cookie Policy"
    }
  }
}
```

Remove keys for unused providers. If i18n is not set up, hardcode the strings
in `LoginPage.tsx` and remove the `useTranslation` import.

---

## Step 14 — Environment variables and KV binding

### `wrangler.toml` additions

```toml
[vars]
APP_URL = "https://yourdomain.com"   # ADAPT

[[kv_namespaces]]
binding  = "SESSION_STORE"           # ADAPT: match KV binding name from step 1
id       = "YOUR_KV_NAMESPACE_ID"   # ADAPT: fill in after creating the namespace
```

Create the KV namespace if it doesn't exist:

```bash
npx wrangler kv namespace create SESSION_STORE
```

### Secrets (run once per environment)

```bash
npx wrangler secret put APP_SECRET
# Generate a strong random value, e.g.: openssl rand -hex 32
```

For each chosen provider, put the client credentials as secrets:

```bash
# LinkedIn
npx wrangler secret put LINKEDIN_CLIENT_ID
npx wrangler secret put LINKEDIN_CLIENT_SECRET

# Google
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET

# Microsoft
npx wrangler secret put MICROSOFT_CLIENT_ID
npx wrangler secret put MICROSOFT_CLIENT_SECRET
```

### OAuth app redirect URIs to configure in each provider console

| Provider  | Redirect URI                              |
|-----------|-------------------------------------------|
| LinkedIn  | `https://yourdomain.com/auth/linkedin/callback`  |
| Google    | `https://yourdomain.com/auth/google/callback`    |
| Microsoft | `https://yourdomain.com/auth/microsoft/callback` |

Also add `http://localhost:8787/auth/<provider>/callback` for local dev.

---

## Step 14b — Write tests

Write at minimum:
- **Happy-path test**: call `GET /api/me` with a valid session token — assert 200 and expected user fields.
- **Rejection test**: call `GET /api/me` with no session — assert 401 redirect to `/login`.
- **Protected route test**: access a protected route without session — assert redirect with `returnTo` param.

## Step 15 — Verify

0. Run `npx tsc --noEmit` — fix any type errors before proceeding.
1. Run the dev server: `npm run dev` (or `npx wrangler dev`)
2. Navigate to `/login` — confirm the correct provider buttons appear.
3. Click a provider button — confirm redirect to the OAuth consent screen.
4. Complete the OAuth flow — confirm redirect to the default post-login path.
5. Call `GET /api/me` — confirm user fields are returned.
6. Click sign out — confirm redirect to `/` and session cookie is cleared.
7. Attempt to access a protected route without a session — confirm redirect
   to `/login?returnTo=<path>`.

---

## Operational Readiness

**SLIs to define before going live:**
- Login success rate: % of OAuth callback attempts that result in a valid session (target: >99%)
- Session validation latency p95: time for `requireAuth` to resolve from KV (target: <50ms)
- OAuth callback error rate: % of `/auth/<provider>/callback` requests that return an error (target: <0.1%)
- Token refresh failure rate: % of token refresh attempts that fail (target: <0.5%)

**Key failure modes:**
- KV/session store unavailable → all authenticated requests fail; detected by session validation error rate spike; mitigation: circuit-breaker to a read-only degraded state, surface a login-unavailable page rather than a 500
- OAuth provider outage → login flow broken; detected by OAuth callback error rate exceeding 1%; mitigation: show "Login temporarily unavailable, try again shortly" — do not expose provider error details to the user
- Token signing key misconfiguration → all JWTs rejected immediately after deploy; detected by auth failure rate spiking post-deploy; mitigation: validate key presence and format in the startup health check before accepting traffic

**Rollback classification:** Reversible — auth config changes (secrets, KV bindings, provider toggles) can be reverted; session data is not migrated by auth-setup, so no data migration is required to roll back.

---

## Summary output

After completing all steps, output:

```
## auth-setup complete

Providers configured: <list>
Store LinkedIn token: <yes/no>
Migration applied: migrations/001_users_auth.sql
Routes registered: /auth/<provider>, /auth/<provider>/callback, /auth/logout, /api/me
Frontend: LoginPage, AuthContext, OAuthProviderIcons

Next steps:
- Add KV namespace ID to wrangler.toml
- Set APP_SECRET, client ID + secret for each provider via wrangler secret put
- Register redirect URIs in each provider's OAuth app console
```
