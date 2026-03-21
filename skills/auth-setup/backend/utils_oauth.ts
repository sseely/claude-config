import { Env } from '../types';
import { STATE_EXPIRY_MS } from '../constants';

// ---------------------------------------------------------------------------
// OAuth state signing
// State = "<timestamp_ms>.<hex_hmac>" — no KV needed, HMAC proves we issued it.
// ---------------------------------------------------------------------------

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateState(env: Env): Promise<string> {
  const ts = Date.now().toString();
  const mac = await hmacHex(ts, env.APP_SECRET);
  return `${ts}.${mac}`;
}

export async function verifyState(state: string, env: Env): Promise<boolean> {
  const dot = state.indexOf('.');
  if (dot === -1) return false;
  const ts = state.slice(0, dot);
  const mac = state.slice(dot + 1);
  if (Date.now() - parseInt(ts, 10) > STATE_EXPIRY_MS) return false;
  const expected = await hmacHex(ts, env.APP_SECRET);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== mac.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ mac.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Token exchange + profile fetch (standard OIDC / OAuth2 code flow)
// ---------------------------------------------------------------------------

export async function exchangeCode(opts: {
  tokenUrl: string;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ access_token: string; [key: string]: unknown }> {
  const res = await fetch(opts.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function fetchUserProfile(
  url: string,
  accessToken: string
): Promise<{ sub: string; email: string; name: string; picture?: string }> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Session helpers — KV-backed, 30-day TTL
// Requires: SESSION_STORE KVNamespace binding in wrangler.toml
// ---------------------------------------------------------------------------

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export async function storeSession(env: Env, token: string, userId: string): Promise<void> {
  await env.SESSION_STORE.put(token, userId, { expirationTtl: SESSION_TTL_SECONDS });
}

export async function getSessionUserId(env: Env, token: string): Promise<string | null> {
  return env.SESSION_STORE.get(token);
}

export async function deleteSession(env: Env, token: string): Promise<void> {
  await env.SESSION_STORE.delete(token);
}
