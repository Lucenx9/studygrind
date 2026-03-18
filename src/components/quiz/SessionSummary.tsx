import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getQuestions } from '@/lib/storage';
import { t, type Language } from '@/lib/i18n';
import { ArrowRight, CheckCircle, Clock, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SessionSummaryProps {
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  language: Language;
  onClose: () => void;
  onGoHome?: () => void;
  onGoMore?: () => void;
}

function AccuracyRing({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: reducedMotion ? 'none' : 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{value}%</span>
      </div>
    </div>
  );
}

export function SessionSummary({
  totalQuestions,
  correctAnswers,
  durationSeconds,
  language,
  onClose,
  onGoHome,
  onGoMore,
}: SessionSummaryProps) {
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const reducedMotion = prefersReducedMotion();
  const nextReview = getNextReviewLabel(language);

  const message = accuracy >= 90
    ? t('session.outstanding', language)
    : accuracy >= 70
      ? t('session.goodWork', language)
      : t('session.keepPracticing', language);

  useEffect(() => {
    if (!reducedMotion && accuracy >= 50) {
      const intensity = accuracy >= 90 ? 1 : accuracy >= 70 ? 0.6 : 0.3;
      confetti({
        particleCount: Math.round(100 * intensity),
        spread: 70 + 30 * intensity,
        origin: { y: 0.6 },
        colors: ['#34d399', '#6366f1', '#fbbf24', '#8b5cf6'],
      });
    }
  }, [accuracy, reducedMotion]);

  return (
    <div className="animate-fade-in-up mx-auto max-w-[980px] space-y-6">
      <div className="h-1 w-full overflow-hidden rounded-full bg-[color:var(--sg-surface-3)]">
        <div className="h-full rounded-full animate-progress-fill" style={{ width: '100%', background: '#34d399' }} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="overflow-hidden border-[rgba(52,211,153,0.18)] bg-[linear-gradient(180deg,rgba(52,211,153,0.08),rgba(255,255,255,0.02))]">
          <CardContent className="space-y-6 px-6 py-7 text-center sm:px-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(99,102,241,0.1)]">
              <Trophy className="h-10 w-10 text-[#fbbf24] animate-celebrate" />
            </div>

            <div className="space-y-3">
              <h2 className="text-[1.7rem] font-bold tracking-[-0.03em]">{t('session.complete', language)}</h2>
              <p className="text-base text-muted-foreground">
                {language === 'it'
                  ? `Hai risposto a ${totalQuestions} domande. Prossimo ripasso tra `
                  : `You answered ${totalQuestions} questions. Next review in `}
                <strong className="text-foreground">{nextReview}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>

            <div className="mx-auto max-w-[200px]">
              <AccuracyRing value={accuracy} reducedMotion={reducedMotion} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <CheckCircle className="h-3.5 w-3.5 text-[#34d399]" />
                {language === 'it' ? 'Corrette' : 'Correct'} {accuracy}%
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <Clock className="h-3.5 w-3.5 text-[#60a5fa]" />
                {language === 'it' ? 'Tempo' : 'Time'} {minutes}:{String(seconds).padStart(2, '0')}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {language === 'it' ? 'Domande' : 'Questions'} {totalQuestions}
              </Badge>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="accent" onClick={onGoHome ?? onClose} size="lg" className="gap-2">
                {language === 'it' ? 'Torna alla dashboard' : 'Back to dashboard'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={onGoMore ?? onClose} size="lg">
                {language === 'it' ? 'Ripassa altro' : 'Review more'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 px-5 py-6">
            <Badge variant="secondary" className="w-fit">
              {language === 'it' ? 'Tip di studio' : 'Study tip'}
            </Badge>
            <h3 className="text-lg font-semibold tracking-[-0.02em]">
              {language === 'it' ? 'La spaced repetition funziona meglio con sessioni brevi e frequenti.' : 'Spaced repetition works best with short, frequent sessions.'}
            </h3>
            <p className="text-sm leading-7 text-muted-foreground">
              {language === 'it'
                ? 'Rivedere poco ma spesso mantiene alta la ritenzione e riduce il carico mentale quando le carte tornano in coda.'
                : 'Small, consistent review blocks keep retention high and reduce the mental load when cards come back due.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getNextReviewLabel(language: Language): string {
  const now = new Date();
  const nextDue = getQuestions()
    .map((question) => new Date(question.fsrsCard.due))
    .filter((date) => Number.isFinite(date.getTime()) && date.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!nextDue) {
    return language === 'it' ? 'presto' : 'soon';
  }

  const diffMs = nextDue.getTime() - now.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return language === 'it' ? `${diffHours} ore` : `${diffHours} hours`;
  }

  const diffDays = Math.round(diffHours / 24);
  return language === 'it' ? `${diffDays} giorni` : `${diffDays} days`;
}
