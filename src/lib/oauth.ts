// OAuth 2.0 PKCE flow for browser-based authentication
// Client IDs are configurable — users need to register their own OAuth apps
import { isRecord } from './validation';

interface OAuthEndpoints {
  authorize: string;
  token: string;
  clientId: string;
  scopes: string[];
}

const ENDPOINTS: Record<string, OAuthEndpoints> = {
  openai: {
    authorize: 'https://auth.openai.com/authorize',
    token: 'https://auth.openai.com/token',
    clientId: '', // User must configure
    scopes: ['openid', 'profile', 'email'],
  },
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    clientId: '', // User must configure
    scopes: ['https://www.googleapis.com/auth/generative-language'],
  },
  anthropic: {
    authorize: 'https://console.anthropic.com/oauth/authorize',
    token: 'https://console.anthropic.com/oauth/token',
    clientId: '', // User must configure
    scopes: ['api'],
  },
};

const OAUTH_SESSION_KEYS = ['oauth_verifier', 'oauth_state', 'oauth_provider'] as const;
const OAUTH_TIMEOUT_MS = 30_000;

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OAUTH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function persistOAuthSession(
  provider: 'openai' | 'google' | 'anthropic',
  verifier: string,
  state: string,
): void {
  try {
    sessionStorage.setItem('oauth_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', provider);
  } catch {
    clearOAuthSession();
    throw new Error('Unable to start OAuth because session storage is unavailable.');
  }
}

function parseTokenResponse(value: unknown): { accessToken: string; expiresAt: string; email?: string } | null {
  if (
    !isRecord(value) ||
    typeof value.access_token !== 'string' ||
    typeof value.expires_in !== 'number' ||
    !Number.isFinite(value.expires_in)
  ) {
    return null;
  }

  return {
    accessToken: value.access_token,
    expiresAt: new Date(Date.now() + value.expires_in * 1000).toISOString(),
    email: typeof value.email === 'string' ? value.email : undefined,
  };
}

export async function startOAuthFlow(
  provider: 'openai' | 'google' | 'anthropic',
): Promise<{ accessToken: string; expiresAt: string; email?: string }> {
  const endpoints = ENDPOINTS[provider];
  if (!endpoints.clientId) {
    throw new Error(
      `OAuth client ID not configured for ${provider}. ` +
      'For most users, OpenRouter is easier — it requires just an API key.'
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const redirectUri = `${window.location.origin}/oauth/callback`;
  const state = crypto.randomUUID();

  persistOAuthSession(provider, verifier, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: endpoints.clientId,
    redirect_uri: redirectUri,
    scope: endpoints.scopes.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  // Open popup
  const popup = window.open(
    `${endpoints.authorize}?${params}`,
    'oauth',
    'width=500,height=600'
  );

  if (!popup) {
    clearOAuthSession();
    throw new Error('Popup blocked. Please allow popups for this site.');
  }

  // Wait for callback via postMessage
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearInterval(closedPoll);
      window.removeEventListener('message', handler);
      clearOAuthSession();
      if (!popup.closed) {
        popup.close();
      }
      callback();
    };

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error('OAuth timeout — popup was closed')));
    }, 120000);
    const closedPoll = window.setInterval(() => {
      if (popup.closed) {
        finish(() => reject(new Error('OAuth popup was closed before completion')));
      }
    }, 500);

    const handler = async (event: MessageEvent<unknown>) => {
      // SECURITY: verify the message comes from our own origin (strict equality)
      if (event.origin !== window.location.origin) return;
      if (event.source !== popup) return;
      if (!isOAuthCallbackMessage(event.data)) return;

      const data = event.data;
      const { code, state: returnedState, error } = data;

      if (error) {
        finish(() => reject(new Error(`OAuth error: ${error}`)));
        return;
      }

      if (!code || returnedState !== state) {
        finish(() => reject(new Error('OAuth state mismatch')));
        return;
      }

      try {
        const tokenRes = await fetchWithTimeout(endpoints.token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: endpoints.clientId,
            code_verifier: verifier,
          }),
        });

        if (!tokenRes.ok) {
          throw new Error(`Token exchange failed: ${tokenRes.status}`);
        }

        const rawTokens = (await tokenRes.json()) as unknown;
        const tokens = parseTokenResponse(rawTokens);
        if (!tokens) {
          throw new Error('OAuth token response was invalid.');
        }

        finish(() => resolve({
          accessToken: tokens.accessToken,
          expiresAt: tokens.expiresAt,
          email: tokens.email,
        }));
      } catch (err) {
        finish(() => reject(err instanceof Error ? err : new Error('OAuth token exchange failed')));
      }
    };

    window.addEventListener('message', handler);
  });
}

function clearOAuthSession(): void {
  for (const key of OAUTH_SESSION_KEYS) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore sessionStorage cleanup failures
    }
  }
}

function isOAuthCallbackMessage(
  value: unknown,
): value is { type: 'oauth_callback'; code?: string; state?: string; error?: string } {
  if (!isRecord(value)) return false;

  const candidate = value;
  return (
    candidate.type === 'oauth_callback' &&
    (candidate.code === undefined || typeof candidate.code === 'string') &&
    (candidate.state === undefined || typeof candidate.state === 'string') &&
    (candidate.error === undefined || typeof candidate.error === 'string')
  );
}
