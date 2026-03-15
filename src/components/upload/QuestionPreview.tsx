import { useState } from 'react';
import type { Question } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { t, type Language } from '@/lib/i18n';

interface QuestionPreviewProps {
  questions: Question[];
  language: Language;
  onSave: (selectedIds: string[]) => void;
}

export function QuestionPreview({ questions, language, onSave }: QuestionPreviewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(questions.map(q => q.id)));

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(questions.map(q => q.id)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('upload.selected', language).replace('{n}', String(selected.size)).replace('{total}', String(questions.length))}
        </p>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {selected.size === questions.length ? t('upload.deselectAll', language) : t('upload.selectAll', language)}
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {questions.map((q, i) => (
          <Card
            key={q.id}
            className={`cursor-pointer transition-opacity ${selected.has(q.id) ? '' : 'opacity-40'}`}
            onClick={() => toggle(q.id)}
          >
            <CardContent className="flex items-start gap-3 pt-4">
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                selected.has(q.id) ? 'bg-primary border-primary' : 'border-border'
              }`}>
                {selected.has(q.id) && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <Badge variant={q.type === 'mcq' ? 'default' : 'secondary'}>
                    {q.type === 'mcq' ? 'MCQ' : 'Cloze'}
                  </Badge>
                </div>
                <p className="text-sm">{q.question}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={() => onSave(Array.from(selected))}
        disabled={selected.size === 0}
        className="w-full"
        size="lg"
      >
        {t('upload.saveSelected', language).replace('{n}', String(selected.size))}
      </Button>
    </div>
  );
}
