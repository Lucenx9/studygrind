import type { ProviderConfig } from './types';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class TruncationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TruncationError';
  }
}

const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_OAUTH_BETA = 'oauth-2025-04-20';

/** Detect Anthropic OAuth tokens (sk-ant-oat*) vs regular API keys */
function isAnthropicOAuthToken(key: string): boolean {
  return key.startsWith('sk-ant-oat');
}

function normalizeCredential(value: string): string {
  return value.trim();
}

function getBaseUrl(config: ProviderConfig): string {
  if (config.method === 'openrouter') {
    return 'https://openrouter.ai/api/v1';
  }
  if (config.method === 'oauth' || config.method === 'direct') {
    const provider = config.provider;
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'google':
        return 'https://generativelanguage.googleapis.com/v1beta';
      default: {
        const _exhaustive: never = provider;
        throw new Error(`Unknown provider: ${_exhaustive}`);
      }
    }
  }
  return '';
}

function getAuthHeaders(config: ProviderConfig): Record<string, string> {
  if (config.method === 'openrouter') {
    return {
      'Authorization': `Bearer ${normalizeCredential(config.apiKey)}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'StudyGrind',
    };
  }
  if (config.method === 'direct') {
    const apiKey = normalizeCredential(config.apiKey);
    if (config.provider === 'anthropic') {
      // OAuth tokens use Bearer auth + beta header; regular keys use x-api-key
      // Both need anthropic-dangerous-direct-browser-access for CORS
      if (isAnthropicOAuthToken(apiKey)) {
        return {
          'Authorization': `Bearer ${apiKey}`,
          'anthropic-version': ANTHROPIC_VERSION,
          'anthropic-beta': ANTHROPIC_OAUTH_BETA,
          'anthropic-dangerous-direct-browser-access': 'true',
        };
      }
      return {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      };
    }
    if (config.provider === 'google') {
      // Google: pass key in header, NOT in URL query param
      return { 'x-goog-api-key': apiKey };
    }
    return { 'Authorization': `Bearer ${apiKey}` };
  }
  if (config.method === 'oauth') {
    const accessToken = normalizeCredential(config.accessToken);
    if (config.provider === 'anthropic') {
      return {
        'Authorization': `Bearer ${accessToken}`,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': ANTHROPIC_OAUTH_BETA,
        'anthropic-dangerous-direct-browser-access': 'true',
      };
    }
    if (config.provider === 'google') {
      return { 'Authorization': `Bearer ${accessToken}` };
    }
    return { 'Authorization': `Bearer ${accessToken}` };
  }
  return {};
}

const API_TIMEOUT_MS = 120_000; // 2 minutes

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

function throwApiError(provider: string, status: number, body: string): never {
  if (status === 401 || status === 403) throw new Error(`${provider}: Invalid API key (${status})`);
  if (status === 429) throw new Error(`${provider}: Rate limited. Wait a moment and try again.`);
  if (status >= 500) throw new Error(`${provider}: Server error (${status}). Try again later.`);
  throw new Error(`${provider} error (${status}): ${body.slice(0, 200)}`);
}

// Anthropic
async function callAnthropic(config: ProviderConfig, messages: ChatMessage[]): Promise<string> {
  const baseUrl = getBaseUrl(config);
  const headers = getAuthHeaders(config);
  const systemMsg = messages.find(m => m.role === 'system');
  const conversationMsgs = messages.filter(m => m.role === 'user' || m.role === 'assistant');

  const res = await fetchWithTimeout(`${baseUrl}/messages`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 16384,
      system: systemMsg?.content ?? '',
      messages: conversationMsgs.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throwApiError('Anthropic', res.status, await res.text());
  const data = await res.json();
  if (!data?.content?.[0]?.text) throw new Error('Anthropic returned an empty response');
  if (data.stop_reason === 'max_tokens') {
    throw new TruncationError('Anthropic response was truncated (max_tokens reached)');
  }
  return data.content[0].text;
}

// Google Gemini
async function callGoogle(config: ProviderConfig, messages: ChatMessage[]): Promise<string> {
  const headers = getAuthHeaders(config);
  const model = config.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const systemMsg = messages.find(m => m.role === 'system');
  const conversationMsgs = messages.filter(m => m.role !== 'system');

  const contents = conversationMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents, generationConfig: { maxOutputTokens: 16384 } };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throwApiError('Google', res.status, await res.text());
  const data = await res.json();
  if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Google returned an empty response');
  const finishReason = data.candidates[0].finishReason;
  if (finishReason === 'MAX_TOKENS') {
    throw new TruncationError('Google response was truncated (MAX_TOKENS reached)');
  }
  return data.candidates[0].content.parts[0].text;
}

// OpenAI-compatible (OpenRouter, OpenAI direct)
async function callOpenAI(config: ProviderConfig, messages: ChatMessage[]): Promise<string> {
  const baseUrl = getBaseUrl(config);
  const headers = getAuthHeaders(config);

  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model, messages, temperature: 0.7, max_tokens: 16384 }),
  });

  if (!res.ok) throwApiError('API', res.status, await res.text());
  const data = await res.json();
  if (!data?.choices?.[0]?.message?.content) throw new Error('API returned an empty response');
  if (data.choices[0].finish_reason === 'length') {
    throw new TruncationError('API response was truncated (max_tokens reached)');
  }
  return data.choices[0].message.content;
}

export async function chatCompletion(
  config: ProviderConfig,
  messages: ChatMessage[],
): Promise<string> {
  const provider = config.method === 'openrouter' ? 'openai' : config.provider;

  if (provider === 'anthropic') {
    return callAnthropic(config, messages);
  }
  if (provider === 'google') {
    return callGoogle(config, messages);
  }
  return callOpenAI(config, messages);
}

export function buildQuizPrompt(
  notes: string,
  count: number,
  language: 'it' | 'en',
  customInstructions?: string,
): ChatMessage[] {
  const mcqCount = Math.round(count * 0.7);
  const clozeCount = count - mcqCount;

  const langSpecific = language === 'it'
    ? `- Write questions and options in Italian
- Keep standard technical/scientific terms untranslated when common in Italian academia (e.g., "DNA", "feedback", "ATP")
- For cloze acceptable_answers, include morphological variants: singular/plural, with/without article (e.g., ["mitocondrio", "mitocondri", "il mitocondrio"])`
    : '- Write questions and options in English';

  const customLine = customInstructions
    ? `\nAdditional instructions: ${customInstructions}`
    : '';

  return [
    {
      role: 'system',
      content: `You are an expert educational assessment designer for university students. Generate questions ONLY from the provided source material — never invent facts.

TASK: Generate exactly ${count} questions (${mcqCount} MCQ + ${clozeCount} cloze) from the study notes.

TYPE "mcq" (${mcqCount} questions):
Multiple choice with exactly 4 options (A, B, C, D). One correct answer.

Cognitive level distribution:
- ~30% REMEMBER/UNDERSTAND: identify, describe, explain ("Which best describes...?")
- ~40% APPLY/ANALYZE: apply to scenarios, compare, cause-effect ("If X is observed, which mechanism...?")
- ~30% EVALUATE/SYNTHESIZE: judge, predict, combine concepts ("Given A and B, which conclusion...?")

MCQ rules:
- Stem must be a clear, complete question answerable without reading options
- DISTRACTORS must be plausible (based on common misconceptions), clearly wrong to experts, similar in length/structure to the correct answer
- No "all of the above", "none of the above", or negative stems ("Which is NOT...")
- Each question tests ONE concept
- Vary correct answer position across A, B, C, D

TYPE "cloze" (${clozeCount} questions):
A statement with ONE key concept replaced by "___".

Cloze rules:
- Blank the CONCEPTUALLY CRITICAL word — the one proving understanding of the relationship
- Never blank articles, prepositions, or trivial words
- Rewrite the sentence for clarity, don't copy verbatim from notes
- Provide 2-4 acceptable answers covering spelling variants, singular/plural

AVOID:
- Questions that copy a sentence and ask "What is X?" — rephrase to test understanding
- Questions answerable by common sense without the material
- Distractors that are absurd or obviously unrelated
- Grammatical clues revealing the correct answer
- Inventing facts not in the source notes

EXPLANATION: After each question, 2-3 sentences: why the correct answer is right, and why the most plausible distractor is wrong. Ground in the source notes.

${langSpecific}${customLine}

Output ONLY valid JSON array. No markdown fences, no commentary.
[
  {
    "type": "mcq",
    "question": "Clear question stem?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": 0,
    "explanation": "A is correct because... B is wrong because..."
  },
  {
    "type": "cloze",
    "question": "The ___ converts ADP into ATP via oxidative phosphorylation.",
    "acceptable_answers": ["mitochondria", "mitochondrion"],
    "explanation": "Mitochondria are where oxidative phosphorylation occurs..."
  }
]`,
    },
    {
      role: 'user',
      content: `Generate questions ONLY from this material:\n\n${notes}`,
    },
  ];
}
