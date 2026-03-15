import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Trophy } from 'lucide-react';
import { t, type Language } from '@/lib/i18n';

interface SessionSummaryProps {
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  language: Language;
  onClose: () => void;
}

function AccuracyRing({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/50" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  );
}

export function SessionSummary({ totalQuestions, correctAnswers, durationSeconds, language, onClose }: SessionSummaryProps) {
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  const message = accuracy >= 90
    ? (language === 'it' ? 'Eccezionale!' : 'Outstanding!')
    : accuracy >= 70
    ? (language === 'it' ? 'Ottimo lavoro, continua così!' : 'Good work, keep it up!')
    : (language === 'it' ? 'Continua a esercitarti, stai migliorando!' : 'Keep practicing, you\'re improving!');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <Trophy className="h-14 w-14 mx-auto text-yellow-500 animate-celebrate" />
        <h2 className="text-2xl font-bold animate-fade-in-up">{t('session.complete', language)}</h2>
        <p className="text-muted-foreground animate-fade-in-up" style={{ animationDelay: '100ms' }}>{message}</p>
      </div>

      {/* Accuracy ring */}
      <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <AccuracyRing value={accuracy} />
      </div>

      <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" /> {t('session.correct', language)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{correctAnswers}/{totalQuestions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4 text-blue-500" /> {t('session.time', language)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{minutes}:{String(seconds).padStart(2, '0')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <Button onClick={onClose} className="w-full rounded-xl" size="lg">
          {t('session.done', language)}
        </Button>
      </div>
    </div>
  );
}
