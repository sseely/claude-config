// Auth-related constants — merge into your project's src/constants.ts.
// ADAPT: remove OAUTH entries for providers you are not using.
// ADAPT: adjust LinkedIn scope — remove w_member_social if not posting to LinkedIn.

export const COOKIE = {
  SESSION:  'session',   // ADAPT: rename if your project uses a different cookie name
  RETURN_TO: 'return_to',
} as const;

/** Max-age values in seconds */
export const COOKIE_MAX_AGE = {
  SESSION:   30 * 24 * 60 * 60, // 30 days
  RETURN_TO: 10 * 60,            // 10 minutes
  CLEAR:     0,
} as const;

/** OAuth state token validity window */
export const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export const OAUTH = {
  // ADAPT: delete providers you are not using
  linkedin: {
    authUrl:     'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl:    'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    // Remove w_member_social if you don't need LinkedIn API posting
    scope:       'openid profile email w_member_social',
  },
  google: {
    authUrl:     'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl:    'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope:       'openid profile email',
  },
  microsoft: {
    authUrl:     'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl:    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    scope:       'openid profile email',
  },
} as const;
