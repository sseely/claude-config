// ADAPT: extend AuthUser with any project-specific fields returned by /api/me
// (e.g. credits_available, subscription_tier, consent_required).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AuthUser {
  id:         string;
  name:       string;
  email:      string;
  profile_url: string | null;
  is_admin:   boolean;
  // ADAPT: add project-specific fields here
}

interface AuthContextValue {
  user:    AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch('/api/me');
      setUser(res.ok ? await res.json() : null);
    } catch (err) {
      console.error('[auth refresh]', err instanceof Error ? err.message : String(err));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await fetch('/auth/logout', { method: 'POST' });
    setUser(null);
  }

  useEffect(() => { refresh(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
