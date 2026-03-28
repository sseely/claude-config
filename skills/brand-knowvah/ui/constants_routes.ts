// Central route registry. Import from here — never hardcode paths in components.
// ADAPT: add/remove routes to match this app's page structure.
// ADAPT: dynamic routes are functions so callers get type-safe string literals.
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  LOGIN: '/login',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS: '/terms',
  COOKIE_POLICY: '/cookie-policy',
  CONSENT: '/consent',
  // ADAPT: add admin routes only if auth-setup includes is_admin support
  ADMIN_DASHBOARD: '/admin',
} as const;
