// Vitest config for a Cloudflare Workers project.
// Uses @cloudflare/vitest-plugin. The older `defineWorkersConfig` from
// '@cloudflare/vitest-pool-workers/config' no longer exists — that package
// dropped its "./config" export, and Cloudflare's docs now direct projects
// to this plugin. The former `poolOptions.workers.*` block is passed to
// cloudflareTest() instead; `isolatedStorage` and `singleWorker` are no
// longer options (see fileParallelism below). Requires vitest ^4.1.0 —
// vitest 5 is not supported by the plugin.
// ADAPT: update miniflare.bindings with your project's required env vars.
// ADAPT: add or remove kvNamespaces to match your wrangler.toml bindings.
// ADAPT: remove STRIPE_BASE_URL and stripe-related bindings if not using Stripe.
// ADAPT: update DATABASE_URL default to match your docker-compose.yml
//        credentials and TEST_PG_PORT (see docker/docker-compose.yml).

import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-plugin';

const req = createRequire(import.meta.url);

export default defineConfig({
  resolve: {
    // pg detects the workerd runtime and requires `pg-cloudflare` for its
    // socket implementation. pg-cloudflare only exports that implementation
    // under the "workerd" condition — without it the resolver serves
    // dist/empty.js and pg fails with "Cannot destructure property
    // 'CloudflareSocket'".
    conditions: ['workerd', 'import', 'module', 'browser', 'default'],

    // pg, pg-pool and pg-protocol are all dual-published: their exports maps
    // serve ESM under the "import" condition. The Workers resolver applies
    // import conditions even to the internal `require()` calls between them,
    // so ESM lands inside CommonJS modules — first as "Cannot use import
    // statement outside a module", then "Class extends value [object Module]".
    // One root cause, so pin all three to their CommonJS builds.
    //
    // Exact-match regexes (not bare strings) so `pg-pool` inside pg/lib/ is not
    // rewritten to a path relative to the importing file, and absolute
    // replacements so resolution does not depend on the importer's directory.
    alias: [
      // createRequire resolves under CommonJS conditions, so resolving the
      // bare specifier yields each package's CJS entry — and does not trip the
      // exports gate the way an explicit subpath would.
      { find: /^pg$/, replacement: req.resolve('pg') },
      { find: /^pg-pool$/, replacement: req.resolve('pg-pool') },
      { find: /^pg-protocol$/, replacement: req.resolve('pg-protocol') },
      // pg-cloudflare gates its subpaths behind "exports", so resolve the
      // package.json (which is exported) and walk to the CJS build beside it.
      {
        find: /^pg-cloudflare$/,
        replacement: path.join(
          path.dirname(req.resolve('pg-cloudflare/package.json')),
          'dist/index.js'
        ),
      },
    ],
  },

  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },

      miniflare: {
        bindings: {
          // ADAPT: set values that match your wrangler.toml [vars] block.
          // These override wrangler.toml values during tests.
          DATABASE_URL:
            process.env.DATABASE_URL ??
            `postgresql://dev:devpass@localhost:${process.env.TEST_PG_PORT ?? '5432'}/myapp`, // ADAPT
          ENVIRONMENT: 'test',
          APP_URL: 'http://localhost:8787',
          APP_SECRET: 'test-app-secret-32-chars-minimum!!', // ADAPT: 32+ chars

          // ADAPT: add your project-specific env vars below this line
          // SOME_API_KEY: 'test-value',

          // ADAPT: remove the Stripe block if not using payments-setup
          STRIPE_SECRET_KEY: 'sk_test_mock',
          STRIPE_WEBHOOK_SECRET: 'whsec_test_mock_secret_32chars!!',
          STRIPE_BASE_URL:
            process.env.STRIPE_BASE_URL ??
            `http://localhost:${process.env.TEST_STRIPE_MOCK_PORT ?? '12111'}`,
        },

        // ADAPT: list all KV namespace binding names from wrangler.toml
        kvNamespaces: ['SESSION_STORE'],
      },
    }),
  ],

  test: {
    globalSetup: ['./test/globalSetup.ts'],

    // `pg` (used by test/helpers/db.ts) is CommonJS. The Workers plugin runs
    // test code through workerd without the CJS->ESM shim the older pool
    // applied, so Vite has to process it rather than externalising it.
    server: {
      deps: {
        inline: ['pg', 'pg-pool'],
      },
    },

    // Test files share a single PostgreSQL database — run serially so
    // truncateAll() in one file cannot delete rows another file is using.
    // (Replaces the old pool's `singleWorker` option.) The plugin isolates
    // storage per test file by default, which covers the common case.
    fileParallelism: false,
    // ADAPT: uncomment both lines below only if tests need to *share* DO or
    // KV state across test files (fileParallelism: false is not enough for
    // that — it serializes files but doesn't stop per-file storage reset).
    // Cloudflare's documented pattern for shared state; CLI equivalents:
    // --max-workers=1 --no-isolate.
    // maxWorkers: 1,
    // isolate: false,

    coverage: {
      // v8 requires node:inspector, which workerd does not support.
      // Istanbul instruments at transform time — use it instead.
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      // ADAPT: add any generated or pure-type files that should be excluded
      exclude: ['src/types.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      reporter: ['text', 'html'],
    },
  },
});
