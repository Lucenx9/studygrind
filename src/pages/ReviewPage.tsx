import { useEffect, useState } from 'react';
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
  const loadDue = review.loadDue;
  const canUndo = review.canUndo;
  const phase = review.phase;
  const undo = review.undo;
  const currentIndex = review.currentIndex;

  // Reset retype state when moving to next question
  useEffect(() => {
    setRetypeComplete(false);
  }, [currentIndex]);

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
          <PartyPopper className="h-20 w-20 text-yellow-500 animate-celebrate" />
          <h2 className="text-3xl font-bold tracking-tight">{t('review.allCaughtUp', lang)}</h2>
          <p className="text-muted-foreground text-base max-w-md">{t('review.allCaughtUpDesc', lang)}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onNavigate('study')}>{t('review.studyTopic', lang)}</Button>
            <Button onClick={() => onNavigate('upload')}>{t('review.uploadNotes', lang)}</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('review.title', lang)}</h1>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <p className="text-5xl font-bold text-primary">{review.dueQuestions.length}</p>
            <p className="text-muted-foreground">{t('review.dueToday', lang)}</p>
            {dueByTopic.size > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {Array.from(dueByTopic.entries()).map(([topicId, count]) => {
                  const topic = topics.find(tp => tp.id === topicId);
                  return (
                    <span key={topicId} className="rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium">
                      {topic?.name ?? t('common.unknown', lang)}: {count}
                    </span>
                  );
                })}
              </div>
            )}
            <Button onClick={review.startSession} size="lg" className="mt-4 rounded-2xl h-12 text-base font-semibold">{t('review.startReview', lang)}</Button>
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
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-background pt-2 pb-3">
        <div className="flex items-center gap-2">
          {review.canUndo && review.phase === 'question' && (
            <button
              onClick={review.undo}
              aria-label={lang === 'it' ? 'Annulla ultima valutazione' : 'Undo last rating'}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title={lang === 'it' ? 'Annulla (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            >
              <Undo2 className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1">
            <ProgressBar current={review.currentIndex} total={review.dueQuestions.length} results={review.results} />
          </div>
        </div>
      </div>
      <div className="space-y-6 pt-4">
        {q.type === 'mcq' ? (
          <McqQuestion key={q.id} question={q} onSubmit={(idx, c) => review.submitAnswer(idx, c)} disabled={review.phase === 'feedback'} language={lang} />
        ) : (
          <ClozeQuestion key={q.id} question={q} onSubmit={(a, c) => review.submitAnswer(a, c)} disabled={review.phase === 'feedback'} language={lang} />
        )}
        {review.phase === 'feedback' && review.isCorrect !== null && (
          <div className="space-y-4">
            <ExplanationCard explanation={q.explanation} isCorrect={review.isCorrect} language={lang} onOpenChat={settings.provider ? handleOpenChat : undefined} hasChatHistory={chat.hasHistory(q.id)} />
            {!review.isCorrect && !retypeComplete && (
              <RetypePrompt
                correctAnswer={q.type === 'mcq' ? q.options[q.correct].replace(/^[A-D]\)\s*/, '') : q.acceptableAnswers[0]}
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
