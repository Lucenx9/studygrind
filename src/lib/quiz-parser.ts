import { v4 as uuid } from 'uuid';
import { createNewCard } from './fsrs';
import type { Question, QuestionRaw } from './types';

type QuestionCandidate = Partial<QuestionRaw> & {
  acceptableAnswers?: unknown;
  acceptable_answers?: unknown;
  correct?: unknown;
  explanation?: unknown;
  options?: unknown;
  question?: unknown;
  type?: unknown;
};

export function parseQuizResponse(raw: string, topicId: string): Question[] {
  let lastError: Error | null = null;

  for (const candidate of buildParseCandidates(raw)) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed
        .map(normalizeQuestion)
        .filter((question): question is QuestionRaw => question !== null)
        .map(question => toQuestion(question, topicId));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Failed to parse quiz response');
    }
  }

  throw lastError ?? new Error('Failed to parse quiz response');
}

function buildParseCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  const withoutFences = stripMarkdownFences(trimmed);
  const extractedArray = extractJsonArray(withoutFences);
  const withoutTrailingCommas = removeTrailingCommas(extractedArray);
  const balanced = balanceJson(withoutTrailingCommas);

  return [...new Set([
    trimmed,
    withoutFences,
    extractedArray,
    withoutTrailingCommas,
    balanced,
  ].filter(Boolean))];
}

function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

function extractJsonArray(raw: string): string {
  const start = raw.indexOf('[');
  if (start === -1) return raw;

  let inString = false;
  let escaping = false;
  let depth = 0;

  for (let i = start; i < raw.length; i++) {
    const char = raw[i];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '[') depth++;
    if (char === ']') {
      depth--;
      if (depth === 0) {
        return raw.slice(start, i + 1);
      }
    }
  }

  return raw.slice(start);
}

function removeTrailingCommas(raw: string): string {
  return raw.replace(/,\s*([}\]])/g, '$1');
}

function balanceJson(raw: string): string {
  const stack: Array<'[' | '{'> = [];
  let inString = false;
  let escaping = false;

  for (const char of raw) {
    if (escaping) {
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    const last = stack[stack.length - 1];

    if (char === '[' || char === '{') {
      stack.push(char);
    } else if (char === ']' && last === '[') {
      stack.pop();
    } else if (char === '}' && last === '{') {
      stack.pop();
    }
  }

  const suffix = stack
    .reverse()
    .map(char => (char === '[' ? ']' : '}'))
    .join('');

  return removeTrailingCommas(`${raw}${suffix}`);
}

function normalizeQuestion(candidate: unknown): QuestionRaw | null {
  if (!candidate || typeof candidate !== 'object') return null;

  const raw = candidate as QuestionCandidate;
  if (
    (raw.type !== 'mcq' && raw.type !== 'cloze') ||
    typeof raw.question !== 'string' ||
    typeof raw.explanation !== 'string'
  ) {
    return null;
  }

  if (raw.type === 'mcq') {
    if (!Array.isArray(raw.options)) return null;

    const options = raw.options.filter((option): option is string => typeof option === 'string');
    const correct =
      typeof raw.correct === 'number'
        ? raw.correct
        : typeof raw.correct === 'string'
          ? Number.parseInt(raw.correct, 10)
          : Number.NaN;

    if (options.length !== 4 || !Number.isInteger(correct) || correct < 0 || correct > 3) {
      return null;
    }

    return {
      type: 'mcq',
      question: raw.question.trim(),
      options,
      correct,
      explanation: raw.explanation.trim(),
    };
  }

  const acceptableAnswers = Array.isArray(raw.acceptable_answers)
    ? raw.acceptable_answers
    : Array.isArray(raw.acceptableAnswers)
      ? raw.acceptableAnswers
      : null;

  const answers = acceptableAnswers?.filter(
    (answer): answer is string => typeof answer === 'string' && answer.trim().length > 0,
  );

  if (!answers?.length || !raw.question.includes('___')) {
    return null;
  }

  return {
    type: 'cloze',
    question: raw.question.trim(),
    acceptable_answers: answers,
    explanation: raw.explanation.trim(),
  };
}

function toQuestion(raw: QuestionRaw, topicId: string): Question {
  const base = {
    id: uuid(),
    topicId,
    explanation: raw.explanation,
    fsrsCard: createNewCard(),
    timesReviewed: 0,
    timesCorrect: 0,
  };

  if (raw.type === 'mcq') {
    return {
      ...base,
      type: 'mcq',
      question: raw.question,
      options: raw.options,
      correct: raw.correct,
    };
  }

  return {
    ...base,
    type: 'cloze',
    question: raw.question,
    acceptableAnswers: raw.acceptable_answers,
  };
}

// Levenshtein distance for fuzzy cloze matching
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return dp[m][n];
}

export function checkClozeAnswer(userAnswer: string, acceptableAnswers: string[]): boolean {
  const cleaned = userAnswer.trim().toLowerCase();
  return acceptableAnswers.some(ans => {
    const target = ans.trim().toLowerCase();
    if (cleaned === target) return true;
    // Relative threshold: stricter for short words (DNA≠RNA), lenient for long ones
    const maxDist = target.length <= 4 ? 1 : 2;
    return levenshtein(cleaned, target) <= maxDist;
  });
}
