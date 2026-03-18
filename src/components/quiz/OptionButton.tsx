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
        'cursor-pointer animate-fade-in-up flex w-full items-center gap-4 rounded-[16px] border px-4 py-4 text-left shadow-[var(--sg-card-shadow)] transition-all duration-200 active:scale-[0.985] sm:px-5',
        !isRevealed && !selected && 'border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] hover:-translate-y-0.5 hover:border-[rgba(99,102,241,0.28)] hover:bg-[rgba(99,102,241,0.04)]',
        !isRevealed && selected && 'border-[rgba(99,102,241,0.55)] bg-[rgba(99,102,241,0.08)] shadow-[0_16px_28px_-24px_rgba(99,102,241,0.75)]',
        isRevealed && isCorrect && 'border-[rgba(52,211,153,0.42)] bg-[rgba(52,211,153,0.08)] animate-correct-pulse',
        isWrong && 'border-[rgba(248,113,113,0.42)] bg-[rgba(248,113,113,0.08)] animate-shake',
        isRevealed && !isCorrect && !isWrong && 'border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-1)] opacity-55',
        disabled && !isRevealed && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-200',
        !isRevealed && !selected && 'bg-[color:var(--sg-surface-2)] text-muted-foreground',
        !isRevealed && selected && 'sg-btn-accent text-white',
        isRevealed && isCorrect && 'bg-[#34d399] text-white',
        isWrong && 'bg-[#f87171] text-white',
        isRevealed && !isCorrect && !isWrong && 'bg-[color:var(--sg-surface-2)] text-muted-foreground',
      )}>
        {isRevealed && isCorrect ? <Check className="h-4 w-4" strokeWidth={3} /> :
         isWrong ? <X className="h-4 w-4" strokeWidth={3} /> :
         LETTERS[index]}
      </span>

      <span className="flex-1 text-sm leading-relaxed sm:text-[15px]">{cleanLabel}</span>
    </button>
  );
}
