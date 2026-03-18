import { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotesEditor } from '@/components/upload/NotesEditor';
import { PdfDropzone } from '@/components/upload/PdfDropzone';
import { TopicForm } from '@/components/upload/TopicForm';
import { QuestionPreview } from '@/components/upload/QuestionPreview';
import { chatCompletion, buildQuizPrompt, TruncationError, AiRequestError } from '@/lib/ai';
import { parseQuizResponse, QuizParseError } from '@/lib/quiz-parser';
import { saveQuestions, saveTopic, getQuestionsByTopic } from '@/lib/storage';
import { useTopics } from '@/hooks/useTopics';
import { t } from '@/lib/i18n';
import type { Settings, Question, Topic } from '@/lib/types';
import { Upload, Loader2, Trash2, BookOpen, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadPageProps {
  settings: Settings;
}

export function UploadPage({ settings }: UploadPageProps) {
  const { topics, removeTopic, refresh } = useTopics();
  const [notes, setNotes] = useState('');
  const [topicName, setTopicName] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [pendingTopicId, setPendingTopicId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const MAX_ATTEMPTS = 2;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const lang = settings.language;

  // Timer for generation progress — timestamp-based to avoid drift when tab is backgrounded
  const generationStartRef = useRef<number>(0);
  useEffect(() => {
    if (generating) {
      generationStartRef.current = Date.now();
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - generationStartRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [generating]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const buildRetryMessages = (reason: string) => {
    const retryMessages = buildQuizPrompt(notes, settings.questionsPerGeneration, lang, customInstructions || undefined);
    retryMessages[0] = {
      ...retryMessages[0],
      content: `${retryMessages[0].content}\n\nIMPORTANT:\n- Output ONLY a valid JSON array\n- Do not wrap the JSON in markdown fences\n- Do not include trailing commas\n- Make sure the JSON is complete and closed\n- The previous attempt failed because: ${reason}`,
    };
    return retryMessages;
  };

  const handleGenerate = async () => {
    if (!settings.provider) { setError(t('upload.configureProvider', lang)); return; }
    if (!notes.trim() || !topicName.trim()) { setError(t('upload.missingFields', lang)); return; }

    setGenerating(true); setError(null); setGeneratedQuestions(null); setCurrentAttempt(1);

    try {
      const tempTopicId = crypto.randomUUID();
      if (!isMountedRef.current) return;
      setPendingTopicId(tempTopicId);
      const baseMessages = buildQuizPrompt(notes, settings.questionsPerGeneration, lang, customInstructions || undefined);

      let questions: Question[] | null = null;
      let lastError: Error | null = null;
      let retryCount = settings.questionsPerGeneration;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        setCurrentAttempt(attempt + 1);
        // On truncation retry, halve the question count
        const currentMessages = attempt === 0
          ? baseMessages
          : lastError instanceof TruncationError
            ? (() => { retryCount = Math.max(5, Math.floor(retryCount / 2)); return buildQuizPrompt(notes, retryCount, lang, customInstructions || undefined); })()
            : buildRetryMessages(lastError?.message ?? 'Parse error');
        try {
          const response = await chatCompletion(settings.provider, currentMessages);
          questions = parseQuizResponse(response, tempTopicId);
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Failed');
        }
      }

      if (!isMountedRef.current) return;
      if (!questions) throw lastError ?? new Error('Failed');
      if (questions.length === 0) { setError(t('upload.noValidQuestions', lang)); return; }
      setGeneratedQuestions(questions);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(getGenerationErrorMessage(err, lang));
    } finally {
      if (isMountedRef.current) {
        setGenerating(false);
      }
    }
  };

  const handleSave = (selectedIds: string[]) => {
    if (!generatedQuestions || !pendingTopicId) return;
    const selected = generatedQuestions.filter(q => selectedIds.includes(q.id));
    const topic: Topic = { id: pendingTopicId, name: topicName, notes, customInstructions: customInstructions || undefined, createdAt: new Date().toISOString(), questionCount: selected.length };
    const topicSaved = saveTopic(topic);
    const questionsSaved = saveQuestions(selected);
    if (!topicSaved || !questionsSaved) { setError(t('upload.storageError', lang)); return; }
    refresh();
    toast.success(t('upload.savedToTopic', lang).replace('{n}', String(selected.length)).replace('{topic}', topicName));
    setNotes(''); setTopicName(''); setCustomInstructions(''); setGeneratedQuestions(null); setPendingTopicId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t('upload.title', lang)}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t('upload.subtitle', lang)}</p>
          </div>
        </div>
        <Badge variant={settings.provider ? 'default' : 'secondary'} className="w-fit gap-1 self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5" />
          {settings.provider ? t('upload.aiReady', lang) : t('upload.aiNeeded', lang)}
        </Badge>
      </div>

      {topics.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">{t('upload.manageTopics', lang)}</CardTitle>
            <CardDescription>{t('upload.yourTopics', lang)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {topics.map(topic => {
              const qCount = getQuestionsByTopic(topic.id).length;
              return (
                <div key={topic.id} className="flex items-center justify-between gap-4 rounded-[18px] border border-border/55 bg-background/45 px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{topic.name}</p>
                      <p className="text-xs text-muted-foreground">{qCount} {t('upload.questions', lang)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => { removeTopic(topic.id); toast(t('upload.topicDeleted', lang)); }}
                    aria-label={t('upload.deleteTopic', lang).replace('{topic}', topic.name)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!generatedQuestions ? (
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">{t('upload.newTopic', lang)}</CardTitle>
              <CardDescription>{t('upload.newTopicDesc', lang)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              <TopicForm topicName={topicName} onTopicNameChange={setTopicName} customInstructions={customInstructions} onCustomInstructionsChange={setCustomInstructions} language={lang} />
              <div className="rounded-[18px] border border-border/55 bg-background/40 p-4">
                <PdfDropzone onExtracted={(text) => setNotes(prev => prev ? `${prev}\n\n${text}` : text)} language={lang} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{t('upload.studyNotes', lang)}</CardTitle>
                  <CardDescription>{t('upload.subtitle', lang)}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{settings.questionsPerGeneration} {t('settings.questionsPerGen', lang).toLowerCase()}</Badge>
                  <Badge variant={settings.provider ? 'default' : 'secondary'}>{settings.provider ? t('upload.aiReady', lang) : t('upload.aiNeeded', lang)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              <NotesEditor value={notes} onChange={setNotes} language={lang} />
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('common.attention', lang)}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="rounded-[18px] border border-border/55 bg-background/45 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{t('upload.generateQuestions', lang)}</p>
                    <p className="text-xs leading-5 text-muted-foreground">{t('upload.generationHelp', lang)}</p>
                  </div>
                  <Button onClick={handleGenerate} disabled={generating || !notes.trim() || !topicName.trim() || !settings.provider} className="w-full sm:w-auto" size="lg">
                    {generating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('upload.generating', lang)} {elapsedSeconds}s{currentAttempt > 1 && <span className="ml-1 text-xs opacity-75">({t('upload.attempt', lang).replace('{current}', String(currentAttempt)).replace('{max}', String(MAX_ATTEMPTS))})</span>}</>) : t('upload.generateQuestions', lang)}
                  </Button>
                </div>
              </div>
              {!settings.provider && (
                <Alert>
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertTitle>{t('upload.aiNeeded', lang)}</AlertTitle>
                  <AlertDescription>{t('upload.configureProvider', lang)}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              {t('upload.generatedQuestions', lang)} <Badge>{generatedQuestions.length}</Badge>
            </CardTitle>
            <CardDescription>{t('upload.curateQuestionsDesc', lang)}</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
            <QuestionPreview questions={generatedQuestions} language={lang} onSave={handleSave} />
            <Button variant="ghost" className="w-full mt-3" onClick={() => setGeneratedQuestions(null)}>{t('upload.cancel', lang)}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getGenerationErrorMessage(error: unknown, language: Settings['language']): string {
  if (error instanceof TruncationError) {
    return t('error.responseTruncated', language);
  }

  if (error instanceof QuizParseError) {
    return t('error.invalidResponse', language);
  }

  if (error instanceof AiRequestError) {
    switch (error.code) {
      case 'auth':
        return t('error.invalidCredentials', language);
      case 'rate_limit':
        return t('error.rateLimited', language);
      case 'server':
        return t('error.serverUnavailable', language);
      case 'timeout':
        return t('error.requestTimedOut', language);
      case 'network':
        return t('error.network', language);
      case 'request':
        return t('error.requestFailed', language);
      case 'invalid_response':
        return t('error.invalidResponse', language);
    }
  }

  return t('upload.generationFailed', language);
}
