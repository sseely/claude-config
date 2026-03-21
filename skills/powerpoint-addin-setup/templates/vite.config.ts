// Vite config with Office Add-in HTTPS support.
//
// Office Add-ins require HTTPS even on localhost — plain HTTP won't load.
// office-addin-dev-certs generates a trusted cert and installs it into the
// macOS Keychain (or Windows cert store). Run once per machine:
//   npx office-addin-dev-certs install
//
// The config below gracefully falls back to HTTP if the package isn't installed
// so the main app still works during development even without the add-in.
//
// ADAPT: add/remove entries in rollupOptions.input for each surface (taskpane,
//        content, or additional entry points your add-in needs).
// ADAPT: update proxy targets if your Worker runs on a different port.
// ADAPT: remove manualChunks entries that don't apply to your project.

import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(async ({ command }): Promise<UserConfig> => {
  const isBuild = command === 'build';

  // Office Add-ins require HTTPS even on localhost.
  // Run `npx office-addin-dev-certs install` once per machine.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let httpsOptions: any = undefined;
  if (!isBuild) {
    try {
      const devCerts = await import('office-addin-dev-certs');
      httpsOptions = await devCerts.default.getHttpsServerOptions();
    } catch {
      console.warn("[vite] office-addin-dev-certs not found — running HTTP (add-in won't work)");
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // ADAPT: update or remove if your project doesn't have a shared/ directory
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          // ADAPT: main app entry point
          main: path.resolve(__dirname, 'index.html'),
          // ADAPT: add-in surfaces — remove content if not using content surface
          'addin-taskpane': path.resolve(__dirname, 'addin/taskpane/index.html'),
          'addin-content':  path.resolve(__dirname, 'addin/content/index.html'),
        },
        output: {
          // ADAPT: update chunks to match your actual dependencies
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    server: {
      port: 3000,
      https: httpsOptions,
      proxy: {
        // ADAPT: update paths and ports to match your backend
        '/api':   'http://localhost:8787',
        '/auth':  'http://localhost:8787',
        '/admin': 'http://localhost:8787',
        '/ws': { target: 'ws://localhost:8787', ws: true },
      },
    },
  };
});
