---
name: brand-knowvah
description: Apply the Knowvah "Warm Studio" visual identity to a *.knowvah.com project — either a React/Vite app (CSS tokens, ThemeContext, sidebar layout, App.tsx skeleton) or a VitePress documentation site (colours, JetBrains Mono, logo, favicon, social card, OS contrast preference, all sourced from the published @knowvah/theme package).
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

Model routing: Sonnet for implementation steps; WebFetch verification steps need no routing.

# brand-knowvah

Apply the Knowvah "Warm Studio" visual identity to a `*.knowvah.com`
project. Two project types, two paths:

- **React/Vite app** — CSS theme tokens, ThemeContext, sidebar layout, and
  the App.tsx provider/routing skeleton. Steps 2–16.
- **VitePress docs site** — colours, font, logo, favicon, social card, and
  the OS contrast preference, consumed from the published `@knowvah/theme`
  package rather than copied. The "Docs site path" section, steps D1–D6.

For an app, run this after the scaffold exists (Vite + React + TypeScript +
Tailwind CSS v4 + React Router + i18next), and run `auth-setup` first if
you want the sidebar's user profile section wired to a real session. For a
docs site, run it once the VitePress site builds.

---

## Step 0 — Resume check

Before doing anything else, check whether `.brand-knowvah-progress.md` exists
in the working directory.

**If it exists:**
1. Read it.
2. If `collected_inputs: true` is present, extract the stored inputs — do not
   re-ask any question whose answer is already recorded.
3. Find the first step checkbox that is still `[ ]` (unchecked).
4. Print: `Resuming from [step name].`
5. Skip Steps 1–2 entirely and jump directly to the first unchecked step.

**If it does not exist:** continue to Step 1 as normal.

---

## Step 1 — Gather inputs

Ask first:

0. **Project type** — React/Vite app, or VitePress docs site? If it is a
   docs site, skip the rest of this step, write the progress file with the
   **docs-site checklist** shown at the end of this step, and go to the
   "Docs site path" section. Its own Step D0 gathers what it needs.

For a React/Vite app, ask these before doing any work:

1. **App subtitle** — what goes after the dash in the title tag?
   E.g. "Live Polling", "Audience Insights". Used in `index.html`.
2. **Subdomain** — which `*.knowvah.com` subdomain will this deploy to?
   (Informational only — used in the summary.)
3. **Has `auth-setup` been run?** — determines whether ThemeContext and
   Sidebar can reference `useAuth()`. Yes/No.
4. **Has `compliance-setup` been run?** — determines whether `index.html`
   needs the Termly embed and whether `AnalyticsProvider` needs the consent
   gate. Yes/No.
5. **Has `analytics-setup` been run?** — determines whether App.tsx wraps
   routes with `<AnalyticsProvider>` and includes `PageViewTracker`. Yes/No.
6. **What are this app's main nav items?** — list the page names and their
   routes. Used to populate `NAV_ITEMS` in Sidebar and routes in
   `constants/routes.ts`.
7. **Does this app have a credits model?** — show/hide the credits badge in
   the sidebar. Yes/No.
8. **Does this app have an admin role?** — show/hide the admin nav section.
   Yes/No.
9. **Termly site UUID** (if compliance-setup was run) — the
   `data-website-uuid` value for the Termly embed script.

After all questions are answered, write `.brand-knowvah-progress.md` in the
working directory before doing any further work:

```
# Brand-Knowvah Progress
collected_inputs: true

## Inputs
<record each collected input as a key: value line>

## Steps
- [ ] install-dependencies
- [ ] copy-index-css
- [ ] write-index-html
- [ ] write-storage-ts
- [ ] write-routes-ts
- [ ] write-theme-context
- [ ] write-topbar
- [ ] write-layout
- [ ] write-sidebar
- [ ] copy-logo
- [ ] write-app-tsx
- [ ] wire-main-tsx
- [ ] configure-tailwind
- [ ] add-i18n-keys
- [ ] verify
```

For a docs site the progress file is the same shape with this checklist
instead:

```
## Steps
- [ ] d1-registry
- [ ] d2-ci-auth
- [ ] d3-brand-assets
- [ ] d4-theme
- [ ] d5-config
- [ ] d6-verify
```

---

## Step 2 — Install dependencies

Check `ui/package.json`. Install any missing packages:

```bash
# Required
npm install react-router-dom @heroicons/react

# Only if not already present
npm install react-i18next i18next   # if i18n-setup was run
npm install posthog-js              # if analytics-setup was run
```

On success, mark `- [x] install-dependencies` in `.brand-knowvah-progress.md`.

---

## Step 3 — Copy and adapt `index.css`

Copy `ui/index.css` from `ui/index.css` (the template). No changes needed —
the full Warm Studio token set is self-contained.

If `ui/src/index.css` already exists, **replace it entirely**.

The font is JetBrains Mono, loaded from Google Fonts in `index.html`. Do not
add a `font-family` declaration to the CSS — Tailwind's base reset handles
font inheritance from `body`.

On success, mark `- [x] copy-index-css` in `.brand-knowvah-progress.md`.

---

## Step 4 — Write `ui/index.html`

Copy from `ui/index.html`. Adapt:

- Replace `"Knowvah – App Name"` with `"Knowvah – <subtitle from step 1>"`.
- If **compliance-setup was run**: replace `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
  with the Termly UUID from step 1 Q9.
- If **compliance-setup was NOT run**: remove the entire `<script>` block
  containing the Termly embed.

On success, mark `- [x] write-index-html` in `.brand-knowvah-progress.md`.

---

## Step 5 — Write `src/constants/storage.ts`

Copy from `ui/constants_storage.ts`. Adapt:

- Update the `LANG` value prefix to match this app's name if different from
  `knowvah`. E.g. `'myapp_lang'`.

On success, mark `- [x] write-storage-ts` in `.brand-knowvah-progress.md`.

---

## Step 6 — Write `src/constants/routes.ts`

Copy from `ui/constants_routes.ts`. Replace the placeholder routes with this
app's actual page structure (from step 1 Q6):

- Keep `HOME`, `DASHBOARD`, `SETTINGS`, `LOGIN` (auth-setup uses these).
- Keep policy routes (`PRIVACY_POLICY`, `TERMS`, `COOKIE_POLICY`, `CONSENT`)
  only if compliance-setup was run.
- Keep `ADMIN_DASHBOARD` only if this app has an admin role (step 1 Q8).
- Add dynamic routes as functions:
  ```typescript
  ITEM: (id: string) => `/items/${id}` as const,
  ```

On success, mark `- [x] write-routes-ts` in `.brand-knowvah-progress.md`.

---

## Step 7 — Write `src/contexts/ThemeContext.tsx`

Copy from `ui/ThemeContext.tsx`.

- If **auth-setup was run**: no changes — `useAuth()` is already in scope.
- If **auth-setup was NOT run**: replace the `useAuth()` call and the
  `effectiveThemeMode` logic with a simple default:
  ```typescript
  // Remove: const { user, loading: authLoading } = useAuth();
  // Remove: const effectiveThemeMode = ...
  const effectiveThemeMode = themeMode; // always honour stored preference
  ```
  Also remove the `import { useAuth } from './AuthContext';` line.

On success, mark `- [x] write-theme-context` in `.brand-knowvah-progress.md`.

---

## Step 8 — Write `src/components/TopBar.tsx`

Copy from `ui/TopBar.tsx`. No changes needed.

On success, mark `- [x] write-topbar` in `.brand-knowvah-progress.md`.

---

## Step 9 — Write `src/components/Layout.tsx`

Copy from `ui/Layout.tsx`. Adapt:

- If **compliance-setup was NOT run**: remove `CANNY_FEEDBACK_URL` and the
  conditional feedback link in the footer.
- Update i18n namespace references if 'auth' and 'common' are named
  differently in this project.

On success, mark `- [x] write-layout` in `.brand-knowvah-progress.md`.

---

## Step 10 — Write `src/components/Sidebar.tsx`

Copy from `ui/Sidebar.tsx`. Adapt:

1. **NAV_ITEMS**: replace with the items from step 1 Q6. Import the matching
   Heroicons.
2. **Credits badge**: if step 1 Q7 = No, remove the `{user && !collapsed && ...}`
   credits badge block.
3. **Admin section**: if step 1 Q8 = No, remove the `{user?.is_admin && ...}`
   block entirely.
4. **Brand name**: update the text `Knowvah` after the logo `<img>` to match
   this app's display name (or keep "Knowvah" if that's the brand).
5. If **auth-setup was NOT run**: the `user` object shape may differ. Update
   type casts on `user.credits_available`, `user.is_admin`, `user.profile_url`
   to match the actual user type.

On success, mark `- [x] write-sidebar` in `.brand-knowvah-progress.md`.

---

## Step 11 — Copy the Knowvah logo

Copy `knowvah_logo.svg` from this skill's template directory to
`ui/public/knowvah_logo.svg` in the new project.

On success, mark `- [x] copy-logo` in `.brand-knowvah-progress.md`.

---

## Step 12 — Write `src/App.tsx`

Copy from `ui/App.tsx`. Adapt:

1. **Lazy imports**: replace the placeholder page imports with this app's
   actual pages. Remove policy page imports if compliance-setup was not run.
2. **AnalyticsProvider**: if analytics-setup was NOT run, remove the import
   and the `<AnalyticsProvider>` wrapper. Replace `useAnalytics()` with a
   no-op shim or remove the `identify` call from `RequireAuth`.
3. **CannyFeedback**: if compliance-setup was NOT run, remove the import and
   the `{AppID && <CannyFeedback ...>}` block.
4. **Consent gate**: if compliance-setup was NOT run, remove the
   `consent_required` check inside `RequireAuth`.
5. **Routes**: wire up the pages from step 1 Q6. Public routes go outside the
   `<RequireAuth><Layout /></RequireAuth>` wrapper; authenticated routes go
   inside it.
6. **Admin routes**: if step 1 Q8 = No, remove admin route entries.

On success, mark `- [x] write-app-tsx` in `.brand-knowvah-progress.md`.

---

## Step 13 — Wire CSS into `main.tsx`

Ensure `ui/src/main.tsx` imports the CSS:

```typescript
import './index.css';
```

Wrap the app with `<BrowserRouter>` if not already:

```typescript
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

On success, mark `- [x] wire-main-tsx` in `.brand-knowvah-progress.md`.

---

## Step 14 — Configure Tailwind

Ensure `tailwind.config.ts` (or `vite.config.ts` Tailwind plugin) includes
the `ui/src/**` glob. No custom theme extension is needed — the design system
runs entirely through CSS custom properties referenced as `bg-[var(--bg)]` etc.

On success, mark `- [x] configure-tailwind` in `.brand-knowvah-progress.md`.

---

## Step 15 — Add i18n keys

If i18n-setup was run, add the sidebar and footer translation keys to the
`common` and `auth` namespaces:

**`locales/en/common.json`** — add under existing keys:
```json
{
  "sidebar": {
    "expand": "Expand sidebar",
    "collapse": "Collapse sidebar"
  },
  "nav": {
    "dashboard": "Dashboard",
    "settings": "Settings",
    "signOut": "Sign out",
    "adminSection": "Admin",
    "adminDashboard": "Dashboard"
  },
  "credits": {
    "remaining": "{{count}} credits remaining"
  }
}
```

**`locales/en/auth.json`** — add under existing keys:
```json
{
  "login": {
    "footer": {
      "privacy": "Privacy",
      "terms": "Terms",
      "cookies": "Cookies",
      "feedback": "Feedback"
    }
  }
}
```

Run `npm run i18n:translate` (if the translate script exists) to populate the
other 17 locales.

On success, mark `- [x] add-i18n-keys` in `.brand-knowvah-progress.md`.

---

## Step 16 — Verify

**Failure policy: if `npx tsc --noEmit` fails, stop immediately and report the
full error output. Do not continue. The user must resolve type errors and
re-run (Step 0 will resume from this step).**

0. Run `npx tsc --noEmit` — fix any type errors before proceeding.
1. Run `npm run dev` — the app should load with the warm cream background and
   dark charcoal sidebar.
2. Toggle OS dark mode — theme should switch immediately.
3. Collapse/expand the sidebar — state should persist across page refresh.
4. Resize to mobile — sidebar should be hidden, hamburger button visible.
5. Click the hamburger — drawer should slide in with overlay.

On success, mark `- [x] verify` in `.brand-knowvah-progress.md`.

---

## Docs site path (VitePress)

Everything below was worked out on `dot-atlassian` (confluence.knowvah.com)
on 2026-09-15 and is what that repo now does. The brand comes from the
published package, so a colour change in `common/packages/theme` reaches the
docs site with a version bump, not an edit.

Two facts shape every step. `@knowvah/theme` is published to GitHub
Packages and **stays there** (decided 2026-09-15 — do not propose npmjs).
Every other `@knowvah` package lives on npmjs. A scope maps to one registry.

### Step D0 — Gather inputs

1. **Site title** — the VitePress `title`. Used for `og:site_name`.
2. **Site directory** — default `site/`.
3. **Package manager** — pnpm is assumed below; with npm, `pnpm.overrides`
   becomes top-level `overrides` and the lockfile checks change name.
4. **Other `@knowvah` packages in the tree** — run
   `pnpm ls --depth 3 | grep @knowvah` and list every one, direct and
   transitive. Each one that is not `theme` must be pinned in D1.
5. **Workflows that install** — `grep -l 'pnpm install' .github/workflows/*`.
   Every one of them changes in D2.
6. **Social card** — default is the corporate site's existing banner,
   `https://knowvah.com/images/og-diagrams.png` (1200×630). Referencing it
   avoids committing a binary.
7. **All-mono body?** — default no: mono goes on headings, nav, sidebar,
   hero, and code; prose stays sans. The corporate site is all-mono, but
   long-form reading in monospace costs more than it gives.

Record the answers in `.brand-knowvah-progress.md` under `## Inputs`.

### Step D1 — Registry split and dependencies

1. Write `.npmrc` at the repo root:
   ```
   # @knowvah/theme is on GitHub Packages; every other @knowvah package is
   # on registry.npmjs.org. A scope maps to one registry, so the npmjs ones
   # are pinned as tarball URLs in package.json. Auth for npm.pkg.github.com
   # comes from ~/.npmrc locally and actions/setup-node in CI, never here.
   @knowvah:registry=https://npm.pkg.github.com
   ```
2. For each npmjs `@knowvah` package from D0 Q4, replace its version with
   the tarball URL `https://registry.npmjs.org/@knowvah/<name>/-/<name>-<ver>.tgz`
   at the version currently in the lockfile. Direct dependencies in their
   own block; transitive ones under `pnpm.overrides`.
3. Add `@knowvah/theme` at the latest version
   (`npm view @knowvah/theme version --registry=https://npm.pkg.github.com`)
   and `@fontsource/jetbrains-mono` (OFL; self-hosts the brand face), both as
   devDependencies.
4. `pnpm install`, then check the lockfile:
   - every `@knowvah` entry resolves from the intended registry;
   - `grep -c 'resolution: {tarball:' pnpm-lock.yaml` is **0** — a tarball
     entry without `integrity` fails CI with
     `ERR_PNPM_MISSING_TARBALL_INTEGRITY`. If any appear, restore the hash
     from the previous lockfile or compute it
     (`curl -sL <tgz> | openssl dgst -sha512 -binary | base64`) and put it
     back on that line. Never regenerate the lockfile to fix this, and edit
     line-anchored: a regex that can cross lines will splice hundreds of
     comma-free entries into one.

Mark `- [x] d1-registry`.

### Step D2 — CI auth

In **every** workflow from D0 Q5:

1. Add `packages: read` to `permissions`.
2. On `actions/setup-node`, add
   `registry-url: https://npm.pkg.github.com` and `scope: '@knowvah'`.
3. On the install step, add
   `env: NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.

Then **stop and tell the user** what they must do on
https://github.com/orgs/knowvah/packages/npm/theme/settings before CI can
pass: disable "Inherit access from repository", then add this repo with
Read under "Manage Actions access". The package inherits `common`'s access
by default, which silently ignores per-repo grants. The symptom is a 403 on
the theme tarball with the token present and `Packages: read` listed in
the job's token permissions — it is not a missing token. No API exposes
this setting, so only a CI run proves it.

Mark `- [x] d2-ci-auth`.

### Step D3 — Brand assets

`themeConfig.logo` and the favicon link take URLs, and the VitePress config
runs in Node where Vite's `?url` imports are unavailable, so the package is
the source and a copy is the bridge.

1. Copy `vitepress/docs-brand-assets.mjs` from this skill to `scripts/`.
   Its `PUBLIC_DIR` is `site/public`; change it if D0 Q2 differs.
2. Add `site/public/knowvah_logo.svg` (adjust the site dir) to `.gitignore`
   with a one-line comment pointing at the script.
3. In `package.json` scripts: `"docs:brand": "node scripts/docs-brand-assets.mjs"`,
   and prefix `docs:dev` and `docs:build` with `pnpm docs:brand && `.

Mark `- [x] d3-brand-assets`.

### Step D4 — Theme

1. In `<site>/.vitepress/theme/index.ts`, after the existing imports:
   ```typescript
   // Brand: the Warm Studio palette as VitePress variables, the brand mono
   // face self-hosted at the two weights the corporate site loads, and this
   // site's own rules for where that face applies.
   import '@knowvah/theme/vitepress';
   import '@fontsource/jetbrains-mono/400.css';
   import '@fontsource/jetbrains-mono/700.css';
   import './custom.css';
   ```
2. Copy `vitepress/custom.css` from this skill to
   `<site>/.vitepress/theme/custom.css`. If D0 Q7 was yes, add
   `--vp-font-family-base: var(--vp-font-family-mono);` under `:root`.

The package stylesheet already covers light, dark, and
`prefers-contrast: more` for both. Nothing else is needed for contrast.

Mark `- [x] d4-theme`.

### Step D5 — Config

In `<site>/.vitepress/config.ts`:

```typescript
head: [
  ['link', { rel: 'icon', type: 'image/svg+xml', href: '/knowvah_logo.svg' }],
  ['meta', { name: 'theme-color', content: '#c45d3e' }],
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:site_name', content: '<title>' }],
  ['meta', { property: 'og:image', content: '<social card URL from D0 Q6>' }],
  ['meta', { property: 'og:image:width', content: '1200' }],
  ['meta', { property: 'og:image:height', content: '630' }],
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
],
themeConfig: {
  logo: '/knowvah_logo.svg', // merged into every locale's themeConfig
  // ...existing
},
```

Mark `- [x] d5-config`.

### Step D6 — Verify

**Failure policy: if the build fails, stop and report the full output.**
Do not merge on the strength of a green build alone — the checks below are
what catch a silent fallback to Inter or the default indigo.

1. `pnpm docs:build`.
2. In the dist: the favicon link, the OG tags, `knowvah_logo.svg` present,
   `jetbrains-mono-*.woff2` under `assets/`, and **no**
   `fonts.googleapis` reference anywhere.
3. Serve the dist (`pnpm docs:preview`) and run this from inside the repo
   (so Playwright resolves), which asserts the values rather than eyeballing
   them:
   ```javascript
   import { chromium } from '@playwright/test';
   const b = await chromium.launch();
   for (const [name, dark, contrast] of [
     ['light', false, 'no-preference'], ['dark', true, 'no-preference'],
     ['hc-light', false, 'more'], ['hc-dark', true, 'more'],
   ]) {
     const ctx = await b.newContext({ colorScheme: dark ? 'dark' : 'light' });
     const p = await ctx.newPage();
     await p.emulateMedia({ contrast });
     await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
     if (dark) await p.evaluate(() => document.documentElement.classList.add('dark'));
     console.log(name, await p.evaluate(() => ({
       brand: getComputedStyle(document.documentElement).getPropertyValue('--vp-c-brand-1').trim(),
       fontLoaded: document.fonts.check('16px "JetBrains Mono"'),
       logo: !!document.querySelector('.VPNavBarTitle img'),
     })));
     await ctx.close();
   }
   await b.close();
   ```
   Expected brand values: `#c45d3e`, `#e07350`, `#9e3a1e`, `#f09070` in
   that order; `fontLoaded` and `logo` true in all four. Repeat the logo
   check on one translated locale if the site has any.
4. Run the repo's lint, typecheck, and test gates.
5. Open a PR. Its CI run is the only proof of D2; a 403 there means the
   package-settings step in D2 is not done.

Mark `- [x] d6-verify`.

---

## Operational Readiness

**SLIs to define before going live:**
- Theme-token load success rate: % of page loads where `index.css` custom properties resolve before first paint (target: 100%, no FOUC)
- OS dark-mode sync correctness: % of sessions where the initial theme matches `prefers-color-scheme` or the stored override (target: 100%)
- Sidebar state persistence rate: % of reloads where collapsed/expanded state matches the last `localStorage` value (target: 100%)

**Key failure modes:**
- CSS token file missing from the build output → app renders unstyled (no cream/charcoal theme); detected by visual diffing or unstyled-page reports; mitigation: verify `index.css` is included in the Vite build, add a build-time asset check
- `ThemeContext` `localStorage` read throws (private browsing, storage disabled) → provider crashes on mount; detected by a client error-rate spike on mount; mitigation: wrap storage access in try/catch, fall back to system preference
- Sidebar collapse state desyncs across open tabs → confusing UX, not a hard failure; detected via user reports; mitigation: known gap — add a `storage` event listener if cross-tab sync becomes a requirement

**Docs-site failure modes (D-path):**
- CI install 403s on the theme tarball with the token present → the package still inherits access from `common`; detected on the first CI run after D2; mitigation: the package-settings step in D2, nothing in the repo
- CI install fails `ERR_PNPM_MISSING_TARBALL_INTEGRITY` after a version bump → a tarball entry lost its `integrity`; detected by the D1 grep before pushing; mitigation: restore the hash on that line, never regenerate the lockfile
- Headings silently fall back to sans after a VitePress upgrade → a default-theme class name in `custom.css` was renamed; detected by the D6 font check; mitigation: update the selector list

**Rollback classification:** Reversible — brand-knowvah only writes CSS tokens, context, and component files scoped to this project; no data migration; revert via git.

---

## Summary output

```
## knowvah-brand complete

App: <subtitle> at <subdomain>.knowvah.com

Files written:
  ui/index.html                          — JetBrains Mono, favicon, <Termly: yes/no>
  ui/src/index.css                       — Warm Studio tokens (4 theme combinations)
  ui/src/constants/storage.ts
  ui/src/constants/routes.ts             — <N> routes
  ui/src/contexts/ThemeContext.tsx       — OS-aware, auth-gated custom prefs
  ui/src/components/TopBar.tsx           — mobile-only hamburger header
  ui/src/components/Layout.tsx           — sidebar + main + footer shell
  ui/src/components/Sidebar.tsx          — collapsible, <N> nav items
  ui/src/App.tsx                         — AuthProvider → ThemeProvider → ...
  ui/public/knowvah_logo.svg             — copied from knowvah-audience-insights

Nav items configured: <list>
Credits badge: <yes/no>
Admin section: <yes/no>
Compliance (Termly + Canny): <yes/no>
Analytics (PostHog): <yes/no>

Remaining manual steps:
  - Set VITE_CANNY_APP_ID in your hosting env (if compliance-setup was run)
  - Set VITE_CANNY_FEEDBACK_URL in your hosting env (if compliance-setup was run)
  - Deploy to <subdomain>.knowvah.com
```

For a docs site:

```
## knowvah-brand complete (docs site)

Site: <title> at <subdomain>.knowvah.com, source <site dir>

@knowvah/theme <version> from GitHub Packages; npmjs @knowvah packages
pinned as tarballs: <list, or "none">

Files written:
  .npmrc                                 — @knowvah scope → npm.pkg.github.com
  package.json                           — theme + fontsource deps, docs:brand script
  .github/workflows/<each>.yml           — packages: read, registry-url, NODE_AUTH_TOKEN
  scripts/docs-brand-assets.mjs          — copies the logo out of the package
  .gitignore                             — the copied logo
  <site>/.vitepress/theme/index.ts       — theme, font, custom.css imports
  <site>/.vitepress/theme/custom.css     — mono on headings, nav, sidebar, hero
  <site>/.vitepress/config.ts            — favicon, theme-color, OG tags, nav logo

Verified: build, head tags, self-hosted font, logo in every locale,
brand colours in light / dark / prefers-contrast: more.

Remaining manual steps:
  - Package settings: disable "Inherit access from repository" and grant
    this repo Read under Manage Actions access (if not already done)
  - Merge; the docs workflow deploys
```
