import { createDbClient } from '../db/client';
import { Env, User } from '../types';

// PATCH /api/me/language — persists the user's preferred language server-side.
// Requires: users.preferred_language VARCHAR(10) NOT NULL DEFAULT 'en'
// Register as: PATCH /api/me/language → handlePatchLanguage(request, env, user)
export async function handlePatchLanguage(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  const body = await request.json<{ language?: unknown }>();
  const lang = body.language;
  if (typeof lang !== 'string' || lang.length === 0 || lang.length > 10) {
    return Response.json({ error: 'Invalid language code' }, { status: 400 });
  }

  const db = await createDbClient(env);
  try {
    await db.query(
      `UPDATE users SET preferred_language = $2, updated_at = NOW() WHERE id = $1`,
      [user.id, lang]
    );
    return Response.json({ preferred_language: lang });
  } finally {
    await db.end();
  }
}
