import { useEffect, useState } from 'react';
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
  const [submitted, setSubmitted] = useState(false);

  // Keyboard shortcuts 1-4 — guarded against input focus and double-fire
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (submitted) return;
      // Use document.activeElement to catch ALL focused inputs (including RetypePrompt)
      const focused = document.activeElement;
      if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) return;

      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx >= 0) {
        e.preventDefault();
        setSubmitted(true);
        onRate(RATINGS[idx].rating);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRate, submitted]);

  const handleClick = (rating: Grade) => {
    if (submitted) return;
    setSubmitted(true);
    onRate(rating);
  };

  return (
    <div className="animate-fade-in-up space-y-3">
      <p className="text-sm text-muted-foreground text-center">{t('quiz.howWellDidYouKnow', language)}</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {RATINGS.map(({ rating, labelKey, descKey, intervalKey, color, key }) => (
          <Button
            key={rating}
            variant="outline"
            onClick={() => handleClick(rating)}
            disabled={submitted}
            className={`flex flex-col h-auto min-h-[80px] rounded-2xl px-3 py-3 active:scale-95 transition-transform duration-100 ${color}`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-semibold">{t(labelKey, language)}</span>
              <kbd className="rounded bg-black/5 px-1 py-0.5 text-[9px] font-mono opacity-40 dark:bg-white/5">{key}</kbd>
            </div>
            <span className="text-[11px] opacity-60 self-start">{t(descKey, language)}</span>
            {intervals && (
              <span className="text-[11px] opacity-50 font-mono self-start mt-1">{intervals[intervalKey]}</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
