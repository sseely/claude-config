# brand-knowvah

Apply the Knowvah "Warm Studio" visual identity and app shell to a new
`*.knowvah.com` React/Vite project. Covers CSS theme tokens, ThemeContext,
sidebar layout, and the App.tsx provider/routing skeleton.

Run this skill after the project scaffold exists (Vite + React + TypeScript +
Tailwind CSS v4 + React Router + i18next). Run `auth-setup` first if you want
the sidebar's user profile section wired to a real session.

---

## Step 1 — Gather inputs

Ask these before doing any work:

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

---

## Step 3 — Copy and adapt `index.css`

Copy `ui/index.css` from `ui/index.css` (the template). No changes needed —
the full Warm Studio token set is self-contained.

If `ui/src/index.css` already exists, **replace it entirely**.

The font is JetBrains Mono, loaded from Google Fonts in `index.html`. Do not
add a `font-family` declaration to the CSS — Tailwind's base reset handles
font inheritance from `body`.

---

## Step 4 — Write `ui/index.html`

Copy from `ui/index.html`. Adapt:

- Replace `"Knowvah – App Name"` with `"Knowvah – <subtitle from step 1>"`.
- If **compliance-setup was run**: replace `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
  with the Termly UUID from step 1 Q9.
- If **compliance-setup was NOT run**: remove the entire `<script>` block
  containing the Termly embed.

---

## Step 5 — Write `src/constants/storage.ts`

Copy from `ui/constants_storage.ts`. Adapt:

- Update the `LANG` value prefix to match this app's name if different from
  `knowvah`. E.g. `'myapp_lang'`.

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

---

## Step 8 — Write `src/components/TopBar.tsx`

Copy from `ui/TopBar.tsx`. No changes needed.

---

## Step 9 — Write `src/components/Layout.tsx`

Copy from `ui/Layout.tsx`. Adapt:

- If **compliance-setup was NOT run**: remove `CANNY_FEEDBACK_URL` and the
  conditional feedback link in the footer.
- Update i18n namespace references if 'auth' and 'common' are named
  differently in this project.

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

---

## Step 11 — Copy the Knowvah logo

Copy `knowvah_logo.svg` from this skill's template directory to
`ui/public/knowvah_logo.svg` in the new project.

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

---

## Step 14 — Configure Tailwind

Ensure `tailwind.config.ts` (or `vite.config.ts` Tailwind plugin) includes
the `ui/src/**` glob. No custom theme extension is needed — the design system
runs entirely through CSS custom properties referenced as `bg-[var(--bg)]` etc.

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

---

## Step 16 — Verify

1. Run `npm run dev` — the app should load with the warm cream background and
   dark charcoal sidebar.
2. Toggle OS dark mode — theme should switch immediately.
3. Collapse/expand the sidebar — state should persist across page refresh.
4. Resize to mobile — sidebar should be hidden, hamburger button visible.
5. Click the hamburger — drawer should slide in with overlay.

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
