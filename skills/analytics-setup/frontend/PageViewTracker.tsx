// Tracks route changes as PostHog $pageview events.
// Mount once inside <BrowserRouter> (or equivalent), below <AnalyticsProvider>.
// Using a component rather than App-level useEffect keeps the tracking logic
// isolated and testable.
// ADAPT: update import path if useAnalytics lives elsewhere.
// ADAPT: update the shared/constants_analytics import path if this project's
//        depth from ui/src/components/ to shared/ differs from the default
//        (three levels up: components -> src -> ui -> project root, verified
//        against SKILL.md Step 9's default placement with `tsc --noEmit`).

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { AnalyticsEvent } from '../../../shared/constants_analytics';

export function PageViewTracker() {
  const location = useLocation();
  const { capture } = useAnalytics();

  useEffect(() => {
    capture(AnalyticsEvent.PAGE_VIEW, { $current_url: window.location.href });
  }, [location.pathname]);

  return null;
}
