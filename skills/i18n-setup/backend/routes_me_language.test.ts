// Tests for handlePatchLanguage — run with the project's Vitest + Workers
// pool (see testing-setup/config/vitest.config.ts) against a real local
// Postgres via testing-setup's DB test helpers.
// ADAPT: update import paths (Env/User, test helpers) to match this
// project's layout. Requires the preferred_language migration from
// i18n-setup's Step 8 to already be applied to the test database.
import { describe, expect, it, beforeEach } from 'vitest';
import { handlePatchLanguage } from './routes_me_language';
import { createUser, query, truncateAll } from '../../test/helpers/db';
import { Env, User } from '../types';

function makeEnv(): Env {
  return {
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://dev:devpass@localhost:5432/myapp',
  } as Env;
}

async function loadUser(id: string): Promise<User> {
  const { rows } = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

async function preferredLanguageOf(id: string): Promise<string> {
  const { rows } = await query<{ preferred_language: string }>(
    'SELECT preferred_language FROM users WHERE id = $1',
    [id]
  );
  return rows[0].preferred_language;
}

function patchRequest(language: unknown): Request {
  return new Request('http://localhost/api/me/language', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  });
}

describe('handlePatchLanguage', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('returns 200 and persists a supported language code', async () => {
    const { id } = await createUser();
    const user = await loadUser(id);

    const response = await handlePatchLanguage(patchRequest('es'), makeEnv(), user);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ preferred_language: 'es' });
    expect(await preferredLanguageOf(id)).toBe('es');
  });

  it('returns 400 and does not persist an unsupported language code', async () => {
    const { id } = await createUser();
    const user = await loadUser(id);

    const response = await handlePatchLanguage(patchRequest('zz'), makeEnv(), user);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid language code' });
    expect(await preferredLanguageOf(id)).toBe('en'); // unchanged default
  });
});
