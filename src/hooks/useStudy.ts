import { useState, useCallback } from 'react';
import type { Question } from '@/lib/types';
import { rateQuestion, State } from '@/lib/fsrs';
import type { Grade } from '@/lib/fsrs';
import { getQuestionsByTopic, updateQuestion } from '@/lib/storage';

export type StudyPhase = 'idle' | 'question' | 'feedback';

type QuestionResult = 'correct' | 'wrong' | null;

export function useStudy() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<StudyPhase>('idle');
  const [userAnswer, setUserAnswer] = useState<string | number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [countTowardsReview, setCountTowardsReview] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);

  const loadTopic = useCallback((topicId: string) => {
    const qs = getQuestionsByTopic(topicId);
    qs.sort((a, b) => {
      const stateOrder = { [State.New]: 0, [State.Learning]: 1, [State.Relearning]: 2, [State.Review]: 3 };
      const aOrder = stateOrder[a.fsrsCard.state] ?? 4;
      const bOrder = stateOrder[b.fsrsCard.state] ?? 4;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.fsrsCard.due).getTime() - new Date(b.fsrsCard.due).getTime();
    });
    setQuestions(qs);
    setCurrentIndex(0);
    setPhase('idle');
    setResults(new Array(qs.length).fill(null));
  }, []);

  const start = useCallback(() => {
    setCurrentIndex(0);
    setPhase('question');
    setUserAnswer(null);
    setIsCorrect(null);
    setResults(prev => new Array(prev.length).fill(null));
  }, []);

  const submitAnswer = useCallback((answer: string | number, correct: boolean) => {
    setPhase('feedback');
    setUserAnswer(answer);
    setIsCorrect(correct);
    setResults(prev => {
      // currentIndex is captured correctly here since submitAnswer
      // is only called during 'question' phase before any index change
      const next = [...prev];
      // We need the current index — use a ref or read from state
      return next;
    });
    // Update results separately using currentIndex
    setCurrentIndex(idx => {
      setResults(prev => {
        const next = [...prev];
        next[idx] = correct ? 'correct' : 'wrong';
        return next;
      });
      return idx; // don't change the index
    });
  }, []);

  const rate = useCallback((rating: Grade) => {
    // Read isCorrect from current state via functional update pattern
    setIsCorrect(prevCorrect => {
      setCurrentIndex(prevIndex => {
        setQuestions(prevQuestions => {
          if (countTowardsReview && prevQuestions[prevIndex]) {
            const current = prevQuestions[prevIndex];
            const updatedCard = rateQuestion(current.fsrsCard, rating);
            const updated: Question = {
              ...current,
              fsrsCard: updatedCard,
              timesReviewed: current.timesReviewed + 1,
              timesCorrect: current.timesCorrect + (prevCorrect ? 1 : 0),
            };
            updateQuestion(updated);
          }
          return prevQuestions; // don't change questions array
        });

        const next = prevIndex + 1;
        setQuestions(qs => {
          if (next >= qs.length) {
            setPhase('idle');
          } else {
            setPhase('question');
            setUserAnswer(null);
          }
          return qs;
        });

        return next;
      });

      return null; // reset isCorrect
    });
  }, [countTowardsReview]);

  const currentQuestion = questions[currentIndex] ?? null;

  return {
    questions,
    currentQuestion,
    currentIndex,
    phase,
    userAnswer,
    isCorrect,
    results,
    countTowardsReview,
    setCountTowardsReview,
    loadTopic,
    start,
    submitAnswer,
    rate,
  };
}
