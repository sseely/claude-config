// Auth-related type additions — merge into your project's src/types.ts.
// ADAPT: remove provider ID fields for providers you are not using.
// ADAPT: remove linkedin_access_token if not storing LinkedIn tokens.
// ADAPT: add project-specific fields after the base auth fields.

// Additions to your Env interface:
export interface EnvAuthFields {
  APP_URL:    string;     // e.g. https://yourdomain.com — used in OAuth redirect URIs
  APP_SECRET: string;     // HMAC key for OAuth state signing (wrangler secret put APP_SECRET)
  SESSION_STORE: KVNamespace; // Session token → user_id, 30-day TTL

  // OAuth credentials — add only the providers you are using
  LINKEDIN_CLIENT_ID?:     string;
  LINKEDIN_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?:       string;
  GOOGLE_CLIENT_SECRET?:   string;
  MICROSOFT_CLIENT_ID?:    string;
  MICROSOFT_CLIENT_SECRET?: string;
}

// Your User interface — adapt to match the users table columns you created
export interface User {
  id:         string;
  email:      string;
  name:       string;
  profile_url: string | null;
  created_at: string;
  updated_at: string;
  is_admin:   boolean;

  // Provider IDs — remove fields for providers you are not using
  linkedin_id:  string | null;
  google_id:    string | null;
  microsoft_id: string | null;

  // Only present if storing LinkedIn tokens for API posting
  linkedin_access_token: string | null;
}
