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
