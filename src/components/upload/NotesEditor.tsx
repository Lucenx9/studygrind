import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { t, type Language } from '@/lib/i18n';

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
}

export function NotesEditor({ value, onChange, language }: NotesEditorProps) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{t('upload.studyNotes', language)}</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPreview(!preview)}
          className="gap-1 text-xs"
        >
          {preview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {preview ? t('upload.edit', language) : t('upload.preview', language)}
        </Button>
      </div>
      {preview ? (
        <div className="min-h-[300px] rounded-md border border-border p-4 prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {value || t('upload.nothingToPreview', language)}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t('upload.pasteNotes', language)}
          className="min-h-[300px] font-mono text-sm"
        />
      )}
    </div>
  );
}
