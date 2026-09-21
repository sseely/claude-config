// Route-level tests for the scaffolded SBOM request routes.
// ADAPT: update the import paths below once merged into your project's
// test/ directory — this file assumes it lives at the same depth as
// testing-setup's test/helpers/db.ts (e.g. test/routes/sbom.test.ts).
import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { truncateAll, createUserWithSession, query } from '../helpers/db';
import { handleRequestSbom, handleGetSbomStatus } from '../../src/routes/sbom';
import type { User } from '../../src/types';

async function loadUser(id: string): Promise<User> {
  const { rows } = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

describe('POST /api/sbom/request', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('returns 201 for a first request', async () => {
    const created = await createUserWithSession(env);
    const user = await loadUser(created.id);
    const ctx = createExecutionContext();

    const res = await handleRequestSbom(new Request('http://localhost/api/sbom/request', { method: 'POST' }), env, user, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(201);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('pending');
  });

  it('returns 429 for a second request inside the 30-day window', async () => {
    const created = await createUserWithSession(env);
    const user = await loadUser(created.id);

    const firstCtx = createExecutionContext();
    await handleRequestSbom(new Request('http://localhost/api/sbom/request', { method: 'POST' }), env, user, firstCtx);
    await waitOnExecutionContext(firstCtx);

    const secondCtx = createExecutionContext();
    const res = await handleRequestSbom(new Request('http://localhost/api/sbom/request', { method: 'POST' }), env, user, secondCtx);

    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Rate limited');
  });
});

describe('GET /api/sbom/status', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('reflects the most recently created request', async () => {
    const created = await createUserWithSession(env);
    const user = await loadUser(created.id);
    const ctx = createExecutionContext();

    await handleRequestSbom(new Request('http://localhost/api/sbom/request', { method: 'POST' }), env, user, ctx);
    await waitOnExecutionContext(ctx);

    const res = await handleGetSbomStatus(new Request('http://localhost/api/sbom/status'), env, user);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('pending');
  });
});
