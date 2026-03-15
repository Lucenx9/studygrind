import { getTopics, getQuestions, getSessions, getActivities, getChatHistories } from './storage';
import type { Topic, Question, ReviewSession, DailyActivity, ChatHistory } from './types';

const MAX_IMPORT_SIZE = 50 * 1024 * 1024; // 50MB

export interface StudygrindExport {
  version: 1;
  exportedAt: string;
  topics: Topic[];
  questions: Question[];
  sessions: ReviewSession[];
  chatHistories: ChatHistory[];
  dailyActivity: DailyActivity[];
}

export function buildExportData(topicId?: string): StudygrindExport {
  const allTopics = getTopics();
  const allQuestions = getQuestions();
  const allSessions = getSessions();
  const allActivities = getActivities();
  const allChats = getChatHistories();

  if (topicId) {
    const topics = allTopics.filter(t => t.id === topicId);
    const questions = allQuestions.filter(q => q.topicId === topicId);
    const questionIds = new Set(questions.map(q => q.id));
    const sessions = allSessions.filter(s =>
      s.ratings.some(r => questionIds.has(r.questionId))
    );
    const chats = allChats.filter(c => c.topicId === topicId);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      topics,
      questions,
      sessions,
      chatHistories: chats,
      dailyActivity: allActivities,
    };
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    topics: allTopics,
    questions: allQuestions,
    sessions: allSessions,
    chatHistories: allChats,
    dailyActivity: allActivities,
  };
}

export function downloadAsJson(data: StudygrindExport, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // Delay revocation — revoking immediately can race with async download initiation
  // (Chromium bug #827932, Firefox bug #1282407)
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export interface ImportPreview {
  data: StudygrindExport;
  topicCount: number;
  questionCount: number;
  sessionCount: number;
  duplicateTopics: string[];
}

export async function parseImportFile(file: File): Promise<ImportPreview> {
  if (file.size > MAX_IMPORT_SIZE) {
    throw new Error('File is too large (max 50MB).');
  }

  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Invalid JSON file.');
  }

  validateImport(data);

  // Revive and validate Date objects in FSRS cards
  for (const q of data.questions) {
    if (q.fsrsCard) {
      q.fsrsCard.due = reviveDate(q.fsrsCard.due);
      q.fsrsCard.last_review = reviveDate(q.fsrsCard.last_review);
    }
  }

  const existingTopics = getTopics();
  const existingNames = new Set(existingTopics.map(t => t.name));
  const duplicateTopics = data.topics
    .filter(t => existingNames.has(t.name))
    .map(t => t.name);

  return {
    data,
    topicCount: data.topics.length,
    questionCount: data.questions.length,
    sessionCount: data.sessions.length,
    duplicateTopics,
  };
}

function reviveDate(value: unknown): Date {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  // Fallback: if date is invalid, return now (card becomes immediately due)
  return new Date();
}

function validateImport(data: unknown): asserts data is StudygrindExport {
  if (!isRecord(data)) {
    throw new Error('Invalid file format.');
  }

  const d = data;

  if (d.version !== 1) {
    throw new Error('Unsupported export version. Expected version 1.');
  }
  if (typeof d.exportedAt !== 'string') {
    throw new Error('Invalid file: missing export timestamp.');
  }

  if (!Array.isArray(d.topics)) {
    throw new Error('Invalid file: missing topics array.');
  }

  if (!Array.isArray(d.questions)) {
    throw new Error('Invalid file: missing questions array.');
  }

  // Ensure sessions and other arrays exist or default them
  if (!Array.isArray(d.sessions)) {
    d.sessions = [];
  }
  if (!Array.isArray(d.chatHistories)) {
    d.chatHistories = [];
  }
  if (!Array.isArray(d.dailyActivity)) {
    d.dailyActivity = [];
  }
  const sessions = d.sessions as unknown[];
  const chatHistories = d.chatHistories as unknown[];
  const dailyActivity = d.dailyActivity as unknown[];

  const topicIds = new Set<string>();
  // Validate topics
  for (const topic of d.topics) {
    if (
      !isRecord(topic) ||
      typeof topic.id !== 'string' ||
      typeof topic.name !== 'string' ||
      typeof topic.notes !== 'string' ||
      typeof topic.createdAt !== 'string' ||
      !isNonNegativeInteger(topic.questionCount) ||
      (topic.customInstructions !== undefined && typeof topic.customInstructions !== 'string')
    ) {
      throw new Error('Invalid file: topics are missing required fields (id, name).');
    }
    topicIds.add(topic.id);
  }

  const questionIds = new Set<string>();
  // Validate questions with FSRS card structure and semantic integrity
  for (const question of d.questions) {
    if (
      !isRecord(question) ||
      typeof question.id !== 'string' ||
      typeof question.topicId !== 'string' ||
      typeof question.question !== 'string' ||
      typeof question.explanation !== 'string' ||
      !isNonNegativeInteger(question.timesReviewed) ||
      !isNonNegativeInteger(question.timesCorrect) ||
      question.timesCorrect > question.timesReviewed
    ) {
      throw new Error('Invalid file: questions are missing required fields (id, topicId).');
    }
    if (!topicIds.has(question.topicId)) {
      throw new Error('Invalid file: question references a missing topic.');
    }
    if (!isRecord(question.fsrsCard)) {
      throw new Error('Invalid file: questions are missing FSRS card data.');
    }
    const card = question.fsrsCard;
    if (card.due === undefined || card.state === undefined) {
      throw new Error('Invalid file: FSRS card is missing required fields (due, state).');
    }
    // Semantic validation: FSRS state must be 0-3
    if (typeof card.state === 'number' && (card.state < 0 || card.state > 3)) {
      throw new Error('Invalid file: FSRS card state out of range (expected 0-3).');
    }
    if (typeof question.type !== 'string' || (question.type !== 'mcq' && question.type !== 'cloze')) {
      throw new Error('Invalid file: question type must be "mcq" or "cloze".');
    }
    // Semantic validation: MCQ correct index must be within options bounds
    if (question.type === 'mcq') {
      const options = question.options;
      const correct = question.correct;
      if (!isNonEmptyStringArray(options) || options.length < 2) {
        throw new Error('Invalid file: MCQ question must have at least 2 options.');
      }
      if (typeof correct !== 'number' || correct < 0 || correct >= options.length) {
        throw new Error('Invalid file: MCQ correct answer index out of bounds.');
      }
      if (new Set(options.map(option => option.trim().toLocaleLowerCase())).size !== options.length) {
        throw new Error('Invalid file: MCQ question contains duplicate options.');
      }
    }
    // Semantic validation: cloze must have non-empty acceptable answers
    if (question.type === 'cloze') {
      const answers = question.acceptableAnswers ?? question.acceptable_answers;
      if (!isNonEmptyStringArray(answers)) {
        throw new Error('Invalid file: cloze question must have at least one acceptable answer.');
      }
    }
    questionIds.add(question.id);
  }

  for (const session of sessions) {
    if (
      !isRecord(session) ||
      typeof session.id !== 'string' ||
      typeof session.date !== 'string' ||
      !isNonNegativeInteger(session.totalQuestions) ||
      !isNonNegativeInteger(session.correctAnswers) ||
      session.correctAnswers > session.totalQuestions ||
      !isNonNegativeInteger(session.durationSeconds) ||
      !Array.isArray(session.ratings)
    ) {
      throw new Error('Invalid file: session data is malformed.');
    }

    for (const rating of session.ratings) {
      if (
        !isRecord(rating) ||
        typeof rating.questionId !== 'string' ||
        !questionIds.has(rating.questionId) ||
        typeof rating.correct !== 'boolean' ||
        (rating.rating !== 1 && rating.rating !== 2 && rating.rating !== 3 && rating.rating !== 4)
      ) {
        throw new Error('Invalid file: session ratings are malformed.');
      }
    }
  }

  for (const history of chatHistories) {
    if (
      !isRecord(history) ||
      typeof history.questionId !== 'string' ||
      typeof history.topicId !== 'string' ||
      !questionIds.has(history.questionId) ||
      !topicIds.has(history.topicId) ||
      (history.socraticLevel !== 1 && history.socraticLevel !== 2 && history.socraticLevel !== 3) ||
      !Array.isArray(history.messages)
    ) {
      throw new Error('Invalid file: chat history is malformed.');
    }

    for (const message of history.messages) {
      if (
        !isRecord(message) ||
        (message.role !== 'user' && message.role !== 'assistant') ||
        typeof message.content !== 'string' ||
        typeof message.timestamp !== 'string' ||
        (message.isQuestion !== undefined && typeof message.isQuestion !== 'boolean')
      ) {
        throw new Error('Invalid file: chat messages are malformed.');
      }
    }
  }

  for (const activity of dailyActivity) {
    if (
      !isRecord(activity) ||
      typeof activity.date !== 'string' ||
      !isNonNegativeInteger(activity.questionsReviewed) ||
      !isUnitInterval(activity.accuracy)
    ) {
      throw new Error('Invalid file: daily activity is malformed.');
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim().length > 0);
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}
