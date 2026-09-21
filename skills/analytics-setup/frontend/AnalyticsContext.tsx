// Frontend PostHog analytics context.
// ADAPT: remove the Termly consent gate if compliance-setup has not been run.
//        In that case, initialize PostHog directly in the useEffect.
// ADAPT: update the consent-category key below if using a different CMP than
//        Termly, or a different Termly consent category than "analytics".

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import posthog from 'posthog-js';

const POSTHOG_KEY  = import.meta.env['VITE_POSTHOG_API_KEY'] as string | undefined;
const POSTHOG_HOST = (import.meta.env['VITE_POSTHOG_HOST'] as string | undefined)
  ?? 'https://us.i.posthog.com';

interface AnalyticsContextValue {
  capture:  (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  reset:    () => void;
}

// Termly's client-side Event API. Verified against Termly's own support
// docs (see the skill's README/commit note for the exact URLs and
// confidence level) — `window.Termly` exists only once the CMP embed
// script (added by compliance-setup) has finished loading, so every
// access below is guarded.
interface TermlyConsentState {
  analytics?: boolean;
  [category: string]: boolean | undefined;
}
interface TermlyGlobal {
  getConsentState?: () => TermlyConsentState;
  on?: (
    event: 'consent' | 'initialized',
    callback: (data: { consentState?: TermlyConsentState }) => void
  ) => void;
}

// Safe no-op default — components can always call these without null-checking
const AnalyticsContext = createContext<AnalyticsContextValue>({
  capture:  () => {},
  identify: () => {},
  reset:    () => {},
});

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    function init() {
      if (!POSTHOG_KEY || initialized.current) return;
      posthog.init(POSTHOG_KEY, {
        api_host:         POSTHOG_HOST,
        autocapture:      false, // Manual control — fire only the events in AnalyticsEvent
        capture_pageview: false, // Use PageViewTracker component instead
      });
      initialized.current = true;
    }

    // ADAPT: if not using Termly (compliance-setup not run), replace this block with:
    //   init();
    // and remove checkAndSubscribe/the polling fallback below.
    function checkAndSubscribe(): boolean {
      const termly = (window as Window & { Termly?: TermlyGlobal }).Termly;
      if (!termly?.on) return false;
      if (termly.getConsentState?.().analytics === true) init();
      termly.on('consent', (data) => {
        if (data?.consentState?.analytics === true) init();
      });
      return true;
    }

    if (checkAndSubscribe()) return;

    // compliance-setup's Termly embed script loads asynchronously, so
    // `window.Termly` may not exist yet on mount — poll briefly until it does.
    const pollId = window.setInterval(() => {
      if (checkAndSubscribe()) window.clearInterval(pollId);
    }, 200);
    return () => window.clearInterval(pollId);
  }, []);

  const value: AnalyticsContextValue = {
    capture(event, properties) {
      if (!initialized.current) return;
      posthog.capture(event, properties);
    },
    identify(userId, traits) {
      if (!initialized.current) return;
      posthog.identify(userId, traits);
    },
    reset() {
      if (!initialized.current) return;
      posthog.reset();
    },
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}
