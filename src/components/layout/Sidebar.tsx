import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { BookOpen, Upload, BarChart3, Settings, GraduationCap } from 'lucide-react';

export type Page = 'review' | 'study' | 'upload' | 'dashboard' | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  dueCount: number;
  totalDueToday?: number;
  language: Language;
}

const MAIN_NAV = [
  { page: 'review' as Page, key: 'nav.review' as const, icon: GraduationCap },
  { page: 'study' as Page, key: 'nav.study' as const, icon: BookOpen },
  { page: 'upload' as Page, key: 'nav.upload' as const, icon: Upload },
  { page: 'dashboard' as Page, key: 'nav.dashboard' as const, icon: BarChart3 },
];

const ALL_NAV = [
  ...MAIN_NAV,
  { page: 'settings' as Page, key: 'nav.settings' as const, icon: Settings },
];

/** SVG mini ring showing daily completion % */
function CompletionRing({ done, total, size = 40 }: { done: number; total: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(done / total, 1) : 0;
  const offset = c - pct * c;
  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#accentGrad)" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <defs>
        <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Sidebar({ currentPage, onNavigate, dueCount, totalDueToday, language }: SidebarProps) {
  const reviewCountLabel = dueCount > 99 ? '99+' : String(dueCount);
  const totalToday = totalDueToday ?? dueCount;
  const doneToday = Math.max(0, totalToday - dueCount);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border bg-sidebar px-4 py-5 md:flex">
        {/* Brand */}
        <div className="mb-5 px-2">
          <h1 className="text-lg font-bold tracking-[-0.025em]">StudyGrind</h1>
          <p className="text-tertiary mt-0.5">{t('common.appTagline', language)}</p>
        </div>

        {/* Queue card */}
        <button
          type="button"
          onClick={() => onNavigate('review')}
          className="mb-5 rounded-xl border border-border bg-[rgba(255,255,255,0.03)] px-4 py-4 text-left transition-all duration-200 hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.05)]"
        >
          <p className="text-tertiary">{t('review.queueReady', language)}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <CompletionRing done={doneToday} total={totalToday} />
              <div>
                <p className="text-4xl font-bold tracking-[-0.04em] tabular-nums text-foreground">{reviewCountLabel}</p>
                <p className="text-xs text-muted-foreground">{t('review.dueToday', language)}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg sg-btn-accent px-3 py-2 text-sm font-semibold">
            <GraduationCap className="h-4 w-4" />
            {t('review.title', language)}
          </div>
        </button>

        {/* Main nav */}
        <nav className="flex-1 space-y-0.5">
          {MAIN_NAV.map(({ page, key, icon: Icon }) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                currentPage === page
                  ? 'bg-[rgba(99,102,241,0.08)] text-foreground'
                  : 'text-muted-foreground hover:bg-[rgba(255,255,255,0.04)] hover:text-foreground'
              )}
            >
              {currentPage === page && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#6366f1] to-[#8b5cf6]" />
              )}
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{t(key, language)}</span>
              {page === 'review' && dueCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[22px] items-center justify-center rounded-full sg-btn-accent px-1.5 text-[11px] font-bold">
                  {reviewCountLabel}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer — Settings */}
        <div className="mt-auto border-t border-border pt-3">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            aria-current={currentPage === 'settings' ? 'page' : undefined}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              currentPage === 'settings'
                ? 'bg-[rgba(99,102,241,0.08)] text-foreground'
                : 'text-muted-foreground hover:bg-[rgba(255,255,255,0.04)] hover:text-foreground'
            )}
          >
            {currentPage === 'settings' && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#6366f1] to-[#8b5cf6]" />
            )}
            <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{t('nav.settings', language)}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-[rgba(10,10,15,0.92)] px-2 pt-2 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5 gap-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {ALL_NAV.map(({ page, key, icon: Icon }) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-[background-color,color] duration-200',
                currentPage === page
                  ? 'bg-[rgba(99,102,241,0.12)] text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                {page === 'review' && dueCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full sg-btn-accent px-1 text-[10px] font-bold text-white">
                    {reviewCountLabel}
                  </span>
                )}
              </div>
              {page === 'dashboard'
                ? t('nav.dashboardShort', language)
                : page === 'settings'
                  ? t('nav.settingsShort', language)
                  : t(key, language)}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
