// OAuth routes for LinkedIn, Google, and Microsoft.
// ADAPT: delete the entire section for any provider you are NOT using.
// ADAPT: update USER_COLS to match your actual users table columns.
// ADAPT: update PROVIDER_ID_FIELD to include only the providers you are using.
// ADAPT: if not storing linkedin_access_token, remove it from upsertUser.

import { createDbClient } from '../db/client';
import { Env, User } from '../types';
import {
  generateState,
  verifyState,
  exchangeCode,
  fetchUserProfile,
  storeSession,
  deleteSession,
} from '../utils/oauth';
import { parseCookies } from '../middleware/auth';
import { COOKIE, COOKIE_MAX_AGE, OAUTH } from '../constants';

function safeDecodeURIComponent(value: string): string | null {
  try { return decodeURIComponent(value); } catch { return null; }
}

function validateAppUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`APP_URL must use http(s), got: ${parsed.protocol}`);
  }
  return parsed.origin;
}

// ADAPT: list only the columns that exist in your users table
const USER_COLS = `id, linkedin_id, google_id, microsoft_id,
                   email, name, profile_url, linkedin_access_token,
                   created_at, updated_at, is_admin`;

// ADAPT: remove entries for providers you are not using
const PROVIDER_ID_FIELD = {
  linkedin:  'linkedin_id',
  google:    'google_id',
  microsoft: 'microsoft_id',
} as const satisfies Record<string, string>;

type Provider = keyof typeof PROVIDER_ID_FIELD;

// ---------------------------------------------------------------------------
// upsertUser — shared across all providers
// 1. Fast path: existing provider link
// 2. Email match: link new provider to existing account
// 3. New user: insert
// ---------------------------------------------------------------------------

async function upsertUser(
  env: Env,
  profile: {
    provider: Provider;
    provider_id: string;
    email: string;
    name?: string;
    picture?: string;
    linkedin_access_token?: string; // ADAPT: remove if not storing LinkedIn tokens
  }
): Promise<{ user: User; isNew: boolean }> {
  const email = profile.email.trim().toLowerCase();
  const name = (profile.name ?? profile.email.split('@')[0]).trim();
  const idField = PROVIDER_ID_FIELD[profile.provider];
  const db = await createDbClient(env);
  try {
    const { rows: byProvider } = await db.query<User>(
      `SELECT ${USER_COLS} FROM users WHERE ${idField} = $1`,
      [profile.provider_id]
    );
    if (byProvider.length > 0) {
      const { rows } = await db.query<User>(
        `UPDATE users
         SET email = $2, name = $3, profile_url = $4,
             linkedin_access_token = COALESCE($5, linkedin_access_token),
             updated_at = NOW()
         WHERE id = $1
         RETURNING ${USER_COLS}`,
        [byProvider[0].id, email, name, profile.picture ?? null, profile.linkedin_access_token ?? null]
      );
      return { user: rows[0], isNew: false };
    }

    const { rows: byEmail } = await db.query<User>(
      `SELECT ${USER_COLS} FROM users WHERE lower(email) = $1`,
      [email]
    );
    if (byEmail.length > 0) {
      const { rows } = await db.query<User>(
        `UPDATE users
         SET ${idField} = $2, name = $3, profile_url = $4,
             linkedin_access_token = COALESCE($5, linkedin_access_token),
             updated_at = NOW()
         WHERE id = $1
         RETURNING ${USER_COLS}`,
        [byEmail[0].id, profile.provider_id, name, profile.picture ?? null, profile.linkedin_access_token ?? null]
      );
      return { user: rows[0], isNew: false };
    }

    const { rows } = await db.query<User>(
      `INSERT INTO users (${idField}, email, name, profile_url, linkedin_access_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${USER_COLS}`,
      [profile.provider_id, email, name, profile.picture ?? null, profile.linkedin_access_token ?? null]
    );
    return { user: rows[0], isNew: true };
  } finally {
    await db.end();
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function safeReturnTo(value: string | null | undefined): string {
  if (!value) return '/dashboard'; // ADAPT: update default post-login path
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

function authInitResponse(authUrl: URL, returnTo: string | null): Response {
  const headers = new Headers({ Location: authUrl.toString() });
  if (returnTo) {
    const safe = safeReturnTo(returnTo);
    if (safe !== '/dashboard') {
      headers.append(
        'Set-Cookie',
        `${COOKIE.RETURN_TO}=${encodeURIComponent(safe)}; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE.RETURN_TO}; Path=/`
      );
    }
  }
  return new Response(null, { status: 302, headers });
}

async function createSessionAndRedirect(request: Request, env: Env, user: User): Promise<Response> {
  const token = crypto.randomUUID();
  await storeSession(env, token, user.id);
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const returnToRaw = cookies[COOKIE.RETURN_TO]
    ? safeDecodeURIComponent(cookies[COOKIE.RETURN_TO])
    : null;
  const location = safeReturnTo(returnToRaw);
  const headers = new Headers({
    Location: location,
    'Set-Cookie': `${COOKIE.SESSION}=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE.SESSION}; Path=/`,
  });
  if (returnToRaw) {
    headers.append(
      'Set-Cookie',
      `${COOKIE.RETURN_TO}=; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE.CLEAR}; Path=/`
    );
  }
  return new Response(null, { status: 302, headers });
}

function getCallbackParams(request: Request): { code: string | null; state: string | null } {
  const url = new URL(request.url);
  return { code: url.searchParams.get('code'), state: url.searchParams.get('state') };
}

// ---------------------------------------------------------------------------
// LinkedIn — ADAPT: delete this section if not using LinkedIn
// ---------------------------------------------------------------------------

export async function handleLinkedInAuth(request: Request, env: Env): Promise<Response> {
  const returnTo = new URL(request.url).searchParams.get('returnTo');
  const state = await generateState(env);
  const authUrl = new URL(OAUTH.linkedin.authUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', env.LINKEDIN_CLIENT_ID ?? '');
  authUrl.searchParams.set('redirect_uri', `${validateAppUrl(env.APP_URL)}/auth/linkedin/callback`);
  authUrl.searchParams.set('scope', OAUTH.linkedin.scope);
  authUrl.searchParams.set('state', state);
  return authInitResponse(authUrl, returnTo);
}

export async function handleLinkedInCallback(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  const { code, state } = getCallbackParams(request);
  if (!code || !state || !(await verifyState(state, env))) {
    return new Response('Invalid callback', { status: 400 });
  }
  try {
    const tokens = await exchangeCode({
      tokenUrl: OAUTH.linkedin.tokenUrl,
      code,
      clientId: env.LINKEDIN_CLIENT_ID ?? '',
      clientSecret: env.LINKEDIN_CLIENT_SECRET ?? '',
      redirectUri: `${validateAppUrl(env.APP_URL)}/auth/linkedin/callback`,
    });
    const profile = await fetchUserProfile(OAUTH.linkedin.userInfoUrl, tokens.access_token);
    const { user } = await upsertUser(env, {
      provider: 'linkedin',
      provider_id: profile.sub,
      email: profile.email,
      name: profile.name?.trim(),
      picture: profile.picture,
      linkedin_access_token: tokens.access_token, // ADAPT: remove if not posting to LinkedIn
    });
    return createSessionAndRedirect(request, env, user);
  } catch (err) {
    console.error('[linkedin callback]', err instanceof Error ? err.message : String(err));
    return new Response('Authentication failed', { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// Google — ADAPT: delete this section if not using Google
// ---------------------------------------------------------------------------

export async function handleGoogleAuth(request: Request, env: Env): Promise<Response> {
  const returnTo = new URL(request.url).searchParams.get('returnTo');
  const state = await generateState(env);
  const authUrl = new URL(OAUTH.google.authUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID ?? '');
  authUrl.searchParams.set('redirect_uri', `${validateAppUrl(env.APP_URL)}/auth/google/callback`);
  authUrl.searchParams.set('scope', OAUTH.google.scope);
  authUrl.searchParams.set('state', state);
  return authInitResponse(authUrl, returnTo);
}

export async function handleGoogleCallback(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  const { code, state } = getCallbackParams(request);
  if (!code || !state || !(await verifyState(state, env))) {
    return new Response('Invalid callback', { status: 400 });
  }
  try {
    const tokens = await exchangeCode({
      tokenUrl: OAUTH.google.tokenUrl,
      code,
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
      redirectUri: `${validateAppUrl(env.APP_URL)}/auth/google/callback`,
    });
    const profile = await fetchUserProfile(OAUTH.google.userInfoUrl, tokens.access_token);
    const { user } = await upsertUser(env, {
      provider: 'google',
      provider_id: profile.sub,
      email: profile.email,
      name: profile.name?.trim(),
      picture: profile.picture,
    });
    return createSessionAndRedirect(request, env, user);
  } catch (err) {
    console.error('[google callback]', err instanceof Error ? err.message : String(err));
    return new Response('Authentication failed', { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// Microsoft — ADAPT: delete this section if not using Microsoft
// ---------------------------------------------------------------------------

export async function handleMicrosoftAuth(request: Request, env: Env): Promise<Response> {
  const returnTo = new URL(request.url).searchParams.get('returnTo');
  const state = await generateState(env);
  const authUrl = new URL(OAUTH.microsoft.authUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', env.MICROSOFT_CLIENT_ID ?? '');
  authUrl.searchParams.set('redirect_uri', `${validateAppUrl(env.APP_URL)}/auth/microsoft/callback`);
  authUrl.searchParams.set('scope', OAUTH.microsoft.scope);
  authUrl.searchParams.set('state', state);
  return authInitResponse(authUrl, returnTo);
}

export async function handleMicrosoftCallback(
  request: Request,
  env: Env,
  ctx?: ExecutionContext
): Promise<Response> {
  const { code, state } = getCallbackParams(request);
  if (!code || !state || !(await verifyState(state, env))) {
    return new Response('Invalid callback', { status: 400 });
  }
  try {
    const tokens = await exchangeCode({
      tokenUrl: OAUTH.microsoft.tokenUrl,
      code,
      clientId: env.MICROSOFT_CLIENT_ID ?? '',
      clientSecret: env.MICROSOFT_CLIENT_SECRET ?? '',
      redirectUri: `${validateAppUrl(env.APP_URL)}/auth/microsoft/callback`,
    });
    const profile = await fetchUserProfile(OAUTH.microsoft.userInfoUrl, tokens.access_token);
    const { user } = await upsertUser(env, {
      provider: 'microsoft',
      provider_id: profile.sub,
      email: profile.email,
      name: profile.name?.trim(),
      picture: profile.picture,
    });
    return createSessionAndRedirect(request, env, user);
  } catch (err) {
    console.error('[microsoft callback]', err instanceof Error ? err.message : String(err));
    return new Response('Authentication failed', { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function handleLogout(request: Request, env: Env): Promise<Response> {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  if (cookies[COOKIE.SESSION]) {
    await deleteSession(env, cookies[COOKIE.SESSION]);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': `${COOKIE.SESSION}=; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE.CLEAR}; Path=/`,
    },
  });
}
