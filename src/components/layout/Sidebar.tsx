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
  return (
    <>
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4 gap-2">
        <div className="flex items-center gap-2 px-3 py-4 mb-4">
          <GraduationCap className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold">StudyGrind</h1>
        </div>
        {NAV_KEYS.map(({ page, key, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              currentPage === page
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {t(key, language)}
            {page === 'review' && dueCount > 0 && (
              <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs text-white">
                {dueCount}
              </span>
            )}
          </button>
        ))}
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card">
        {NAV_KEYS.map(({ page, key, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
              currentPage === page ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {page === 'review' && dueCount > 0 && (
                <span className="absolute -top-1 -right-2 rounded-full bg-destructive px-1 text-[10px] text-white">
                  {dueCount}
                </span>
              )}
            </div>
            {t(key, language)}
          </button>
        ))}
      </nav>
    </>
  );
}
