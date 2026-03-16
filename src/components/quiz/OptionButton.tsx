import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface OptionButtonProps {
  label: string;
  index: number;
  selected: boolean;
  correctIndex: number | null;
  disabled: boolean;
  onClick: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D'];
const LABEL_PREFIX_RE = /^[[(]?(?:[A-Da-d]|[1-4])(?:[.):\]])?\s*/;

export function OptionButton({ label, index, selected, correctIndex, disabled, onClick }: OptionButtonProps) {
  // Strip any leftover A)/B)/1. prefix — the badge already shows the letter
  const cleanLabel = label.replace(LABEL_PREFIX_RE, '').trim() || label;
  const isRevealed = correctIndex !== null;
  const isCorrect = index === correctIndex;
  const isWrong = isRevealed && selected && !isCorrect;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      style={{ animationDelay: `${index * 50}ms` }}
      className={cn(
        'cursor-pointer animate-fade-in-up flex w-full items-center gap-3.5 rounded-2xl border p-3 text-left transition-all duration-250 active:scale-[0.985] sm:p-4',
        !isRevealed && !selected && 'border-border/60 bg-card/50 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-[0_12px_28px_-20px_rgba(79,128,255,0.65)]',
        !isRevealed && selected && 'border-primary/70 bg-primary/8 ring-2 ring-primary/20 shadow-[0_12px_28px_-18px_rgba(79,128,255,0.5)]',
        isRevealed && isCorrect && 'border-green-500/60 bg-green-500/8 ring-2 ring-green-500/25 dark:bg-green-500/10 animate-correct-pulse',
        isWrong && 'border-red-500/60 bg-red-500/8 ring-2 ring-red-500/25 dark:bg-red-500/10 animate-shake',
        isRevealed && !isCorrect && !isWrong && 'border-border/40 bg-card/30 opacity-55',
        disabled && !isRevealed && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all duration-250',
        !isRevealed && !selected && 'bg-secondary/80 text-muted-foreground',
        !isRevealed && selected && 'bg-primary text-primary-foreground shadow-[0_4px_12px_-4px_rgba(79,128,255,0.5)]',
        isRevealed && isCorrect && 'bg-green-500 text-white shadow-[0_4px_12px_-4px_rgba(34,197,94,0.5)]',
        isWrong && 'bg-red-500 text-white shadow-[0_4px_12px_-4px_rgba(239,68,68,0.5)]',
        isRevealed && !isCorrect && !isWrong && 'bg-muted/60 text-muted-foreground',
      )}>
        {isRevealed && isCorrect ? <Check className="h-4 w-4" strokeWidth={3} /> :
         isWrong ? <X className="h-4 w-4" strokeWidth={3} /> :
         LETTERS[index]}
      </span>

      <span className="flex-1 text-sm leading-relaxed sm:text-[15px]">{cleanLabel}</span>
    </button>
  );
}
