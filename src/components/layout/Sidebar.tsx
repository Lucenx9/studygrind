import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { BookOpen, Upload, BarChart3, Settings, GraduationCap, Plus } from 'lucide-react';

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
function CompletionRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(done / total, 1) : 0;
  const visualPct = pct === 0 ? 0.01 : pct;
  const offset = c - visualPct * c;
  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-[color:var(--sg-surface-3)]" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#accentGrad)" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        className={pct === 0 ? 'opacity-90' : undefined}
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
      <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-sidebar)] px-4 py-5 backdrop-blur-2xl md:flex">
        {/* Brand */}
        <div className="mb-5 flex items-start justify-between gap-3 px-2">
          <div>
            <h1 className="text-lg font-bold tracking-[-0.03em]">StudyGrind</h1>
            <p className="text-tertiary mt-1">{t('common.appTagline', language)}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--sg-border-2)] bg-[color:var(--sg-surface-1)] text-foreground shadow-[var(--sg-card-shadow)] hover:border-[color:var(--sg-border-3)] hover:bg-[color:var(--sg-surface-2)]"
            aria-label={language === 'it' ? 'Crea nuovo contenuto' : 'Create new content'}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Queue card */}
        <button
          type="button"
          onClick={() => onNavigate('review')}
          className="mb-3 rounded-[22px] border border-[color:var(--sg-border-2)] bg-[linear-gradient(180deg,rgba(99,102,241,0.12),rgba(99,102,241,0.04))] px-4 py-4 text-left shadow-[var(--sg-card-shadow)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--sg-border-3)] hover:shadow-[var(--sg-card-shadow-hover)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-tertiary">{t('review.queueReady', language)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {language === 'it'
                  ? `${doneToday} completate oggi`
                  : `${doneToday} completed today`}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.06)]">
              <CompletionRing done={doneToday} total={totalToday} />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[2.5rem] font-bold leading-none tracking-[-0.05em] tabular-nums text-foreground">{reviewCountLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('review.dueToday', language)}</p>
            </div>
            <div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {totalToday > 0 ? `${Math.round((doneToday / totalToday) * 100)}%` : '0%'}
            </div>
          </div>
          <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl sg-btn-accent px-3 py-2.5 text-sm font-semibold">
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
                'relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                currentPage === page
                  ? 'bg-[rgba(99,102,241,0.08)] text-foreground'
                  : 'text-muted-foreground hover:bg-[color:var(--sg-surface-2)] hover:text-foreground'
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
              'relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
              currentPage === 'settings'
                ? 'bg-[rgba(99,102,241,0.08)] text-foreground'
                : 'text-muted-foreground hover:bg-[color:var(--sg-surface-2)] hover:text-foreground'
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
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-overlay)] px-2 pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:hidden">
        <div className="grid grid-cols-5 gap-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {ALL_NAV.map(({ page, key, icon: Icon }) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-[background-color,color,border-color] duration-150',
                currentPage === page
                  ? 'border border-[rgba(99,102,241,0.18)] bg-[rgba(99,102,241,0.12)] text-primary'
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
