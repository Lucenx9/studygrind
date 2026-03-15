import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { checkClozeAnswer } from '@/lib/quiz-parser';
import { Check } from 'lucide-react';
import { t, type Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface RetypePromptProps {
  correctAnswer: string;
  language: Language;
  onComplete: () => void;
}

export function RetypePrompt({ correctAnswer, language, onComplete }: RetypePromptProps) {
  const [value, setValue] = useState('');
  const [matched, setMatched] = useState(false);

  const handleChange = (input: string) => {
    setValue(input);
    if (checkClozeAnswer(input, [correctAnswer])) {
      setMatched(true);
      setTimeout(onComplete, 400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      if (checkClozeAnswer(value, [correctAnswer])) {
        setMatched(true);
        setTimeout(onComplete, 400);
      }
    }
  };

  return (
    <div className="animate-fade-in-up space-y-3 rounded-[24px] border border-primary/20 bg-primary/6 p-5">
      <p className="text-sm font-medium text-primary">
        {t('quiz.retypeToContinue', language)}
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={correctAnswer}
          autoFocus
          className={cn(
            'min-h-12 transition-colors duration-200',
            matched && 'border-green-500 bg-green-50 dark:bg-green-500/12',
          )}
        />
        {matched && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-white animate-correct-pulse">
            <Check className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
