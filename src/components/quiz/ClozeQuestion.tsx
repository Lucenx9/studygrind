import { useState, useEffect, useRef } from 'react';
import type { ClozeQuestion as ClozeQuestionType } from '@/lib/types';
import { checkClozeAnswer } from '@/lib/quiz-parser';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { Mic, MicOff } from 'lucide-react';
import { playCorrectSound, playWrongSound } from '@/lib/sounds';

interface ClozeQuestionProps {
  question: ClozeQuestionType;
  onSubmit: (answer: string, correct: boolean) => void;
  disabled: boolean;
  language?: Language;
  /** Pre-filled answer when restoring a session in feedback phase */
  initialAnswer?: string | null;
  initialCorrect?: boolean | null;
}

export function ClozeQuestion({ question, onSubmit, disabled, language = 'it', initialAnswer, initialCorrect }: ClozeQuestionProps) {
  const [answer, setAnswer] = useState(typeof initialAnswer === 'string' ? initialAnswer : '');
  const [revealed, setRevealed] = useState(initialAnswer != null);
  const [isCorrect, setIsCorrect] = useState(initialCorrect ?? false);
  const voice = useVoiceInput(language);
  const voiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup voice auto-submit timer on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => { if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current); };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [question.id]);

  const handleVoiceResult = (transcript: string) => {
    if (revealed || disabled) return;
    setAnswer(transcript);
    if (voiceTimerRef.current) {
      clearTimeout(voiceTimerRef.current);
    }
    voiceTimerRef.current = setTimeout(() => {
      voiceTimerRef.current = null;
      const correct = checkClozeAnswer(transcript, question.acceptableAnswers);
      setIsCorrect(correct);
      setRevealed(true);
      if (correct) playCorrectSound();
      else playWrongSound();
      onSubmit(transcript, correct);
    }, 300);
  };

  useEffect(() => {
    if (voice.interim && !revealed) {
      setAnswer(voice.interim);
    }
  }, [voice.interim, revealed]);

  const handleSubmit = () => {
    if (!answer.trim() || revealed || disabled) return;
    const correct = checkClozeAnswer(answer, question.acceptableAnswers);
    setIsCorrect(correct);
    setRevealed(true);
    if (correct) playCorrectSound();
    else playWrongSound();
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
    <div className="animate-slide-in-question space-y-5">
      <Card className="border-primary/15 bg-card/92">
        <CardContent className="space-y-4 px-6 py-6">
          <Badge variant="secondary" className="bg-primary/12 text-primary">
            {t('quiz.fillBlank', language)}
          </Badge>
          <h2 className="text-xl font-semibold leading-snug tracking-[-0.02em] sm:text-2xl">{question.question}</h2>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          ref={inputRef}
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={voice.state === 'listening' ? t('quiz.listening', language) : t('quiz.typeAnswer', language)}
          disabled={revealed || disabled}
          className={cn(
            'min-h-12 flex-1',
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
            aria-label={
              voice.state === 'listening'
                ? t('quiz.stopVoiceInput', language)
                : t('quiz.startVoiceInput', language)
            }
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
          <Button onClick={handleSubmit} disabled={!answer.trim() || disabled} className="shrink-0 sm:min-w-32">
            {t('quiz.check', language)}
          </Button>
        )}
      </div>
      {!revealed && (
        <p className="text-xs text-muted-foreground">{t('quiz.pressEnter', language)}</p>
      )}
      {revealed && !isCorrect && (
        <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-2xl bg-green-500/10 px-4 py-3">
          <span className="text-sm text-muted-foreground">{t('quiz.correctAnswer', language)}</span>
          <strong className="text-base text-green-600 dark:text-green-400">{question.acceptableAnswers[0]}</strong>
        </div>
      )}
    </div>
  );
}
