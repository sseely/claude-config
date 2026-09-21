#!/usr/bin/env tsx
/**
 * Fitness function (rules/architecture.md#Fitness-functions): verifies the
 * hand-declared `NAMESPACES` array is identical across the three files that
 * must agree on it: src/i18n/index.ts, scripts/i18n-audit.ts, and
 * scripts/translate.ts.
 *
 * This re-parses each file's source text rather than importing it — index.ts
 * runs browser-only side effects at module load time (localStorage,
 * navigator, window) and cannot be imported from a plain Node script.
 *
 * Run locally: cd ui && npm run i18n:check-namespaces
 */
import fs from 'node:fs';
import path from 'node:path';

const FILES: Record<string, string> = {
  'src/i18n/index.ts': path.resolve(import.meta.dirname, '../src/i18n/index.ts'),
  'scripts/i18n-audit.ts': path.resolve(import.meta.dirname, './i18n-audit.ts'),
  'scripts/translate.ts': path.resolve(import.meta.dirname, './translate.ts'),
};

/**
 * Extracts the string values inside `const NAMESPACES = [ ... ]` in `source`.
 * Scans by character rather than a bracket-heavy regex, since some analysis
 * tools mis-parse regex literals containing literal `[`/`]`.
 */
function extractNamespaces(source: string): string[] {
  // Search for the literal declaration prefix, not just the word
  // "NAMESPACES" — several of these files mention it in comments (e.g. "keep
  // NAMESPACES in sync") before the real `const NAMESPACES = [...]` line.
  const declStart = source.indexOf('const NAMESPACES');
  if (declStart === -1) throw new Error('no "const NAMESPACES = [...]" declaration found');

  const openIdx = source.indexOf('[', declStart);
  const closeIdx = openIdx === -1 ? -1 : source.indexOf(']', openIdx);
  if (openIdx === -1 || closeIdx === -1) {
    throw new Error('malformed NAMESPACES declaration');
  }

  return scanQuotedStrings(source.slice(openIdx + 1, closeIdx));
}

/** Returns the contents of every single- or double-quoted string in `text`. */
function scanQuotedStrings(text: string): string[] {
  const values: string[] = [];
  let quote: string | null = null;
  let current = '';
  for (const ch of text) {
    if (quote) {
      if (ch === quote) {
        values.push(current);
        current = '';
        quote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    }
  }
  return values;
}

function readNamespaces(label: string, filePath: string): string[] {
  try {
    return extractNamespaces(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`ERROR reading ${label}: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

function main(): void {
  const labels = Object.keys(FILES);
  const parsed = Object.fromEntries(
    labels.map((label) => [label, readNamespaces(label, FILES[label])])
  );

  const reference = JSON.stringify([...parsed[labels[0]]].sort());
  const mismatched = labels.filter(
    (label) => JSON.stringify([...parsed[label]].sort()) !== reference
  );

  if (mismatched.length > 0) {
    console.error('NAMESPACES mismatch across files:');
    for (const label of labels) {
      console.error(`  ${label}: [${parsed[label].join(', ')}]`);
    }
    process.exit(1);
  }

  console.log(`✓ NAMESPACES match across ${labels.length} files: [${parsed[labels[0]].join(', ')}]`);
}

main();
