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
      <Card className="mx-auto max-w-[800px]">
        <CardContent className="space-y-5 px-6 py-8 sm:px-8">
          <Badge variant="secondary" className="w-fit">
            {t('quiz.fillBlank', language)}
          </Badge>
          <h2 className="text-[1.35rem] font-semibold leading-snug tracking-[-0.03em] sm:text-[1.5rem]">{question.question}</h2>
          <p className="text-sm text-muted-foreground">
            {language === 'it' ? 'Scrivi la risposta oppure usa il microfono per dettarla.' : 'Type the answer or use the microphone to dictate it.'}
          </p>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <Input
              ref={inputRef}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={voice.state === 'listening' ? t('quiz.listening', language) : t('quiz.typeAnswer', language)}
              disabled={revealed || disabled}
              className={cn(
                'min-h-12 flex-1',
                revealed && isCorrect && 'border-[#34d399] bg-[rgba(52,211,153,0.08)] ring-2 ring-[#34d399]/20',
                revealed && !isCorrect && 'border-[#f87171] bg-[rgba(248,113,113,0.08)] ring-2 ring-[#f87171]/20 animate-shake',
                voice.state === 'listening' && !revealed && 'border-[#f87171]',
                voice.interim && !revealed && 'italic text-muted-foreground',
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
                  voice.state === 'listening' && 'border-[#f87171] bg-[rgba(248,113,113,0.12)]',
                )}
              >
                {voice.state === 'listening' ? (
                  <MicOff className="h-4 w-4 text-[#f87171]" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            {!revealed && (
              <Button onClick={handleSubmit} disabled={!answer.trim() || disabled} variant="accent" className="shrink-0 sm:min-w-32">
                {t('quiz.check', language)}
              </Button>
            )}
          </div>

          {!revealed && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] px-3 py-1.5 text-[12px] text-muted-foreground">
              <span>{t('quiz.pressEnter', language)}</span>
              <kbd className="rounded-md border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] px-1.5 py-0.5 font-mono text-[10px] text-tertiary">Enter ↵</kbd>
            </div>
          )}

          {revealed && !isCorrect && (
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-2xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)] px-4 py-3">
              <span className="text-sm text-muted-foreground">{t('quiz.correctAnswer', language)}</span>
              <strong className="text-base text-[#34d399]">{question.acceptableAnswers[0]}</strong>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
