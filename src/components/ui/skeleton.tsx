import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-[color:var(--sg-surface-2)] animate-pulse',
        className,
      )}
    />
  );
}
