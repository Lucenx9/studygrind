import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { McqQuestion } from '@/components/quiz/McqQuestion';
import { ClozeQuestion } from '@/components/quiz/ClozeQuestion';
import { ExplanationCard } from '@/components/quiz/ExplanationCard';
import { RatingButtons } from '@/components/quiz/RatingButtons';
import { RetypePrompt } from '@/components/quiz/RetypePrompt';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useStudy } from '@/hooks/useStudy';
import { useTopics } from '@/hooks/useTopics';
import { useChat } from '@/hooks/useChat';
import { BookOpen, Upload, Play } from 'lucide-react';
import { getTopics } from '@/lib/storage';
import { getIntervalPreview } from '@/lib/fsrs';
import { t } from '@/lib/i18n';
import type { Settings } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StudyPageProps {
  settings: Settings;
  onNavigate?: (page: 'upload') => void;
}

export function StudyPage({ settings, onNavigate }: StudyPageProps) {
  const { topics } = useTopics();
  const study = useStudy();
  const chat = useChat(settings);
  const lang = settings.language;
  const [retypeComplete, setRetypeComplete] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const loadTopic = study.loadTopic;

  useEffect(() => { setRetypeComplete(false); }, [study.currentIndex, selectedTopicId]);

  useEffect(() => {
    if (topics.length === 0) {
      if (selectedTopicId) setSelectedTopicId('');
      return;
    }

    if (selectedTopicId && topics.some(topic => topic.id === selectedTopicId)) {
      return;
    }

    const nextTopicId = topics[0].id;
    setSelectedTopicId(nextTopicId);
    loadTopic(nextTopicId);
  }, [loadTopic, selectedTopicId, topics]);

  const handleOpenChat = () => {
    const q = study.currentQuestion;
    if (!q || study.isCorrect === null) return;
    const topic = getTopics().find(tp => tp.id === q.topicId);
    const answerText = q.type === 'mcq' && typeof study.userAnswer === 'number'
      ? q.options[study.userAnswer] ?? String(study.userAnswer)
      : String(study.userAnswer ?? '');
    chat.openChat(q, answerText, study.isCorrect, topic?.notes ?? '', topic?.name ?? '');
  };

  /* ── Empty state ── */
  if (topics.length === 0) {
    return (
      <div className="flex min-h-[68vh] items-center justify-center animate-fade-in-up">
        <Card className="w-full max-w-2xl text-center">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-14 sm:px-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.1)]">
              <BookOpen className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h2 className="text-[28px] font-bold tracking-[-0.025em]">
                {lang === 'it' ? 'Inizia il tuo percorso' : 'Start your journey'}
              </h2>
              <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground">
                {lang === 'it'
                  ? 'Carica i tuoi appunti e genera domande con l\'AI'
                  : 'Upload your notes and generate questions with AI'}
              </p>
            </div>
            {onNavigate && (
              <Button variant="accent" size="lg" onClick={() => onNavigate('upload')} className="gap-2">
                <Upload className="h-4 w-4" />
                {t('study.uploadNotes', lang)}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.025em]">{t('study.title', lang)}</h1>
        <p className="mt-1 text-base text-muted-foreground">{t('study.subtitle', lang)}</p>
      </div>

      {/* ── Practice setup ── */}
      <Card>
        <CardContent className="space-y-6 px-6 py-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">{t('study.practiceSetup', lang)}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{t('study.topicQueueDesc', lang)}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-2">
              <Label htmlFor="study-topic">{t('study.selectTopic', lang)}</Label>
              <Select
                value={selectedTopicId || undefined}
                onValueChange={(v: string | null) => {
                  if (!v) return;
                  setSelectedTopicId(v);
                  loadTopic(v);
                }}
              >
                <SelectTrigger id="study-topic" className="w-full">
                  <SelectValue placeholder={t('study.selectTopic', lang)} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map(tp => (
                    <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-4">
              <div className="flex items-start gap-3">
                <Switch id="count-review" checked={study.countTowardsReview} onCheckedChange={study.setCountTowardsReview} className="mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="count-review">{t('study.countTowardsReview', lang)}</Label>
                  <p className="text-sm leading-6 text-muted-foreground">{t('study.countTowardsReviewDesc', lang)}</p>
                </div>
              </div>
            </div>
          </div>

          {study.phase === 'idle' && study.questions.length > 0 && (
            <div className="flex flex-col gap-4 rounded-xl border border-primary/15 bg-[rgba(99,102,241,0.06)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-[-0.04em] tabular-nums text-primary">{study.questions.length}</p>
                <p className="text-sm text-muted-foreground">{t('study.questionsInTopic', lang)}</p>
              </div>
              <Button variant="accent" onClick={study.start} size="lg" className="w-full gap-2 sm:w-auto">
                <Play className="h-4 w-4" />
                {t('study.startStudying', lang)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Active quiz ── */}
      {(study.phase === 'question' || study.phase === 'feedback') && study.currentQuestion && (
        <div className={cn('mx-auto max-w-[860px]', chat.isOpen && 'xl:mr-[396px]')}>
          <div className="sticky top-0 z-20 mb-6 rounded-2xl border border-border bg-[rgba(10,10,15,0.85)] px-4 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Badge variant="secondary">{topics.find(tp => tp.id === study.currentQuestion?.topicId)?.name}</Badge>
              <div className="rounded-full border border-border bg-[rgba(255,255,255,0.03)] px-3 py-1 text-sm font-semibold">
                <span className="text-primary">{study.currentIndex + 1}</span>
                <span className="text-muted-foreground"> / {study.questions.length}</span>
              </div>
            </div>
            <ProgressBar current={study.currentIndex} total={study.questions.length} results={study.results} />
          </div>
          <div className="space-y-5">
            {study.currentQuestion.type === 'mcq' ? (
              <McqQuestion key={study.currentQuestion.id} question={study.currentQuestion} onSubmit={(i, c) => study.submitAnswer(i, c)} disabled={study.phase === 'feedback'} language={lang} />
            ) : (
              <ClozeQuestion key={study.currentQuestion.id} question={study.currentQuestion} onSubmit={(a, c) => study.submitAnswer(a, c)} disabled={study.phase === 'feedback'} language={lang} />
            )}
            {study.phase === 'feedback' && study.isCorrect !== null && (
              <div className="space-y-4">
                <ExplanationCard explanation={study.currentQuestion.explanation} isCorrect={study.isCorrect} language={lang} onOpenChat={settings.provider ? handleOpenChat : undefined} hasChatHistory={chat.hasHistory(study.currentQuestion.id)} />
                {!study.isCorrect && !retypeComplete && (
                  <RetypePrompt
                    correctAnswer={study.currentQuestion.type === 'mcq' ? study.currentQuestion.options[study.currentQuestion.correct].replace(/^[A-D]\)\s*/, '') : study.currentQuestion.acceptableAnswers[0]}
                    language={lang}
                    onComplete={() => setRetypeComplete(true)}
                  />
                )}
                {(study.isCorrect || retypeComplete) && (
                  <RatingButtons onRate={study.rate} language={lang} intervals={study.currentQuestion ? getIntervalPreview(study.currentQuestion.fsrsCard) : undefined} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ChatPanel isOpen={chat.isOpen} history={chat.history} loading={chat.loading} canSendMore={chat.canSendMore} messagesRemaining={chat.messagesRemaining} language={lang} onSend={chat.sendMessage} onClose={chat.closeChat} />
    </div>
  );
}
