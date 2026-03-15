import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { checkClozeAnswer } from '@/lib/quiz-parser';
import { Check } from 'lucide-react';
import type { Language } from '@/lib/i18n';
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
    <div className="animate-fade-in-up rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
      <p className="text-sm font-medium text-primary">
        {language === 'it' ? 'Riscrivi la risposta corretta per continuare:' : 'Type the correct answer to continue:'}
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={correctAnswer}
          autoFocus
          className={cn(
            'transition-colors duration-200',
            matched && 'border-green-500 bg-green-50 dark:bg-green-500/12',
          )}
        />
        {matched && (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white shrink-0 animate-correct-pulse">
            <Check className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
