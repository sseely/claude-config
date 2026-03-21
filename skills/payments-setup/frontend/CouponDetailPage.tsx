// Coupon detail page — shows metadata and full redemption history.
// ADAPT: update api import to match your project's API client.
// ADAPT: update the back navigation path to match your routes.
// ADAPT: replace t() calls with hardcoded strings if i18n-setup has not been run.

import { useEffect, useState } from 'react';
import type React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminCoupon } from '../types/shared'; // ADAPT: update import path

interface Props {
  api: {
    getAdminCoupon: (id: string) => Promise<AdminCoupon>;
  };
}

export default function CouponDetailPage({ api }: Props) {
  const { t } = useTranslation('dashboard');
  const { couponId } = useParams<{ couponId: string }>();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState<AdminCoupon | null>(null);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!couponId) return;
    api.getAdminCoupon(couponId)
      .then(setCoupon)
      .catch(() => setError('Failed to load coupon'));
  }, [couponId]);

  if (error)   return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!coupon) return null;

  const full    = coupon.use_count >= coupon.max_uses;
  const expired = new Date(coupon.expires_at) < new Date();

  const row = (label: string, value: React.ReactNode) => (
    <div style={{
      display: 'flex', gap: 16, padding: '10px 0',
      borderBottom: 'var(--border-width) solid var(--border)',
    }}>
      <span style={{ width: 160, flexShrink: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      <button
        onClick={() => navigate('/admin/coupons')} // ADAPT: update back path
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--accent)', fontSize: 14, padding: 0, marginBottom: 24,
        }}
      >
        {t('adminCoupons.detailBack')}
      </button>

      <h1 style={{ marginBottom: 32 }}>
        <code style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{coupon.code}</code>
      </h1>

      <section style={{ marginBottom: 40 }}>
        {row(t('adminCoupons.detailPack'),
          t('adminCoupons.session', { count: coupon.pack_size }))}
        {row(t('adminCoupons.detailMaxUses'), String(coupon.max_uses))}
        {row(t('adminCoupons.detailStatus'),
          <span style={{
            fontSize: 12, padding: '2px 8px', borderRadius: 12,
            background: full || expired ? 'var(--bg-warm)' : 'var(--success-light)',
            color:      full || expired ? 'var(--text-muted)' : 'var(--success)',
          }}>
            {expired
              ? t('adminCoupons.expired')
              : t('adminCoupons.usageCount', { used: coupon.use_count, max: coupon.max_uses })}
          </span>
        )}
        {row(t('adminCoupons.detailExpires'),
          <span style={{ color: expired ? 'var(--danger)' : 'var(--text-primary)' }}>
            {new Date(coupon.expires_at).toLocaleDateString(navigator.language)}
          </span>
        )}
        {row(t('adminCoupons.detailCreated'),
          new Date(coupon.created_at).toLocaleString(navigator.language))}
        {row(t('adminCoupons.detailRestrictedTo'),
          coupon.email ?? t('adminCoupons.unrestricted'))}
      </section>

      <section>
        <h2 style={{ marginBottom: 16 }}>{t('adminCoupons.detailRedemptions')}</h2>
        {!coupon.redemptions || coupon.redemptions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {t('adminCoupons.detailNoRedemptions')}
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-width) solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {t('adminCoupons.detailColName')}
                </th>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {t('adminCoupons.detailColEmail')}
                </th>
                <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {t('adminCoupons.detailColRedeemedAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {coupon.redemptions.map((r) => (
                <tr key={r.email} style={{ borderBottom: 'var(--border-width) solid var(--border)' }}>
                  <td style={{ padding: '10px 12px' }}>{r.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{r.email}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {new Date(r.redeemed_at).toLocaleString(navigator.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
