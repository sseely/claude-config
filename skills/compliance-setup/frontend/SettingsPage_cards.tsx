// Compliance-related settings cards. Add these exports to your SettingsPage.
// Each card is independently composable — render only what your project needs.
//
// Dependencies: react-i18next, useAuth, api (postConsent, exportData,
//   deleteAccount, requestSbom, getSbomStatus), useTheme (optional).

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

// ---------------------------------------------------------------------------
// PrivacyConsentCard — shows accepted versions of ToS and Privacy Policy
// ---------------------------------------------------------------------------

export function PrivacyConsentCard() {
  const { t } = useTranslation('settings');
  const { user } = useAuth();

  return (
    <div
      className="bg-[var(--card-bg)] rounded-lg p-6"
      style={{ border: 'var(--border-width) solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
        {t('privacy.heading')}
      </h3>
      <div className="space-y-3 text-sm text-[var(--text-secondary)]">
        <div>
          <span className="font-medium text-[var(--text-primary)]">{t('privacy.tos')}</span>
          {user?.terms_accepted_at
            ? t('privacy.tosAccepted', {
                version: user?.terms_version,
                date: new Date(user.terms_accepted_at as string).toLocaleDateString(
                  navigator.language
                ),
              })
            : t('privacy.tosNotAccepted')}
        </div>
        <div>
          <span className="font-medium text-[var(--text-primary)]">{t('privacy.privacy')}</span>
          {user?.privacy_policy_accepted_at
            ? t('privacy.privacyAccepted', {
                version: user?.privacy_policy_version,
                date: new Date(user.privacy_policy_accepted_at as string).toLocaleDateString(
                  navigator.language
                ),
              })
            : t('privacy.privacyNotAccepted')}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataExportCard — triggers GET /api/me/export
// ---------------------------------------------------------------------------

export function DataExportCard() {
  const { t } = useTranslation('settings');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setExporting(true);
    setError('');
    try {
      await api.exportData();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('export.error'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      className="bg-[var(--card-bg)] rounded-lg p-6"
      style={{ border: 'var(--border-width) solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
        {t('export.heading')}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{t('export.subtitle')}</p>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="px-4 py-2 text-sm font-medium rounded-md"
        style={{
          border: 'var(--border-width) solid var(--border)',
          background: 'var(--card-bg)',
          color: 'var(--text-secondary)',
          cursor: exporting ? 'not-allowed' : 'pointer',
          opacity: exporting ? 0.7 : 1,
        }}
      >
        {exporting ? t('export.preparing') : t('export.button')}
      </button>
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SbomCard — request SBOM download; shows pending / download states
// ---------------------------------------------------------------------------

export function SbomCard() {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const [status, setStatus] = useState<{
    status: string;
    download_urls?: { spdx: string; cyclonedx: string };
    download_expires_at?: string;
    requested_at?: string;
  } | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSbomStatus().then(setStatus).catch(() => {});
  }, []);

  async function handleRequest() {
    setRequesting(true);
    setError('');
    try {
      const result = await api.requestSbom();
      setStatus({ status: result.status, requested_at: result.requested_at });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('sbom.error'));
    } finally {
      setRequesting(false);
    }
  }

  const hasActiveDownload =
    status?.status === 'delivered' &&
    status.download_expires_at &&
    new Date(status.download_expires_at) > new Date();

  return (
    <div
      className="bg-[var(--card-bg)] rounded-lg p-6"
      style={{ border: 'var(--border-width) solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">{t('sbom.heading')}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{t('sbom.subtitle')}</p>

      {hasActiveDownload ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-secondary)]">
            {t('sbom.downloadLinks', {
              date: new Date(status!.download_expires_at!).toLocaleString(navigator.language),
            })}
          </p>
          <div className="flex gap-3">
            <a
              href={status!.download_urls!.spdx}
              className="text-sm text-[var(--accent)] underline"
            >
              {t('sbom.spdx')}
            </a>
            <a
              href={status!.download_urls!.cyclonedx}
              className="text-sm text-[var(--accent)] underline"
            >
              {t('sbom.cyclonedx')}
            </a>
          </div>
        </div>
      ) : status?.status === 'pending' ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('sbom.pending', { email: user?.email })}
        </p>
      ) : (
        <>
          <button
            onClick={handleRequest}
            disabled={requesting}
            className="px-4 py-2 text-sm font-medium rounded-md"
            style={{
              border: 'var(--border-width) solid var(--border)',
              background: 'var(--card-bg)',
              color: 'var(--text-secondary)',
              cursor: requesting ? 'not-allowed' : 'pointer',
              opacity: requesting ? 0.7 : 1,
            }}
          >
            {requesting ? t('sbom.requesting') : t('sbom.request')}
          </button>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {t('sbom.note', { email: user?.email })}
          </p>
        </>
      )}
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DangerZoneCard — account deletion with typed confirmation
// ---------------------------------------------------------------------------

export function DangerZoneCard() {
  const { t } = useTranslation('settings');
  const { signOut } = useAuth();
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [recoveryExpiry, setRecoveryExpiry] = useState<string | null>(null);

  async function handleDelete() {
    if (confirm !== 'DELETE') return;
    setDeleting(true);
    setError('');
    try {
      const result = await api.deleteAccount();
      setRecoveryExpiry(result.recovery_expires_at);
      await signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('danger.error'));
      setDeleting(false);
    }
  }

  if (recoveryExpiry) {
    return (
      <div
        className="bg-[var(--card-bg)] rounded-lg p-6"
        style={{ border: 'var(--border-width) solid var(--danger)', boxShadow: 'var(--shadow-sm)' }}
      >
        <h3 className="text-lg font-medium text-[var(--danger)] mb-2">
          {t('danger.initiatedHeading')}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {t('danger.initiatedBody', {
            date: new Date(recoveryExpiry).toLocaleDateString(navigator.language),
          })}
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-[var(--card-bg)] rounded-lg p-6"
      style={{ border: 'var(--border-width) solid var(--danger)', boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="text-lg font-medium text-[var(--danger)] mb-2">{t('danger.heading')}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{t('danger.subtitle')}</p>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          {t('danger.confirmLabel')}
        </label>
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t('danger.confirmPlaceholder')}
          className="w-full px-3 py-2 text-sm rounded-md"
          style={{
            border: 'var(--border-width) solid var(--border)',
            background: 'var(--card-bg)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={handleDelete}
          disabled={confirm !== 'DELETE' || deleting}
          className="px-4 py-2 text-sm font-medium rounded-md text-white"
          style={{
            background: confirm === 'DELETE' ? 'var(--danger)' : 'var(--text-muted)',
            border: 'none',
            cursor: confirm === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
          }}
        >
          {deleting ? t('danger.deleting') : t('danger.delete')}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
