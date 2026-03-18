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
import { BookOpen } from 'lucide-react';
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

  if (topics.length === 0) {
    return (
      <div className="flex min-h-[68vh] items-center justify-center">
        <Card className="w-full max-w-2xl text-center">
          <CardContent className="flex flex-col items-center gap-5 px-6 py-10 sm:px-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-primary/10 text-primary">
              <BookOpen className="h-10 w-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">{t('study.noTopicsYet', lang)}</h2>
              <p className="mx-auto max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{t('study.noTopicsDesc', lang)}</p>
            </div>
            {onNavigate && (
              <Button size="lg" onClick={() => onNavigate('upload')}>
                {t('study.uploadNotes', lang)}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t('study.title', lang)}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('study.subtitle', lang)}</p>
          </div>
        </div>
      </div>

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

            <div className="rounded-[22px] border border-border/70 bg-background/55 p-4">
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
            <div className="flex flex-col gap-4 rounded-[22px] border border-primary/15 bg-primary/8 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-4xl font-semibold tracking-[-0.04em] text-primary">{study.questions.length}</p>
                <p className="text-sm font-medium text-muted-foreground">{t('study.questionsInTopic', lang)}</p>
              </div>
              <Button onClick={study.start} size="lg" className="w-full sm:w-auto">
                {t('study.startStudying', lang)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {(study.phase === 'question' || study.phase === 'feedback') && study.currentQuestion && (
        <div className={cn('mx-auto max-w-[860px]', chat.isOpen && 'xl:mr-[396px]')}>
          <div className="sticky top-0 z-20 mb-6 rounded-[20px] border border-border/65 bg-background/82 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.72)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Badge variant="secondary">{topics.find(tp => tp.id === study.currentQuestion?.topicId)?.name}</Badge>
              <div className="rounded-full border border-border/60 bg-background/78 px-3 py-1 text-sm font-semibold">
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
