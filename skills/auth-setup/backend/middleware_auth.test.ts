// Unit tests for requireAuth.
// ADAPT: update the import path below once merged into your project's
// test/ directory — this file assumes it lives at the same depth as
// testing-setup's test/helpers/db.ts (e.g. test/middleware/auth.test.ts).
import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { truncateAll, createUserWithSession } from '../helpers/db';
import { requireAuth } from '../../src/middleware/auth';
import { COOKIE } from '../../src/constants';

describe('requireAuth', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('returns the user for a valid session cookie', async () => {
    const user = await createUserWithSession(env);
    const request = new Request('http://localhost/api/me', {
      headers: { Cookie: user.cookie },
    });

    const result = await requireAuth(request, env);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(user.id);
    expect(result?.email).toBe(user.email);
  });

  it('returns null when no session cookie is present', async () => {
    const request = new Request('http://localhost/api/me');

    const result = await requireAuth(request, env);

    expect(result).toBeNull();
  });

  it('returns null for a session cookie with no matching KV entry', async () => {
    const request = new Request('http://localhost/api/me', {
      headers: { Cookie: `${COOKIE.SESSION}=not-a-real-token` },
    });

    const result = await requireAuth(request, env);

    expect(result).toBeNull();
  });
});
