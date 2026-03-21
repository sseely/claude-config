// Coupon redemption section — drop into any page that needs the redeem UI.
// ADAPT: replace t() calls with hardcoded strings if i18n-setup has not been run.
// ADAPT: update COUPON_MAX_LENGTH to match COUPON_CODE_LENGTH in your constants.

import { useState } from 'react';
import type React from 'react';
import { useTranslation } from 'react-i18next';

// ADAPT: import from your project's constants — must match COUPON_CODE_LENGTH
const COUPON_MAX_LENGTH = 9; // "XXXX-XXXX"

interface Props {
  /** Called after a successful redemption so the parent can refresh user state */
  onRedeemed?: () => void | Promise<void>;
  /** API method to call */
  onRedeem: (code: string) => Promise<{ sessions_added: number }>;
}

export default function RedeemCouponSection({ onRedeem, onRedeemed }: Props) {
  const { t } = useTranslation('dashboard');
  const [couponCode, setCouponCode] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await onRedeem(couponCode.trim());
      setSuccess(t('coupon.success', { count: result.sessions_added }));
      setCouponCode('');
      await onRedeemed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('coupon.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 style={{ marginBottom: 12 }}>{t('coupon.heading')}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder={t('coupon.placeholder')}
          maxLength={COUPON_MAX_LENGTH}
          style={{
            padding: '10px 12px', fontSize: 16,
            border: 'var(--border-width) solid var(--border)',
            borderRadius: 6, width: 160,
            fontFamily: 'monospace', letterSpacing: 2,
            background: 'var(--card-bg)', color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={loading || !couponCode.trim()}
          style={{ padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}
        >
          {loading ? t('coupon.redeeming') : t('coupon.redeem')}
        </button>
      </form>
      {error   && <p style={{ color: 'var(--danger)',  marginTop: 8, fontSize: 14 }}>{error}</p>}
      {success && <p style={{ color: 'var(--success)', marginTop: 8, fontSize: 14 }}>{success}</p>}
    </section>
  );
}
