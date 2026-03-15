import { useState, useEffect, useCallback } from 'react';
import type { McqQuestion as McqQuestionType } from '@/lib/types';
import { OptionButton } from './OptionButton';
import { Button } from '@/components/ui/button';
import { t, type Language } from '@/lib/i18n';
import { playCorrectSound, playWrongSound } from '@/lib/sounds';

interface McqQuestionProps {
  question: McqQuestionType;
  onSubmit: (selectedIndex: number, correct: boolean) => void;
  disabled: boolean;
  language?: Language;
}

export function McqQuestion({ question, onSubmit, disabled, language = 'it' }: McqQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    const correct = selected === question.correct;
    setRevealed(true);
    if (correct) playCorrectSound();
    else playWrongSound();
    onSubmit(selected, correct);
  }, [onSubmit, question.correct, selected]);

  // Keyboard shortcuts: A/B/C/D or 1/2/3/4 to select, Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (revealed || disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, handleSubmit, question.options.length, revealed, selected]);

  const handleSelect = (idx: number) => {
    if (revealed || disabled) return;
    setSelected(idx);
  };

  return (
    <div className="animate-slide-in-question space-y-4">
      <h2 className="text-xl font-semibold leading-relaxed border-l-4 border-primary pl-5">
        {question.question}
      </h2>
      <div className="grid gap-3.5">
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
          className="w-full rounded-2xl h-12 text-base font-semibold"
          size="lg"
        >
          {t('quiz.checkAnswer', language)}
        </Button>
      )}
    </div>
  );
}
