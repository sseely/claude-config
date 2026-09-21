// Route-level tests for the scaffolded compliance /me routes.
// ADAPT: update the import paths below once merged into your project's
// test/ directory — this file assumes it lives at the same depth as
// testing-setup's test/helpers/db.ts (e.g. test/routes/me.test.ts).
import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { truncateAll, createUserWithSession, query } from '../helpers/db';
import { getSessionUserId } from '../../src/utils/oauth';
import { handleExportData, handleDeleteAccount, handleRestoreAccount } from '../../src/routes/me';
import type { User } from '../../src/types';

async function loadUser(id: string): Promise<User> {
  const { rows } = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

describe('GET /api/me/export', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('returns 200 with the expected export payload shape', async () => {
    const created = await createUserWithSession(env);
    const user = await loadUser(created.id);
    const ctx = createExecutionContext();

    const res = await handleExportData(new Request('http://localhost/api/me/export'), env, user, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { exportVersion: string; profile: { id: string; email: string } };
    expect(body.exportVersion).toBe('1.0');
    expect(body.profile.id).toBe(user.id);
    expect(body.profile.email).toBe(user.email);
  });
});

describe('DELETE /api/me', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('soft-deletes the row and revokes every active session', async () => {
    const created = await createUserWithSession(env);
    const user = await loadUser(created.id);
    const ctx = createExecutionContext();

    const res = await handleDeleteAccount(
      new Request('http://localhost/api/me', { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE' }) }),
      env,
      user,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);

    const { rows } = await query<{ deleted_at: string | null }>(
      'SELECT deleted_at FROM users WHERE id = $1',
      [user.id]
    );
    expect(rows[0].deleted_at).not.toBeNull();

    const token = created.cookie.split('=')[1];
    expect(await getSessionUserId(env, token)).toBeNull();
  });
});

describe('POST /api/me/restore', () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it('un-deletes the account and clears the recovery fields', async () => {
    const created = await createUserWithSession(env);
    let user = await loadUser(created.id);

    const deleteCtx = createExecutionContext();
    await handleDeleteAccount(
      new Request('http://localhost/api/me', { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE' }) }),
      env,
      user,
      deleteCtx
    );
    await waitOnExecutionContext(deleteCtx);

    user = await loadUser(created.id);
    const restoreCtx = createExecutionContext();
    const res = await handleRestoreAccount(new Request('http://localhost/api/me/restore', { method: 'POST' }), env, user, restoreCtx);
    await waitOnExecutionContext(restoreCtx);

    expect(res.status).toBe(200);
    const { rows } = await query<{
      deleted_at: string | null;
      has_recovery_backup: boolean;
      recovery_backup_expires_at: string | null;
    }>('SELECT deleted_at, has_recovery_backup, recovery_backup_expires_at FROM users WHERE id = $1', [user.id]);

    expect(rows[0].deleted_at).toBeNull();
    expect(rows[0].has_recovery_backup).toBe(false);
    expect(rows[0].recovery_backup_expires_at).toBeNull();
  });
});
