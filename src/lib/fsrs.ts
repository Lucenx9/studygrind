import { createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import type { Card, Grade } from 'ts-fsrs';
import type { Question } from './types';
import { toDateKey } from './utils';

const params = generatorParameters({
  enable_fuzz: true,
  request_retention: 0.9,
  maximum_interval: 365,
});

const scheduler = fsrs(params);

export function createNewCard(): Card {
  return createEmptyCard(new Date());
}

export function getDueQuestions(questions: Question[]): Question[] {
  const now = new Date();
  return questions.filter(q => new Date(q.fsrsCard.due) <= now);
}

export function rateQuestion(card: Card, rating: Grade): Card {
  const now = new Date();
  const result = scheduler.repeat(card, now);
  return result[rating].card;
}

export function getReviewForecast(questions: Question[], days: number): Map<string, number> {
  const forecast = new Map<string, number>();
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    forecast.set(toDateKey(date), 0);
  }

  for (const q of questions) {
    const due = new Date(q.fsrsCard.due);
    const dateStr = toDateKey(due);
    if (forecast.has(dateStr)) {
      forecast.set(dateStr, (forecast.get(dateStr) ?? 0) + 1);
    }
  }

  return forecast;
}

// Preview next review intervals for each rating option (for UI display)
export function getIntervalPreview(card: Card): { again: string; hard: string; good: string; easy: string } {
  const now = new Date();
  const result = scheduler.repeat(card, now);

  function formatInterval(nextDue: Date): string {
    const diffMs = nextDue.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return '<1m';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d`;
    const diffMonths = Math.round(diffDays / 30);
    return `${diffMonths}mo`;
  }

  return {
    again: formatInterval(result[Rating.Again].card.due),
    hard: formatInterval(result[Rating.Hard].card.due),
    good: formatInterval(result[Rating.Good].card.due),
    easy: formatInterval(result[Rating.Easy].card.due),
  };
}

export { Rating, State };
export type { Grade };
