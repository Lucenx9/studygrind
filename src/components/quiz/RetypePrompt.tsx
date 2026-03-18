import { useState, useRef, useEffect } from 'react';
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
  const headingRef = useRef<HTMLParagraphElement>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus heading first for screen reader context, then user tabs to input
  useEffect(() => { headingRef.current?.focus(); }, []);
  useEffect(() => {
    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  const scheduleComplete = () => {
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
    }
    completeTimerRef.current = setTimeout(() => {
      completeTimerRef.current = null;
      onComplete();
    }, 400);
  };

  const handleChange = (input: string) => {
    setValue(input);
    if (!matched && checkClozeAnswer(input, [correctAnswer])) {
      setMatched(true);
      scheduleComplete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      e.stopPropagation();
      if (!matched && checkClozeAnswer(value, [correctAnswer])) {
        setMatched(true);
        scheduleComplete();
      }
    }
  };

  return (
    <div className="animate-fade-in-up space-y-4 rounded-[18px] border border-[rgba(99,102,241,0.22)] bg-[rgba(99,102,241,0.06)] p-5 shadow-[var(--sg-card-shadow)]">
      <div className="space-y-1">
        <p ref={headingRef} tabIndex={-1} className="text-sm font-semibold text-primary outline-none">
          {t('quiz.retypeToContinue', language)}
        </p>
        <p className="text-xs text-muted-foreground">
          {language === 'it' ? 'Ripetere la risposta corretta aiuta a consolidarla prima del prossimo intervallo.' : 'Re-typing the correct answer helps reinforce it before the next interval.'}
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={correctAnswer}
          aria-label={t('quiz.correctAnswer', language)}
          className={cn(
            'min-h-12 transition-colors duration-200',
            matched && 'border-[#34d399] bg-[rgba(52,211,153,0.08)]',
          )}
        />
        {matched && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#34d399] text-white animate-correct-pulse">
            <Check className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
