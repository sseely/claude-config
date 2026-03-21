---
name: compliance-setup
description: Scaffold GDPR + CRA compliance features into a Cloudflare Workers + Neon + React/Vite project. Covers consent gate, data export, account deletion/restore, user feedback (star rating), SBOM request/delivery, Termly policy pages, Canny feedback widget, and CI jobs (SBOM generation + i18n audit).
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

Scaffold full GDPR + CRA compliance features into this project. Templates live at
`~/.claude/skills/compliance-setup/`. Work through each step in order.

---

## Step 1 — Gather inputs

Ask the user for all of the following before writing any files:

| Variable | Description | Example |
|---|---|---|
| `PROJECT_NAME` | SBOM filename prefix (no spaces) | `my-app` |
| `APP_DISPLAY_NAME` | App name shown in emails | `My App` |
| `NOREPLY_EMAIL` | SendGrid from address | `noreply@myapp.com` |
| `TERMLY_COOKIE_ID` | Termly Cookie Policy dataId | `e5b2bd62-...` |
| `TERMLY_PRIVACY_ID` | Termly Privacy Policy dataId | `7695fe09-...` |
| `TERMLY_TERMS_ID` | Termly Terms of Service dataId | `28c6b006-...` |
| `CANNY_APP_ID` | Canny app ID (optional — skip if not using Canny) | `abc123` or blank |
| `CANNY_URL` | Canny public board URL (optional) | `https://feedback.myapp.com` |
| `R2_SBOM_PREFIX` | R2 path prefix for SBOM files | `sbom/latest` |

---

## Step 2 — Database migrations

Find the next available numeric prefix in `src/db/migrations/` (e.g. if the highest is
`018_`, use `019_`, `020_`, `021_`).

For each migration below, Read the template, then write it to `src/db/migrations/` with
the correct prefix. Do not modify the SQL — it is already idempotent.

1. Read `~/.claude/skills/compliance-setup/migrations/001_consent_fields.sql`
   → write as `src/db/migrations/NNN_consent_fields.sql`

2. Read `~/.claude/skills/compliance-setup/migrations/002_user_feedback.sql`
   → write as `src/db/migrations/NNN_user_feedback.sql`
   → **ADAPT**: if your session/item table is not `polls`, update the FK reference.

3. Read `~/.claude/skills/compliance-setup/migrations/003_sbom_requests.sql`
   → write as `src/db/migrations/NNN_sbom_requests.sql`

If these columns/tables already exist in `src/db/schema.sql`, skip the corresponding
migration and note it.

---

## Step 3 — Backend routes

Read each template and write to `src/routes/`. If the project already has an
`src/routes/me.ts`, merge the handlers from `routes_me.ts` into it rather than
creating a separate file.

### 3a. Me routes (consent, export, delete, restore)

Read `~/.claude/skills/compliance-setup/backend/routes_me.ts` and apply:
- **ADAPT `buildExportPayload`**: update the data query to include your project's
  primary tables (events, sessions, orders — whatever the user owns). The profile
  and consent sections are generic and do not need changes.
- **ADAPT `handleDeleteAccount`**: null out the OAuth ID columns that your project
  uses. Remove columns that don't exist in your schema.
- **ADAPT cookie clearing**: update the cookie name constant if it differs from
  `COOKIE.SESSION`.

### 3b. Feedback route

Read `~/.claude/skills/compliance-setup/backend/routes_feedback.ts` and write to
`src/routes/feedback.ts`.
- **ADAPT**: if your session FK column is not `poll_id`, rename it in the INSERT
  and the upsert conflict clause.

### 3c. SBOM route

Read `~/.claude/skills/compliance-setup/backend/routes_sbom.ts` and write to
`src/routes/sbom.ts`. No adaptation needed.

### 3d. SBOM cron / scheduled handler

Read `~/.claude/skills/compliance-setup/backend/sbom_cron.ts`.

In `src/index.ts` (or equivalent scheduled handler), add a call to
`processPendingSbomRequests` inside the `scheduled` export. Also add the two helper
functions (`generateR2PresignedUrl`, `sendSbomEmail`) or import them from the route file.

Apply substitutions:
- `PROJECT_NAME` → the value from Step 1
- `R2_SBOM_PREFIX` → the value from Step 1
- `NOREPLY_EMAIL` → the value from Step 1
- `APP_DISPLAY_NAME` → the value from Step 1

### 3e. Register routes

Add these entries to the fetch handler in `src/index.ts` (adapt to the project's
routing pattern):

```
POST   /api/me/consent    → handlePostConsent(request, env, user)
GET    /api/me/export     → handleExportData(request, env, user, ctx)
DELETE /api/me            → handleDeleteAccount(request, env, user, ctx)
POST   /api/me/restore    → handleRestoreAccount(request, env, user, ctx)
POST   /api/feedback      → handleSubmitFeedback(request, env, user)
POST   /api/sbom/request  → handleRequestSbom(request, env, user, ctx)
GET    /api/sbom/status   → handleGetSbomStatus(request, env, user)
```

### 3f. Scheduled cleanup (account deletion)

In the scheduled handler, add a cleanup block that hard-deletes users whose
`recovery_backup_expires_at` has passed and `has_recovery_backup = true`:

```sql
UPDATE users
SET deleted_at = NULL  -- or DELETE if you prefer hard delete
WHERE deleted_at IS NOT NULL
  AND recovery_backup_expires_at < NOW()
  AND has_recovery_backup = true
```

Also delete the R2 backup object for each expired user before removing the row.

---

## Step 4 — Frontend components

Read each template and write to the project's UI directory. Adapt import paths
(e.g. `../contexts/AuthContext`, `../api`, `../constants/routes`) to match the
project's actual structure.

| Template | Target | Substitutions |
|---|---|---|
| `frontend/TermlyEmbed.tsx` | `ui/src/components/TermlyEmbed.tsx` | none |
| `frontend/CannyFeedback.tsx` | `ui/src/components/CannyFeedback.tsx` | none |
| `frontend/ConsentPage.tsx` | `ui/src/pages/ConsentPage.tsx` | none |
| `frontend/CookiePolicyPage.tsx` | `ui/src/pages/CookiePolicyPage.tsx` | `TERMLY_COOKIE_ID` |
| `frontend/PrivacyPolicyPage.tsx` | `ui/src/pages/PrivacyPolicyPage.tsx` | `TERMLY_PRIVACY_ID` |
| `frontend/TermsPage.tsx` | `ui/src/pages/TermsPage.tsx` | `TERMLY_TERMS_ID` |
| `frontend/SettingsPage_cards.tsx` | merge exports into `ui/src/pages/SettingsPage.tsx` | none |

### 4a. Wire consent gate into App.tsx (or equivalent router)

Inside `RequireAuth` (or the auth guard), add after the unauthenticated redirect:

```tsx
if (user.consent_required) return <Navigate to={ROUTES.CONSENT} replace />;
```

### 4b. Add public routes

```tsx
<Route path={ROUTES.COOKIE_POLICY}  element={<CookiePolicyPage />} />
<Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicyPage />} />
<Route path={ROUTES.TERMS}          element={<TermsPage />} />
<Route path={ROUTES.CONSENT}        element={<ConsentPage />} />
```

### 4c. Add Canny (if CANNY_APP_ID was provided)

Inside `RequireAuth`, render `<CannyFeedback>` only when `VITE_CANNY_APP_ID` is set:

```tsx
const AppID = import.meta.env['VITE_CANNY_APP_ID'] as string | undefined;
// ...
{AppID && <CannyFeedback user={{ id: user.id, name: user.name, email: user.email }} />}
```

### 4d. Footer links

In the Layout footer, add:

```tsx
<Link to={ROUTES.PRIVACY_POLICY}>{t('login.footer.privacy')}</Link>
<Link to={ROUTES.TERMS}>{t('login.footer.terms')}</Link>
<Link to={ROUTES.COOKIE_POLICY}>{t('login.footer.cookies')}</Link>
{CANNY_URL && (
  <a href={CANNY_URL} target="_blank" rel="noopener noreferrer" data-canny-link>
    {t('login.footer.feedback')}
  </a>
)}
```

### 4e. Route constants

Add to `ui/src/constants/routes.ts` (or equivalent):

```ts
CONSENT:        '/consent',
COOKIE_POLICY:  '/cookie-policy',
PRIVACY_POLICY: '/privacy-policy',
TERMS:          '/terms',
```

### 4f. Env vars

Add to `ui/.env.example` (or equivalent):

```
VITE_CANNY_APP_ID=       # optional
VITE_CANNY_FEEDBACK_URL= # optional
```

Add to `wrangler.toml` / `wrangler.jsonc` vars:

```toml
TERMS_VERSION   = "YYYY-MM"   # bump when ToS changes
PRIVACY_VERSION = "YYYY-MM"   # bump when Privacy Policy changes
R2_ENDPOINT     = ""
R2_ACCESS_KEY_ID = ""
R2_SBOM_BUCKET  = ""
SENDGRID_API_KEY = ""
```

Add R2 binding for user backup data:

```toml
[[r2_buckets]]
binding    = "R2_USER_BACKUPS"
bucket_name = "your-user-backups-bucket"
```

Also add the `consent_required` flag to the `/api/me` response — return
`consent_required: user.terms_accepted_at === null` alongside the existing user fields.

---

## Step 5 — i18n keys

Read `~/.claude/skills/compliance-setup/i18n/en_auth_consent.json` and
`~/.claude/skills/compliance-setup/i18n/en_settings_compliance.json`.

1. Find all locale directories under `ui/src/i18n/locales/` (use Glob).
2. For each locale:
   - Merge the `consent` block and `login.footer` block into `auth.json`.
   - Merge the `privacy`, `export`, `sbom`, and `danger` blocks into `settings.json`.
   - Translate each new key into the target language.
   - For RTL languages (Arabic `ar`, Urdu `ur`), check the existing file's
     encoding style (some store non-ASCII as `\uXXXX`) and match it.
3. Do not overwrite existing keys — only add the missing ones.

---

## Step 6 — CI jobs

Read `~/.claude/skills/compliance-setup/github/workflow_sbom.yml` and
`~/.claude/skills/compliance-setup/github/workflow_i18n_audit.yml`.

Open `.github/workflows/ci.yml` and merge both jobs in at the end of the `jobs:` block.

Apply substitutions to the SBOM job:
- `PROJECT_NAME` → the value from Step 1
- Confirm the R2 secret/var names (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_ENDPOINT`, `R2_BUCKET`) match what is configured in the GitHub repo settings.
  Adjust if different.

For the i18n-audit job:
- Confirm `npm run i18n:check` exists in `ui/package.json`. If it doesn't, note
  this to the user and skip that job — they'll need to add the script first.

---

## Step 7 — Verify

1. Run `npm run build` (or equivalent) and confirm TypeScript compiles cleanly.
2. If compliance test files exist (`test/me.test.ts`, `test/feedback.test.ts`,
   `test/sbom.test.ts`), run them.
3. Summarise:
   - What was created
   - What ADAPT comments remain and need manual attention
   - What env vars / secrets need to be set before the feature is live
   - Whether the i18n:check script is missing (action required)
