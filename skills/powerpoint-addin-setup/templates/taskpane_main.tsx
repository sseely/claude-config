// Task pane entry point.
//
// CRITICAL: Always use Office.onReady() — never render before it fires.
// document.settings and other Office APIs are unavailable until then.
// Using React's StrictMode here is safe; Office.onReady fires only once.
//
// ADAPT: replace App import with your actual taskpane root component.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

Office.onReady(() => {
  const root = document.getElementById('root')!;
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
