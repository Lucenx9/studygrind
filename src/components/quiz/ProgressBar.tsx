interface ProgressBarProps {
  current: number;
  total: number;
  results?: ('correct' | 'wrong' | null)[];
}

export function ProgressBar({ current, total, results }: ProgressBarProps) {
  const currentStep = total > 0 ? Math.min(current + 1, total) : 0;

  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="flex flex-1 gap-1">
        {Array.from({ length: total }, (_, i) => {
          const result = results?.[i];
          const isCurrent = i === current;
          const isPast = i < current;

          let color = 'bg-muted';
          if (result === 'correct') color = 'bg-green-500';
          else if (result === 'wrong') color = 'bg-red-400';
          else if (isCurrent) color = 'bg-primary';
          else if (isPast) color = 'bg-primary/40';

          return (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${color}`}
            />
          );
        })}
      </div>
      <span className="text-sm font-medium whitespace-nowrap">
        <span className="font-bold text-primary">{currentStep}</span>
        <span className="text-muted-foreground"> / {total}</span>
      </span>
    </div>
  );
}
