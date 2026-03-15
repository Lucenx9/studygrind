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

export function OptionButton({ label, index, selected, correctIndex, disabled, onClick }: OptionButtonProps) {
  const isRevealed = correctIndex !== null;
  const isCorrect = index === correctIndex;
  const isWrong = isRevealed && selected && !isCorrect;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        'cursor-pointer animate-fade-in-up w-full rounded-2xl border p-5 text-left transition-colors duration-150 flex items-center gap-3 active:scale-[0.98]',
        !isRevealed && !selected && 'border-border hover:border-primary/40 hover:bg-primary/5',
        !isRevealed && selected && 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm',
        isRevealed && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-500/12 animate-correct-pulse',
        isWrong && 'border-red-500 bg-red-50 dark:bg-red-500/12 animate-shake',
        isRevealed && !isCorrect && !isWrong && 'border-border opacity-40',
        disabled && !isRevealed && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
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

      <span className="flex-1 text-[15px] leading-snug">{label}</span>
    </button>
  );
}
