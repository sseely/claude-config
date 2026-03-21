// Mobile-only top bar (hidden on md+). Shows a hamburger button that opens
// the mobile drawer sidebar. Sticky so it stays visible on scroll.
// ADAPT: update the i18n namespace if 'common' is named differently.

import { Bars3Icon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { t } = useTranslation('common');
  return (
    <header
      className="md:hidden bg-[var(--card-bg)] border-b border-[var(--border)] h-14 flex items-center px-4 sticky top-0 z-30"
      style={{ borderWidth: 'var(--border-width)' }}
    >
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-warm)] transition-colors"
        aria-label={t('sidebar.expand')}
      >
        <Bars3Icon className="w-6 h-6" />
      </button>
    </header>
  );
}
