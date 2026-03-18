import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/quiz/ProgressBar';
import { McqQuestion } from '@/components/quiz/McqQuestion';
import { ClozeQuestion } from '@/components/quiz/ClozeQuestion';
import { ExplanationCard } from '@/components/quiz/ExplanationCard';
import { RatingButtons } from '@/components/quiz/RatingButtons';
import { RetypePrompt } from '@/components/quiz/RetypePrompt';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Switch } from '@/components/ui/switch';
import { useStudy } from '@/hooks/useStudy';
import { useTopics } from '@/hooks/useTopics';
import { useChat } from '@/hooks/useChat';
import { getDueQuestions, getIntervalPreview } from '@/lib/fsrs';
import type { Grade } from '@/lib/fsrs';
import { getQuestionsByTopic, getSessions, getTopics } from '@/lib/storage';
import { t } from '@/lib/i18n';
import type { Settings } from '@/lib/types';
import { cn, formatRelativeDate } from '@/lib/utils';
import { BookOpen, Clock3, Search, Sparkles, Upload } from 'lucide-react';

const TOPIC_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-lime-500 to-green-500',
];

function topicColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return TOPIC_GRADIENTS[Math.abs(hash) % TOPIC_GRADIENTS.length];
}

function MiniRing({ percent, size = 32 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(percent / 100, 0), 1);
  const offset = c - (pct === 0 ? 0.01 : pct) * c;
  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-[color:var(--sg-surface-3)]" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#miniRingGrad)" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        className={pct === 0 ? 'opacity-90' : undefined}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <defs>
        <linearGradient id="miniRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface StudyPageProps {
  settings: Settings;
  onNavigate?: (page: 'upload') => void;
}

type TopicFilter = 'all' | 'active' | 'completed' | 'due';

export function StudyPage({ settings, onNavigate }: StudyPageProps) {
  const { topics } = useTopics();
  const study = useStudy();
  const chat = useChat(settings);
  const lang = settings.language;
  const [retypeComplete, setRetypeComplete] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TopicFilter>('all');
  const loadTopic = study.loadTopic;

  useEffect(() => { setRetypeComplete(false); }, [study.currentIndex, selectedTopicId]);

  useEffect(() => {
    if (topics.length === 0) {
      if (selectedTopicId) setSelectedTopicId('');
      return;
    }

    if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
      return;
    }

    const nextTopicId = topics[0].id;
    setSelectedTopicId(nextTopicId);
    loadTopic(nextTopicId);
  }, [loadTopic, selectedTopicId, topics]);

  const topicCards = useMemo(() => {
    const sessions = getSessions();
    return topics.map((topic) => {
      const questions = getQuestionsByTopic(topic.id);
      const dueCount = getDueQuestions(questions).length;
      const reviewedCount = questions.filter((question) => question.timesReviewed > 0).length;
      const progress = questions.length > 0 ? Math.round((reviewedCount / questions.length) * 100) : 0;
      const questionIds = new Set(questions.map((question) => question.id));
      const lastSession = sessions
        .filter((session) => session.ratings.some((rating) => questionIds.has(rating.questionId)))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const status: TopicFilter =
        dueCount > 0 ? 'due' :
          progress >= 100 ? 'completed' :
            reviewedCount > 0 ? 'active' :
              'all';

      return {
        id: topic.id,
        name: topic.name,
        totalQuestions: questions.length,
        dueCount,
        progress,
        status,
        lastSessionLabel: lastSession
          ? formatRelativeDate(new Date(lastSession.date), lang)
          : (lang === 'it' ? 'Mai' : 'Never'),
      };
    });
  }, [lang, topics]);

  const filteredTopics = topicCards.filter((topic) => {
    const matchesQuery = topic.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchesFilter = activeFilter === 'all'
      ? true
      : activeFilter === 'active'
        ? topic.status === 'active'
        : activeFilter === 'completed'
          ? topic.status === 'completed'
          : topic.dueCount > 0;
    return matchesQuery && matchesFilter;
  });

  const selectedTopic = topicCards.find((topic) => topic.id === selectedTopicId) ?? null;

  const handleRate = useCallback((rating: Grade) => {
    setTransitioning(true);
    setTimeout(() => {
      study.rate(rating);
      setTransitioning(false);
    }, 200);
  }, [study]);

  const handleOpenChat = () => {
    const question = study.currentQuestion;
    if (!question || study.isCorrect === null) return;
    const topic = getTopics().find((item) => item.id === question.topicId);
    const answerText = question.type === 'mcq' && typeof study.userAnswer === 'number'
      ? question.options[study.userAnswer] ?? String(study.userAnswer)
      : String(study.userAnswer ?? '');
    chat.openChat(question, answerText, study.isCorrect, topic?.notes ?? '', topic?.name ?? '');
  };

  if (topics.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center animate-fade-in-up">
        <Card className="w-full max-w-2xl text-center">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-12 sm:px-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(99,102,241,0.1)]">
              <BookOpen className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h2 className="text-[28px] font-bold tracking-[-0.03em]">
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
    <div className="sg-page-enter space-y-6">
      <div className="space-y-2">
        <h1 className="sg-h1">{t('study.title', lang)}</h1>
        <p className="sg-subtitle">{t('study.subtitle', lang)}</p>
      </div>

      {study.phase === 'idle' && (
        <>
          <Card>
            <CardContent className="space-y-5 px-6 py-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={lang === 'it' ? 'Cerca un argomento...' : 'Search topics...'}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all' as const, label: lang === 'it' ? 'Tutti' : 'All', count: topicCards.length, dot: 'bg-primary' },
                      { key: 'active' as const, label: lang === 'it' ? 'In corso' : 'Active', count: topicCards.filter((topic) => topic.status === 'active').length, dot: 'bg-sky-400' },
                      { key: 'completed' as const, label: lang === 'it' ? 'Completati' : 'Completed', count: topicCards.filter((topic) => topic.status === 'completed').length, dot: 'bg-emerald-400' },
                      { key: 'due' as const, label: lang === 'it' ? 'Da ripassare' : 'Due', count: topicCards.filter((topic) => topic.dueCount > 0).length, dot: 'bg-amber-400' },
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setActiveFilter(filter.key)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all',
                          activeFilter === filter.key
                            ? 'border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.1)] text-foreground'
                            : 'border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <span className={`h-2 w-2 rounded-full ${filter.dot}`} />
                        <span>{filter.label}</span>
                        <span className="rounded-full bg-[color:var(--sg-surface-1)] px-1.5 py-0.5 text-[11px] tabular-nums">
                          {filter.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTopic && (
                  <div className="rounded-[22px] border border-[rgba(99,102,241,0.16)] bg-[linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.04))] px-5 py-5">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-tertiary">{lang === 'it' ? 'Argomento selezionato' : 'Selected topic'}</p>
                        <h2 className="text-xl font-semibold tracking-[-0.02em]">{selectedTopic.name}</h2>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] px-4 py-3">
                          <p className="text-tertiary">{lang === 'it' ? 'Domande' : 'Cards'}</p>
                          <p className="mt-2 text-2xl font-semibold tabular-nums">{selectedTopic.totalQuestions}</p>
                        </div>
                        <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] px-4 py-3">
                          <p className="text-tertiary">{lang === 'it' ? 'Da ripassare' : 'Due'}</p>
                          <p className="mt-2 text-2xl font-semibold tabular-nums">{selectedTopic.dueCount}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] p-4">
                        <div className="flex items-start gap-3">
                          <Switch
                            id="count-review"
                            checked={study.countTowardsReview}
                            onCheckedChange={study.setCountTowardsReview}
                            className="mt-0.5"
                          />
                          <div className="space-y-1">
                            <Label htmlFor="count-review" className="font-semibold">
                              {t('study.countTowardsReview', lang)}
                            </Label>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {t('study.countTowardsReviewDesc', lang)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button variant="accent" size="lg" onClick={study.start} className="w-full gap-2" disabled={study.questions.length === 0}>
                        <Sparkles className="h-4 w-4" />
                        {t('study.startStudying', lang)}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {filteredTopics.length > 0 ? (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
              {filteredTopics.map((topic, index) => (
                <Card
                  key={topic.id}
                  className={cn(
                    'sg-hover-card animate-stagger-in overflow-hidden',
                    selectedTopicId === topic.id && 'border-[rgba(99,102,241,0.28)] bg-[rgba(99,102,241,0.06)]',
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className={`h-2 bg-gradient-to-r ${topicColor(topic.name)}`} />
                  <CardContent className="space-y-4 px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-base font-semibold truncate">{topic.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {topic.totalQuestions} {lang === 'it' ? 'domande' : 'questions'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold tabular-nums text-emerald-400">{topic.progress}%</span>
                        <MiniRing percent={topic.progress} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" />
                      <span>{topic.lastSessionLabel}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTopicId(topic.id);
                          loadTopic(topic.id);
                        }}
                      >
                        {lang === 'it' ? 'Ripassa' : 'Practice'}
                      </Button>
                      {topic.dueCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTopicId(topic.id);
                            loadTopic(topic.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#fbbf24] transition-colors hover:bg-[rgba(251,191,36,0.18)]"
                        >
                          Due: {topic.dueCount}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="px-6 py-10 text-center">
                {searchQuery.trim() && (
                  <div className="mb-4 flex justify-center">
                    <Search className="h-10 w-10 text-muted-foreground/20" strokeWidth={1.5} />
                  </div>
                )}
                <p className="text-base font-medium">{lang === 'it' ? 'Nessun argomento trovato' : 'No topics found'}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === 'it' ? 'Prova a cambiare ricerca o filtro.' : 'Try changing the search or filter.'}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {(study.phase === 'question' || study.phase === 'feedback') && study.currentQuestion && (
        <div className={cn(
          'mx-auto max-w-[920px] space-y-6',
          chat.isOpen && 'xl:mr-[396px]',
          study.phase === 'feedback' && study.isCorrect === true && 'flash-correct',
          study.phase === 'feedback' && study.isCorrect === false && 'flash-wrong',
        )}>
          <div className="sticky top-3 z-20 rounded-[20px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-overlay)] px-4 py-4 shadow-[var(--sg-overlay-shadow)] backdrop-blur-2xl">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{topics.find((topic) => topic.id === study.currentQuestion?.topicId)?.name}</Badge>
                <Badge variant="outline" className="ml-auto">
                  {study.currentQuestion.type === 'mcq' ? t('quiz.multipleChoice', lang) : t('quiz.fillBlank', lang)}
                </Badge>
              </div>
              <ProgressBar
                current={study.currentIndex}
                total={study.questions.length}
                results={study.results}
                label={lang === 'it'
                  ? `Domanda ${study.currentIndex + 1} di ${study.questions.length}`
                  : `Question ${study.currentIndex + 1} of ${study.questions.length}`}
              />
            </div>
          </div>

          <div
            key={study.currentIndex}
            className={cn(
              'space-y-5',
              transitioning ? 'animate-question-exit' : 'animate-question-enter',
            )}
          >
            {study.currentQuestion.type === 'mcq' ? (
              <McqQuestion
                key={study.currentQuestion.id}
                question={study.currentQuestion}
                onSubmit={(answer, correct) => study.submitAnswer(answer, correct)}
                disabled={study.phase === 'feedback'}
                language={lang}
              />
            ) : (
              <ClozeQuestion
                key={study.currentQuestion.id}
                question={study.currentQuestion}
                onSubmit={(answer, correct) => study.submitAnswer(answer, correct)}
                disabled={study.phase === 'feedback'}
                language={lang}
              />
            )}

            {study.phase === 'feedback' && study.isCorrect !== null && (
              <div className="space-y-4">
                <ExplanationCard
                  explanation={study.currentQuestion.explanation}
                  isCorrect={study.isCorrect}
                  language={lang}
                  onOpenChat={settings.provider ? handleOpenChat : undefined}
                  hasChatHistory={chat.hasHistory(study.currentQuestion.id)}
                />
                {!study.isCorrect && !retypeComplete && (
                  <RetypePrompt
                    correctAnswer={study.currentQuestion.type === 'mcq' ? study.currentQuestion.options[study.currentQuestion.correct].replace(/^[A-D]\)\s*/, '') : study.currentQuestion.acceptableAnswers[0]}
                    language={lang}
                    onComplete={() => setRetypeComplete(true)}
                  />
                )}
                {(study.isCorrect || retypeComplete) && (
                  <RatingButtons onRate={handleRate} language={lang} intervals={study.currentQuestion ? getIntervalPreview(study.currentQuestion.fsrsCard) : undefined} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

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

