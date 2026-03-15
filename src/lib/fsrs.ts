import { createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import type { Card, Grade } from 'ts-fsrs';
import type { Question } from './types';

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
    const dateStr = date.toISOString().split('T')[0];
    forecast.set(dateStr, 0);
  }

  for (const q of questions) {
    const due = new Date(q.fsrsCard.due);
    const dateStr = due.toISOString().split('T')[0];
    if (forecast.has(dateStr)) {
      forecast.set(dateStr, (forecast.get(dateStr) ?? 0) + 1);
    }
  }

  return forecast;
}

export { Rating, State };
export type { Grade };
