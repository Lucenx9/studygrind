import { useState, useCallback, useRef } from 'react';
import type { Question } from '@/lib/types';
import type { Card as FSRSCard } from 'ts-fsrs';
import { getDueQuestions, rateQuestion } from '@/lib/fsrs';
import type { Grade } from '@/lib/fsrs';
import { getQuestions, updateQuestion, saveSession, recordActivity } from '@/lib/storage';
import { toDateKey } from '@/lib/utils';
import { v4 as uuid } from 'uuid';
import { isRecord } from '@/lib/validation';

const SESSION_KEY = 'studygrind_active_session';
const MAX_UNDO_STACK = 50;

interface SavedSession {
  questionIds: string[];
  currentIndex: number;
  correctCount: number;
  results: QuestionResult[];
  ratings: ReviewState['ratings'];
  startTime: number;
  phase: Extract<ReviewPhase, 'question' | 'feedback'>;
  userAnswer: string | number | null;
  isCorrect: boolean | null;
}

function saveActiveSession(data: SavedSession | null): void {
  try {
    if (data) localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    else localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Unable to persist the active review session.', error);
    window.dispatchEvent(new CustomEvent('studygrind:storage-error', {
      detail: { message: 'Unable to persist the active review session.' },
    }));
  }
}

function parseSavedSession(raw: unknown): SavedSession | null {
  if (!isRecord(raw)) return null;

  const candidate = raw;
  const questionIdsRaw = Array.isArray(candidate.questionIds) ? candidate.questionIds : null;
  const resultsRaw = Array.isArray(candidate.results) ? candidate.results : null;
  const ratingsRaw = Array.isArray(candidate.ratings) ? candidate.ratings : null;
  const questionIds = questionIdsRaw
    ? questionIdsRaw.filter((id): id is string => typeof id === 'string')
    : null;
  const results = resultsRaw
    ? resultsRaw.filter(
        (result): result is QuestionResult =>
          result === 'correct' || result === 'wrong' || result === null,
      )
    : null;
  const ratings = ratingsRaw
    ? ratingsRaw.filter(
        (
          rating,
        ): rating is ReviewState['ratings'][number] =>
          !!rating &&
          isRecord(rating) &&
          typeof rating.questionId === 'string' &&
          typeof rating.correct === 'boolean' &&
          (rating.rating === 1 || rating.rating === 2 || rating.rating === 3 || rating.rating === 4),
      )
    : null;

  if (
    !questionIds ||
    !results ||
    !ratings ||
    questionIdsRaw === null ||
    resultsRaw === null ||
    ratingsRaw === null ||
    questionIds.length !== questionIdsRaw.length ||
    results.length !== resultsRaw.length ||
    ratings.length !== ratingsRaw.length ||
    typeof candidate.currentIndex !== 'number' ||
    !Number.isInteger(candidate.currentIndex) ||
    candidate.currentIndex < 0 ||
    typeof candidate.correctCount !== 'number' ||
    !Number.isInteger(candidate.correctCount) ||
    candidate.correctCount < 0 ||
    typeof candidate.startTime !== 'number' ||
    !Number.isFinite(candidate.startTime)
  ) {
    return null;
  }

  const phase = candidate.phase === 'feedback' ? 'feedback' : 'question';
  const userAnswer =
    candidate.userAnswer === null ||
    typeof candidate.userAnswer === 'string' ||
    typeof candidate.userAnswer === 'number'
      ? candidate.userAnswer
      : null;
  const isCorrect =
    candidate.isCorrect === null || typeof candidate.isCorrect === 'boolean'
      ? candidate.isCorrect
      : null;

  return {
    questionIds,
    currentIndex: candidate.currentIndex,
    correctCount: candidate.correctCount,
    results,
    ratings,
    startTime: candidate.startTime,
    phase,
    userAnswer,
    isCorrect,
  };
}

function loadActiveSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? parseSavedSession(JSON.parse(raw)) : null;
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

  const resetUndoState = useCallback(() => {
    undoStack.current = [];
    setCanUndo(false);
  }, []);

  const loadDue = useCallback(() => {
    const allQuestions = getQuestions();
    const due = getDueQuestions(allQuestions);
    resetUndoState();

    // Check for an in-progress session to resume
    const saved = loadActiveSession();
    if (saved && saved.currentIndex < saved.questionIds.length) {
      const questionMap = new Map(allQuestions.map(q => [q.id, q]));
      const validSet = new Set(
        saved.questionIds.filter(id => questionMap.has(id)),
      );

      if (validSet.size > 0) {
        const savedQuestions = saved.questionIds
          .filter(id => validSet.has(id))
          .map(id => questionMap.get(id))
          .filter((question): question is Question => question !== undefined);

        let newIndex = saved.currentIndex;
        let newResults = saved.results;
        let newCorrectCount = saved.correctCount;
        let newRatings = saved.ratings;
        let newPhase = saved.phase;
        let newUserAnswer = saved.userAnswer;
        let newIsCorrect = saved.isCorrect;

        if (validSet.size < saved.questionIds.length) {
          const indexMap: number[] = [];
          saved.questionIds.forEach((id, i) => {
            if (validSet.has(id)) indexMap.push(i);
          });
          newResults = indexMap.map(i => saved.results[i] ?? null);
          newRatings = saved.ratings.filter(r => validSet.has(r.questionId));
          newCorrectCount = newResults.filter(r => r === 'correct').length;

          const oldCurrentId = saved.questionIds[saved.currentIndex];
          if (oldCurrentId && validSet.has(oldCurrentId)) {
            newIndex = indexMap.indexOf(saved.currentIndex);
          } else {
            const nextValid = indexMap.find(i => i >= saved.currentIndex);
            newIndex = nextValid !== undefined ? indexMap.indexOf(nextValid) : savedQuestions.length;
            newPhase = 'question';
            newUserAnswer = null;
            newIsCorrect = null;
          }
        }

        if (newIndex < savedQuestions.length) {
          startTime.current = saved.startTime;
          setSummary(null);
          setState({
            phase: newPhase,
            dueQuestions: savedQuestions,
            currentIndex: newIndex,
            correctCount: newCorrectCount,
            ratings: newRatings,
            results: newResults,
            userAnswer: newUserAnswer,
            isCorrect: newIsCorrect,
          });
          return savedQuestions;
        }
      }
    }

    // No saved session — start fresh
    saveActiveSession(null);
    setSummary(null);
    setState({
      phase: 'idle',
      dueQuestions: due,
      currentIndex: 0,
      correctCount: 0,
      ratings: [],
      results: new Array(due.length).fill(null),
      userAnswer: null,
      isCorrect: null,
    });
    return due;
  }, [resetUndoState]);

  const startSession = useCallback(() => {
    startTime.current = Date.now();
    resetUndoState();
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
        phase: 'question',
        userAnswer: null,
        isCorrect: null,
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
  }, [resetUndoState]);

  const submitAnswer = useCallback((answer: string | number, correct: boolean) => {
    setState(prev => {
      const newResults = [...prev.results];
      newResults[prev.currentIndex] = correct ? 'correct' : 'wrong';
      const nextCorrectCount = correct ? prev.correctCount + 1 : prev.correctCount;

      saveActiveSession({
        questionIds: prev.dueQuestions.map(q => q.id),
        currentIndex: prev.currentIndex,
        correctCount: nextCorrectCount,
        results: newResults,
        ratings: prev.ratings,
        startTime: startTime.current,
        phase: 'feedback',
        userAnswer: answer,
        isCorrect: correct,
      });

      return {
        ...prev,
        phase: 'feedback',
        userAnswer: answer,
        isCorrect: correct,
        correctCount: nextCorrectCount,
        results: newResults,
      };
    });
  }, []);

  const rate = useCallback((rating: Grade) => {
    setState(prev => {
      const current = prev.dueQuestions[prev.currentIndex];
      if (!current) return prev;

      // Save undo entry before modifying
      undoStack.current = [
        ...undoStack.current.slice(-MAX_UNDO_STACK + 1),
        {
          previousCardState: { ...current.fsrsCard },
          questionId: current.id,
          previousState: { ...prev },
        },
      ];
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

        const today = toDateKey(new Date());
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
          phase: 'question',
          userAnswer: null,
          isCorrect: null,
        });
      }

      return {
        ...prev,
        ratings: newRatings,
        phase: isLast ? 'summary' : 'question',
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

    saveActiveSession({
      questionIds: entry.previousState.dueQuestions.map(q => q.id),
      currentIndex: entry.previousState.currentIndex,
      correctCount: entry.previousState.correctCount,
      results: entry.previousState.results,
      ratings: entry.previousState.ratings,
      startTime: startTime.current,
      phase: entry.previousState.phase === 'feedback' ? 'feedback' : 'question',
      userAnswer: entry.previousState.userAnswer,
      isCorrect: entry.previousState.isCorrect,
    });
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
