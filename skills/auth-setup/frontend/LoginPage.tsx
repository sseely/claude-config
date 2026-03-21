// ADAPT: delete the <a> blocks for providers you are not using.
// ADAPT: update the app name heading (currently "My App").
// ADAPT: update the tagline i18n key or hardcode temporarily.
// ADAPT: remove LanguageSwitcher import/usage if i18n-setup has not been run.

import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LinkedInIcon, GoogleIcon, MicrosoftIcon } from '../components/OAuthProviderIcons';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const suffix = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';

  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 20px',
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 600,
    textDecoration: 'none',
    marginBottom: 12,
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      {/* ADAPT: replace with your app name */}
      <h1 style={{ marginBottom: 8 }}>My App</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>
        {t('login.tagline')}
      </p>

      {/* LinkedIn — ADAPT: delete if not using LinkedIn */}
      <a
        href={`/auth/linkedin${suffix}`}
        style={{ ...btnBase, background: '#0A66C2', color: '#fff', border: 'none' }}
      >
        <LinkedInIcon size={20} />
        {t('login.continueLinkedIn')}
      </a>

      {/* Google — ADAPT: delete if not using Google */}
      <a
        href={`/auth/google${suffix}`}
        style={{ ...btnBase, background: '#fff', color: '#333', border: '1px solid #dadce0' }}
      >
        <GoogleIcon size={20} />
        {t('login.continueGoogle')}
      </a>

      {/* Microsoft — ADAPT: delete if not using Microsoft */}
      <a
        href={`/auth/microsoft${suffix}`}
        style={{ ...btnBase, background: '#fff', color: '#333', border: '1px solid #dadce0' }}
      >
        <MicrosoftIcon size={20} />
        {t('login.continueMicrosoft')}
      </a>

      <footer style={{ marginTop: 48, fontSize: 12, color: 'var(--text-muted)' }}>
        {/* ADAPT: remove policy links if compliance-setup has not been run */}
        <Link to="/privacy-policy" style={{ color: 'inherit' }}>{t('login.footer.privacy')}</Link>
        {' · '}
        <Link to="/terms" style={{ color: 'inherit' }}>{t('login.footer.terms')}</Link>
        {' · '}
        <Link to="/cookie-policy" style={{ color: 'inherit' }}>{t('login.footer.cookies')}</Link>
      </footer>
    </div>
  );
}
