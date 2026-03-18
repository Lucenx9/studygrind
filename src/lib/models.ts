import type { DirectProvider } from './types';

const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_OAUTH_BETA = 'oauth-2025-04-20';

function isAnthropicOAuthToken(key: string): boolean {
  return key.startsWith('sk-ant-oat');
}

function normalizeCredential(value: string): string {
  return value.trim();
}

export interface ModelInfo {
  id: string;
  name: string;
}

// Simple in-memory cache for model lists
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const modelCache = new Map<string, { data: ModelInfo[]; timestamp: number }>();

function getCached(key: string): ModelInfo[] | null {
  const entry = modelCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= CACHE_TTL_MS) {
    modelCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: ModelInfo[]) {
  modelCache.set(key, { data, timestamp: Date.now() });
}

export async function fetchOpenRouterModels(apiKey: string, forceRefresh = false): Promise<ModelInfo[]> {
  const normalizedKey = normalizeCredential(apiKey);
  const cacheKey = `openrouter:${normalizedKey}`;
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${normalizedKey}`,
      'HTTP-Referer': window.location.origin,
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);

  const data = await res.json();
  const models = (data.data as { id: string; name: string }[])
    .map(m => ({ id: m.id, name: m.name || m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
  setCache(cacheKey, models);
  return models;
}

export async function fetchDirectModels(provider: DirectProvider, apiKey: string, forceRefresh = false): Promise<ModelInfo[]> {
  switch (provider) {
    case 'openai':
      return fetchOpenAIModels(apiKey, forceRefresh);
    case 'anthropic':
      return fetchAnthropicModels(apiKey, forceRefresh);
    case 'google':
      return fetchGoogleModels(apiKey, forceRefresh);
  }
}

async function fetchOpenAIModels(apiKey: string, forceRefresh = false): Promise<ModelInfo[]> {
  const normalizedKey = normalizeCredential(apiKey);
  const cacheKey = `openai:${normalizedKey}`;
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${normalizedKey}` },
  });

  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);

  const data = await res.json();
  const models = (data.data as { id: string; owned_by: string }[])
    .filter(m => m.id.startsWith('gpt-') || m.id.startsWith('o') || m.id.startsWith('chatgpt-'))
    .filter(m => !m.id.includes('instruct') && !m.id.includes('realtime') && !m.id.includes('audio') && !m.id.includes('search'))
    .map(m => ({ id: m.id, name: m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
  setCache(cacheKey, models);
  return models;
}

async function fetchAnthropicModels(apiKey: string, forceRefresh = false): Promise<ModelInfo[]> {
  const normalizedKey = normalizeCredential(apiKey);
  const cacheKey = `anthropic:${normalizedKey}`;
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  // OAuth tokens use Bearer + beta header; regular keys use x-api-key
  const headers: Record<string, string> = isAnthropicOAuthToken(normalizedKey)
    ? {
        'Authorization': `Bearer ${normalizedKey}`,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': ANTHROPIC_OAUTH_BETA,
        'anthropic-dangerous-direct-browser-access': 'true',
      }
    : {
        'x-api-key': normalizedKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      };

  const res = await fetch('https://api.anthropic.com/v1/models', { headers });

  if (!res.ok) {
    // If model listing fails with OAuth token, return hardcoded list
    // (the /v1/models endpoint may not support OAuth tokens yet)
    if (isAnthropicOAuthToken(normalizedKey)) {
      const fallback = getAnthropicFallbackModels();
      setCache(cacheKey, fallback);
      return fallback;
    }
    throw new Error(`Failed to fetch models: ${res.status}`);
  }

  const data = await res.json();
  const models = (data.data as { id: string; display_name: string }[])
    .map(m => ({ id: m.id, name: m.display_name || m.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
  setCache(cacheKey, models);
  return models;
}

function getAnthropicFallbackModels(): ModelInfo[] {
  return [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
  ];
}

// Google: API key in header, NOT in URL query param (security)
async function fetchGoogleModels(apiKey: string, forceRefresh = false): Promise<ModelInfo[]> {
  const normalizedKey = normalizeCredential(apiKey);
  const cacheKey = `google:${normalizedKey}`;
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': normalizedKey },
  });

  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);

  const data = await res.json();
  const models = (data.models as { name: string; displayName: string; supportedGenerationMethods: string[] }[])
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => ({
      id: m.name.replace('models/', ''),
      name: m.displayName || m.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  setCache(cacheKey, models);
  return models;
}
