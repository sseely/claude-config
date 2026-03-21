// Content surface entry point (embedded iframe inside a slide).
//
// CRITICAL: Always use Office.onReady() — never render before it fires.
// document.settings and other Office APIs are unavailable until then.
//
// ADAPT: replace App import with your actual content root component.
// ADAPT: remove this file entirely if not using the content surface.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Office.onReady fires once the Office JS runtime is initialised.
// Never render before this — document.settings won't be available.
Office.onReady(() => {
  const root = document.getElementById('root')!;
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
