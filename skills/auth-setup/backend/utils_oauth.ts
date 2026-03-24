import { Env } from '../types';
import { STATE_EXPIRY_MS, SESSION_TTL_SECONDS } from '../constants';

// ---------------------------------------------------------------------------
// OAuth state signing
// State = "<timestamp_ms>.<hex_hmac>" — no KV needed, HMAC proves we issued it.
// ---------------------------------------------------------------------------

/** Cache imported CryptoKey per APP_SECRET value to avoid re-importing on every call. */
let cachedSecret: string | null = null;
let cachedKey: CryptoKey | null = null;

async function getHmacKey(secret: string): Promise<CryptoKey> {
  if (cachedKey && cachedSecret === secret) return cachedKey;
  const enc = new TextEncoder();
  cachedKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  cachedSecret = secret;
  return cachedKey;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
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
  if (!res.ok) {
    const category = res.status < 500 ? 'client' : 'provider';
    throw new Error(`Token exchange failed (${category} error ${res.status})`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  if (typeof data.access_token !== 'string') {
    throw new Error('Token exchange response missing access_token');
  }
  return data as { access_token: string; [key: string]: unknown };
}

export async function fetchUserProfile(
  url: string,
  accessToken: string
): Promise<{ sub: string; email: string; name: string; picture?: string }> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const category = res.status < 500 ? 'client' : 'provider';
    throw new Error(`Profile fetch failed (${category} error ${res.status})`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  if (typeof data.sub !== 'string' || typeof data.email !== 'string') {
    throw new Error('Profile response missing required fields (sub, email)');
  }
  return {
    sub: data.sub,
    email: data.email,
    name: typeof data.name === 'string' ? data.name : '',
    picture: typeof data.picture === 'string' ? data.picture : undefined,
  };
}

// ---------------------------------------------------------------------------
// Session helpers — KV-backed, TTL from shared constant
// Requires: SESSION_STORE KVNamespace binding in wrangler.toml
// ---------------------------------------------------------------------------

export async function storeSession(env: Env, token: string, userId: string): Promise<void> {
  await env.SESSION_STORE.put(token, userId, { expirationTtl: SESSION_TTL_SECONDS });
}

export async function getSessionUserId(env: Env, token: string): Promise<string | null> {
  return env.SESSION_STORE.get(token);
}

export async function deleteSession(env: Env, token: string): Promise<void> {
  await env.SESSION_STORE.delete(token);
}
