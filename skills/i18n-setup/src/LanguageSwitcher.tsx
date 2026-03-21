import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../i18n';
import { STORAGE_KEYS } from '../constants/storage';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('settings');
  const isSystem = !localStorage.getItem(STORAGE_KEYS.LANG);
  const value = isSystem ? 'system' : i18n.language;

  return (
    <select
      value={value}
      onChange={(e) => changeLanguage(e.target.value)}
      className="px-3 py-1.5 text-sm rounded-md"
      style={{
        border: 'var(--border-width) solid var(--border)',
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
      }}
    >
      <option value="system">{t('language.systemDefault')}</option>
      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
        <option key={code} value={code}>{label}</option>
      ))}
    </select>
  );
}
