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
    <div className="animate-slide-down space-y-0">
      {/* Status banner */}
      <div className={`flex items-center justify-center gap-2.5 rounded-t-xl px-5 py-3.5 ${
        isCorrect
          ? 'bg-[rgba(52,211,153,0.1)] border border-b-0 border-[rgba(52,211,153,0.2)]'
          : 'bg-[rgba(248,113,113,0.1)] border border-b-0 border-[rgba(248,113,113,0.2)]'
      }`}>
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

      {/* Explanation body — sky blue accent */}
      <div className="rounded-b-xl border border-[rgba(96,165,250,0.15)] border-t-0 bg-[rgba(96,165,250,0.06)]">
        <div className="border-l-[3px] border-[#60a5fa] px-5 py-5 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#60a5fa]" />
            <span className="text-tertiary !text-[#60a5fa]">
              {language === 'it' ? 'Spiegazione' : 'Explanation'}
            </span>
          </div>
          <p className="text-sm leading-7 text-foreground/80">{explanation}</p>

          {onOpenChat && (
            <Button
              variant={isCorrect ? 'ghost' : 'accent'}
              size="sm"
              className="w-full justify-between gap-3 rounded-lg"
              onClick={onOpenChat}
            >
              <span className="flex items-center gap-2">
                {isCorrect ? <MessageCircle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {isCorrect ? t('chat.exploreDeeper', language) : t('chat.helpMeThink', language)}
              </span>
              {hasChatHistory && <Badge variant="secondary" className="text-xs">{t('chat.resume', language)}</Badge>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
