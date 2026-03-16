import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, MessageCircle, Sparkles } from 'lucide-react';
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
    <div className="animate-fade-in-up space-y-0">
      {/* Divider with gradient */}
      <div className={`mx-auto h-px w-3/4 ${isCorrect ? 'bg-gradient-to-r from-transparent via-green-500/40 to-transparent' : 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent'}`} />

      <Card className={`mt-4 overflow-hidden ${isCorrect ? 'border-green-500/25' : 'border-red-500/25'}`}>
        {/* Status banner */}
        <div className={`flex items-center justify-center gap-2.5 px-5 py-4 ${
          isCorrect
            ? 'bg-green-50 dark:bg-green-500/12 border-b border-green-500/15'
            : 'bg-red-50 dark:bg-red-500/12 border-b border-red-500/15'
        }`}>
          {isCorrect ? (
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
          <span className={`text-lg font-bold tracking-tight ${
            isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
          }`}>
            {isCorrect ? t('quiz.correct', language) : t('quiz.notQuiteRight', language)}
          </span>
        </div>

        <CardContent className="space-y-4 px-5 py-5">
          <p className="text-sm leading-7 text-foreground/80">{explanation}</p>

          {onOpenChat && (
            <Button
              variant={isCorrect ? 'ghost' : 'default'}
              size="sm"
              className={`w-full justify-between gap-3 rounded-xl ${
                !isCorrect ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''
              }`}
              onClick={onOpenChat}
            >
              <span className="flex items-center gap-2">
                {isCorrect ? <MessageCircle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {isCorrect ? t('chat.exploreDeeper', language) : t('chat.helpMeThink', language)}
              </span>
              {hasChatHistory && <Badge variant="secondary" className="text-xs">{t('chat.resume', language)}</Badge>}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
