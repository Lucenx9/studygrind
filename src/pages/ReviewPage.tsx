import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { McqQuestion } from '@/components/quiz/McqQuestion';
import { ClozeQuestion } from '@/components/quiz/ClozeQuestion';
import { ExplanationCard } from '@/components/quiz/ExplanationCard';
import { RatingButtons } from '@/components/quiz/RatingButtons';
import { RetypePrompt } from '@/components/quiz/RetypePrompt';
import { SessionSummary } from '@/components/quiz/SessionSummary';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useReview } from '@/hooks/useReview';
import { useChat } from '@/hooks/useChat';
import { GraduationCap, PartyPopper, Undo2 } from 'lucide-react';
import { getTopics } from '@/lib/storage';
import { getIntervalPreview } from '@/lib/fsrs';
import { t } from '@/lib/i18n';
import type { Settings } from '@/lib/types';

interface ReviewPageProps {
  onNavigate: (page: 'upload' | 'study') => void;
  settings: Settings;
}

export function ReviewPage({ onNavigate, settings }: ReviewPageProps) {
  const review = useReview();
  const chat = useChat(settings);
  const lang = settings.language;
  const [retypeComplete, setRetypeComplete] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const loadDue = review.loadDue;
  const canUndo = review.canUndo;
  const phase = review.phase;
  const undo = review.undo;
  const currentIndex = review.currentIndex;

  // Reset retype state when moving to next question
  useEffect(() => {
    setRetypeComplete(false);
  }, [currentIndex]);

  // Auto-scroll to feedback when answer is revealed
  useEffect(() => {
    if (phase === 'feedback' && feedbackRef.current) {
      setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    }
  }, [phase]);

  useEffect(() => {
    loadDue();
  }, [loadDue]);

  // Ctrl+Z undo shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && canUndo && phase === 'question') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canUndo, phase, undo]);

  const handleOpenChat = () => {
    const q = review.currentQuestion;
    if (!q || review.isCorrect === null) return;
    const topic = getTopics().find(t => t.id === q.topicId);
    chat.openChat(q, String(review.userAnswer ?? ''), review.isCorrect, topic?.notes ?? '');
  };

  if (review.phase === 'idle') {
    const topics = getTopics();
    const dueByTopic = new Map<string, number>();
    for (const q of review.dueQuestions) {
      dueByTopic.set(q.topicId, (dueByTopic.get(q.topicId) ?? 0) + 1);
    }

    if (review.dueQuestions.length === 0) {
      return (
        <div className="flex min-h-[68vh] items-center justify-center">
          <Card className="w-full max-w-2xl border-primary/15 bg-card/92 text-center">
            <CardContent className="flex flex-col items-center gap-5 px-6 py-10 sm:px-10">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-yellow-500/12 text-yellow-500">
                <PartyPopper className="h-11 w-11 animate-celebrate" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{t('review.allCaughtUp', lang)}</h2>
                <p className="mx-auto max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{t('review.allCaughtUpDesc', lang)}</p>
              </div>
              <div className="grid w-full gap-3 sm:max-w-md sm:grid-cols-2">
                <Button variant="outline" size="lg" onClick={() => onNavigate('study')}>
                  {t('review.studyTopic', lang)}
                </Button>
                <Button size="lg" onClick={() => onNavigate('upload')}>
                  {t('review.uploadNotes', lang)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t('review.title', lang)}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('review.subtitle', lang)}</p>
            </div>
          </div>
        </div>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/12 via-card/95 to-card/90">
          <CardContent className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-primary/12 text-primary">
                  {t('review.queueReady', lang)}
                </Badge>
                <div className="space-y-2">
                  <p className="text-5xl font-semibold tracking-[-0.05em] text-primary sm:text-6xl">{review.dueQuestions.length}</p>
                  <p className="text-sm font-medium text-muted-foreground">{t('review.dueToday', lang)}</p>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('review.queueHint', lang)}</p>
                </div>
              </div>
              <Button onClick={review.startSession} size="lg" className="w-full sm:w-auto">
                {t('review.startReview', lang)}
              </Button>
            </div>
            {dueByTopic.size > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {Array.from(dueByTopic.entries()).map(([topicId, count]) => {
                  const topic = topics.find(tp => tp.id === topicId);
                  return (
                    <span key={topicId} className="rounded-full border border-primary/10 bg-background/75 px-3 py-1.5 text-xs font-medium text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                      {topic?.name ?? t('common.unknown', lang)}: {count}
                    </span>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (review.phase === 'summary') {
    if (!review.summary) return null;
    return (
      <SessionSummary
        totalQuestions={review.summary.totalQuestions}
        correctAnswers={review.summary.correctAnswers}
        durationSeconds={review.summary.durationSeconds}
        language={lang}
        onClose={() => review.loadDue()}
      />
    );
  }

  const q = review.currentQuestion;
  if (!q) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-0 z-20 mb-6 rounded-[24px] border border-border/70 bg-background/80 px-4 py-4 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.75)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {review.canUndo && review.phase === 'question' && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={review.undo}
              aria-label={t('review.undo', lang)}
              title={t('review.undoShortcut', lang)}
              className="shrink-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <ProgressBar current={review.currentIndex} total={review.dueQuestions.length} results={review.results} />
          </div>
        </div>
      </div>
      <div className="space-y-5">
        {q.type === 'mcq' ? (
          <McqQuestion
            key={q.id}
            question={q}
            onSubmit={(idx, c) => review.submitAnswer(idx, c)}
            disabled={review.phase === 'feedback'}
            language={lang}
            initialAnswer={review.phase === 'feedback' && typeof review.userAnswer === 'number' ? review.userAnswer : undefined}
          />
        ) : (
          <ClozeQuestion
            key={q.id}
            question={q}
            onSubmit={(a, c) => review.submitAnswer(a, c)}
            disabled={review.phase === 'feedback'}
            language={lang}
            initialAnswer={review.phase === 'feedback' && typeof review.userAnswer === 'string' ? review.userAnswer : undefined}
            initialCorrect={review.phase === 'feedback' ? review.isCorrect : undefined}
          />
        )}
        {review.phase === 'feedback' && review.isCorrect !== null && (
          <div ref={feedbackRef} className="space-y-4">
            <ExplanationCard explanation={q.explanation} isCorrect={review.isCorrect} language={lang} onOpenChat={settings.provider ? handleOpenChat : undefined} hasChatHistory={chat.hasHistory(q.id)} />
            {!review.isCorrect && !retypeComplete && (
              <RetypePrompt
                correctAnswer={q.type === 'mcq' ? q.options[q.correct].replace(/^[[(]?(?:[A-Da-d]|[1-4])(?:[.):\]])?\s*/i, '') : q.acceptableAnswers[0]}
                language={lang}
                onComplete={() => setRetypeComplete(true)}
              />
            )}
            {(review.isCorrect || retypeComplete) && (
              <RatingButtons onRate={review.rate} language={lang} intervals={q ? getIntervalPreview(q.fsrsCard) : undefined} />
            )}
          </div>
        )}
      </div>
      <ChatPanel isOpen={chat.isOpen} history={chat.history} loading={chat.loading} canSendMore={chat.canSendMore} language={lang} onSend={chat.sendMessage} onClose={chat.closeChat} />
    </div>
  );
}
