import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Question } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRelativeDate(date: Date, language: 'it' | 'en'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return language === 'it' ? 'Oggi' : 'Today';
  if (diffDays === 1) return language === 'it' ? 'Ieri' : 'Yesterday';
  if (diffDays < 7) return language === 'it' ? `${diffDays} giorni fa` : `${diffDays} days ago`;
  return date.toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short' });
}

const TOPIC_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-lime-500 to-green-500',
];

export function getTopicGradient(name: string): string {
  let hash = 0;
  for (const char of name) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return TOPIC_GRADIENTS[Math.abs(hash) % TOPIC_GRADIENTS.length];
}

export function getNextReviewLabel(
  questions: Pick<Question, 'fsrsCard'>[],
  language: 'it' | 'en',
): string {
  const now = new Date();
  const nextDue = questions
    .map((question) => new Date(question.fsrsCard.due))
    .filter((date) => Number.isFinite(date.getTime()) && date.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!nextDue) {
    return language === 'it' ? 'presto' : 'soon';
  }

  const diffHours = Math.max(1, Math.round((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return language === 'it' ? `${diffHours} ore` : `${diffHours} hours`;
  }

  const diffDays = Math.round(diffHours / 24);
  return language === 'it' ? `${diffDays} giorni` : `${diffDays} days`;
}
