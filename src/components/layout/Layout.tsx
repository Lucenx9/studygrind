import type { ReactNode } from 'react';
import { Sidebar, type Page } from './Sidebar';
import type { Language } from '@/lib/i18n';
import { Toaster } from 'sonner';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  dueCount: number;
  language: Language;
  children: ReactNode;
}

export function Layout({ currentPage, onNavigate, dueCount, language, children }: LayoutProps) {
  return (
    <div className="relative flex min-h-dvh bg-transparent text-foreground">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} dueCount={dueCount} language={language} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:py-8 xl:px-10">
          {children}
        </div>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'rounded-xl border border-border bg-[rgba(10,10,15,0.92)] text-card-foreground shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl',
          duration: 3500,
        }}
      />
    </div>
  );
}
