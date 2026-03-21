import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import { ROUTES } from '../constants/routes';

export default function ConsentPage() {
  const { t } = useTranslation('auth');
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleAccept() {
    setSubmitting(true);
    setError('');
    try {
      await api.postConsent();
      await refresh();
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('consent.error'));
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{t('consent.title')}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        {t('consent.subtitle')}
      </p>

      <div
        style={{
          border: 'var(--border-width) solid var(--border)',
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
          background: 'var(--card-bg)',
        }}
      >
        <p style={{ margin: '0 0 12px' }}>
          {t('consent.bodyPrefix')}{' '}
          <Link to={ROUTES.TERMS} style={{ color: 'var(--accent)' }} target="_blank">
            {t('consent.termsLink')}
          </Link>{' '}
          {t('consent.bodySeparator')}{' '}
          <Link to={ROUTES.PRIVACY_POLICY} style={{ color: 'var(--accent)' }} target="_blank">
            {t('consent.privacyLink')}
          </Link>
          .
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          {t('consent.dataNote')}
        </p>
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</p>}

      <button
        onClick={handleAccept}
        disabled={submitting}
        style={{
          padding: '12px 32px',
          background: 'var(--accent)',
          color: 'var(--text-on-accent)',
          border: 'none',
          borderRadius: 6,
          fontSize: 16,
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? t('consent.saving') : t('consent.accept')}
      </button>
    </div>
  );
}