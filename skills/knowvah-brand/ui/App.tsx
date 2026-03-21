// App root — provider stack + routing.
//
// Provider order (outermost → innermost):
//   AuthProvider → ThemeProvider → AnalyticsProvider → router content
//
// AuthProvider must be outermost: ThemeProvider reads the user to decide
// whether to honour stored preferences or fall back to OS hints.
//
// ADAPT: add/remove lazy-loaded pages to match this app's route structure.
// ADAPT: remove AnalyticsProvider if analytics-setup has not been run.
// ADAPT: remove CannyFeedback if compliance-setup was not run.
// ADAPT: update RequireAuth's consent_required check if this app has no
//        GDPR consent page (remove the Navigate to ROUTES.CONSENT line).

import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnalyticsProvider, useAnalytics } from './contexts/AnalyticsContext';
import { Layout } from './components/Layout';
import CannyFeedback from './components/CannyFeedback';
import { ROUTES } from './constants/routes';

// ADAPT: add/remove lazy imports to match this app's pages
const LoginPage    = lazy(() => import('./pages/LoginPage'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
// Pages for compliance-setup policy routes — remove if not needed
const CookiePolicyPage  = lazy(() => import('./pages/CookiePolicyPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage         = lazy(() => import('./pages/TermsPage'));
const ConsentPage       = lazy(() => import('./pages/ConsentPage'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { identify } = useAnalytics();

  useEffect(() => {
    if (user) identify(user.id);
  }, [user, identify]);

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Navigate to={`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  // ADAPT: remove this line if there's no consent gate
  if ((user as { consent_required?: boolean }).consent_required) return <Navigate to={ROUTES.CONSENT} replace />;
  const AppID = import.meta.env['VITE_CANNY_APP_ID'] as string | undefined;
  return (
    <>
      {/* ADAPT: remove CannyFeedback if compliance-setup was not run */}
      {AppID && <CannyFeedback user={{ id: user.id, name: user.name, email: (user as { email?: string }).email }} />}
      {children}
    </>
  );
}

function PageViewTracker() {
  const location = useLocation();
  const { capture } = useAnalytics();
  useEffect(() => {
    capture('$pageview', { $current_url: window.location.href });
  }, [location.pathname, capture]);
  return null;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
      <PageViewTracker />
      <Routes>
        {/* Public routes — no sidebar */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        {/* ADAPT: remove policy routes if compliance-setup was not run */}
        <Route path={ROUTES.COOKIE_POLICY}  element={<CookiePolicyPage />} />
        <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicyPage />} />
        <Route path={ROUTES.TERMS}          element={<TermsPage />} />
        <Route path={ROUTES.CONSENT}        element={<ConsentPage />} />

        {/* Authenticated routes — wrapped in Layout (sidebar + footer) */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.SETTINGS}  element={<SettingsPage />} />
          {/* ADAPT: add app-specific authenticated routes here */}
        </Route>

        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AnalyticsProvider>
          <AppRoutes />
        </AnalyticsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
