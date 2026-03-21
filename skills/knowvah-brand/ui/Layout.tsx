// Authenticated app shell: collapsible sidebar + top bar + main content + footer.
// Used as a React Router <Outlet> wrapper for all authenticated routes.
//
// ADAPT: update the i18n namespace if 'auth' is named differently.
// ADAPT: update footer links if your app has different policy pages or no Canny.
// ADAPT: remove CANNY_FEEDBACK_URL if compliance-setup was not run.

import { useState, useCallback } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { STORAGE_KEYS } from '../constants/storage';
import { ROUTES } from '../constants/routes';

const CANNY_FEEDBACK_URL = import.meta.env['VITE_CANNY_FEEDBACK_URL'] as string | undefined;

export function Layout() {
  const { t } = useTranslation('auth');
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: 0 }}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 px-4 lg:px-8 py-6">
          <Outlet />
        </main>

        <footer className="border-t border-[var(--border)] bg-[var(--card-bg)]" style={{ borderWidth: 'var(--border-width)' }}>
          <div className="px-4 lg:px-8 py-4 flex justify-center gap-6 text-xs text-[var(--text-muted)]">
            <Link to={ROUTES.PRIVACY_POLICY} className="hover:text-[var(--text-secondary)]">{t('login.footer.privacy')}</Link>
            <Link to={ROUTES.TERMS} className="hover:text-[var(--text-secondary)]">{t('login.footer.terms')}</Link>
            <Link to={ROUTES.COOKIE_POLICY} className="hover:text-[var(--text-secondary)]">{t('login.footer.cookies')}</Link>
            {CANNY_FEEDBACK_URL && (
              <a
                href={CANNY_FEEDBACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-canny-link
                className="hover:text-[var(--text-secondary)]"
              >
                {t('login.footer.feedback')}
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
