import { type ChangeEvent, type ReactNode, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildExportData, downloadAsJson, parseImportFile, type ImportPreview } from '@/lib/export';
import {
  getQuestionsByTopic,
  getTopics,
  mergeActivities,
  replaceChatHistoriesForTopic,
  replaceQuestionsForTopic,
  saveChatHistoriesBulk,
  saveQuestions,
  saveSessionsBulk,
  saveTopic,
} from '@/lib/storage';
import { useTopics } from '@/hooks/useTopics';
import { t, type Language } from '@/lib/i18n';
import { toDateKey } from '@/lib/utils';
import { Check, Download, Upload, FileJson, AlertTriangle, Info } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import type { ChatHistory, ReviewSession, Topic } from '@/lib/types';

interface ExportImportProps {
  language: Language;
}

export function ExportImport({ language: lang }: ExportImportProps) {
  const { topics, refresh } = useTopics();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAll = () => {
    const data = buildExportData();
    const date = toDateKey(new Date());
    downloadAsJson(data, `studygrind-export-${date}.json`);
    toast.success(t('settings.dataExported', lang));
  };

  const handleExportTopic = () => {
    if (!selectedTopic) return;
    const data = buildExportData(selectedTopic);
    const topic = topics.find(t => t.id === selectedTopic);
    const safeName = (topic?.name ?? 'topic').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    downloadAsJson(data, `studygrind-${safeName}.json`);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportError(null);
    setImportPreview(null);
    setImportSuccess(false);
    try {
      const preview = await parseImportFile(file);
      setImportPreview(preview);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('settings.importReadError', lang));
    }
  };

  const handleConfirmImport = (replaceDuplicates: boolean) => {
    if (!importPreview) return;
    const existingTopics = getTopics();
    const existingNames = new Map(existingTopics.map(t => [t.name, t.id]));
    const existingTopicIds = new Set(existingTopics.map(topic => topic.id));
    const existingQuestionIds = new Set(
      existingTopics.flatMap(topic => getQuestionsByTopic(topic.id).map(question => question.id)),
    );
    const topicIdMap = new Map<string, string>();
    const questionIdMap = new Map<string, string>();
    const replacedTopicIds = new Set<string>();
    let ok = true;

    for (const topic of importPreview.data.topics) {
      const duplicateTopicId = existingNames.get(topic.name);
      const shouldReplaceTopic = Boolean(duplicateTopicId && replaceDuplicates);

      let finalTopicId = topic.id;
      let finalTopicName = topic.name;

      if (shouldReplaceTopic) {
        finalTopicId = duplicateTopicId!;
        replacedTopicIds.add(finalTopicId);
      } else {
        if (duplicateTopicId) {
          finalTopicId = uuid();
          finalTopicName = `${topic.name} (imported)`;
        } else if (existingTopicIds.has(finalTopicId)) {
          finalTopicId = uuid();
        }
      }

      topicIdMap.set(topic.id, finalTopicId);
      existingTopicIds.add(finalTopicId);

      const replaceableQuestionIds = shouldReplaceTopic
        ? new Set(getQuestionsByTopic(finalTopicId).map(question => question.id))
        : new Set<string>();

      const mappedQuestions = importPreview.data.questions
        .filter(question => question.topicId === topic.id)
        .map(question => {
          let nextQuestionId = question.id;
          if (existingQuestionIds.has(nextQuestionId) && !replaceableQuestionIds.has(nextQuestionId)) {
            nextQuestionId = uuid();
          }

          questionIdMap.set(question.id, nextQuestionId);
          existingQuestionIds.add(nextQuestionId);

          return {
            ...question,
            id: nextQuestionId,
            topicId: finalTopicId,
          };
        });

      const normalizedTopic: Topic = {
        ...topic,
        id: finalTopicId,
        name: finalTopicName,
        questionCount: mappedQuestions.length,
      };

      ok = saveTopic(normalizedTopic) && ok;
      ok = (
        shouldReplaceTopic
          ? replaceQuestionsForTopic(finalTopicId, mappedQuestions)
          : saveQuestions(mappedQuestions)
      ) && ok;
    }

    const mappedChats: ChatHistory[] = importPreview.data.chatHistories
      .map(history => {
        const topicId = topicIdMap.get(history.topicId);
        const questionId = questionIdMap.get(history.questionId);
        if (!topicId || !questionId) return null;

        return {
          ...history,
          topicId,
          questionId,
        };
      })
      .filter((history): history is ChatHistory => history !== null);

    for (const topicId of replacedTopicIds) {
      const topicHistories = mappedChats.filter(history => history.topicId === topicId);
      ok = replaceChatHistoriesForTopic(topicId, topicHistories) && ok;
    }

    const newTopicChats = mappedChats.filter(history => !replacedTopicIds.has(history.topicId));
    ok = saveChatHistoriesBulk(newTopicChats) && ok;

    const mappedSessions: ReviewSession[] = importPreview.data.sessions.map(session => ({
      ...session,
      ratings: session.ratings
        .map(rating => {
          const mappedQuestionId = questionIdMap.get(rating.questionId);
          return mappedQuestionId ? { ...rating, questionId: mappedQuestionId } : null;
        })
        .filter(
          (
            rating,
          ): rating is ReviewSession['ratings'][number] => rating !== null,
        ),
    }));

    ok = saveSessionsBulk(mappedSessions) && ok;
    ok = mergeActivities(importPreview.data.dailyActivity) && ok;

    if (!ok) {
      setImportError(t('settings.importStorageError', lang));
      return;
    }

    refresh();
    setImportPreview(null);
    setImportSuccess(true);
  };

  return (
    <Card>
      <CardContent className="space-y-5 px-6 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-tertiary">{lang === 'it' ? 'JSON BACKUP' : 'JSON BACKUP'}</p>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-[-0.02em]">
              <FileJson className="h-5 w-5 text-primary" strokeWidth={1.5} />
              {t('settings.dataManagement', lang)}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {lang === 'it'
                ? 'Esporta o importa il tuo archivio locale mantenendo argomenti, domande e cronologia sincronizzati.'
                : 'Export or import your local archive while keeping topics, questions, and history in sync.'}
            </p>
          </div>
          <Badge className="gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#60a5fa]" />
            {lang === 'it' ? 'Locale' : 'Local only'}
          </Badge>
        </div>

        <DataRow
          title={t('settings.exportAll', lang)}
          description={lang === 'it'
            ? 'Scarica un backup completo con argomenti, domande, cronologia del tutor e sessioni di ripasso.'
            : 'Download a full backup with topics, questions, tutor history, and review sessions.'}
        >
          <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={handleExportAll}>
            <Download className="h-4 w-4" />
            {t('settings.exportAll', lang)}
          </Button>
        </DataRow>

        {topics.length > 0 && (
          <DataRow
            title={t('settings.exportTopic', lang)}
            description={lang === 'it'
              ? 'Crea un file dedicato per un singolo argomento, utile per archivio o condivisione selettiva.'
              : 'Create a dedicated file for a single topic, useful for archiving or selective sharing.'}
          >
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Select onValueChange={(v: string | null) => setSelectedTopic(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('settings.exportTopic', lang)} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="gap-2 sm:min-w-32"
                onClick={handleExportTopic}
                disabled={!selectedTopic}
                aria-label={t('settings.exportSelectedTopic', lang)}
              >
                <Download className="h-4 w-4" />
                {lang === 'it' ? 'Esporta' : 'Export'}
              </Button>
            </div>
          </DataRow>
        )}

        <DataRow
          title={t('settings.importData', lang)}
          description={lang === 'it'
            ? 'Carica un file JSON esistente per ripristinare o unire dati nello storage locale attuale.'
            : 'Upload an existing JSON file to restore or merge data into the current local storage.'}
        >
          <>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {t('settings.importData', lang)}
            </Button>
          </>
        </DataRow>

        {importError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('common.attention', lang)}</AlertTitle>
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}
        {importSuccess && (
          <Alert>
            <Check className="h-4 w-4 text-[#34d399]" />
            <AlertTitle>{lang === 'it' ? 'Import completato' : 'Import complete'}</AlertTitle>
            <AlertDescription>{t('settings.importSuccess', lang)}</AlertDescription>
          </Alert>
        )}

        {importPreview && (
          <div className="space-y-4 rounded-[24px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] p-5 shadow-[var(--sg-card-shadow)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-tertiary">{t('settings.importPreview', lang)}</p>
                <p className="mt-1 text-base font-semibold">
                  {lang === 'it' ? 'Controlla il contenuto prima di importare' : 'Review the file before importing'}
                </p>
              </div>
              <Badge variant="outline" className="gap-1.5 self-start">
                <FileJson className="h-3.5 w-3.5" />
                JSON
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                t('settings.topicCountLabel', lang).replace('{n}', String(importPreview.topicCount)),
                t('settings.questionCountLabel', lang).replace('{n}', String(importPreview.questionCount)),
                t('settings.sessionCountLabel', lang).replace('{n}', String(importPreview.sessionCount)),
              ].map((label) => (
                <div key={label} className="rounded-2xl border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                </div>
              ))}
            </div>

            {importPreview.duplicateTopics.length > 0 && (
              <div className="rounded-[18px] border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] px-4 py-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#fbbf24]" />
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      {lang === 'it' ? 'Sono stati trovati argomenti con lo stesso nome.' : 'Topics with the same name were found.'}
                    </p>
                    <p className="leading-6 text-muted-foreground">
                      {t('settings.topicsExist', lang)} {importPreview.duplicateTopics.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {importPreview.duplicateTopics.length > 0 ? (
                <>
                  <Button className="w-full sm:flex-1" variant="accent" onClick={() => handleConfirmImport(true)}>
                    {t('settings.replaceExisting', lang)}
                  </Button>
                  <Button className="w-full sm:flex-1" variant="outline" onClick={() => handleConfirmImport(false)}>
                    {t('settings.keepBoth', lang)}
                  </Button>
                </>
              ) : (
                <Button className="w-full sm:flex-1" variant="accent" onClick={() => handleConfirmImport(false)}>
                  {t('settings.confirmImport', lang)}
                </Button>
              )}
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setImportPreview(null)}>
                {t('common.cancel', lang)}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DataRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[color:var(--sg-border-1)] pb-5 last:border-b-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-[360px] space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="w-full lg:max-w-[420px]">
        {children}
      </div>
    </div>
  );
}
