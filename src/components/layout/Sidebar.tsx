import { cn } from '@/lib/utils';
import { t, type Language } from '@/lib/i18n';
import { BookOpen, Upload, BarChart3, Settings, GraduationCap } from 'lucide-react';

export type Page = 'review' | 'study' | 'upload' | 'dashboard' | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  dueCount: number;
  language: Language;
}

const NAV_KEYS = [
  { page: 'review' as Page, key: 'nav.review' as const, icon: GraduationCap },
  { page: 'study' as Page, key: 'nav.study' as const, icon: BookOpen },
  { page: 'upload' as Page, key: 'nav.upload' as const, icon: Upload },
  { page: 'dashboard' as Page, key: 'nav.dashboard' as const, icon: BarChart3 },
  { page: 'settings' as Page, key: 'nav.settings' as const, icon: Settings },
];

export function Sidebar({ currentPage, onNavigate, dueCount, language }: SidebarProps) {
  const reviewCountLabel = dueCount > 99 ? '99+' : String(dueCount);

  return (
    <>
      <aside className="hidden w-[288px] shrink-0 flex-col border-r border-border/45 bg-sidebar/82 px-4 py-5 backdrop-blur-xl md:flex">
        <div className="mb-4 flex items-center gap-3 rounded-[20px] border border-border/65 bg-background/50 px-4 py-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.72)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/12 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-[-0.02em]">StudyGrind</h1>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/85">{t('common.appTagline', language)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('review')}
          className="mb-4 rounded-[20px] border border-primary/12 bg-primary/6 px-4 py-4 text-left transition-colors hover:bg-primary/8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('review.queueReady', language)}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{reviewCountLabel}</p>
              <p className="text-xs text-muted-foreground">{t('review.dueToday', language)}</p>
            </div>
            <span className="rounded-full border border-border/70 bg-background/75 px-2.5 py-1 text-[11px] font-semibold text-foreground">
              {t('review.title', language)}
            </span>
          </div>
        </button>

        <div className="space-y-1.5">
          {NAV_KEYS.map(({ page, key, icon: Icon }) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                'relative flex min-h-11 w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-sm font-medium transition-all duration-200',
                currentPage === page
                  ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(79,128,255,0.12)]'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              )}
            >
              {currentPage === page && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_rgba(79,128,255,0.35)]" />
              )}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] transition-colors',
                  currentPage === page ? 'bg-primary/12 text-primary' : 'bg-transparent text-current'
                )}
              >
                <Icon className="h-[17px] w-[17px]" />
              </div>
              <span className="truncate">{t(key, language)}</span>
              {page === 'review' && dueCount > 0 && (
                <span className="ml-auto rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                  {reviewCountLabel}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/65 bg-card/92 px-2 pt-2 backdrop-blur-xl shadow-[0_-14px_34px_-26px_rgba(15,23,42,0.68)] md:hidden">
        <div className="grid grid-cols-5 gap-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {NAV_KEYS.map(({ page, key, icon: Icon }) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-medium transition-[background-color,color] duration-200',
                currentPage === page
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {page === 'review' && dueCount > 0 && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
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
