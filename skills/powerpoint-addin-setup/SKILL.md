# /powerpoint-addin-setup

Scaffold a PowerPoint Office Add-in into an existing Vite + React project.
Covers the HTTPS dev cert (the step everyone forgets), manifest, HTML entry
points, React entrypoints, Vite config adaptation, dev environment wef sync,
and the sideload procedure.

Run this after the main Vite + React project exists. The add-in shares the
same dev server and build output as the main app.

---

## Step 1 — Gather inputs

Ask these before doing any work:

1. **Add-in display name** — shown in the Office ribbon and any store listing.
   E.g. "Knowvah Live Polling".
2. **Provider name** — your company or publisher name. E.g. "Knowvah".
3. **Ribbon button label** — the short label on the ribbon button that opens
   the task pane. E.g. "Live Polling".
4. **Ribbon button tooltip** — one sentence describing what the button does.
5. **Support URL** — where users go for help. E.g. `https://myapp.com/support`.
6. **Surfaces needed** — Task pane only, or task pane + content surface?
   (Content surface = an iframe embedded inside a slide.) Task pane only / Both.
7. **Dev server port** — default `3000`. Change only if something else is
   already on that port.
8. **Backend proxy port** — default `8787` (Cloudflare Worker). Change if
   your backend runs elsewhere.
9. **Does the project already have a `vite.config.ts`?** — determines whether
   to replace it or merge the add-in changes into it.
10. **Does the project already have an `onebox.sh` or equivalent dev startup
    script?** — determines whether to create one or add the wef sync snippet.

---

## Step 2 — Install dependencies

```bash
cd ui   # or wherever your Vite project root is
npm install office-addin-dev-certs @types/office-js --save-dev
```

`office-addin-dev-certs` generates and installs a trusted localhost cert.
`@types/office-js` provides TypeScript types for the `Office` global.

Check `package.json` first — skip packages already installed.

---

## Step 3 — Install and trust the dev certificate

Office Add-ins require HTTPS even on localhost. A self-signed cert is not
enough — Office will refuse to load it. The `office-addin-dev-certs` package
generates a cert and installs it into the system trust store.

Run once per machine (not per project):

```bash
npx office-addin-dev-certs install
```

**On macOS**, this installs the cert into the macOS Keychain. You will be
prompted for your login password. After installation, verify it worked:

```bash
npx office-addin-dev-certs verify
```

Expected output: `Certificates are trusted by the system.`

**If the cert expires or is untrusted later:**

```bash
npx office-addin-dev-certs uninstall
npx office-addin-dev-certs install
```

**Why this step matters:** Without a trusted cert, PowerPoint will silently
refuse to load the add-in with no useful error message. This is the most
common cause of "my add-in won't load" during initial setup.

---

## Step 4 — Create the directory structure

```
ui/
  addin/
    manifest.xml          ← manifest (sideloaded into PowerPoint)
    taskpane/
      index.html          ← task pane HTML entry point
    content/              ← ADAPT: omit if task pane only (step 1 Q6)
      index.html          ← content surface HTML entry point
  src/
    addin/
      taskpane/
        main.tsx          ← Office.onReady → React root
        App.tsx           ← your task pane UI (placeholder)
      content/            ← ADAPT: omit if task pane only
        main.tsx          ← Office.onReady → React root
        App.tsx           ← your content surface UI (placeholder)
```

---

## Step 5 — Write the manifest

Copy from `templates/manifest.xml`. Replace every `XXXXXXXX` placeholder:

- Generate a fresh GUID for `<Id>`:
  ```bash
  node -e "const {randomUUID}=require('crypto');console.log(randomUUID())"
  ```
- `<ProviderName>` — step 1 Q2
- `<DisplayName>` — step 1 Q1
- `<Description>` — step 1 Q4 (or expand it)
- `<SupportUrl>` — step 1 Q5
- Group id, Control id, TaskpaneId — use the add-in name with dots, no spaces
  (e.g. `Knowvah.Group`, `Knowvah.OpenTaskPane`, `Knowvah.TaskPane`)
- `Group.Label` string — step 1 Q2 (provider name)
- `TaskPane.Label` string — step 1 Q3 (ribbon button label)
- `TaskPane.Tooltip` string — step 1 Q4 (tooltip)

If step 1 Q6 = Task pane only:
- Remove the `<AllFormFactors>` block containing `PresentationContent`
- Remove the `<bt:Url id="ContentApp.Url">` entry from Resources

Write to `ui/addin/manifest.xml`.

---

## Step 6 — Write the HTML entry points

**Task pane** — copy from `templates/taskpane_index.html`:
- Replace `XXXXXXXX` in `<title>` with the add-in name.
- Write to `ui/addin/taskpane/index.html`.

**Content surface** (if step 1 Q6 = Both) — copy from `templates/content_index.html`:
- Replace `XXXXXXXX` in `<title>` with the add-in name.
- Write to `ui/addin/content/index.html`.

**Critical:** `office.js` must be loaded from Microsoft's CDN in each HTML
file. Do not bundle it — bundling breaks the add-in runtime.

---

## Step 7 — Write the React entry points

**Task pane** — copy from `templates/taskpane_main.tsx`:
- Write to `ui/src/addin/taskpane/main.tsx`.
- Create a placeholder `ui/src/addin/taskpane/App.tsx`:
  ```tsx
  export default function App() {
    return <div style={{ padding: 16 }}>Task pane loaded.</div>;
  }
  ```

**Content surface** (if step 1 Q6 = Both) — copy from `templates/content_main.tsx`:
- Write to `ui/src/addin/content/main.tsx`.
- Create a placeholder `ui/src/addin/content/App.tsx`:
  ```tsx
  export default function App() {
    return <div style={{ padding: 16 }}>Content surface loaded.</div>;
  }
  ```

**Critical:** Always use `Office.onReady()` — never call `createRoot` before
it fires. `document.settings` and all Office APIs are unavailable until then.

---

## Step 8 — Update Vite config

Copy from `templates/vite.config.ts`. Adapt:

- Update `rollupOptions.input` to include only the surfaces from step 1 Q6.
  Remove `addin-content` if task pane only.
- Update proxy ports to match step 1 Q7 and Q8.
- Update or remove `manualChunks` to match your actual dependencies.
- Remove `@shared` alias if your project has no `shared/` directory.

If the project already has a `vite.config.ts` (step 1 Q9 = Yes):
- Merge the HTTPS block (`httpsOptions`) into the existing `server` config.
- Merge the add-in entry points into the existing `rollupOptions.input`.
- Do not replace the file — add only what's missing.

---

## Step 9 — Add TypeScript types for Office

Add to `tsconfig.json` (or `tsconfig.app.json`) in the `compilerOptions.types` array:

```json
{
  "compilerOptions": {
    "types": ["office-js"]
  }
}
```

If `types` doesn't exist yet, add it. This gives you the `Office` global
without needing an explicit import in every file.

---

## Step 10 — Wire the wef sync into the dev startup script

The `wef` folder is where PowerPoint looks for sideloaded add-in manifests.
Syncing the manifest there on startup means you never have to manually
re-upload it after making manifest changes.

**If the project has an `onebox.sh`** (step 1 Q10 = Yes):
- Copy the snippet from `templates/onebox_addin_snippet.sh`.
- Add it after the Docker services are up, before starting Vite.
- Replace `XXXXXXXX-manifest.xml` with `<your-addin-name>-manifest.xml`.

**If starting from scratch**, create `onebox.sh` with at minimum:

```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  kill "$VITE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Sync manifest
if [ "$(uname -s)" = "Darwin" ]; then
  WEF_DIR="$HOME/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef"
  mkdir -p "$WEF_DIR"
  cp "$SCRIPT_DIR/ui/addin/manifest.xml" "$WEF_DIR/<your-addin-name>-manifest.xml"
  echo "Manifest synced. Restart PowerPoint (Cmd+Q then relaunch) to pick up changes."
fi

cd "$SCRIPT_DIR/ui" && npm run dev &
VITE_PID=$!
wait "$VITE_PID"
```

**Note:** After syncing the manifest, PowerPoint must be fully quit (Cmd+Q)
and relaunched to pick up changes. A simple window close is not enough —
this is a PowerPoint quirk, not a bug in the sync.

---

## Step 11 — Sideload the add-in in PowerPoint

1. Start your dev server (`./onebox.sh` or `npm run dev`).
2. Open PowerPoint.
3. Insert → Add-ins → Manage My Add-ins → Upload My Add-in.
4. Select `ui/addin/manifest.xml`.
5. The add-in button should appear in the Home tab ribbon.
6. Click it — the task pane should open with the placeholder "Task pane loaded."

**If the task pane is blank or won't open:**
- Confirm `npx office-addin-dev-certs verify` reports certs are trusted.
- Confirm the dev server is running on HTTPS (check the Vite output for `https://`).
- Open the browser dev tools inside the task pane (right-click → Inspect) to see errors.

**If the ribbon button doesn't appear after sideloading:**
- Quit PowerPoint completely (Cmd+Q), relaunch, and try again.

---

## Step 12 — Verify

1. `npm run dev` starts on `https://localhost:<port>` (not http).
2. PowerPoint ribbon shows the button after sideloading.
3. Clicking the button opens the task pane showing "Task pane loaded."
4. If using the content surface: inserting it via the add-in shows "Content surface loaded."
5. `npm run build` compiles without errors (both entry points included in output).

---

## Summary output

```
## powerpoint-addin-setup complete

Add-in: <display name>
Surfaces: <task pane only | task pane + content>
Dev server: https://localhost:<port>

Files written:
  ui/addin/manifest.xml                    — sideload this in PowerPoint
  ui/addin/taskpane/index.html             — task pane HTML entry
  ui/addin/content/index.html              — content surface HTML entry (if applicable)
  ui/src/addin/taskpane/main.tsx           — Office.onReady → React root
  ui/src/addin/taskpane/App.tsx            — placeholder task pane UI
  ui/src/addin/content/main.tsx            — Office.onReady → React root (if applicable)
  ui/src/addin/content/App.tsx             — placeholder content UI (if applicable)
  vite.config.ts                           — updated with HTTPS + add-in entry points
  onebox.sh                                — dev startup with wef manifest sync

One-time machine setup (already done if cert verify passed):
  npx office-addin-dev-certs install       — installs trusted localhost cert

Next steps:
  - Replace placeholder App.tsx files with your actual add-in UI
  - Update manifest.xml prod URLs before deploying (replace localhost:3000)
  - Add icon PNGs at ui/public/addin/assets/icon-16.png, icon-32.png, icon-80.png
  - To reload after manifest changes: Cmd+Q PowerPoint, relaunch, re-sideload
```
