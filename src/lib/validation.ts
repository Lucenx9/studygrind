import { safeCard } from './fsrs'
import type { Card, CardInput } from 'ts-fsrs'
import type {
  ChatHistory,
  ChatMessage,
  DailyActivity,
  DirectProvider,
  ProviderConfig,
  Question,
  ReviewSession,
  Settings,
  Topic,
} from './types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

function isLanguage(value: unknown): value is Settings['language'] {
  return value === 'it' || value === 'en'
}

function isTheme(value: unknown): value is Settings['theme'] {
  return value === 'dark' || value === 'light'
}

function isCardLike(value: unknown): value is Card | CardInput {
  if (!isRecord(value)) return false

  return (
    value.due !== undefined &&
    typeof value.state === 'number' &&
    typeof value.stability === 'number' &&
    typeof value.difficulty === 'number' &&
    typeof value.elapsed_days === 'number' &&
    typeof value.scheduled_days === 'number' &&
    typeof value.learning_steps === 'number' &&
    typeof value.reps === 'number' &&
    typeof value.lapses === 'number'
  )
}

function isDirectProvider(value: unknown): value is DirectProvider {
  return value === 'openai' || value === 'anthropic' || value === 'google'
}

function sanitizeProviderConfig(value: unknown): ProviderConfig | null {
  if (!isRecord(value) || typeof value.method !== 'string' || typeof value.model !== 'string') {
    return null
  }

  if (value.method === 'openrouter') {
    return typeof value.apiKey === 'string'
      ? {
          method: 'openrouter',
          apiKey: value.apiKey,
          model: value.model,
        }
      : null
  }

  if (value.method === 'direct') {
    return isDirectProvider(value.provider) && typeof value.apiKey === 'string'
      ? {
          method: 'direct',
          provider: value.provider,
          apiKey: value.apiKey,
          model: value.model,
        }
      : null
  }

  if (value.method === 'oauth') {
    return isDirectProvider(value.provider) &&
      typeof value.accessToken === 'string' &&
      typeof value.expiresAt === 'string' &&
      (value.refreshToken === undefined || typeof value.refreshToken === 'string') &&
      (value.email === undefined || typeof value.email === 'string')
      ? {
          method: 'oauth',
          provider: value.provider,
          accessToken: value.accessToken,
          refreshToken: value.refreshToken,
          expiresAt: value.expiresAt,
          email: value.email,
          model: value.model,
        }
      : null
  }

  return null
}

export function sanitizeTopic(value: unknown): Topic | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.name) || typeof value.notes !== 'string') {
    return null
  }

  return {
    id: value.id,
    name: value.name.trim(),
    notes: value.notes,
    customInstructions: typeof value.customInstructions === 'string' ? value.customInstructions : undefined,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    questionCount: isNonNegativeInteger(value.questionCount) ? value.questionCount : 0,
  }
}

export function sanitizeTopics(value: unknown): Topic[] | null {
  if (!Array.isArray(value)) return null

  return value
    .map(sanitizeTopic)
    .filter((topic): topic is Topic => topic !== null)
}

export function sanitizeQuestion(value: unknown): Question | null {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.topicId) ||
    !isNonEmptyString(value.question) ||
    typeof value.explanation !== 'string' ||
    !isRecord(value.fsrsCard) ||
    !isCardLike(value.fsrsCard)
  ) {
    return null
  }

  const base = {
    id: value.id,
    topicId: value.topicId,
    question: value.question.trim(),
    explanation: value.explanation.trim(),
    fsrsCard: safeCard(value.fsrsCard),
    timesReviewed: isNonNegativeInteger(value.timesReviewed) ? value.timesReviewed : 0,
    timesCorrect: isNonNegativeInteger(value.timesCorrect) ? value.timesCorrect : 0,
  }

  if (value.type === 'mcq') {
    if (!Array.isArray(value.options)) return null

    const options = value.options
      .filter((option): option is string => typeof option === 'string')
      .map(option => option.trim())
      .filter(Boolean)

    if (options.length !== 4 || typeof value.correct !== 'number' || !Number.isInteger(value.correct) || value.correct < 0 || value.correct >= options.length) {
      return null
    }

    return {
      ...base,
      type: 'mcq',
      options,
      correct: value.correct,
    }
  }

  if (value.type !== 'cloze') {
    return null
  }

  const acceptableAnswersSource = Array.isArray(value.acceptableAnswers)
    ? value.acceptableAnswers
    : Array.isArray(value.acceptable_answers)
      ? value.acceptable_answers
      : null

  if (!acceptableAnswersSource) return null

  const acceptableAnswers = Array.from(
    new Set(
      acceptableAnswersSource
        .filter((answer): answer is string => typeof answer === 'string')
        .map(answer => answer.trim())
        .filter(Boolean),
    ),
  )

  if (acceptableAnswers.length === 0) return null

  return {
    ...base,
    type: 'cloze',
    acceptableAnswers,
  }
}

export function sanitizeQuestions(value: unknown): Question[] | null {
  if (!Array.isArray(value)) return null

  return value
    .map(sanitizeQuestion)
    .filter((question): question is Question => question !== null)
}

export function sanitizeReviewSession(value: unknown): ReviewSession | null {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    typeof value.date !== 'string' ||
    !Array.isArray(value.ratings)
  ) {
    return null
  }

  const ratings = value.ratings
    .map(rating => {
      if (
        !isRecord(rating) ||
        !isNonEmptyString(rating.questionId) ||
        typeof rating.correct !== 'boolean' ||
        (rating.rating !== 1 && rating.rating !== 2 && rating.rating !== 3 && rating.rating !== 4)
      ) {
        return null
      }

      return {
        questionId: rating.questionId,
        rating: rating.rating,
        correct: rating.correct,
      }
    })
    .filter((rating): rating is ReviewSession['ratings'][number] => rating !== null)

  const totalQuestions = isNonNegativeInteger(value.totalQuestions) ? value.totalQuestions : ratings.length
  const safeTotalQuestions = Math.max(totalQuestions, ratings.length)
  const safeCorrectAnswers = isNonNegativeInteger(value.correctAnswers)
    ? Math.min(value.correctAnswers, safeTotalQuestions)
    : ratings.filter(rating => rating.correct).length

  return {
    id: value.id,
    date: value.date,
    totalQuestions: safeTotalQuestions,
    correctAnswers: safeCorrectAnswers,
    ratings,
    durationSeconds: isNonNegativeInteger(value.durationSeconds) ? value.durationSeconds : 0,
  }
}

export function sanitizeReviewSessions(value: unknown): ReviewSession[] | null {
  if (!Array.isArray(value)) return null

  return value
    .map(sanitizeReviewSession)
    .filter((session): session is ReviewSession => session !== null)
}

export function sanitizeDailyActivity(value: unknown): DailyActivity | null {
  if (!isRecord(value) || typeof value.date !== 'string') {
    return null
  }

  return {
    date: value.date,
    questionsReviewed: isNonNegativeInteger(value.questionsReviewed) ? value.questionsReviewed : 0,
    accuracy: isUnitInterval(value.accuracy) ? value.accuracy : 0,
  }
}

export function sanitizeDailyActivities(value: unknown): DailyActivity[] | null {
  if (!Array.isArray(value)) return null

  return value
    .map(sanitizeDailyActivity)
    .filter((activity): activity is DailyActivity => activity !== null)
}

export function sanitizeSettings(value: unknown): Settings | null {
  if (!isRecord(value)) return null

  return {
    provider: value.provider === null ? null : sanitizeProviderConfig(value.provider),
    language: isLanguage(value.language) ? value.language : 'it',
    theme: isTheme(value.theme) ? value.theme : 'dark',
    questionsPerGeneration:
      isNonNegativeInteger(value.questionsPerGeneration) &&
      value.questionsPerGeneration >= 5 &&
      value.questionsPerGeneration <= 50
        ? value.questionsPerGeneration
        : 15,
  }
}

export function sanitizeChatMessage(value: unknown): ChatMessage | null {
  if (
    !isRecord(value) ||
    (value.role !== 'user' && value.role !== 'assistant') ||
    typeof value.content !== 'string' ||
    typeof value.timestamp !== 'string' ||
    (value.isQuestion !== undefined && typeof value.isQuestion !== 'boolean')
  ) {
    return null
  }

  return {
    role: value.role,
    content: value.content,
    timestamp: value.timestamp,
    isQuestion: value.isQuestion,
  }
}

export function sanitizeChatHistory(value: unknown): ChatHistory | null {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.questionId) ||
    !isNonEmptyString(value.topicId) ||
    !Array.isArray(value.messages)
  ) {
    return null
  }

  const messages = value.messages
    .map(sanitizeChatMessage)
    .filter((message): message is ChatMessage => message !== null)

  if (messages.length !== value.messages.length) {
    return null
  }

  return {
    questionId: value.questionId,
    topicId: value.topicId,
    messages,
    socraticLevel:
      value.socraticLevel === 1 || value.socraticLevel === 2 || value.socraticLevel === 3
        ? value.socraticLevel
        : 1,
  }
}

export function sanitizeChatHistories(value: unknown): ChatHistory[] | null {
  if (!Array.isArray(value)) return null

  return value
    .map(sanitizeChatHistory)
    .filter((history): history is ChatHistory => history !== null)
}
