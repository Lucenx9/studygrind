import { useState, useCallback, useRef } from 'react';
import type { Question } from '@/lib/types';
import { getDueQuestions, rateQuestion } from '@/lib/fsrs';
import type { Grade } from '@/lib/fsrs';
import { getQuestions, updateQuestion, saveSession, recordActivity } from '@/lib/storage';
import { v4 as uuid } from 'uuid';

export type ReviewPhase = 'idle' | 'question' | 'feedback' | 'summary';

type QuestionResult = 'correct' | 'wrong' | null;

interface ReviewSummary {
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
}

interface ReviewState {
  phase: ReviewPhase;
  dueQuestions: Question[];
  currentIndex: number;
  correctCount: number;
  ratings: { questionId: string; rating: 1 | 2 | 3 | 4; correct: boolean }[];
  results: QuestionResult[]; // per-question results for segmented progress bar
  userAnswer: string | number | null;
  isCorrect: boolean | null;
}

export function useReview() {
  const startTime = useRef<number>(0);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [state, setState] = useState<ReviewState>({
    phase: 'idle',
    dueQuestions: [],
    currentIndex: 0,
    correctCount: 0,
    ratings: [],
    results: [],
    userAnswer: null,
    isCorrect: null,
  });

  const loadDue = useCallback(() => {
    const allQuestions = getQuestions();
    const due = getDueQuestions(allQuestions);
    setSummary(null);
    setState(prev => ({
      ...prev,
      dueQuestions: due,
      currentIndex: 0,
      phase: 'idle',
      results: new Array(due.length).fill(null),
    }));
    return due;
  }, []);

  const startSession = useCallback(() => {
    startTime.current = Date.now();
    setSummary(null);
    setState(prev => ({
      ...prev,
      phase: 'question',
      currentIndex: 0,
      correctCount: 0,
      ratings: [],
      results: new Array(prev.dueQuestions.length).fill(null),
      userAnswer: null,
      isCorrect: null,
    }));
  }, []);

  const submitAnswer = useCallback((answer: string | number, correct: boolean) => {
    setState(prev => {
      const newResults = [...prev.results];
      newResults[prev.currentIndex] = correct ? 'correct' : 'wrong';
      return {
        ...prev,
        phase: 'feedback' as ReviewPhase,
        userAnswer: answer,
        isCorrect: correct,
        correctCount: correct ? prev.correctCount + 1 : prev.correctCount,
        results: newResults,
      };
    });
  }, []);

  // Use functional setState to avoid stale closure over `state`
  const rate = useCallback((rating: Grade) => {
    setState(prev => {
      const current = prev.dueQuestions[prev.currentIndex];
      if (!current) return prev;

      // Update FSRS card
      const updatedCard = rateQuestion(current.fsrsCard, rating);
      const updatedQuestion: Question = {
        ...current,
        fsrsCard: updatedCard,
        timesReviewed: current.timesReviewed + 1,
        timesCorrect: current.timesCorrect + (prev.isCorrect ? 1 : 0),
      };
      updateQuestion(updatedQuestion);

      const newRatings = [
        ...prev.ratings,
        { questionId: current.id, rating: rating as 1 | 2 | 3 | 4, correct: prev.isCorrect ?? false },
      ];

      const nextIndex = prev.currentIndex + 1;
      const isLast = nextIndex >= prev.dueQuestions.length;

      if (isLast) {
        const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);
        const nextSummary = {
          totalQuestions: prev.dueQuestions.length,
          correctAnswers: prev.correctCount,
          durationSeconds,
        };

        saveSession({
          id: uuid(),
          date: new Date().toISOString(),
          totalQuestions: nextSummary.totalQuestions,
          correctAnswers: nextSummary.correctAnswers,
          ratings: newRatings,
          durationSeconds,
        });

        const today = new Date().toISOString().split('T')[0];
        const accuracy = nextSummary.totalQuestions > 0
          ? nextSummary.correctAnswers / nextSummary.totalQuestions
          : 0;
        recordActivity(today, nextSummary.totalQuestions, accuracy);
        setSummary(nextSummary);
      }

      return {
        ...prev,
        ratings: newRatings,
        phase: isLast ? 'summary' as ReviewPhase : 'question' as ReviewPhase,
        currentIndex: nextIndex,
        userAnswer: null,
        isCorrect: null,
      };
    });
  }, []);

  const currentQuestion = state.dueQuestions[state.currentIndex] ?? null;

  return {
    ...state,
    currentQuestion,
    summary,
    loadDue,
    startSession,
    submitAnswer,
    rate,
  };
}
