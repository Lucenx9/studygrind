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
        'cursor-pointer animate-fade-in-up flex w-full items-center gap-3.5 rounded-xl border px-4 py-4 text-left transition-all duration-200 active:scale-[0.985] sm:px-5',
        !isRevealed && !selected && 'border-border bg-[rgba(255,255,255,0.03)] hover:border-[rgba(99,102,241,0.25)] hover:bg-[rgba(99,102,241,0.03)]',
        !isRevealed && selected && 'border-[rgba(99,102,241,0.6)] bg-[rgba(99,102,241,0.08)]',
        isRevealed && isCorrect && 'border-[rgba(52,211,153,0.5)] bg-[rgba(52,211,153,0.08)] animate-correct-pulse',
        isWrong && 'border-[rgba(248,113,113,0.5)] bg-[rgba(248,113,113,0.08)] animate-shake',
        isRevealed && !isCorrect && !isWrong && 'border-border bg-[rgba(255,255,255,0.02)] opacity-50',
        disabled && !isRevealed && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-200',
        !isRevealed && !selected && 'bg-[rgba(255,255,255,0.05)] text-muted-foreground',
        !isRevealed && selected && 'sg-btn-accent text-white',
        isRevealed && isCorrect && 'bg-[#34d399] text-white',
        isWrong && 'bg-[#f87171] text-white',
        isRevealed && !isCorrect && !isWrong && 'bg-[rgba(255,255,255,0.05)] text-muted-foreground',
      )}>
        {isRevealed && isCorrect ? <Check className="h-4 w-4" strokeWidth={3} /> :
         isWrong ? <X className="h-4 w-4" strokeWidth={3} /> :
         LETTERS[index]}
      </span>

      <span className="flex-1 text-sm leading-relaxed sm:text-[15px]">{cleanLabel}</span>
    </button>
  );
}
