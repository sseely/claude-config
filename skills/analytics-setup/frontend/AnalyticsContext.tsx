// Frontend PostHog analytics context.
// ADAPT: remove the Termly consent gate if compliance-setup has not been run.
//        In that case, initialize PostHog directly in the useEffect.
// ADAPT: update the termly-consent-update event name if using a different CMP.

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
    // and remove the event listener below.
    const consent = (window as Window & { __termlyConsent?: { analytics?: boolean } })
      .__termlyConsent;
    if (consent?.analytics === true) init();

    function handleTermlyConsent(e: Event) {
      const detail = (e as CustomEvent<{ analytics?: boolean }>).detail;
      if (detail?.analytics === true) init();
    }
    window.addEventListener('termly-consent-update', handleTermlyConsent);
    return () => window.removeEventListener('termly-consent-update', handleTermlyConsent);
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
