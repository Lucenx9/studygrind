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
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        'cursor-pointer animate-fade-in-up flex w-full items-center gap-4 rounded-[22px] border p-4 text-left transition-[border-color,background-color,transform,opacity,box-shadow] duration-200 active:scale-[0.99] sm:p-5',
        !isRevealed && !selected && 'border-border/70 bg-card/65 hover:-translate-y-px hover:border-primary/35 hover:bg-primary/6 hover:shadow-[0_16px_30px_-26px_rgba(79,128,255,0.8)]',
        !isRevealed && selected && 'border-primary bg-primary/10 ring-2 ring-primary/25 shadow-[0_16px_30px_-24px_rgba(79,128,255,0.6)]',
        isRevealed && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-500/12 animate-correct-pulse',
        isWrong && 'border-red-500 bg-red-50 dark:bg-red-500/12 animate-shake',
        isRevealed && !isCorrect && !isWrong && 'border-border/70 bg-card/55 opacity-45',
        disabled && !isRevealed && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold transition-colors',
        !isRevealed && !selected && 'bg-secondary text-muted-foreground',
        !isRevealed && selected && 'bg-primary text-primary-foreground',
        isRevealed && isCorrect && 'bg-green-500 text-white',
        isWrong && 'bg-red-500 text-white',
        isRevealed && !isCorrect && !isWrong && 'bg-muted text-muted-foreground',
      )}>
        {isRevealed && isCorrect ? <Check className="h-4 w-4" /> :
         isWrong ? <X className="h-4 w-4" /> :
         LETTERS[index]}
      </span>

      <span className="flex-1 text-[15px] leading-relaxed sm:text-base">{cleanLabel}</span>
    </button>
  );
}
