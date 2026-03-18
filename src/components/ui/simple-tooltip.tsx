interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
}

export function SimpleTooltip({ content, children }: SimpleTooltipProps) {
  return (
    <div className="group/tip relative inline-flex">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-[color:var(--sg-border-2)] bg-[color:var(--sg-surface-overlay-strong)] px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-[var(--sg-overlay-shadow)] backdrop-blur-xl transition-opacity duration-150 group-hover/tip:opacity-100 whitespace-nowrap"
      >
        {content}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[color:var(--sg-surface-overlay-strong)]" />
      </div>
    </div>
  );
}
