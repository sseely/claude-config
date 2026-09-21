import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { STORAGE_KEYS } from '../constants/storage';
export { SUPPORTED_LANGUAGES, type SupportedLanguage } from './i18n_supported_languages';
import { SUPPORTED_LANGUAGES } from './i18n_supported_languages';

// ADAPT: import one JSON file per namespace from the en locale.
// Add a matching entry to NAMESPACES, resources.en, and loadLocale below
// every time you add a new namespace.
import enCommon from './locales/en/common.json';

// ADAPT: keep in sync with scripts/translate.ts and scripts/i18n-audit.ts
const NAMESPACES = [
  'common',
] as const;

// Lazy-load a non-English locale (all namespaces in one Promise.all batch)
async function loadLocale(lang: string): Promise<void> {
  // ADAPT: add one import() per namespace
  const [common] = await Promise.all([
    import(`./locales/${lang}/common.json`),
  ]);
  i18n.addResourceBundle(lang, 'common', common.default ?? common, true, true);
}

function detectBrowserLang(): string {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const exact = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    if (exact) return exact.code;
    const prefix = lang.split('-')[0];
    const fuzzy = SUPPORTED_LANGUAGES.find((l) => l.code.startsWith(prefix));
    if (fuzzy) return fuzzy.code;
  }
  return 'en';
}

const savedLang = localStorage.getItem(STORAGE_KEYS.LANG) ?? detectBrowserLang();

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: 'en',
  ns: NAMESPACES,
  defaultNS: 'common',
  resources: {
    en: {
      common: enCommon,
      // ADAPT: add remaining namespaces here
    },
  },
  interpolation: { escapeValue: false },
});

if (savedLang !== 'en') {
  loadLocale(savedLang).catch(() => {
    // fallback to English already handled by i18next fallbackLng
  });
}

function persistLanguageToServer(lang: string): void {
  // Only fire when authenticated — unauthenticated pages don't have an account.
  // ADAPT: update the cookie name if your session cookie differs from 'session'.
  if (!document.cookie.includes('session=')) return;
  fetch('/api/me/language', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: lang }),
  }).catch(() => { /* non-critical */ });
}

export async function changeLanguage(lang: string): Promise<void> {
  if (lang === 'system') {
    localStorage.removeItem(STORAGE_KEYS.LANG);
    const detected = detectBrowserLang();
    if (detected !== 'en' && !i18n.hasResourceBundle(detected, 'common')) {
      await loadLocale(detected);
    }
    await i18n.changeLanguage(detected);
    persistLanguageToServer(detected);
    return;
  }
  if (lang !== 'en' && !i18n.hasResourceBundle(lang, 'common')) {
    await loadLocale(lang);
  }
  await i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEYS.LANG, lang);
  persistLanguageToServer(lang);
}

window.addEventListener('languagechange', () => {
  if (localStorage.getItem(STORAGE_KEYS.LANG)) return;
  changeLanguage('system').catch(() => {});
});

export default i18n;
