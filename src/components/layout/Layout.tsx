import type { ReactNode } from 'react';
import { Sidebar, type Page } from './Sidebar';
import type { Language } from '@/lib/i18n';
import { Toaster } from 'sonner';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  dueCount: number;
  totalDueToday?: number;
  language: Language;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, dueCount, totalDueToday, language, children }: LayoutProps) {
  return (
    <div className="relative flex min-h-dvh bg-transparent text-foreground">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        dueCount={dueCount}
        totalDueToday={totalDueToday}
        language={language}
      />
      <main className="relative flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto w-full max-w-[1380px] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:py-8 xl:px-10">
          {children}
        </div>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'rounded-xl border border-[color:var(--sg-border-2)] bg-[color:var(--sg-surface-overlay)] text-card-foreground shadow-[var(--sg-overlay-shadow)] backdrop-blur-2xl',
          duration: 3500,
        }}
      />
    </div>
  );
}
