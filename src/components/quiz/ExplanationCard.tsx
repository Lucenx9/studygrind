import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, MessageCircle, Sparkles, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { t, type Language } from '@/lib/i18n';

interface ExplanationCardProps {
  explanation: string;
  isCorrect: boolean;
  language: Language;
  onOpenChat?: () => void;
  hasChatHistory?: boolean;
}

export function ExplanationCard({ explanation, isCorrect, language, onOpenChat, hasChatHistory }: ExplanationCardProps) {
  return (
    <div className="animate-slide-down overflow-hidden rounded-[18px] border border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] shadow-[var(--sg-card-shadow)]">
      <div className={`flex items-center justify-between gap-3 px-5 py-4 ${
        isCorrect
          ? 'border-b border-[rgba(52,211,153,0.18)] bg-[rgba(52,211,153,0.08)]'
          : 'border-b border-[rgba(248,113,113,0.18)] bg-[rgba(248,113,113,0.08)]'
      }`}>
        <div className="flex items-center gap-2.5">
          {isCorrect ? (
            <CheckCircle className="h-5 w-5 text-[#34d399]" />
          ) : (
            <XCircle className="h-5 w-5 text-[#f87171]" />
          )}
          <span className={`text-base font-bold tracking-tight ${
            isCorrect ? 'text-[#34d399]' : 'text-[#f87171]'
          }`}>
            {isCorrect ? t('quiz.correct', language) : t('quiz.notQuiteRight', language)}
          </span>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {isCorrect ? (language === 'it' ? 'Vai avanti' : 'Keep going') : (language === 'it' ? 'Fissa il concetto' : 'Lock it in')}
        </Badge>
      </div>

      <div className="bg-[rgba(96,165,250,0.08)]">
        <div className="border-l-[3px] border-[#60a5fa] px-5 py-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#60a5fa]" />
              <span className="text-tertiary !text-[#60a5fa]">
                {language === 'it' ? 'Spiegazione' : 'Explanation'}
              </span>
            </div>
            <p className="text-sm leading-7 text-foreground/84">{explanation}</p>

            {onOpenChat && (
              <Button
                variant={isCorrect ? 'outline' : 'accent'}
                size={isCorrect ? 'sm' : 'default'}
                className={isCorrect ? 'w-fit gap-2 rounded-xl' : 'w-full justify-between gap-3 rounded-xl'}
                onClick={onOpenChat}
              >
                <span className="flex items-center gap-2">
                  {isCorrect ? <MessageCircle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  {isCorrect
                    ? (language === 'it' ? 'Approfondisci' : 'Go deeper')
                    : t('chat.helpMeThink', language)}
                </span>
                {hasChatHistory && <Badge variant="secondary" className="text-[10px]">{t('chat.resume', language)}</Badge>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
