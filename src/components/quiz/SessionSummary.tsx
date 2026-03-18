import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Trophy, ArrowRight } from 'lucide-react';
import { t, type Language } from '@/lib/i18n';
import confetti from 'canvas-confetti';

interface SessionSummaryProps {
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  language: Language;
  onClose: () => void;
}

function AccuracyRing({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: reducedMotion ? 'none' : 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{value}%</span>
      </div>
    </div>
  );
}

export function SessionSummary({ totalQuestions, correctAnswers, durationSeconds, language, onClose }: SessionSummaryProps) {
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const reducedMotion = prefersReducedMotion();

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
    <div className="animate-fade-in-up mx-auto max-w-2xl space-y-8">
      {/* Progress bar — full at 100% emerald */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full animate-progress-fill"
          style={{ width: '100%', background: '#34d399' }}
        />
      </div>

      {/* Celebration hero */}
      <div className="text-center space-y-3">
        <Trophy className="h-16 w-16 mx-auto text-[#fbbf24] animate-celebrate" />
        <h2 className="text-[28px] font-bold tracking-[-0.025em] animate-fade-in-up">
          {t('session.complete', language)}
        </h2>
        <p className="text-base text-muted-foreground animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {message}
        </p>
      </div>

      {/* Accuracy ring */}
      <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <AccuracyRing value={accuracy} reducedMotion={reducedMotion} />
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <CheckCircle className="h-3.5 w-3.5 text-[#34d399]" />
          {language === 'it' ? 'Corrette' : 'Correct'}: {correctAnswers}/{totalQuestions}
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <Clock className="h-3.5 w-3.5 text-[#60a5fa]" />
          {language === 'it' ? 'Tempo' : 'Time'}: {minutes}:{String(seconds).padStart(2, '0')}
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          {language === 'it' ? 'Domande' : 'Questions'}: {totalQuestions}
        </Badge>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <Button variant="accent" onClick={onClose} size="lg" className="gap-2">
          {language === 'it' ? 'Torna alla dashboard' : 'Back to dashboard'}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onClose} size="lg">
          {language === 'it' ? 'Ripassa altro' : 'Review more'}
        </Button>
      </div>
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
