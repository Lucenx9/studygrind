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
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border/40 bg-card/55 px-4 py-5 backdrop-blur-xl md:flex">
        <div className="mb-6 flex items-center gap-3 rounded-[24px] border border-border/70 bg-background/55 px-4 py-4 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.7)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-[-0.02em]">StudyGrind</h1>
            <p className="text-xs text-muted-foreground">{t('common.appTagline', language)}</p>
          </div>
        </div>
        <div className="space-y-2">
          {NAV_KEYS.map(({ page, key, icon: Icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                'relative flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                currentPage === page
                  ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(79,128,255,0.12)]'
                  : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
              )}
            >
              {currentPage === page && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary shadow-[0_0_8px_rgba(79,128,255,0.4)]" />
              )}
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                  currentPage === page ? 'bg-primary/14 text-primary' : 'bg-transparent text-current'
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <span className="truncate">{t(key, language)}</span>
              {page === 'review' && dueCount > 0 && (
                <span className="ml-auto rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                  {reviewCountLabel}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-card/90 px-2 pt-2 backdrop-blur-xl shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.65)] md:hidden">
        <div className="grid grid-cols-5 gap-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {NAV_KEYS.map(({ page, key, icon: Icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-[background-color,color] duration-200',
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
