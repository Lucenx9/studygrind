interface ProgressBarProps {
  current: number;
  total: number;
  results?: ('correct' | 'wrong' | null)[];
}

export function ProgressBar({ current, total, results }: ProgressBarProps) {
  const currentStep = total > 0 ? Math.min(current + 1, total) : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-1 gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const result = results?.[i];
          const isCurrent = i === current;
          const isPast = i < current;

          let color = 'bg-muted';
          if (result === 'correct') color = 'bg-green-500';
          else if (result === 'wrong') color = 'bg-red-400';
          else if (isCurrent) color = 'bg-primary';
          else if (isPast) color = 'bg-primary/35';

          return (
            <div
              key={i}
              className={`h-3 flex-1 rounded-full transition-[background-color,transform] duration-300 ${color}`}
            />
          );
        })}
      </div>
      <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <span className="text-primary">{currentStep}</span>
        <span className="text-muted-foreground"> / {total}</span>
      </div>
    </div>
  );
}
