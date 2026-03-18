interface ProgressBarProps {
  current: number;
  total: number;
  results?: ('correct' | 'wrong' | null)[];
  label?: string;
  showSegments?: boolean;
}

export function ProgressBar({ current, total, results, label, showSegments = true }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(((current + (results?.[current] ? 1 : 0)) / total) * 100, 100) : 0;

  return (
    <div className="space-y-3">
      {label && <p className="text-center text-tertiary">{label}</p>}
      <div className="h-1 w-full overflow-hidden rounded-full bg-[color:var(--sg-surface-3)]">
        <div
          className="h-full rounded-full transition-all duration-600 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          }}
        />
      </div>
      {showSegments && (
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => {
            const result = results?.[i];
            const isCurrent = i === current;

            let bg = 'bg-[color:var(--sg-surface-3)]';
            if (result === 'correct') bg = 'bg-[#34d399]';
            else if (result === 'wrong') bg = 'bg-[#f87171]';
            else if (isCurrent) bg = 'bg-primary';

            return (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-[background-color] duration-300 ${bg}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
