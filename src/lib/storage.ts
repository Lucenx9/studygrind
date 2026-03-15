import { set as idbSet, del as idbDel, entries as idbEntries, clear as idbClear } from 'idb-keyval';
import type { Topic, Question, ReviewSession, DailyActivity, Settings, ChatHistory } from './types';

const KEYS = {
  topics: 'studygrind_topics',
  questions: 'studygrind_questions',
  sessions: 'studygrind_sessions',
  activities: 'studygrind_activities',
  settings: 'studygrind_settings',
  chatHistories: 'studygrind_chat_histories',
} as const;

// ---------------------------------------------------------------------------
// In-memory cache — synchronous reads, IndexedDB persistence
// Strategy B: cache serves reads, IndexedDB is source of truth after init
// ---------------------------------------------------------------------------

const cache = new Map<string, unknown>();
let initialized = false;

/** Must be called and awaited before React renders (in main.tsx) */
export async function initStorage(): Promise<void> {
  if (initialized) return;

  // 1. Load everything from IndexedDB into cache
  try {
    const allEntries = await idbEntries();
    for (const [key, value] of allEntries) {
      if (typeof key === 'string') {
        cache.set(key, value);
      }
    }
  } catch {
    // IndexedDB unavailable — fall through to localStorage migration
  }

  // 2. Migrate localStorage data into IndexedDB (first-time or fallback)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('studygrind_') && !cache.has(key)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const value = JSON.parse(raw, (k, v) => {
              if ((k === 'due' || k === 'last_review') && typeof v === 'string') {
                return new Date(v);
              }
              return v;
            });
            cache.set(key, value);
            idbSet(key, value).catch(() => {});
          }
        } catch {
          // skip non-JSON values
        }
      }
    }
  } catch {
    // localStorage unavailable — rely on IndexedDB/in-memory cache only
  }

  initialized = true;
}

function notifyStorageChange(): void {
  window.dispatchEvent(new Event('studygrind:data-changed'));
}

function get<T>(key: string, fallback: T): T {
  if (initialized) {
    const value = cache.get(key);
    return (value !== undefined ? value : fallback) as T;
  }
  // Pre-init fallback: read from localStorage (only during app bootstrap)
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw, (k, v) => {
      if ((k === 'due' || k === 'last_review') && typeof v === 'string') {
        return new Date(v);
      }
      return v;
    }) as T;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): boolean {
  try {
    // Update in-memory cache immediately (synchronous)
    cache.set(key, value);
    notifyStorageChange();

    // Persist to IndexedDB (fire-and-forget)
    idbSet(key, value).catch(error => {
      console.error('IndexedDB write failed:', error);
      window.dispatchEvent(new CustomEvent('studygrind:storage-error', {
        detail: { message: 'Unable to persist data. Storage may be full.' },
      }));
    });

    // Also write to localStorage as fallback (best-effort, may fail on quota)
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage full — IndexedDB is the primary store now, this is fine
    }

    return true;
  } catch (error) {
    console.error('Storage write failed:', error);
    return false;
  }
}

function remove(key: string): boolean {
  try {
    cache.delete(key);
    notifyStorageChange();
    idbDel(key).catch(() => {});
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}

// Topics
export function getTopics(): Topic[] {
  return get<Topic[]>(KEYS.topics, []);
}

export function saveTopic(topic: Topic): boolean {
  const topics = getTopics();
  const idx = topics.findIndex(t => t.id === topic.id);
  if (idx >= 0) topics[idx] = topic;
  else topics.push(topic);
  return set(KEYS.topics, topics);
}

export function deleteTopic(topicId: string): boolean {
  const topicsOk = set(KEYS.topics, getTopics().filter(t => t.id !== topicId));
  const questionsOk = set(KEYS.questions, getQuestions().filter(q => q.topicId !== topicId));
  return topicsOk && questionsOk;
}

// Questions
export function getQuestions(): Question[] {
  return get<Question[]>(KEYS.questions, []);
}

export function getQuestionsByTopic(topicId: string): Question[] {
  return getQuestions().filter(q => q.topicId === topicId);
}

export function saveQuestions(questions: Question[]): boolean {
  const existing = getQuestions();
  const existingIds = new Set(existing.map(q => q.id));
  const newQs = questions.filter(q => !existingIds.has(q.id));
  return set(KEYS.questions, [...existing, ...newQs]);
}

export function replaceQuestionsForTopic(topicId: string, questions: Question[]): boolean {
  const nextQuestions = getQuestions().filter(q => q.topicId !== topicId);
  return set(KEYS.questions, [...nextQuestions, ...questions]);
}

export function updateQuestion(question: Question): boolean {
  const questions = getQuestions();
  const idx = questions.findIndex(q => q.id === question.id);
  if (idx >= 0) {
    questions[idx] = question;
    return set(KEYS.questions, questions);
  }
  return false;
}

// Review sessions
export function getSessions(): ReviewSession[] {
  return get<ReviewSession[]>(KEYS.sessions, []);
}

export function saveSession(session: ReviewSession): boolean {
  const sessions = getSessions();
  sessions.push(session);
  return set(KEYS.sessions, sessions);
}

export function saveSessionsBulk(sessions: ReviewSession[]): boolean {
  const existing = getSessions();
  const byId = new Map(existing.map(session => [session.id, session]));

  for (const session of sessions) {
    byId.set(session.id, session);
  }

  return set(KEYS.sessions, Array.from(byId.values()));
}

// Daily activity
export function getActivities(): DailyActivity[] {
  return get<DailyActivity[]>(KEYS.activities, []);
}

export function recordActivity(date: string, questionsReviewed: number, accuracy: number): boolean {
  const activities = getActivities();
  const idx = activities.findIndex(a => a.date === date);
  if (idx >= 0) {
    activities[idx].questionsReviewed += questionsReviewed;
    // Rolling average
    const total = activities[idx].questionsReviewed;
    const prev = activities[idx].accuracy * (total - questionsReviewed);
    activities[idx].accuracy = (prev + accuracy * questionsReviewed) / total;
  } else {
    activities.push({ date, questionsReviewed, accuracy });
  }
  return set(KEYS.activities, activities);
}

// Settings
export function getSettings(): Settings {
  return get<Settings>(KEYS.settings, {
    provider: null,
    language: 'it',
    theme: 'dark',
    questionsPerGeneration: 15,
  });
}

export function saveSettings(settings: Settings): boolean {
  return set(KEYS.settings, settings);
}

// Chat histories
export function getChatHistories(): ChatHistory[] {
  return get<ChatHistory[]>(KEYS.chatHistories, []);
}

export function getChatHistory(questionId: string): ChatHistory | null {
  return getChatHistories().find(h => h.questionId === questionId) ?? null;
}

export function saveChatHistory(history: ChatHistory): boolean {
  const histories = getChatHistories();
  const idx = histories.findIndex(h => h.questionId === history.questionId);
  if (idx >= 0) histories[idx] = history;
  else histories.push(history);
  return set(KEYS.chatHistories, histories);
}

export function saveChatHistoriesBulk(histories: ChatHistory[]): boolean {
  const existing = getChatHistories();
  const byQuestionId = new Map(existing.map(history => [history.questionId, history]));

  for (const history of histories) {
    byQuestionId.set(history.questionId, history);
  }

  return set(KEYS.chatHistories, Array.from(byQuestionId.values()));
}

export function replaceChatHistoriesForTopic(topicId: string, histories: ChatHistory[]): boolean {
  const nextHistories = getChatHistories().filter(history => history.topicId !== topicId);
  return set(KEYS.chatHistories, [...nextHistories, ...histories]);
}

export function mergeActivities(activitiesToMerge: DailyActivity[]): boolean {
  const activities = getActivities();

  for (const incoming of activitiesToMerge) {
    const idx = activities.findIndex(activity => activity.date === incoming.date);
    if (idx >= 0) {
      const existing = activities[idx];
      const totalQuestions = existing.questionsReviewed + incoming.questionsReviewed;
      activities[idx] = {
        date: existing.date,
        questionsReviewed: totalQuestions,
        accuracy:
          totalQuestions > 0
            ? (
                existing.accuracy * existing.questionsReviewed +
                incoming.accuracy * incoming.questionsReviewed
              ) / totalQuestions
            : 0,
      };
    } else {
      activities.push(incoming);
    }
  }

  activities.sort((a, b) => a.date.localeCompare(b.date));
  return set(KEYS.activities, activities);
}

// Clear all
export function clearAllData(): boolean {
  const keysCleared = Object.values(KEYS).every(remove);
  idbClear().catch(() => {});
  return keysCleared;
}
