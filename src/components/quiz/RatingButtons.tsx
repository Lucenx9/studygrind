import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Rating } from '@/lib/fsrs';
import type { Grade } from '@/lib/fsrs';
import { t, type Language } from '@/lib/i18n';

interface RatingButtonsProps {
  onRate: (rating: Grade) => void;
  language: Language;
  intervals?: { again: string; hard: string; good: string; easy: string };
}

const RATINGS: { rating: Grade; labelKey: 'rating.again' | 'rating.hard' | 'rating.good' | 'rating.easy'; descKey: 'rating.againDesc' | 'rating.hardDesc' | 'rating.goodDesc' | 'rating.easyDesc'; intervalKey: 'again' | 'hard' | 'good' | 'easy'; color: string; key: string; emoji: string }[] = [
  { rating: Rating.Again, labelKey: 'rating.again', descKey: 'rating.againDesc', intervalKey: 'again', color: 'bg-red-500/8 hover:bg-red-500/18 border-red-500/35 text-red-600 dark:text-red-400', key: '1', emoji: '🔄' },
  { rating: Rating.Hard, labelKey: 'rating.hard', descKey: 'rating.hardDesc', intervalKey: 'hard', color: 'bg-orange-500/8 hover:bg-orange-500/18 border-orange-500/35 text-orange-600 dark:text-orange-400', key: '2', emoji: '😤' },
  { rating: Rating.Good, labelKey: 'rating.good', descKey: 'rating.goodDesc', intervalKey: 'good', color: 'bg-blue-500/8 hover:bg-blue-500/18 border-blue-500/35 text-blue-600 dark:text-blue-400', key: '3', emoji: '👍' },
  { rating: Rating.Easy, labelKey: 'rating.easy', descKey: 'rating.easyDesc', intervalKey: 'easy', color: 'bg-green-500/8 hover:bg-green-500/18 border-green-500/35 text-green-600 dark:text-green-400', key: '4', emoji: '⚡' },
];

export function RatingButtons({ onRate, language, intervals }: RatingButtonsProps) {
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus container so keyboard shortcuts work immediately
  useEffect(() => { containerRef.current?.focus(); }, []);

  // WCAG 2.1.4: shortcuts scoped to focused container, not global
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (submitted) return;
    const idx = ['1', '2', '3', '4'].indexOf(e.key);
    if (idx >= 0) {
      e.preventDefault();
      setSubmitted(true);
      onRate(RATINGS[idx].rating);
    }
  };

  const handleClick = (rating: Grade) => {
    if (submitted) return;
    setSubmitted(true);
    onRate(rating);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="animate-fade-in-up space-y-4 outline-none"
      aria-label={t('quiz.howWellDidYouKnow', language)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{t('quiz.howWellDidYouKnow', language)}</p>
        <p className="text-tertiary">{language === 'it' ? 'Usa 1-4' : 'Use 1-4'}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RATINGS.map(({ rating, labelKey, descKey, intervalKey, color, key, emoji }, idx) => (
          <Button
            key={rating}
            variant="outline"
            onClick={() => handleClick(rating)}
            disabled={submitted}
            style={{ animationDelay: `${idx * 60}ms` }}
            className={`animate-fade-in-up flex h-auto min-h-[112px] flex-col items-start rounded-[18px] px-3.5 py-3.5 text-left active:scale-95 ${color}`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="text-base" aria-hidden="true">{emoji}</span>
                <span className="text-sm font-bold">{t(labelKey, language)}</span>
              </span>
              <kbd className="rounded-md border border-current/10 bg-black/5 px-1.5 py-0.5 text-[9px] font-mono opacity-45 dark:bg-white/5">{key}</kbd>
            </div>
            <span className="self-start text-[11px] opacity-60">{t(descKey, language)}</span>
            {intervals && (
              <span className="mt-2 rounded-full border border-current/10 px-2 py-1 text-xs font-semibold font-mono opacity-80">{intervals[intervalKey]}</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
