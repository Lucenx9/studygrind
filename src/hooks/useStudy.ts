import { useState, useCallback } from 'react';
import type { Question } from '@/lib/types';
import { rateQuestion, State } from '@/lib/fsrs';
import type { Grade } from '@/lib/fsrs';
import { getQuestionsByTopic, updateQuestion } from '@/lib/storage';

export type StudyPhase = 'idle' | 'question' | 'feedback';

type QuestionResult = 'correct' | 'wrong' | null;

interface StudyState {
  questions: Question[];
  currentIndex: number;
  phase: StudyPhase;
  userAnswer: string | number | null;
  isCorrect: boolean | null;
  results: QuestionResult[];
}

export function useStudy() {
  const [state, setState] = useState<StudyState>({
    questions: [],
    currentIndex: 0,
    phase: 'idle',
    userAnswer: null,
    isCorrect: null,
    results: [],
  });
  const [countTowardsReview, setCountTowardsReview] = useState(false);

  const loadTopic = useCallback((topicId: string) => {
    const qs = getQuestionsByTopic(topicId);
    qs.sort((a, b) => {
      const stateOrder = { [State.New]: 0, [State.Learning]: 1, [State.Relearning]: 2, [State.Review]: 3 };
      const aOrder = stateOrder[a.fsrsCard.state] ?? 4;
      const bOrder = stateOrder[b.fsrsCard.state] ?? 4;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.fsrsCard.due).getTime() - new Date(b.fsrsCard.due).getTime();
    });
    setState({
      questions: qs,
      currentIndex: 0,
      phase: 'idle',
      userAnswer: null,
      isCorrect: null,
      results: new Array(qs.length).fill(null),
    });
  }, []);

  const start = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: 0,
      phase: 'question',
      userAnswer: null,
      isCorrect: null,
      results: new Array(prev.questions.length).fill(null),
    }));
  }, []);

  const submitAnswer = useCallback((answer: string | number, correct: boolean) => {
    setState(prev => {
      const newResults = [...prev.results];
      newResults[prev.currentIndex] = correct ? 'correct' : 'wrong';
      return {
        ...prev,
        phase: 'feedback',
        userAnswer: answer,
        isCorrect: correct,
        results: newResults,
      };
    });
  }, []);

  const rate = useCallback((rating: Grade) => {
    setState(prev => {
      const current = prev.questions[prev.currentIndex];

      if (countTowardsReview && current) {
        const updatedCard = rateQuestion(current.fsrsCard, rating);
        const updated: Question = {
          ...current,
          fsrsCard: updatedCard,
          timesReviewed: current.timesReviewed + 1,
          timesCorrect: current.timesCorrect + (prev.isCorrect ? 1 : 0),
        };
        updateQuestion(updated);
      }

      const next = prev.currentIndex + 1;
      const isLast = next >= prev.questions.length;

      return {
        ...prev,
        currentIndex: next,
        phase: isLast ? 'idle' : 'question',
        userAnswer: null,
        isCorrect: null,
      };
    });
  }, [countTowardsReview]);

  const currentQuestion = state.questions[state.currentIndex] ?? null;

  return {
    questions: state.questions,
    currentQuestion,
    currentIndex: state.currentIndex,
    phase: state.phase,
    userAnswer: state.userAnswer,
    isCorrect: state.isCorrect,
    results: state.results,
    countTowardsReview,
    setCountTowardsReview,
    loadTopic,
    start,
    submitAnswer,
    rate,
  };
}
