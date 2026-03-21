import { createDbClient } from '../db/client';
import { Env, User } from '../types';

// POST /api/feedback
// ADAPT: if your session FK is not poll_id, rename it in the query and the upsert index.
export async function handleSubmitFeedback(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  const body = await request.json<{
    poll_id?: string; // ADAPT: rename to match your session/item FK, or remove
    rating?: number;
    comment?: string;
  }>();

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return Response.json({ error: 'rating must be an integer between 1 and 5' }, { status: 400 });
  }

  const db = await createDbClient(env);
  try {
    await db.query(
      `INSERT INTO user_feedback (user_id, poll_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, poll_id) WHERE poll_id IS NOT NULL
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
      [user.id, body.poll_id ?? null, body.rating, body.comment ?? null]
    );
    return Response.json({ submitted: true }, { status: 201 });
  } finally {
    await db.end();
  }
}