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
  { rating: Rating.Again, labelKey: 'rating.again', descKey: 'rating.againDesc', intervalKey: 'again', color: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-400', key: '1' },
  { rating: Rating.Hard, labelKey: 'rating.hard', descKey: 'rating.hardDesc', intervalKey: 'hard', color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-700 dark:text-orange-400', key: '2' },
  { rating: Rating.Good, labelKey: 'rating.good', descKey: 'rating.goodDesc', intervalKey: 'good', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-400', key: '3' },
  { rating: Rating.Easy, labelKey: 'rating.easy', descKey: 'rating.easyDesc', intervalKey: 'easy', color: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-400', key: '4' },
];

export function RatingButtons({ onRate, language, intervals }: RatingButtonsProps) {
  // Keyboard shortcuts 1-4
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
    <div className="animate-fade-in-up space-y-2">
      <p className="text-sm text-muted-foreground text-center">{t('quiz.howWellDidYouKnow', language)}</p>
      <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
        {RATINGS.map(({ rating, labelKey, descKey, intervalKey, color, key }) => (
          <Button
            key={rating}
            variant="outline"
            onClick={() => onRate(rating)}
            className={`flex flex-col h-auto py-4 rounded-xl active:scale-95 transition-transform duration-100 ${color}`}
          >
            <span className="font-semibold">{t(labelKey, language)}</span>
            <span className="text-xs opacity-70">{t(descKey, language)}</span>
            {intervals && (
              <span className="text-[10px] opacity-50 font-mono mt-1">{intervals[intervalKey]}</span>
            )}
            <kbd className="mt-1 text-[10px] opacity-40 bg-black/5 dark:bg-white/5 rounded px-1.5 py-0.5 font-mono">{key}</kbd>
          </Button>
        ))}
      </div>
    </div>
  );
}
