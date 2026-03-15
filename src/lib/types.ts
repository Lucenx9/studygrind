import type { Card as FSRSCard } from 'ts-fsrs';

// --- Provider types ---
export type AuthMethod = 'openrouter' | 'oauth' | 'direct';
export type OAuthProvider = 'openai' | 'google' | 'anthropic';
export type DirectProvider = 'openai' | 'anthropic' | 'google';

export interface OpenRouterConfig {
  method: 'openrouter';
  apiKey: string;
  model: string;
}

export interface OAuthConfig {
  method: 'oauth';
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  email?: string;
  model: string;
}

export interface DirectKeyConfig {
  method: 'direct';
  provider: DirectProvider;
  apiKey: string;
  model: string;
}

export type ProviderConfig = OpenRouterConfig | OAuthConfig | DirectKeyConfig;

// --- App types ---

export interface Topic {
  id: string;
  name: string;
  notes: string;
  customInstructions?: string;
  createdAt: string;
  questionCount: number;
}

// Base question type
export interface BaseQuestion {
  id: string;
  topicId: string;
  explanation: string;
  fsrsCard: FSRSCard;
  timesReviewed: number;
  timesCorrect: number;
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  question: string;
  options: string[];
  correct: number;
}

export interface ClozeQuestion extends BaseQuestion {
  type: 'cloze';
  question: string;
  acceptableAnswers: string[];
}

export type Question = McqQuestion | ClozeQuestion;

export interface ReviewSession {
  id: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  ratings: { questionId: string; rating: 1 | 2 | 3 | 4; correct: boolean }[];
  durationSeconds: number;
}

export interface DailyActivity {
  date: string;
  questionsReviewed: number;
  accuracy: number;
}

export interface Settings {
  provider: ProviderConfig | null;
  language: 'it' | 'en';
  theme: 'dark' | 'light';
  questionsPerGeneration: number;
}

// --- LLM response types ---

export interface McqRaw {
  type: 'mcq';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface ClozeRaw {
  type: 'cloze';
  question: string;
  acceptable_answers: string[];
  explanation: string;
}

export type QuestionRaw = McqRaw | ClozeRaw;

// --- Chat types ---

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isQuestion?: boolean;
}

export interface ChatHistory {
  questionId: string;
  topicId: string;
  messages: ChatMessage[];
  socraticLevel: 1 | 2 | 3;
}
