import { createDbClient } from '../db/client';
import { Env, User } from '../types';
// ADAPT: relative path assumes the default project layout — this route at
// src/routes/me_language.ts, the isomorphic language list at
// ui/src/i18n/i18n_supported_languages.ts (see i18n-setup's Step 4/5).
// Adjust if your project places routes or the i18n module elsewhere.
import { SUPPORTED_LANGUAGES } from '../../ui/src/i18n/i18n_supported_languages';

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
  if (typeof lang !== 'string' || !SUPPORTED_LANGUAGES.some((l) => l.code === lang)) {
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
