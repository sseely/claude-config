#!/usr/bin/env tsx
/**
 * Translate English locale JSON files into all 17 target languages using
 * Claude claude-opus-4-6 (context-aware, nuance-preserving).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/translate.ts
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/translate.ts --lang es      # single language
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/translate.ts --ns common    # single namespace
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/translate.ts --force        # overwrite existing
 *
 * ADAPT: keep NAMESPACES in sync with src/i18n/index.ts and scripts/i18n-audit.ts.
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = path.resolve(import.meta.dirname, '../src/i18n/locales');

const TARGET_LANGUAGES: Record<string, string> = {
  es: 'Spanish (Latin America)',
  fr: 'French (France)',
  de: 'German (Germany)',
  'pt-BR': 'Brazilian Portuguese',
  'pt-PT': 'European Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-CN': 'Simplified Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  ru: 'Russian',
  id: 'Indonesian',
  tr: 'Turkish',
  ur: 'Urdu',
  it: 'Italian',
  nl: 'Dutch',
};

// ADAPT: add/remove namespaces to match src/i18n/index.ts
const NAMESPACES = [
  'common',
];

const args = process.argv.slice(2);
const langFlag = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;
const nsFlag = args.includes('--ns') ? args[args.indexOf('--ns') + 1] : null;

const langsToTranslate = langFlag
  ? { [langFlag]: TARGET_LANGUAGES[langFlag] ?? langFlag }
  : TARGET_LANGUAGES;
const nsToTranslate = nsFlag ? [nsFlag] : NAMESPACES;

function flattenJson(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      out[key] = v;
    } else if (typeof v === 'object' && v !== null) {
      Object.assign(out, flattenJson(v as Record<string, unknown>, key));
    }
  }
  return out;
}

function unflatten(flat: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = value;
  }
  return out;
}

async function translateNamespace(
  client: Anthropic,
  ns: string,
  lang: string,
  langName: string
): Promise<void> {
  const enPath = path.join(LOCALES_DIR, 'en', `${ns}.json`);
  const outPath = path.join(LOCALES_DIR, lang, `${ns}.json`);

  if (!fs.existsSync(enPath)) {
    console.warn(`  SKIP: ${enPath} not found`);
    return;
  }
  if (fs.existsSync(outPath) && !args.includes('--force')) {
    console.log(`  SKIP: ${lang}/${ns}.json already exists (use --force to overwrite)`);
    return;
  }

  const enRaw = JSON.parse(fs.readFileSync(enPath, 'utf-8')) as Record<string, unknown>;
  const flatEn = flattenJson(enRaw);

  let contextMap: Record<string, string> = {};
  try {
    const { TRANSLATION_CONTEXT } = await import('../src/i18n/manifest.ts');
    contextMap = TRANSLATION_CONTEXT[ns] ?? {};
  } catch {
    // manifest is optional
  }

  const entries = Object.entries(flatEn).map(([key, value]) => ({
    key,
    english: value,
    context: contextMap[key] ?? '',
  }));

  // ADAPT: update the system prompt's app description and any locale-specific rules
  const systemPrompt = `You are a professional software localisation expert translating UI strings for a web application.

Rules:
1. Return ONLY a valid JSON object mapping each input key to its translated value.
2. Preserve ALL {{variable}} interpolation placeholders exactly — do not translate them.
3. Preserve _one / _other plural suffix patterns in the keys — only translate the values.
4. Keep HTML entities (&amp; etc) unchanged.
5. Match the register (formal/informal) and tone of the English source.
6. For Japanese: only use the _other plural form; the _one form may be the same.
7. Translate naturally — not word-for-word. Consider the usage context provided.`;

  const userPrompt = `Translate the following namespace ("${ns}") from English into ${langName}.

Input (JSON array):
${JSON.stringify(entries, null, 2)}

Return a JSON object with the same keys and translated values. No markdown, no explanation — just the JSON.`;

  console.log(`  Translating ${lang}/${ns}.json (${entries.length} strings)…`);

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON found in response for ${lang}/${ns}`);

  const translated = JSON.parse(jsonMatch[0]) as Record<string, string>;
  const mergedFlat: Record<string, string> = { ...flatEn, ...translated };
  const output = unflatten(mergedFlat);

  fs.mkdirSync(path.join(LOCALES_DIR, lang), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`  ✓ Written ${outPath}`);
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });
  for (const [lang, langName] of Object.entries(langsToTranslate)) {
    console.log(`\nLanguage: ${langName} (${lang})`);
    for (const ns of nsToTranslate) {
      await translateNamespace(client, ns, lang, langName);
    }
  }
  console.log('\nDone.');
}

main().catch((err) => { console.error(err); process.exit(1); });
