// Collapsible sidebar with dark warm-charcoal background.
// Desktop: sticky, 60px (collapsed) or 220px (expanded).
// Mobile: fixed drawer with overlay, hidden by default.
//
// ADAPT: replace NAV_ITEMS with this app's routes and Heroicons.
// ADAPT: update the credits badge if this app doesn't have a credits model.
//        Remove the <div className="mx-3 mt-3 ..."> block entirely if not needed.
// ADAPT: remove admin section if this app has no admin role.
// ADAPT: update i18n namespace references if 'common' is named differently.
// ADAPT: update Avatar import path if Avatar lives elsewhere.

import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './Avatar';
import { ROUTES } from '../constants/routes';
import {
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightStartOnRectangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// ADAPT: add/remove entries to match this app's navigation structure.
const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, labelKey: 'nav.dashboard', icon: HomeIcon },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useTranslation('common');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-3 h-16 border-b border-[var(--sidebar-surface)]">
        {!collapsed && (
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2 text-[var(--sidebar-text-active)] font-semibold text-lg no-underline">
            <img src="/knowvah_logo.svg" alt="" className="w-6 h-6 flex-shrink-0" />
            {/* ADAPT: update brand name after the logo */}
            Knowvah
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)] transition-colors"
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed
            ? <ChevronRightIcon className="w-5 h-5" />
            : <ChevronLeftIcon className="w-5 h-5" />
          }
        </button>
      </div>

      {/* Credits badge — ADAPT: remove this block if the app has no credits model */}
      {user && !collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-md bg-[var(--sidebar-surface)] text-[var(--sidebar-text)] text-xs">
          {t('credits.remaining', { count: (user as { credits_available?: number }).credits_available ?? 0 })}
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.to}
            to={item.to}
            label={t(item.labelKey)}
            icon={item.icon}
            collapsed={collapsed}
            onNavigate={onMobileClose}
          />
        ))}
        {/* Admin section — ADAPT: remove if no admin role */}
        {(user as { is_admin?: boolean })?.is_admin && (
          <>
            {!collapsed && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--sidebar-text)] opacity-50">
                {t('nav.adminSection')}
              </p>
            )}
            <SidebarNavItem to={ROUTES.ADMIN_DASHBOARD} label={t('nav.adminDashboard')} icon={ChartBarIcon} collapsed={collapsed} onNavigate={onMobileClose} />
          </>
        )}
      </nav>

      {/* Bottom: user profile + sign out */}
      <div className="py-3 px-2 border-t border-[var(--sidebar-surface)] space-y-1">
        {user && (
          <Link
            to={ROUTES.SETTINGS}
            onClick={onMobileClose}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)] transition-colors no-underline"
          >
            <Avatar profileUrl={(user as { profile_url?: string }).profile_url} name={user.name} size="sm" />
            {!collapsed && (
              <span className="text-sm font-medium truncate">{user.name}</span>
            )}
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className={`
            group relative flex items-center gap-3 rounded-md transition-colors w-full
            ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
            text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]
          `}
          aria-label={t('nav.signOut')}
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{t('nav.signOut')}</span>}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium bg-[var(--text-primary)] text-[var(--bg)] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {t('nav.signOut')}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onMobileClose} />
      )}

      <aside className={`
        bg-[var(--sidebar-bg)] flex-shrink-0 h-screen overflow-y-auto transition-all duration-200
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}
        fixed md:sticky top-0 z-50
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}

function SidebarNavItem({
  to, label, icon: Icon, collapsed, onNavigate,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => `
        group relative flex items-center gap-3 rounded-md transition-colors no-underline
        ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
        ${isActive
          ? 'bg-[var(--sidebar-hover)] text-[var(--sidebar-text-active)] shadow-[inset_4px_0_0_var(--accent)]'
          : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
        }
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {collapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium bg-[var(--text-primary)] text-[var(--bg)] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {label}
        </span>
      )}
    </NavLink>
  );
}
