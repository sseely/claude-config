// Vitest config for a Cloudflare Workers project.
// ADAPT: update miniflare.bindings with your project's required env vars.
// ADAPT: add or remove kvNamespaces to match your wrangler.toml bindings.
// ADAPT: set isolatedStorage: true if your Durable Objects write state in tests.
// ADAPT: remove STRIPE_BASE_URL and stripe-related bindings if not using Stripe.
// ADAPT: update DATABASE_URL default to match your docker-compose.yml credentials.

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    globalSetup: ['./test/globalSetup.ts'],

    // Test files share a single PostgreSQL DB — run serially to avoid
    // truncateAll() races and FK violations across concurrent files.
    fileParallelism: false,

    coverage: {
      // v8 requires node:inspector which Workerd doesn't support.
      // Istanbul instruments at transform time — use this instead.
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      // ADAPT: add any generated or pure-type files that should be excluded
      exclude: ['src/types.ts'],
      thresholds: {
        lines:      80,
        functions:  80,
        branches:   80,
        statements: 80,
      },
      reporter: ['text', 'html'],
    },

    poolOptions: {
      workers: {
        // Disable per-test DO storage isolation.
        // The DO is stateless (no writes); PostgreSQL state is reset in beforeEach.
        // Without this, nested DO calls cause unresolvable storage stack frames.
        // ADAPT: set to true if your DOs write state that must be isolated per test.
        isolatedStorage: false,

        // Force a single Worker instance so fileParallelism: false is honoured.
        // With concurrent instances the shared PostgreSQL DB gets race conditions.
        singleWorker: true,

        wrangler: { configPath: './wrangler.toml' },

        miniflare: {
          bindings: {
            // ADAPT: set values that match your wrangler.toml [vars] block.
            // These override wrangler.toml values during tests.
            DATABASE_URL: process.env.DATABASE_URL
              ?? 'postgresql://dev:devpass@localhost:5432/myapp', // ADAPT
            ENVIRONMENT:  'test',
            APP_URL:      'http://localhost:8787',
            APP_SECRET:   'test-app-secret-32-chars-minimum!!', // ADAPT: 32+ chars

            // ADAPT: add your project-specific env vars below this line
            // SOME_API_KEY: 'test-value',

            // ADAPT: remove the Stripe block if not using payments-setup
            STRIPE_SECRET_KEY:    'sk_test_mock',
            STRIPE_WEBHOOK_SECRET: 'whsec_test_mock_secret_32chars!!',
            STRIPE_BASE_URL: process.env.STRIPE_BASE_URL ?? 'http://localhost:12111',
          },

          // ADAPT: list all KV namespace binding names from wrangler.toml
          kvNamespaces: ['SESSION_STORE'],
        },
      },
    },
  },
});
