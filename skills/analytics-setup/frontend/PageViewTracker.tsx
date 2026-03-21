// Tracks route changes as PostHog $pageview events.
// Mount once inside <BrowserRouter> (or equivalent), below <AnalyticsProvider>.
// Using a component rather than App-level useEffect keeps the tracking logic
// isolated and testable.
// ADAPT: update import path if useAnalytics lives elsewhere.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../contexts/AnalyticsContext';

export function PageViewTracker() {
  const location = useLocation();
  const { capture } = useAnalytics();

  useEffect(() => {
    capture('$pageview', { $current_url: window.location.href });
  }, [location.pathname]);

  return null;
}
