// Global test setup — runs once before all test files.
// Starts Docker services if PostgreSQL is not already reachable,
// applies the DB schema, and runs all pending migrations.
// ADAPT: update the docker compose service names to match your docker-compose.yml.
// ADAPT: update the schema file path to match your project layout.
// ADAPT: update the migrations directory path if different.
// ADAPT: remove stripe-mock from the docker compose command if not using Stripe.

import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';

function run(cmd: string, args: string[], opts: { cwd?: string } = {}): void {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with status ${result.status}`);
  }
}

let dockerStartedBySetup = false;

export default function setup() {
  const dbUrl =
    process.env.DATABASE_URL ??
    'postgresql://dev:devpass@localhost:5432/myapp'; // ADAPT
  const root = process.cwd();

  // Only start Docker if the DB isn't already reachable.
  // In CI the database service is provided by the workflow; locally we start it.
  const probe = spawnSync('psql', [dbUrl, '-c', 'SELECT 1'], {
    stdio: 'pipe',
    timeout: 5000,
  });
  if (probe.status !== 0) {
    // ADAPT: remove 'stripe-mock' if not using Stripe
    run('docker', ['compose', 'up', '-d', '--wait', 'postgres', 'stripe-mock'], { cwd: root });
    dockerStartedBySetup = true;
  }

  // Apply base schema if the users table doesn't exist yet (sentinel check).
  // ADAPT: update sentinel table name if your schema doesn't have a 'users' table.
  const check = spawnSync(
    'psql',
    [dbUrl, '-tAc', "SELECT 1 FROM information_schema.tables WHERE table_name='users'"],
    { encoding: 'utf8' }
  );
  if (!check.stdout.trim()) {
    // ADAPT: update path to your base schema file
    run('psql', [dbUrl, '-f', path.join(root, 'src/db/schema.sql')]);
  }

  // Apply all pending migrations in filename order.
  // ADAPT: update path to your migrations directory
  const migrationsDir = path.join(root, 'src/db/migrations');
  const migrations = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const migration of migrations) {
    spawnSync('psql', [dbUrl, '-f', path.join(migrationsDir, migration)], { stdio: 'pipe' });
  }
}

export function teardown() {
  if (dockerStartedBySetup) {
    spawnSync('docker', ['compose', 'down'], { cwd: process.cwd(), stdio: 'inherit' });
  }
}
