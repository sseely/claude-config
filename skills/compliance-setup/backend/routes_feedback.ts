import { createDbClient } from '../db/client';
import { Env, User } from '../types';

// POST /api/feedback
// ADAPT: if your session FK is not poll_id, rename it in the query and the upsert index.
export async function handleSubmitFeedback(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
    return Response.json({ error: 'rating must be an integer between 1 and 5' }, { status: 400 });
  }

  // ADAPT: rename poll_id to match your session/item FK, or remove
  const pollId = typeof body.poll_id === 'string' ? body.poll_id : null;
  const comment = typeof body.comment === 'string' ? body.comment : null;

  const db = await createDbClient(env);
  try {
    await db.query(
      `INSERT INTO user_feedback (user_id, poll_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, poll_id) WHERE poll_id IS NOT NULL
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
      [user.id, pollId, body.rating, comment]
    );
    return Response.json({ submitted: true }, { status: 201 });
  } finally {
    await db.end();
  }
}