import type { Topic, Question, ReviewSession, DailyActivity, Settings, ChatHistory } from './types';

const KEYS = {
  topics: 'studygrind_topics',
  questions: 'studygrind_questions',
  sessions: 'studygrind_sessions',
  activities: 'studygrind_activities',
  settings: 'studygrind_settings',
  chatHistories: 'studygrind_chat_histories',
} as const;

const STORAGE_ERROR =
  'Unable to persist StudyGrind data locally. Browser storage may be unavailable or full.';

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw, (k, v) => {
      // Revive Date objects from FSRS card fields
      if ((k === 'due' || k === 'last_review') && typeof v === 'string') {
        return new Date(v);
      }
      return v;
    }) as T;
  } catch {
    return fallback;
  }
}

function notifyStorageChange(): void {
  window.dispatchEvent(new Event('studygrind:data-changed'));
}

function set<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStorageChange();
    return true;
  } catch (error) {
    console.error(STORAGE_ERROR, error);
    return false;
  }
}

function remove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    notifyStorageChange();
    return true;
  } catch (error) {
    console.error(STORAGE_ERROR, error);
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
  return Object.values(KEYS).every(remove);
}
