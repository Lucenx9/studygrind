import { useState, useCallback, useRef, useEffect } from 'react';
import type { McqQuestion as McqQuestionType } from '@/lib/types';
import { OptionButton } from './OptionButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { t, type Language } from '@/lib/i18n';
import { playCorrectSound, playWrongSound } from '@/lib/sounds';

interface McqQuestionProps {
  question: McqQuestionType;
  onSubmit: (selectedIndex: number, correct: boolean) => void;
  disabled: boolean;
  language?: Language;
  /** Pre-selected answer index when restoring a session in feedback phase */
  initialAnswer?: number | null;
}

export function McqQuestion({ question, onSubmit, disabled, language = 'it', initialAnswer }: McqQuestionProps) {
  const [selected, setSelected] = useState<number | null>(initialAnswer ?? null);
  const [revealed, setRevealed] = useState(initialAnswer != null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus container on mount so keyboard shortcuts work immediately
  useEffect(() => { containerRef.current?.focus(); }, []);

  const handleSubmit = useCallback(() => {
    if (selected === null || revealed || disabled) return;
    const correct = selected === question.correct;
    setRevealed(true);
    if (correct) playCorrectSound();
    else playWrongSound();
    onSubmit(selected, correct);
  }, [onSubmit, question.correct, selected, revealed, disabled]);

  // WCAG 2.1.4: shortcuts scoped to focused container, not global
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (revealed || disabled) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const letterIdx = ['a', 'b', 'c', 'd'].indexOf(e.key.toLowerCase());
    const numIdx = ['1', '2', '3', '4'].indexOf(e.key);
    const idx = letterIdx >= 0 ? letterIdx : numIdx;

    if (idx >= 0 && idx < question.options.length) {
      e.preventDefault();
      setSelected(idx);
    } else if ((e.key === 'Enter' || e.key === ' ') && selected !== null) {
      e.preventDefault();
      handleSubmit();
    }
  }, [disabled, handleSubmit, question.options.length, revealed, selected]);

  const handleSelect = (idx: number) => {
    if (revealed || disabled) return;
    setSelected(idx);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="animate-slide-in-question space-y-5 outline-none"
      aria-label={t('quiz.multipleChoice', language)}
    >
      <Card className="mx-auto max-w-[800px]">
        <CardContent className="space-y-5 px-6 py-8 sm:px-8">
          <Badge variant="secondary" className="w-fit">
            {t('quiz.multipleChoice', language)}
          </Badge>
          <h2 className="text-[1.35rem] font-semibold leading-snug tracking-[-0.03em] sm:text-[1.5rem]">
            {question.question}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'it' ? 'Scegli la risposta migliore. Puoi usare A-D oppure 1-4.' : 'Choose the best answer. You can also use A-D or 1-4.'}
          </p>
        </CardContent>
      </Card>
      <div className="mx-auto grid max-w-[800px] gap-3">
        {question.options.map((opt, idx) => (
          <OptionButton
            key={idx}
            label={opt}
            index={idx}
            selected={selected === idx}
            correctIndex={revealed ? question.correct : null}
            disabled={revealed || disabled}
            onClick={() => handleSelect(idx)}
          />
        ))}
      </div>
      {!revealed && (
        <div className="mx-auto flex max-w-[800px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-3 py-1.5 text-[12px] text-muted-foreground">
            <span>{language === 'it' ? 'Conferma rapida' : 'Quick submit'}</span>
            <kbd className="rounded-md border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] px-1.5 py-0.5 font-mono text-[10px] text-tertiary">Enter ↵</kbd>
          </div>
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={selected === null || disabled}
            className="w-full gap-2 sm:w-auto"
            size="lg"
          >
            {t('quiz.checkAnswer', language)}
          </Button>
        </div>
      )}
    </div>
  );
}
