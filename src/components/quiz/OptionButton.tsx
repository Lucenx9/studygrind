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
        'animate-fade-in-up w-full rounded-xl border p-4 text-left text-sm transition-all flex items-center gap-3',
        !isRevealed && !selected && 'border-border hover:border-primary/50 hover:bg-accent/50',
        !isRevealed && selected && 'border-primary bg-primary/10 ring-2 ring-primary/20',
        isRevealed && isCorrect && 'border-green-500 bg-green-500/10 animate-correct-pulse',
        isWrong && 'border-red-500 bg-red-500/10 animate-shake',
        isRevealed && !isCorrect && !isWrong && 'border-border opacity-40',
        disabled && !isRevealed && 'cursor-not-allowed opacity-50',
      )}
    >
      {/* Letter badge */}
      <span className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
        !isRevealed && !selected && 'bg-muted text-muted-foreground',
        !isRevealed && selected && 'bg-primary text-primary-foreground',
        isRevealed && isCorrect && 'bg-green-500 text-white',
        isWrong && 'bg-red-500 text-white',
        isRevealed && !isCorrect && !isWrong && 'bg-muted text-muted-foreground',
      )}>
        {isRevealed && isCorrect ? <Check className="h-3.5 w-3.5" /> :
         isWrong ? <X className="h-3.5 w-3.5" /> :
         LETTERS[index]}
      </span>

      <span className="flex-1">{label}</span>
    </button>
  );
}
