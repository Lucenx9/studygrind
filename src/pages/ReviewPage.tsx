import { useEffect, useState } from 'react';
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
import { BookOpen, PartyPopper, Play, Upload, Undo2 } from 'lucide-react';
import { getQuestions, getTopics } from '@/lib/storage';
import { getIntervalPreview } from '@/lib/fsrs';
import { t } from '@/lib/i18n';
import type { Settings } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ReviewPageProps {
  onNavigate: (page: 'upload' | 'study' | 'dashboard') => void;
  settings: Settings;
}

export function ReviewPage({ onNavigate, settings }: ReviewPageProps) {
  const review = useReview();
  const chat = useChat(settings);
  const lang = settings.language;
  const [retypeComplete, setRetypeComplete] = useState(false);
  const loadDue = review.loadDue;
  const canUndo = review.canUndo;
  const phase = review.phase;
  const undo = review.undo;
  const currentIndex = review.currentIndex;

  useEffect(() => { setRetypeComplete(false); }, [currentIndex]);
  useEffect(() => { loadDue(); }, [loadDue]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && canUndo && phase === 'question') {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canUndo, phase, undo]);

  const handleOpenChat = () => {
    const question = review.currentQuestion;
    if (!question || review.isCorrect === null) return;
    const topic = getTopics().find((item) => item.id === question.topicId);
    const answerText = question.type === 'mcq' && typeof review.userAnswer === 'number'
      ? question.options[review.userAnswer] ?? String(review.userAnswer)
      : String(review.userAnswer ?? '');
    chat.openChat(question, answerText, review.isCorrect, topic?.notes ?? '', topic?.name ?? '');
  };

  if (review.phase === 'idle') {
    const topics = getTopics();
    const questions = getQuestions();
    const dueByTopic = new Map<string, number>();
    review.dueQuestions.forEach((question) => {
      dueByTopic.set(question.topicId, (dueByTopic.get(question.topicId) ?? 0) + 1);
    });

    if (review.dueQuestions.length === 0) {
      const nextReview = getNextScheduledReviewLabel(questions, lang);
      return (
        <div className="flex min-h-[70vh] items-center justify-center animate-fade-in-up">
          <Card className="w-full max-w-3xl overflow-hidden text-center">
            <CardContent className="flex flex-col items-center gap-6 px-6 py-10 sm:px-10">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(99,102,241,0.1)]">
                <PartyPopper className="h-11 w-11 text-[#fbbf24] animate-celebrate" />
              </div>
              <div className="space-y-2">
                <h2 className="text-[28px] font-bold tracking-[-0.03em]">{t('review.allCaughtUp', lang)}</h2>
                <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground">{t('review.allCaughtUpDesc', lang)}</p>
                <p className="text-sm text-muted-foreground">
                  {lang === 'it'
                    ? `Ottimo ritmo. Il prossimo ripasso stimato è tra ${nextReview}.`
                    : `Strong pace. Your next estimated review is in ${nextReview}.`}
                </p>
              </div>

              <div className="grid w-full gap-3 sm:max-w-2xl sm:grid-cols-3">
                <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-4 text-left">
                  <p className="text-tertiary">{lang === 'it' ? 'Argomenti attivi' : 'Active topics'}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{topics.length}</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-4 text-left">
                  <p className="text-tertiary">{lang === 'it' ? 'Carte monitorate' : 'Tracked cards'}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{questions.length}</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-4 py-4 text-left">
                  <p className="text-tertiary">{lang === 'it' ? 'Prossima finestra' : 'Next window'}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{nextReview}</p>
                </div>
              </div>

              <div className="grid w-full gap-3 sm:max-w-md sm:grid-cols-2">
                <Button variant="outline" size="lg" onClick={() => onNavigate('study')} className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t('review.studyTopic', lang)}
                </Button>
                <Button variant="accent" size="lg" onClick={() => onNavigate('upload')} className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t('review.uploadNotes', lang)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="sg-page-enter space-y-8">
        <div className="space-y-2">
          <h1 className="sg-h1">{t('review.title', lang)}</h1>
          <p className="sg-subtitle">{t('review.subtitle', lang)}</p>
        </div>

        <Card className="overflow-hidden border-[rgba(99,102,241,0.14)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.04))]">
          <CardContent className="space-y-6 px-6 py-7 sm:px-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  {t('review.queueReady', lang)}
                </Badge>
                <div className="space-y-1">
                  <p className="text-5xl font-bold tracking-[-0.05em] tabular-nums text-primary sm:text-6xl">{review.dueQuestions.length}</p>
                  <p className="text-sm text-muted-foreground">{t('review.dueToday', lang)}</p>
                  <p className="max-w-lg text-sm leading-6 text-muted-foreground">{t('review.queueHint', lang)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="accent" onClick={review.startSession} size="lg" className="w-full gap-2 sm:w-auto">
                    <Play className="h-4 w-4" />
                    {t('review.startReview', lang)}
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => onNavigate('dashboard')}>
                    {lang === 'it' ? 'Dashboard' : 'Dashboard'}
                  </Button>
                </div>
              </div>

              {dueByTopic.size > 0 && (
                <div className="rounded-[20px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-tertiary">{t('dash.topics', lang)}</p>
                    <span className="rounded-full border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                      {dueByTopic.size}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {Array.from(dueByTopic.entries()).slice(0, 4).map(([topicId, count]) => {
                      const topic = topics.find((item) => item.id === topicId);
                      return (
                        <div key={topicId} className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] px-3 py-3 text-sm">
                          <span className="truncate">{topic?.name ?? t('common.unknown', lang)}</span>
                          <span className="text-xs font-bold tabular-nums text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
        onGoHome={() => onNavigate('dashboard')}
        onGoMore={() => onNavigate('study')}
      />
    );
  }

  const question = review.currentQuestion;
  if (!question) return null;
  const currentTopic = getTopics().find((topic) => topic.id === question.topicId);

  return (
    <div className={cn('mx-auto max-w-[920px] space-y-6', chat.isOpen && 'xl:mr-[396px]')}>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {t('review.questionOf', lang).replace('{current}', String(review.currentIndex + 1)).replace('{total}', String(review.dueQuestions.length))}
      </div>

      <div className="sticky top-3 z-20 rounded-[20px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-overlay)] px-4 py-4 shadow-[var(--sg-overlay-shadow)] backdrop-blur-2xl">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
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
            {currentTopic && <Badge variant="secondary">{currentTopic.name}</Badge>}
            <Badge variant="outline" className="ml-auto">
              {question.type === 'mcq' ? t('quiz.multipleChoice', lang) : t('quiz.fillBlank', lang)}
            </Badge>
          </div>
          <ProgressBar
            current={review.currentIndex}
            total={review.dueQuestions.length}
            results={review.results}
            label={t('review.questionOf', lang)
              .replace('{current}', String(review.currentIndex + 1))
              .replace('{total}', String(review.dueQuestions.length))}
          />
        </div>
      </div>

      <div className="space-y-5">
        {question.type === 'mcq' ? (
          <McqQuestion
            key={question.id}
            question={question}
            onSubmit={(index, correct) => review.submitAnswer(index, correct)}
            disabled={review.phase === 'feedback'}
            language={lang}
            initialAnswer={review.phase === 'feedback' && typeof review.userAnswer === 'number' ? review.userAnswer : undefined}
          />
        ) : (
          <ClozeQuestion
            key={question.id}
            question={question}
            onSubmit={(answer, correct) => review.submitAnswer(answer, correct)}
            disabled={review.phase === 'feedback'}
            language={lang}
            initialAnswer={review.phase === 'feedback' && typeof review.userAnswer === 'string' ? review.userAnswer : undefined}
            initialCorrect={review.phase === 'feedback' ? review.isCorrect : undefined}
          />
        )}

        {review.phase === 'feedback' && review.isCorrect !== null && (
          <div className="space-y-4">
            <ExplanationCard
              explanation={question.explanation}
              isCorrect={review.isCorrect}
              language={lang}
              onOpenChat={settings.provider ? handleOpenChat : undefined}
              hasChatHistory={chat.hasHistory(question.id)}
            />
            {!review.isCorrect && !retypeComplete && (
              <RetypePrompt
                correctAnswer={question.type === 'mcq' ? question.options[question.correct].replace(/^[[(]?(?:[A-Da-d]|[1-4])(?:[.):\]])?\s*/i, '') : question.acceptableAnswers[0]}
                language={lang}
                onComplete={() => setRetypeComplete(true)}
              />
            )}
            {(review.isCorrect || retypeComplete) && (
              <RatingButtons onRate={review.rate} language={lang} intervals={question ? getIntervalPreview(question.fsrsCard) : undefined} />
            )}
          </div>
        )}
      </div>

      <ChatPanel
        isOpen={chat.isOpen}
        history={chat.history}
        loading={chat.loading}
        canSendMore={chat.canSendMore}
        messagesRemaining={chat.messagesRemaining}
        language={lang}
        onSend={chat.sendMessage}
        onClose={chat.closeChat}
      />
    </div>
  );
}

function getNextScheduledReviewLabel(
  questions: ReturnType<typeof getQuestions>,
  language: Settings['language'],
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
