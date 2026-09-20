// Isomorphic — no browser or i18next imports. Safe to import from both
// ui/src/i18n/ (frontend) and a Workers backend route (src/routes/*.ts),
// unlike index.ts, which runs browser-only side effects at module load time
// (localStorage, navigator, window) and cannot be imported from either a
// Workers route or a plain Node script.

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'pt-PT', label: 'Português (PT)' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'zh-CN', label: '中文（简体）' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ru', label: 'Русский' },
  { code: 'ur', label: 'اردو' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ko', label: '한국어' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];
