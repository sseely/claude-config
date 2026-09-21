// Route-level tests for the scaffolded auth routes.
// ADAPT: update the import path below once merged into your project's
// test/ directory — this file assumes it lives at the same depth as
// testing-setup's test/helpers/db.ts (e.g. test/routes/auth.test.ts).
import { describe, it, expect, beforeEach } from 'vitest';
import { SELF, env } from 'cloudflare:test';
import { truncateAll, createUserWithSession, BASE_URL } from '../helpers/db';
import { generateState } from '../../src/utils/oauth';

describe('GET /api/me', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('returns 200 with the expected user fields for a valid session', async () => {
    const user = await createUserWithSession(env);

    const res = await SELF.fetch(`${BASE_URL}/api/me`, {
      headers: { Cookie: user.cookie },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; email: string };
    expect(body.id).toBe(user.id);
    expect(body.email).toBe(user.email);
  });

  it('returns 401 when no session cookie is present', async () => {
    const res = await SELF.fetch(`${BASE_URL}/api/me`);
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/:provider/callback', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('rejects a tampered state parameter with 400', async () => {
    const validState = await generateState(env);
    const tampered = `${validState}tampered`;

    const res = await SELF.fetch(
      `${BASE_URL}/auth/google/callback?code=test-code&state=${tampered}`
    );

    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Invalid callback');
  });
});
