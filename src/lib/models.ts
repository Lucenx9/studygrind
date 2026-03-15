import type { DirectProvider } from './types';

const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_OAUTH_BETA = 'oauth-2025-04-20';

function isAnthropicOAuthToken(key: string): boolean {
  return key.startsWith('sk-ant-oat');
}

export interface ModelInfo {
  id: string;
  name: string;
}

export async function fetchOpenRouterModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);

  const data = await res.json();
  return (data.data as { id: string; name: string }[])
    .map(m => ({ id: m.id, name: m.name || m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchDirectModels(provider: DirectProvider, apiKey: string): Promise<ModelInfo[]> {
  switch (provider) {
    case 'openai':
      return fetchOpenAIModels(apiKey);
    case 'anthropic':
      return fetchAnthropicModels(apiKey);
    case 'google':
      return fetchGoogleModels(apiKey);
  }
}

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);

  const data = await res.json();
  return (data.data as { id: string; owned_by: string }[])
    .filter(m => m.id.startsWith('gpt-') || m.id.startsWith('o') || m.id.startsWith('chatgpt-'))
    .filter(m => !m.id.includes('instruct') && !m.id.includes('realtime') && !m.id.includes('audio') && !m.id.includes('search'))
    .map(m => ({ id: m.id, name: m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
  // OAuth tokens use Bearer + beta header; regular keys use x-api-key
  const headers: Record<string, string> = isAnthropicOAuthToken(apiKey)
    ? {
        'Authorization': `Bearer ${apiKey}`,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': ANTHROPIC_OAUTH_BETA,
        'anthropic-dangerous-direct-browser-access': 'true',
      }
    : {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      };

  const res = await fetch('https://api.anthropic.com/v1/models', { headers });

  if (!res.ok) {
    // If model listing fails with OAuth token, return hardcoded list
    // (the /v1/models endpoint may not support OAuth tokens yet)
    if (isAnthropicOAuthToken(apiKey)) {
      return getAnthropicFallbackModels();
    }
    throw new Error(`Failed to fetch models: ${res.status}`);
  }

  const data = await res.json();
  return (data.data as { id: string; display_name: string }[])
    .map(m => ({ id: m.id, name: m.display_name || m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getAnthropicFallbackModels(): ModelInfo[] {
  return [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
  ];
}

// Google: API key in header, NOT in URL query param (security)
async function fetchGoogleModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': apiKey },
  });

  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);

  const data = await res.json();
  return (data.models as { name: string; displayName: string; supportedGenerationMethods: string[] }[])
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => ({
      id: m.name.replace('models/', ''),
      name: m.displayName || m.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
