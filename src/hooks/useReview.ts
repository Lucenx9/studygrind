import { useState, useCallback, useRef } from 'react';
import type { Question } from '@/lib/types';
import type { Card as FSRSCard } from 'ts-fsrs';
import { getDueQuestions, rateQuestion } from '@/lib/fsrs';
import type { Grade } from '@/lib/fsrs';
import { getQuestions, updateQuestion, saveSession, recordActivity } from '@/lib/storage';
import { v4 as uuid } from 'uuid';

const SESSION_KEY = 'studygrind_active_session';

interface SavedSession {
  questionIds: string[];
  currentIndex: number;
  correctCount: number;
  results: QuestionResult[];
  ratings: ReviewState['ratings'];
  startTime: number;
}

function saveActiveSession(data: SavedSession | null): void {
  if (data) localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  else localStorage.removeItem(SESSION_KEY);
}

function loadActiveSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as SavedSession : null;
  } catch { return null; }
}

interface UndoEntry {
  previousCardState: FSRSCard;
  questionId: string;
  previousState: ReviewState;
}

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
  const undoStack = useRef<UndoEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);
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

    // Check for an in-progress session to resume
    const saved = loadActiveSession();
    if (saved && saved.currentIndex < saved.questionIds.length) {
      // Rebuild due questions from saved IDs (in original order)
      const questionMap = new Map(allQuestions.map(q => [q.id, q]));
      const savedQuestions = saved.questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is Question => q !== undefined);

      if (savedQuestions.length === saved.questionIds.length) {
        startTime.current = saved.startTime;
        setSummary(null);
        setState({
          phase: 'question',
          dueQuestions: savedQuestions,
          currentIndex: saved.currentIndex,
          correctCount: saved.correctCount,
          ratings: saved.ratings,
          results: saved.results,
          userAnswer: null,
          isCorrect: null,
        });
        return savedQuestions;
      }
    }

    // No saved session — start fresh
    saveActiveSession(null);
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
    setState(prev => {
      // Save session start
      saveActiveSession({
        questionIds: prev.dueQuestions.map(q => q.id),
        currentIndex: 0,
        correctCount: 0,
        results: new Array(prev.dueQuestions.length).fill(null),
        ratings: [],
        startTime: startTime.current,
      });
      return {
        ...prev,
        phase: 'question',
        currentIndex: 0,
        correctCount: 0,
        ratings: [],
        results: new Array(prev.dueQuestions.length).fill(null),
        userAnswer: null,
        isCorrect: null,
      };
    });
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

  const rate = useCallback((rating: Grade) => {
    setState(prev => {
      const current = prev.dueQuestions[prev.currentIndex];
      if (!current) return prev;

      // Save undo entry before modifying
      undoStack.current.push({
        previousCardState: { ...current.fsrsCard },
        questionId: current.id,
        previousState: { ...prev },
      });
      setCanUndo(true);

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
        saveActiveSession(null); // Clear saved session on completion
      } else {
        // Save progress for session recovery
        saveActiveSession({
          questionIds: prev.dueQuestions.map(q => q.id),
          currentIndex: nextIndex,
          correctCount: prev.correctCount,
          results: prev.results,
          ratings: newRatings,
          startTime: startTime.current,
        });
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

  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;

    // Restore the FSRS card to its previous state
    const question = state.dueQuestions.find(q => q.id === entry.questionId);
    if (question) {
      const restored: Question = {
        ...question,
        fsrsCard: entry.previousCardState,
        timesReviewed: Math.max(0, question.timesReviewed - 1),
        timesCorrect: Math.max(0, question.timesCorrect - (entry.previousState.isCorrect ? 1 : 0)),
      };
      updateQuestion(restored);
    }

    setState(entry.previousState);
    setCanUndo(undoStack.current.length > 0);
  }, [state.dueQuestions]);

  const currentQuestion = state.dueQuestions[state.currentIndex] ?? null;

  return {
    ...state,
    currentQuestion,
    summary,
    canUndo,
    loadDue,
    startSession,
    submitAnswer,
    rate,
    undo,
  };
}
