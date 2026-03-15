import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { McqQuestion } from '@/components/quiz/McqQuestion';
import { ClozeQuestion } from '@/components/quiz/ClozeQuestion';
import { ExplanationCard } from '@/components/quiz/ExplanationCard';
import { RatingButtons } from '@/components/quiz/RatingButtons';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useStudy } from '@/hooks/useStudy';
import { useTopics } from '@/hooks/useTopics';
import { useChat } from '@/hooks/useChat';
import { BookOpen } from 'lucide-react';
import { getTopics } from '@/lib/storage';
import { t } from '@/lib/i18n';
import type { Settings } from '@/lib/types';

interface StudyPageProps {
  settings: Settings;
}

export function StudyPage({ settings }: StudyPageProps) {
  const { topics } = useTopics();
  const study = useStudy();
  const chat = useChat(settings);
  const lang = settings.language;

  useEffect(() => {
    if (topics.length > 0 && study.questions.length === 0) study.loadTopic(topics[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics]);

  const handleOpenChat = () => {
    const q = study.currentQuestion;
    if (!q || study.isCorrect === null) return;
    const topic = getTopics().find(tp => tp.id === q.topicId);
    chat.openChat(q, String(study.userAnswer ?? ''), study.isCorrect, topic?.notes ?? '');
  };

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">{t('study.noTopicsYet', lang)}</h2>
        <p className="text-muted-foreground">{t('study.noTopicsDesc', lang)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('study.title', lang)}</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Select onValueChange={(v: string | null) => { if (v) study.loadTopic(v); }}>
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder={t('study.selectTopic', lang)} />
          </SelectTrigger>
          <SelectContent>
            {topics.map(tp => (
              <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="count-review" checked={study.countTowardsReview} onCheckedChange={study.setCountTowardsReview} />
          <Label htmlFor="count-review" className="text-sm">{t('study.countTowardsReview', lang)}</Label>
        </div>
      </div>

      {study.phase === 'idle' && study.questions.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-4xl font-bold">{study.questions.length}</p>
            <p className="text-muted-foreground">{t('study.questionsInTopic', lang)}</p>
            <Button onClick={study.start} size="lg">{t('study.startStudying', lang)}</Button>
          </CardContent>
        </Card>
      )}

      {(study.phase === 'question' || study.phase === 'feedback') && study.currentQuestion && (
        <div className="space-y-6">
          <ProgressBar current={study.currentIndex} total={study.questions.length} results={study.results} />
          {study.currentQuestion.type === 'mcq' ? (
            <McqQuestion key={study.currentQuestion.id} question={study.currentQuestion} onSubmit={(i, c) => study.submitAnswer(i, c)} disabled={study.phase === 'feedback'} language={lang} />
          ) : (
            <ClozeQuestion key={study.currentQuestion.id} question={study.currentQuestion} onSubmit={(a, c) => study.submitAnswer(a, c)} disabled={study.phase === 'feedback'} language={lang} />
          )}
          {study.phase === 'feedback' && study.isCorrect !== null && (
            <div className="space-y-4">
              <ExplanationCard explanation={study.currentQuestion.explanation} isCorrect={study.isCorrect} language={lang} onOpenChat={settings.provider ? handleOpenChat : undefined} hasChatHistory={chat.hasHistory(study.currentQuestion.id)} />
              <RatingButtons onRate={study.rate} language={lang} />
            </div>
          )}
        </div>
      )}

      <ChatPanel isOpen={chat.isOpen} history={chat.history} loading={chat.loading} canSendMore={chat.canSendMore} language={lang} onSend={chat.sendMessage} onClose={chat.closeChat} />
    </div>
  );
}
