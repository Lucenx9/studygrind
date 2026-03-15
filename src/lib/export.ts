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
  const data = JSON.parse(text) as unknown;

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
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid file format.');
  }

  const d = data as Record<string, unknown>;

  if (d.version !== 1) {
    throw new Error('Unsupported export version. Expected version 1.');
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

  // Validate topics
  for (const t of d.topics as Record<string, unknown>[]) {
    if (typeof t.id !== 'string' || typeof t.name !== 'string') {
      throw new Error('Invalid file: topics are missing required fields (id, name).');
    }
  }

  // Validate questions with FSRS card structure and semantic integrity
  for (const q of d.questions as Record<string, unknown>[]) {
    if (typeof q.id !== 'string' || typeof q.topicId !== 'string') {
      throw new Error('Invalid file: questions are missing required fields (id, topicId).');
    }
    if (!q.fsrsCard || typeof q.fsrsCard !== 'object') {
      throw new Error('Invalid file: questions are missing FSRS card data.');
    }
    const card = q.fsrsCard as Record<string, unknown>;
    if (card.due === undefined || card.state === undefined) {
      throw new Error('Invalid file: FSRS card is missing required fields (due, state).');
    }
    // Semantic validation: FSRS state must be 0-3
    if (typeof card.state === 'number' && (card.state < 0 || card.state > 3)) {
      throw new Error('Invalid file: FSRS card state out of range (expected 0-3).');
    }
    if (typeof q.type !== 'string' || (q.type !== 'mcq' && q.type !== 'cloze')) {
      throw new Error('Invalid file: question type must be "mcq" or "cloze".');
    }
    // Semantic validation: MCQ correct index must be within options bounds
    if (q.type === 'mcq') {
      const options = q.options;
      const correct = q.correct;
      if (!Array.isArray(options) || options.length < 2) {
        throw new Error('Invalid file: MCQ question must have at least 2 options.');
      }
      if (typeof correct !== 'number' || correct < 0 || correct >= options.length) {
        throw new Error('Invalid file: MCQ correct answer index out of bounds.');
      }
    }
    // Semantic validation: cloze must have non-empty acceptable answers
    if (q.type === 'cloze') {
      const answers = q.acceptableAnswers ?? q.acceptable_answers;
      if (!Array.isArray(answers) || answers.length === 0) {
        throw new Error('Invalid file: cloze question must have at least one acceptable answer.');
      }
    }
  }
}
