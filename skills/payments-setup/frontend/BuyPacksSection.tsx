// Buy sessions section — drop into any page that needs the purchase UI.
// ADAPT: update PACK_PRICES to match your pricing.
// ADAPT: replace t() calls with hardcoded strings if i18n-setup has not been run.
// ADAPT: update the api.buyPack call to match your API client.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// ADAPT: update prices and session counts to match PACKS in routes_payments.ts
const PACK_PRICES = [
  { pack: 'single' as const, sessions: 1,  price: '$14'  },
  { pack: 'triple' as const, sessions: 3,  price: '$37'  },
  { pack: 'ten'    as const, sessions: 10, price: '$109' },
];

interface Props {
  /** API method to call — returns { url: string } to redirect to Stripe Checkout */
  onBuy: (pack: 'single' | 'triple' | 'ten') => Promise<{ url: string }>;
}

export default function BuyPacksSection({ onBuy }: Props) {
  const { t } = useTranslation('dashboard');
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  async function handleBuy(pack: 'single' | 'triple' | 'ten') {
    setBuyingPack(pack);
    try {
      const { url } = await onBuy(pack);
      window.location.href = url;
    } catch (e) {
      alert(e instanceof Error ? e.message : t('buySessions.checkoutError'));
      setBuyingPack(null);
    }
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ marginBottom: 4 }}>{t('buySessions.heading')}</h2>
      <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 14 }}>
        {t('buySessions.subtitle')}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        {PACK_PRICES.map(({ pack, sessions, price }) => (
          <button
            key={pack}
            onClick={() => handleBuy(pack)}
            disabled={buyingPack !== null}
            style={{
              flex: 1,
              padding: '16px 12px',
              border: 'var(--border-width) solid var(--border)',
              borderRadius: 8,
              background: buyingPack === pack ? 'var(--bg-warm)' : 'var(--card-bg)',
              color: 'var(--text-primary)',
              cursor: buyingPack !== null ? 'not-allowed' : 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700 }}>{price}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {t('buySessions.session', { count: sessions })}
            </div>
            {buyingPack === pack && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {t('buySessions.redirecting')}
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
