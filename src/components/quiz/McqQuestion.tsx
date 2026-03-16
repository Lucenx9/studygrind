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
      <Card className="border-primary/15 bg-card/92">
        <CardContent className="space-y-4 px-6 py-6">
          <Badge variant="secondary" className="bg-primary/12 text-primary">
            {t('quiz.multipleChoice', language)}
          </Badge>
          <h2 className="text-xl font-semibold leading-snug tracking-[-0.02em] sm:text-2xl">
            {question.question}
          </h2>
        </CardContent>
      </Card>
      <div className="grid gap-2.5">
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
        <Button
          onClick={handleSubmit}
          disabled={selected === null || disabled}
          className="w-full"
          size="lg"
        >
          {t('quiz.checkAnswer', language)}
        </Button>
      )}
    </div>
  );
}
