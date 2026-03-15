import { useState } from 'react';
import type { McqQuestion as McqQuestionType } from '@/lib/types';
import { OptionButton } from './OptionButton';
import { Button } from '@/components/ui/button';
import { t, type Language } from '@/lib/i18n';

interface McqQuestionProps {
  question: McqQuestionType;
  onSubmit: (selectedIndex: number, correct: boolean) => void;
  disabled: boolean;
  language?: Language;
}

export function McqQuestion({ question, onSubmit, disabled, language = 'it' }: McqQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    if (revealed || disabled) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setRevealed(true);
    onSubmit(selected, selected === question.correct);
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
