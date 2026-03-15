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

const OPTION_PREFIX_RE = /^[[(]?(?:[A-D]|[1-4])(?:[.):\]])?\s*/i;

export function parseQuizResponse(raw: string, topicId: string): Question[] {
  let lastError: Error | null = null;

  for (const candidate of buildParseCandidates(raw)) {
    try {
      const parsed = extractQuestionArray(JSON.parse(candidate) as unknown);

      const questions = parsed
        .map(normalizeQuestion)
        .filter((question): question is QuestionRaw => question !== null);

      return rebalanceCorrectPositions(questions)
        .map(question => toQuestion(question, topicId));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Failed to parse quiz response');
    }
  }

  throw lastError ?? new Error('Failed to parse quiz response');
}

function extractQuestionArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Response is not an array');
  }

  const record = parsed as Record<string, unknown>;
  for (const key of ['questions', 'quiz', 'items']) {
    if (Array.isArray(record[key])) {
      return record[key];
    }
  }

  throw new Error('Response is not an array');
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
  const questionText = typeof raw.question === 'string' ? raw.question.trim() : '';
  const explanationText = typeof raw.explanation === 'string' ? raw.explanation.trim() : '';
  if (
    (raw.type !== 'mcq' && raw.type !== 'cloze') ||
    !questionText ||
    !explanationText
  ) {
    return null;
  }

  if (raw.type === 'mcq') {
    if (!Array.isArray(raw.options)) return null;

    const options = raw.options
      .filter((option): option is string => typeof option === 'string')
      .map(option => option.replace(OPTION_PREFIX_RE, '').trim());
    const normalizedOptions = options.map(option => option.toLocaleLowerCase());
    const correct =
      typeof raw.correct === 'number'
        ? raw.correct
        : typeof raw.correct === 'string'
          ? Number.parseInt(raw.correct, 10)
          : Number.NaN;

    if (
      options.length !== 4 ||
      options.some(option => option.length === 0) ||
      new Set(normalizedOptions).size !== options.length ||
      !Number.isInteger(correct) ||
      correct < 0 ||
      correct > 3
    ) {
      return null;
    }

    return {
      type: 'mcq',
      question: questionText,
      options,
      correct,
      explanation: explanationText,
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

  if (!answers?.length || !questionText.includes('___')) {
    return null;
  }

  return {
    type: 'cloze',
    question: questionText,
    acceptable_answers: Array.from(
      new Set(answers.map(answer => answer.trim()).filter(Boolean)),
    ),
    explanation: explanationText,
  };
}

/**
 * Post-process MCQ questions to ensure correct answers are evenly distributed
 * across positions A/B/C/D. LLMs consistently bias toward position B despite
 * prompt instructions, so we rebalance them after generation.
 */
function rebalanceCorrectPositions(questions: QuestionRaw[]): QuestionRaw[] {
  const mcqs = questions.filter((q): q is QuestionRaw & { type: 'mcq' } => q.type === 'mcq');
  const targetPositions = buildTargetPositions(mcqs.length);

  let posIdx = 0;
  return questions.map(q => {
    if (q.type !== 'mcq') return q;

    const targetPos = targetPositions[posIdx++];
    if (q.correct === targetPos) return q;

    // Swap the correct answer to the target position
    const newOptions = [...q.options];
    const correctText = newOptions[q.correct];
    newOptions[q.correct] = newOptions[targetPos];
    newOptions[targetPos] = correctText;

    // Update letter references in explanation to match new positions
    const oldLetter = String.fromCharCode(65 + q.correct); // e.g. "B"
    const newLetter = String.fromCharCode(65 + targetPos); // e.g. "D"
    const swappedLetter = String.fromCharCode(65 + q.correct); // letter that moved to old position
    let explanation = q.explanation;
    // Replace "B is correct" → "D is correct", "B)" → "D)", etc.
    // Use word-boundary-aware replacement to avoid mangling words like "Both"
    const oldPattern = new RegExp(`(?<=^|[\\s(])${oldLetter}(?=[).:,\\s]|$)`, 'g');
    const newPattern = new RegExp(`(?<=^|[\\s(])${newLetter}(?=[).:,\\s]|$)`, 'g');
    // Two-pass swap via placeholder to avoid collision
    const placeholder = '\x00SWAP\x00';
    explanation = explanation.replace(oldPattern, placeholder);
    explanation = explanation.replace(newPattern, swappedLetter);
    explanation = explanation.replace(new RegExp(placeholder.replace(/\x00/g, '\\x00'), 'g'), newLetter);

    return { ...q, options: newOptions, correct: targetPos, explanation };
  });
}

/** Build a shuffled sequence of positions [0,1,2,3,...] that distributes evenly */
function buildTargetPositions(count: number): number[] {
  const base = Math.floor(count / 4);
  const remainder = count % 4;
  const bonusOrder = shufflePositions([0, 1, 2, 3]);
  const quotas = new Map<number, number>(
    [0, 1, 2, 3].map(position => [position, base]),
  );

  for (let i = 0; i < remainder; i++) {
    const position = bonusOrder[i];
    quotas.set(position, (quotas.get(position) ?? 0) + 1);
  }

  const positions: number[] = [];
  while (positions.length < count) {
    const round = shufflePositions([0, 1, 2, 3]);
    for (const position of round) {
      const remaining = quotas.get(position) ?? 0;
      if (remaining <= 0) continue;
      positions.push(position);
      quotas.set(position, remaining - 1);
      if (positions.length === count) {
        break;
      }
    }
  }

  return positions;
}

function shufflePositions(values: number[]): number[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
  const cleaned = normalizeAnswer(userAnswer);
  if (!cleaned) return false;

  return acceptableAnswers.some(ans => {
    const target = normalizeAnswer(ans);
    if (!target) return false;
    if (cleaned === target) return true;
    if (cleaned.split(' ').length !== target.split(' ').length) return false;

    // Tighten the threshold for short answers to reduce false positives,
    // while still tolerating obvious typos on longer terms.
    const maxDist =
      target.length <= 4
        ? 0
        : target.length <= 8
          ? 1
          : Math.min(2, Math.max(1, Math.floor(target.length * 0.15)));
    if (Math.abs(cleaned.length - target.length) > maxDist) return false;
    if (target.length <= 8 && cleaned[0] !== target[0]) return false;

    return levenshtein(cleaned, target) <= maxDist;
  });
}

function normalizeAnswer(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');
}
