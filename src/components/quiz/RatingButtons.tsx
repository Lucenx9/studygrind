import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rating } from '@/lib/fsrs';
import type { Grade } from '@/lib/fsrs';
import { t, type Language } from '@/lib/i18n';

interface RatingButtonsProps {
  onRate: (rating: Grade) => void;
  language: Language;
  intervals?: { again: string; hard: string; good: string; easy: string };
}

const RATINGS: { rating: Grade; labelKey: 'rating.again' | 'rating.hard' | 'rating.good' | 'rating.easy'; descKey: 'rating.againDesc' | 'rating.hardDesc' | 'rating.goodDesc' | 'rating.easyDesc'; intervalKey: 'again' | 'hard' | 'good' | 'easy'; color: string; key: string }[] = [
  { rating: Rating.Again, labelKey: 'rating.again', descKey: 'rating.againDesc', intervalKey: 'again', color: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400', key: '1' },
  { rating: Rating.Hard, labelKey: 'rating.hard', descKey: 'rating.hardDesc', intervalKey: 'hard', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/40 text-orange-600 dark:text-orange-400', key: '2' },
  { rating: Rating.Good, labelKey: 'rating.good', descKey: 'rating.goodDesc', intervalKey: 'good', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400', key: '3' },
  { rating: Rating.Easy, labelKey: 'rating.easy', descKey: 'rating.easyDesc', intervalKey: 'easy', color: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-400', key: '4' },
];

export function RatingButtons({ onRate, language, intervals }: RatingButtonsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx >= 0) {
        e.preventDefault();
        onRate(RATINGS[idx].rating);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRate]);

  return (
    <div className="animate-fade-in-up space-y-4">
      <p className="text-sm text-muted-foreground text-center">{t('quiz.howWellDidYouKnow', language)}</p>
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
        {RATINGS.map(({ rating, labelKey, descKey, intervalKey, color, key }) => (
          <Button
            key={rating}
            variant="outline"
            onClick={() => onRate(rating)}
            className={`h-auto min-h-[108px] items-stretch rounded-[22px] p-4 text-left active:scale-95 ${color}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="block text-base font-semibold">{t(labelKey, language)}</span>
                <span className="block text-xs opacity-65">{t(descKey, language)}</span>
              </div>
              <kbd className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-mono opacity-40 dark:bg-white/5">{key}</kbd>
            </div>
            {intervals && (
              <div className="mt-4 flex items-center justify-between text-[11px] opacity-70">
                <span>{t('quiz.nextReview', language)}</span>
                <span className="font-mono">{intervals[intervalKey]}</span>
              </div>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
