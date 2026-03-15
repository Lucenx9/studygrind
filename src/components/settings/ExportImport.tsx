import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildExportData, downloadAsJson, parseImportFile, type ImportPreview } from '@/lib/export';
import { saveTopic, saveQuestions, getTopics } from '@/lib/storage';
import { useTopics } from '@/hooks/useTopics';
import { t, type Language } from '@/lib/i18n';
import { Download, Upload, FileJson, AlertTriangle } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';

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
    const date = new Date().toISOString().split('T')[0];
    downloadAsJson(data, `studygrind-export-${date}.json`);
    toast.success(lang === 'it' ? 'Dati esportati' : 'Data exported');
  };

  const handleExportTopic = () => {
    if (!selectedTopic) return;
    const data = buildExportData(selectedTopic);
    const topic = topics.find(t => t.id === selectedTopic);
    const safeName = (topic?.name ?? 'topic').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    downloadAsJson(data, `studygrind-${safeName}.json`);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setImportError(err instanceof Error ? err.message : 'Failed to read file.');
    }
  };

  const handleConfirmImport = (replaceDuplicates: boolean) => {
    if (!importPreview) return;
    const existingTopics = getTopics();
    const existingNames = new Map(existingTopics.map(t => [t.name, t.id]));

    for (const topic of importPreview.data.topics) {
      const existingId = existingNames.get(topic.name);
      if (existingId && !replaceDuplicates) {
        const newId = uuid();
        const renamedTopic = { ...topic, id: newId, name: `${topic.name} (imported)` };
        saveTopic(renamedTopic);
        const topicQuestions = importPreview.data.questions
          .filter(q => q.topicId === topic.id)
          .map(q => ({ ...q, topicId: newId, id: uuid() }));
        saveQuestions(topicQuestions);
      } else {
        saveTopic(topic);
        const topicQuestions = importPreview.data.questions.filter(q => q.topicId === topic.id);
        saveQuestions(topicQuestions);
      }
    }
    refresh();
    setImportPreview(null);
    setImportSuccess(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileJson className="h-4 w-4" /> {t('settings.dataManagement', lang)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full gap-2" onClick={handleExportAll}>
          <Download className="h-4 w-4" /> {t('settings.exportAll', lang)}
        </Button>

        {topics.length > 0 && (
          <div className="flex gap-2">
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
            <Button variant="outline" onClick={handleExportTopic} disabled={!selectedTopic}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        <Button variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" /> {t('settings.importData', lang)}
        </Button>

        {importError && <p className="text-sm text-destructive">{importError}</p>}
        {importSuccess && <p className="text-sm text-green-600 dark:text-green-400">{t('settings.importSuccess', lang)}</p>}

        {importPreview && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-sm font-medium">{t('settings.importPreview', lang)}</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{importPreview.topicCount} {lang === 'it' ? 'argomenti' : 'topic(s)'}</p>
              <p>{importPreview.questionCount} {lang === 'it' ? 'domande' : 'question(s)'}</p>
              <p>{importPreview.sessionCount} {lang === 'it' ? 'sessioni' : 'session(s)'}</p>
            </div>

            {importPreview.duplicateTopics.length > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    {t('settings.topicsExist', lang)} {importPreview.duplicateTopics.join(', ')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => handleConfirmImport(true)}>
                      {t('settings.replaceExisting', lang)}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleConfirmImport(false)}>
                      {t('settings.keepBoth', lang)}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {importPreview.duplicateTopics.length === 0 && (
              <Button className="w-full" onClick={() => handleConfirmImport(false)}>
                {t('settings.confirmImport', lang)}
              </Button>
            )}

            <Button variant="ghost" size="sm" className="w-full" onClick={() => setImportPreview(null)}>
              {t('common.cancel', lang)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
