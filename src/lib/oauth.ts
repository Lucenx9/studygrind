// OAuth 2.0 PKCE flow for browser-based authentication
// Client IDs are configurable — users need to register their own OAuth apps

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

  // Store verifier for the callback
  sessionStorage.setItem('oauth_verifier', verifier);
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_provider', provider);

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
    throw new Error('Popup blocked. Please allow popups for this site.');
  }

  // Wait for callback via postMessage
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('OAuth timeout — popup was closed'));
    }, 120000);

    const handler = async (event: MessageEvent) => {
      // SECURITY: verify the message comes from our own origin
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'oauth_callback') return;

      clearTimeout(timeout);
      window.removeEventListener('message', handler);

      const { code, state: returnedState, error } = event.data;

      if (error) {
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (returnedState !== state) {
        reject(new Error('OAuth state mismatch'));
        return;
      }

      try {
        const tokenRes = await fetch(endpoints.token, {
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

        const tokens = await tokenRes.json();
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        resolve({
          accessToken: tokens.access_token,
          expiresAt,
          email: tokens.email,
        });
      } catch (err) {
        reject(err);
      }
    };

    window.addEventListener('message', handler);
  });
}
