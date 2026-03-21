// Admin coupon management page — issue new coupons and list existing ones.
// ADAPT: update api import to match your project's API client.
// ADAPT: update navigate path for coupon detail (/admin/coupons/:id) if different.
// ADAPT: replace t() calls with hardcoded strings if i18n-setup has not been run.
// ADAPT: update MAX_COUPON_USES and VALID_PACK_SIZES imports to your constants.

import { useEffect, useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminCoupon } from '../types/shared'; // ADAPT: update import path

// ADAPT: import from your project's constants
const VALID_PACK_SIZES = [1, 3, 10] as const;
const MAX_COUPON_USES = 100;

function defaultExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD for <input type="date">
}

interface Props {
  api: {
    issueCoupons: (p: { pack_size: 1|3|10; max_uses: number; expires_at: string; email?: string }) =>
      Promise<{ code: string }>;
    listAdminCoupons: () => Promise<AdminCoupon[]>;
  };
}

export default function AdminCouponsPage({ api }: Props) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const [coupons, setCoupons]       = useState<AdminCoupon[]>([]);
  const [loadError, setLoadError]   = useState('');
  const [issuePackSize, setIssuePackSize] = useState<1|3|10>(1);
  const [issueMaxUses, setIssueMaxUses]   = useState(1);
  const [issueExpiresAt, setIssueExpiresAt] = useState(defaultExpiresAt);
  const [issueEmail, setIssueEmail]   = useState('');
  const [issuingCoupon, setIssuingCoupon] = useState(false);
  const [issuedCode, setIssuedCode]   = useState('');
  const [issueError, setIssueError]   = useState('');

  useEffect(() => {
    api.listAdminCoupons()
      .then(setCoupons)
      .catch(() => setLoadError('Failed to load coupons'));
  }, []);

  async function handleIssueCoupon(e: React.FormEvent) {
    e.preventDefault();
    setIssuingCoupon(true);
    setIssueError('');
    setIssuedCode('');
    try {
      const result = await api.issueCoupons({
        pack_size:  issuePackSize,
        max_uses:   issueMaxUses,
        expires_at: issueExpiresAt,
        email:      issueEmail.trim() || undefined,
      });
      setIssuedCode(result.code);
      setCoupons(await api.listAdminCoupons());
    } catch (e) {
      setIssueError(e instanceof Error ? e.message : t('issueCoupon.error'));
    } finally {
      setIssuingCoupon(false);
    }
  }

  const inputStyle = {
    display: 'block', marginTop: 4, padding: '8px 10px', width: '100%',
    border: 'var(--border-width) solid var(--border)', borderRadius: 6,
    background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: 14,
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 32 }}>{t('adminCoupons.pageTitle')}</h1>

      {/* Issue form */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 16 }}>{t('adminCoupons.createHeading')}</h2>
        <form onSubmit={handleIssueCoupon}
          style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 360 }}>
          <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {t('issueCoupon.packLabel')}
            <select
              value={issuePackSize}
              onChange={(e) => setIssuePackSize(Number(e.target.value) as 1|3|10)}
              style={inputStyle}
            >
              {VALID_PACK_SIZES.map((s) => (
                <option key={s} value={s}>
                  {t('adminCoupons.session', { count: s })}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {t('issueCoupon.maxUsesLabel')}
            <input
              type="number" min={1} max={MAX_COUPON_USES}
              value={issueMaxUses}
              onChange={(e) => setIssueMaxUses(Number(e.target.value))}
              onBlur={(e) => setIssueMaxUses(
                Math.max(1, Math.min(MAX_COUPON_USES, Number(e.target.value) || 1))
              )}
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {t('issueCoupon.expiresLabel')}
            <input
              type="date"
              value={issueExpiresAt}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setIssueExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {t('issueCoupon.emailLabel')}
            <input
              type="email" value={issueEmail}
              onChange={(e) => setIssueEmail(e.target.value)}
              placeholder={t('issueCoupon.emailPlaceholder')}
              style={inputStyle}
            />
          </label>
          <button
            type="submit" disabled={issuingCoupon}
            style={{ padding: '10px 20px', borderRadius: 6, alignSelf: 'flex-start',
              cursor: issuingCoupon ? 'not-allowed' : 'pointer' }}
          >
            {issuingCoupon ? t('issueCoupon.issuing') : t('issueCoupon.issue')}
          </button>
        </form>
        {issueError && <p style={{ color: 'var(--danger)', marginTop: 8, fontSize: 14 }}>{issueError}</p>}
        {issuedCode && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {t('issueCoupon.result')}
            </p>
            <code style={{ fontSize: 15, fontFamily: 'monospace', letterSpacing: 2, color: 'var(--text-primary)' }}>
              {issuedCode}
            </code>
          </div>
        )}
      </section>

      {/* Coupon list */}
      <section>
        <h2 style={{ marginBottom: 16 }}>{t('adminCoupons.listHeading')}</h2>
        {loadError && <p style={{ color: 'var(--danger)' }}>{loadError}</p>}
        {!loadError && coupons.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>{t('adminCoupons.noResults')}</p>
        )}
        {coupons.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-width) solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('adminCoupons.colCode')}</th>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('adminCoupons.colPack')}</th>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('adminCoupons.colEmail')}</th>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('adminCoupons.colStatus')}</th>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('adminCoupons.colExpires')}</th>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('adminCoupons.colCreated')}</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const full    = c.use_count >= c.max_uses;
                const expired = new Date(c.expires_at) < new Date();
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/coupons/${c.id}`)} // ADAPT: update path
                    style={{ borderBottom: 'var(--border-width) solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-warm)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <code style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{c.code}</code>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {t('adminCoupons.session', { count: c.pack_size })}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {c.email ?? t('adminCoupons.unrestricted')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 12, padding: '2px 8px', borderRadius: 12,
                        background: full || expired ? 'var(--bg-warm)' : 'var(--success-light)',
                        color:      full || expired ? 'var(--text-muted)' : 'var(--success)',
                      }}>
                        {expired
                          ? t('adminCoupons.expired')
                          : t('adminCoupons.usageCount', { used: c.use_count, max: c.max_uses })}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: expired ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {new Date(c.expires_at).toLocaleDateString(navigator.language)}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {new Date(c.created_at).toLocaleDateString(navigator.language)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
