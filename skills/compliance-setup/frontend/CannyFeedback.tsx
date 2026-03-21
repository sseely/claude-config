import { useEffect } from 'react';

const CANNY_APP_ID = import.meta.env['VITE_CANNY_APP_ID'] as string | undefined;

/**
 * Identifies the current user with Canny so they appear in the feedback board.
 * Renders nothing — mount inside RequireAuth.
 * Only active when VITE_CANNY_APP_ID is set.
 */
export default function CannyFeedback({
  user,
}: {
  user: { id: string; name: string; email: string };
}) {
  useEffect(() => {
    if (!CANNY_APP_ID) return;

    type CannyQueue = { (...args: unknown[]): void; q: unknown[][] };
    type CannyWindow = Window &
      typeof globalThis & {
        Canny?: CannyQueue;
        attachEvent?: (event: string, fn: () => void) => void;
      };

    (function (w: CannyWindow, d: Document, i: string) {
      function l() {
        if (!d.getElementById(i)) {
          const f = d.getElementsByTagName('script')[0];
          const e = d.createElement('script');
          e.type = 'text/javascript';
          e.async = true;
          e.src = 'https://cdn.canny.io/canny.js';
          e.id = i;
          f?.parentNode?.insertBefore(e, f);
        }
      }
      if (typeof w.Canny !== 'function') {
        const c: CannyQueue = function (...args: unknown[]) {
          c.q.push(args);
        };
        c.q = [];
        w.Canny = c;
        if (d.readyState === 'complete') {
          l();
        } else if (w.attachEvent) {
          w.attachEvent('onload', l);
        } else {
          w.addEventListener('load', l, false);
        }
      }
    })(window as CannyWindow, document, 'canny-jssdk');

    (window as CannyWindow).Canny?.('identify', {
      appID: CANNY_APP_ID,
      user: { id: user.id, name: user.name, email: user.email },
    });
  }, [user.id, user.name, user.email]);

  return null;
}