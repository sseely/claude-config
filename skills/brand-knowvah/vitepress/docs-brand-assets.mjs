#!/usr/bin/env node
// Copies brand assets from `@knowvah/theme` into site/public/ so VitePress
// can reference them by URL. `themeConfig.logo` and `<link rel="icon">` take
// URLs and the config runs in Node, where Vite's `?url` asset imports are
// unavailable — so the package is the source and this copy is the bridge.
//
// The copies are gitignored; `docs:dev` and `docs:build` run this first.

import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const PUBLIC_DIR = resolve('site/public');

/** Published path under site/public → path inside the theme package. */
const ASSETS = {
  'knowvah_logo.svg': '@knowvah/theme/assets/knowvah_logo.svg',
};

mkdirSync(PUBLIC_DIR, { recursive: true });
for (const [target, source] of Object.entries(ASSETS)) {
  const from = require.resolve(source);
  const to = join(PUBLIC_DIR, target);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`${source} -> site/public/${target}`);
}
