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
    <Card className={`animate-fade-in-up overflow-hidden ${isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
      {/* Status banner */}
      <div className={`flex items-center gap-2 px-4 py-3 ${
        isCorrect
          ? 'bg-green-500/10 border-b border-green-500/20'
          : 'bg-red-500/10 border-b border-red-500/20'
      }`}>
        {isCorrect ? (
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        )}
        <span className={`font-semibold ${
          isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
        }`}>
          {isCorrect ? t('quiz.correct', language) : t('quiz.notQuiteRight', language)}
        </span>
      </div>

      <CardContent className="space-y-3 pt-4">
        <p className="text-sm leading-relaxed text-foreground/80">{explanation}</p>

        {onOpenChat && (
          <Button
            variant={isCorrect ? 'ghost' : 'default'}
            size="sm"
            className={`w-full gap-2 rounded-xl ${
              !isCorrect ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
            }`}
            onClick={onOpenChat}
          >
            {isCorrect ? <MessageCircle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {isCorrect ? t('chat.exploreDeeper', language) : t('chat.helpMeThink', language)}
            {hasChatHistory && <Badge variant="secondary" className="ml-1 text-xs">chat</Badge>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
