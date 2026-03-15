import { useState, useEffect } from 'react';
import type { ClozeQuestion as ClozeQuestionType } from '@/lib/types';
import { checkClozeAnswer } from '@/lib/quiz-parser';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { Mic, MicOff } from 'lucide-react';

interface ClozeQuestionProps {
  question: ClozeQuestionType;
  onSubmit: (answer: string, correct: boolean) => void;
  disabled: boolean;
  language?: Language;
}

export function ClozeQuestion({ question, onSubmit, disabled, language = 'it' }: ClozeQuestionProps) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const voice = useVoiceInput(language);

  const handleVoiceResult = (transcript: string) => {
    setAnswer(transcript);
    setTimeout(() => {
      const correct = checkClozeAnswer(transcript, question.acceptableAnswers);
      setIsCorrect(correct);
      setRevealed(true);
      onSubmit(transcript, correct);
    }, 300);
  };

  useEffect(() => {
    if (voice.interim && !revealed) {
      setAnswer(voice.interim);
    }
  }, [voice.interim, revealed]);

  const handleSubmit = () => {
    if (!answer.trim() || revealed) return;
    const correct = checkClozeAnswer(answer, question.acceptableAnswers);
    setIsCorrect(correct);
    setRevealed(true);
    onSubmit(answer, correct);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleMicToggle = () => {
    if (voice.state === 'listening') {
      voice.stopListening();
    } else {
      voice.startListening(handleVoiceResult);
    }
  };

  return (
    <div className="animate-slide-in-question space-y-4">
      <h2 className="text-xl font-semibold leading-relaxed border-l-3 border-primary pl-4">{question.question}</h2>
      <div className="flex gap-2">
        <Input
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={voice.state === 'listening' ? t('quiz.listening', language) : t('quiz.typeAnswer', language)}
          disabled={revealed || disabled}
          className={cn(
            revealed && isCorrect && 'border-green-500 bg-green-500/10 ring-2 ring-green-500/30',
            revealed && !isCorrect && 'border-red-500 bg-red-500/10 ring-2 ring-red-500/30 animate-shake',
            voice.state === 'listening' && !revealed && 'border-red-400',
            voice.interim && !revealed && 'text-muted-foreground italic',
          )}
        />
        {voice.isSupported && !revealed && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleMicToggle}
            disabled={disabled}
            className={cn(
              'shrink-0',
              voice.state === 'listening' && 'border-red-500 bg-red-500/10 animate-pulse',
            )}
          >
            {voice.state === 'listening' ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
        {!revealed && (
          <Button onClick={handleSubmit} disabled={!answer.trim() || disabled} className="shrink-0">
            {t('quiz.check', language)}
          </Button>
        )}
      </div>
      {revealed && !isCorrect && (
        <div className="animate-fade-in-up inline-flex items-center gap-2 bg-green-500/10 rounded-lg px-3 py-2">
          <span className="text-sm text-muted-foreground">{t('quiz.correctAnswer', language)}</span>
          <strong className="text-base text-green-600 dark:text-green-400">{question.acceptableAnswers[0]}</strong>
        </div>
      )}
    </div>
  );
}
