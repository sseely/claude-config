---
name: i18n-setup
description: Scaffold i18n infrastructure into a React/Vite project. Sets up i18next with 18 locales (en + 17), lazy-loading, browser language detection, localStorage persistence, a Claude-powered translate script, an audit script, and an optional server-side language preference endpoint. Keeps NAMESPACES in sync across all three files that reference them.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

Scaffold i18n infrastructure into this project. Templates live at
`~/.claude/skills/i18n-setup/`. Work through each step in order.

---

## Step 1 — Gather inputs

Ask the user for:

1. **Initial namespaces** — what logical groupings does the UI need?
   Default suggestion: start with `common` and add more as features are built.
   Each namespace becomes one JSON file per locale (e.g. `common.json`, `auth.json`).

2. **Server-side language persistence** — should the chosen language be stored on
   the user's account (requires a `preferred_language` column on the users table
   and a `PATCH /api/me/language` endpoint)?
   Answer: yes / no.

3. **Storage key name** — what key is used for localStorage?
   Default: `lang`. (Will be written as `STORAGE_KEYS.LANG` — confirm the storage
   constants file location.)

---

## Step 2 — Install dependencies

```bash
cd ui && npm install i18next react-i18next
npm install --save-dev @anthropic-ai/sdk tsx
```

`@anthropic-ai/sdk` and `tsx` are dev-only — used only by the translate script.

---

## Step 3 — Directory structure

Create the locale directory for all 18 languages:

```
ui/src/i18n/
  locales/
    en/   es/   fr/   de/   nl/   it/
    pt-BR/  pt-PT/  hi/   zh-CN/  ja/
    ar/   bn/   ru/   ur/   id/   tr/   ko/
```

For each namespace the user specified in Step 1, create an empty starter file in
`locales/en/<namespace>.json`. Read
`~/.claude/skills/i18n-setup/locales/en_common.json` for the minimal shape, then
adapt it — add at minimum a `loading` key so the audit script has something to verify.

---

## Step 4 — Core i18n module

Read `~/.claude/skills/i18n-setup/src/i18n_index.ts`.

Adapt and write to `ui/src/i18n/index.ts`:
- Replace the single `common` namespace with the full list from Step 1.
- Add one `import` per namespace from `./locales/en/<ns>.json`.
- Add one `import()` call per namespace inside `loadLocale`.
- Add one entry per namespace in `resources.en`.
- If server-side persistence is **no**: remove the `persistLanguageToServer` function
  and its call sites. The `changeLanguage` function still saves to localStorage.
- If server-side persistence is **yes**: keep `persistLanguageToServer` and adapt the
  cookie name check to match the project's session cookie name.
- Adapt the `STORAGE_KEYS.LANG` import path to match where storage constants live.

---

## Step 5 — Manifest and dynamic keys

Read `~/.claude/skills/i18n-setup/src/i18n_manifest.ts` → write to
`ui/src/i18n/manifest.ts`. No changes needed — it starts intentionally sparse.

Read `~/.claude/skills/i18n-setup/src/i18n_dynamic_keys.ts` → write to
`ui/src/i18n/dynamic-keys.ts`. No changes needed.

---

## Step 6 — LanguageSwitcher component

Read `~/.claude/skills/i18n-setup/src/LanguageSwitcher.tsx` → write to
`ui/src/components/LanguageSwitcher.tsx`.

Adapt the import paths (`../i18n`, `../constants/storage`) to match the project.

If the project uses a different design system (no CSS variables like `var(--border)`),
update the inline styles to match.

---

## Step 7 — Scripts

Read `~/.claude/skills/i18n-setup/scripts/i18n-audit.ts` → write to
`ui/scripts/i18n-audit.ts`.
- Update the `NAMESPACES` array to match Step 1.

Read `~/.claude/skills/i18n-setup/scripts/translate.ts` → write to
`ui/scripts/translate.ts`.
- Update the `NAMESPACES` array to match Step 1.
- Update the `systemPrompt` app description to match the project name and purpose.

Add to `ui/package.json` scripts:

```json
"translate":  "tsx scripts/translate.ts",
"i18n:check": "tsx scripts/i18n-audit.ts"
```

---

## Step 8 — Backend language route (if server-side persistence is yes)

Read `~/.claude/skills/i18n-setup/backend/routes_me_language.ts`.

Write to `src/routes/me_language.ts` (or merge into an existing `src/routes/me.ts`).

Add to the database schema / next migration:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) NOT NULL DEFAULT 'en';
```

Register the route in `src/index.ts`:

```
PATCH /api/me/language → handlePatchLanguage(request, env, user)
```

On login / session restore, read `preferred_language` from the DB and include it
in the `/api/me` response so the frontend can restore the user's saved language on
next visit. In `ui/src/i18n/index.ts`, update the initialisation to prefer the
server value over the localStorage value when available.

---

## Step 9 — Wire into the app

In `ui/src/main.tsx` (or `App.tsx`), add:

```ts
import './i18n'; // side-effect import — must run before any component renders
```

This ensures i18next is initialised before the React tree mounts.

---

## Step 10 — Generate translations

Run the translate script to generate all 17 non-English locales:

```bash
cd ui && ANTHROPIC_API_KEY=<key> npm run translate
```

If `ANTHROPIC_API_KEY` is not available right now, skip this step and note that
the user should run it before shipping. The audit script will fail until translations
exist for all locales, so add a note that CI will be red until then.

---

## Step 11 — Verify

```bash
cd ui && npm run i18n:check
```

Should print: `✓ All 17 locales × N namespaces are in sync with English.`

If it fails with `MISSING FILE` errors, translations haven't been generated yet
(Step 10 was skipped). That's expected — note it for the user.

---

## Step 12 — Summarise

Report:
- Namespaces created
- Whether server-side persistence was wired
- Whether translations were generated or need to be run manually
- Any ADAPT comments that still need attention
- The three files that must stay in sync whenever a namespace is added:
  `src/i18n/index.ts`, `scripts/translate.ts`, `scripts/i18n-audit.ts`
