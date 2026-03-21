#!/usr/bin/env tsx
/**
 * i18n consistency audit.
 *
 * Verifies that every non-English locale file has exactly the same key
 * structure as the English (en) source file for each namespace.
 *
 * Fails (exit 1) and prints diagnostics if:
 *   - A non-English locale is missing keys that exist in English
 *     → translation was never added after a new string was introduced
 *   - A non-English locale has keys that do not exist in English
 *     → orphaned string left behind after a key was removed from English
 *
 * ADAPT: keep NAMESPACES in sync with the array in src/i18n/index.ts.
 *
 * Run locally:   cd ui && npm run i18n:check
 * Fix missing:   npm run translate -- --force --ns <namespace>
 * Fix orphaned:  delete the stale key from the locale file
 */

import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = path.resolve(import.meta.dirname, '../src/i18n/locales');

// ADAPT: add/remove namespaces to match src/i18n/index.ts
const NAMESPACES = [
  'common',
];

function flatKeys(obj: Record<string, unknown>, prefix = ''): Set<string> {
  const out = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      for (const nested of flatKeys(v as Record<string, unknown>, full)) {
        out.add(nested);
      }
    } else {
      out.add(full);
    }
  }
  return out;
}

const locales = fs
  .readdirSync(LOCALES_DIR)
  .filter((f) => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory());

const nonEnglish = locales.filter((l) => l !== 'en');

let failures = 0;

for (const ns of NAMESPACES) {
  const enPath = path.join(LOCALES_DIR, 'en', `${ns}.json`);
  if (!fs.existsSync(enPath)) continue;

  const enKeys = flatKeys(JSON.parse(fs.readFileSync(enPath, 'utf-8')));

  for (const locale of nonEnglish) {
    const localePath = path.join(LOCALES_DIR, locale, `${ns}.json`);

    if (!fs.existsSync(localePath)) {
      console.error(`MISSING FILE : ${locale}/${ns}.json`);
      failures++;
      continue;
    }

    const localeKeys = flatKeys(JSON.parse(fs.readFileSync(localePath, 'utf-8')));

    for (const key of enKeys) {
      if (!localeKeys.has(key)) {
        console.error(`MISSING KEY  : ${locale}/${ns}.json  →  ${key}`);
        failures++;
      }
    }

    for (const key of localeKeys) {
      if (!enKeys.has(key)) {
        console.error(`ORPHANED KEY : ${locale}/${ns}.json  →  ${key}`);
        failures++;
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} i18n issue(s) found. Fix before merging.`);
  process.exit(1);
}

console.log(
  `✓ All ${nonEnglish.length} locales × ${NAMESPACES.length} namespaces are in sync with English.`
);
