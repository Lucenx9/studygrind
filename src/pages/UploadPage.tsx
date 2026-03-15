import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotesEditor } from '@/components/upload/NotesEditor';
import { PdfDropzone } from '@/components/upload/PdfDropzone';
import { TopicForm } from '@/components/upload/TopicForm';
import { QuestionPreview } from '@/components/upload/QuestionPreview';
import { chatCompletion, buildQuizPrompt } from '@/lib/ai';
import { parseQuizResponse } from '@/lib/quiz-parser';
import { saveQuestions, saveTopic, getQuestionsByTopic } from '@/lib/storage';
import { useTopics } from '@/hooks/useTopics';
import { t } from '@/lib/i18n';
import type { Settings, Question, Topic } from '@/lib/types';
import { Upload, Loader2, Trash2, BookOpen } from 'lucide-react';
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lang = settings.language;

  // Timer for generation progress
  useEffect(() => {
    if (generating) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [generating]);

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
    if (!notes.trim() || !topicName.trim()) { setError(lang === 'it' ? 'Inserisci nome argomento e appunti.' : 'Enter both a topic name and notes.'); return; }

    setGenerating(true); setError(null); setGeneratedQuestions(null);

    try {
      const tempTopicId = crypto.randomUUID();
      setPendingTopicId(tempTopicId);
      const baseMessages = buildQuizPrompt(notes, settings.questionsPerGeneration, lang, customInstructions || undefined);

      let questions: Question[] | null = null;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        const messages = attempt === 0 ? baseMessages : buildRetryMessages(lastError?.message ?? 'Parse error');
        try {
          const response = await chatCompletion(settings.provider, messages);
          questions = parseQuizResponse(response, tempTopicId);
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Failed');
        }
      }

      if (!questions) throw lastError ?? new Error('Failed');
      if (questions.length === 0) { setError(lang === 'it' ? 'Nessuna domanda generata. Prova con appunti diversi.' : 'No valid questions generated.'); return; }
      setGeneratedQuestions(questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = (selectedIds: string[]) => {
    if (!generatedQuestions || !pendingTopicId) return;
    const selected = generatedQuestions.filter(q => selectedIds.includes(q.id));
    const topic: Topic = { id: pendingTopicId, name: topicName, notes, customInstructions: customInstructions || undefined, createdAt: new Date().toISOString(), questionCount: selected.length };
    const topicSaved = saveTopic(topic);
    const questionsSaved = saveQuestions(selected);
    if (!topicSaved || !questionsSaved) { setError(lang === 'it' ? 'Errore nel salvataggio locale.' : 'Storage error.'); return; }
    refresh();
    toast.success(lang === 'it' ? `${selected.length} domande salvate in "${topicName}"` : `${selected.length} questions saved to "${topicName}"`);
    setNotes(''); setTopicName(''); setCustomInstructions(''); setGeneratedQuestions(null); setPendingTopicId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">{t('upload.title', lang)}</h1>
      </div>

      {topics.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{t('upload.yourTopics', lang)}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map(topic => {
              const qCount = getQuestionsByTopic(topic.id).length;
              return (
                <Card key={topic.id}>
                  <CardContent className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{topic.name}</p>
                        <p className="text-xs text-muted-foreground">{qCount} {t('upload.questions', lang)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { removeTopic(topic.id); toast(lang === 'it' ? 'Argomento eliminato' : 'Topic deleted'); }}
                      aria-label={lang === 'it' ? `Elimina ${topic.name}` : `Delete ${topic.name}`}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!generatedQuestions ? (
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('upload.newTopic', lang)}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <TopicForm topicName={topicName} onTopicNameChange={setTopicName} customInstructions={customInstructions} onCustomInstructionsChange={setCustomInstructions} language={lang} />
            <PdfDropzone onExtracted={(text) => setNotes(prev => prev ? `${prev}\n\n${text}` : text)} language={lang} />
            <NotesEditor value={notes} onChange={setNotes} language={lang} />
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button onClick={handleGenerate} disabled={generating || !notes.trim() || !topicName.trim() || !settings.provider} className="w-full" size="lg">
              {generating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('upload.generating', lang)} {elapsedSeconds}s</>) : t('upload.generateQuestions', lang)}
            </Button>
            {!settings.provider && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300 text-center">
                {t('upload.configureProvider', lang)}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {t('upload.generatedQuestions', lang)} <Badge>{generatedQuestions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
            <QuestionPreview questions={generatedQuestions} language={lang} onSave={handleSave} />
            <Button variant="ghost" className="w-full mt-3" onClick={() => setGeneratedQuestions(null)}>{t('upload.cancel', lang)}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
