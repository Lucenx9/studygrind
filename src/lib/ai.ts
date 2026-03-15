import type { ProviderConfig } from './types';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const ANTHROPIC_VERSION = '2024-06-01';

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
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'StudyGrind',
    };
  }
  if (config.method === 'direct') {
    if (config.provider === 'anthropic') {
      return {
        'x-api-key': config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      };
    }
    if (config.provider === 'google') {
      // Google: pass key in header, NOT in URL query param
      return { 'x-goog-api-key': config.apiKey };
    }
    return { 'Authorization': `Bearer ${config.apiKey}` };
  }
  if (config.method === 'oauth') {
    if (config.provider === 'anthropic') {
      return {
        'x-api-key': config.accessToken,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      };
    }
    if (config.provider === 'google') {
      return { 'Authorization': `Bearer ${config.accessToken}` };
    }
    return { 'Authorization': `Bearer ${config.accessToken}` };
  }
  return {};
}

// Anthropic uses a different API format
async function callAnthropic(
  config: ProviderConfig,
  messages: ChatMessage[],
): Promise<string> {
  const baseUrl = getBaseUrl(config);
  const headers = getAuthHeaders(config);

  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role === 'user');

  const res = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system: systemMsg?.content ?? '',
      messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// Google Gemini — API key passed via header, not URL
async function callGoogle(
  config: ProviderConfig,
  messages: ChatMessage[],
): Promise<string> {
  const headers = getAuthHeaders(config);
  const model = config.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role === 'user');

  const contents = userMsgs.map(m => ({
    role: 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

// OpenAI-compatible (OpenRouter, OpenAI direct)
async function callOpenAI(
  config: ProviderConfig,
  messages: ChatMessage[],
): Promise<string> {
  const baseUrl = getBaseUrl(config);
  const headers = getAuthHeaders(config);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error (${res.status}): ${err}`);
  }

  const data = await res.json();
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
  const langLabel = language === 'it' ? 'Italian' : 'English';
  const customLine = customInstructions
    ? `\n- Additional instructions: ${customInstructions}`
    : '';

  return [
    {
      role: 'system',
      content: `You are an expert quiz generator for university students. Given study notes, generate questions that test understanding, not just recall.

Rules:
- Generate exactly ${count} questions based ONLY on the provided notes
- Mix two question types:
  - Type "mcq": Multiple choice with exactly 4 options (A, B, C, D). Exactly one correct answer. Distribute correct answers evenly across positions A/B/C/D.
  - Type "cloze": A sentence from the notes with one key term replaced by "___". The student must type the missing term. Provide 2-3 acceptable answers (e.g. ["mitocondri", "mitocondrio"]).
- Ratio: approximately 70% mcq, 30% cloze
- Vary difficulty: some questions should test basic recall, others should test understanding, application, or comparison
- After each question include a brief explanation (2-3 sentences) of WHY the correct answer is correct, adding context beyond what the notes say when useful
- Questions should be in ${langLabel}${customLine}
- Output valid JSON only, no markdown fences, no extra text

Output format:
[
  {
    "type": "mcq",
    "question": "Which structure is responsible for...?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": 0,
    "explanation": "The correct answer is A because..."
  },
  {
    "type": "cloze",
    "question": "The ___ is the powerhouse of the cell.",
    "acceptable_answers": ["mitochondria", "mitochondrion"],
    "explanation": "Mitochondria produce ATP through..."
  }
]`,
    },
    {
      role: 'user',
      content: `Here are my study notes:\n\n${notes}`,
    },
  ];
}
