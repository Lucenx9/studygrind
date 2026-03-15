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
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 lg:px-10 lg:py-8">
          {children}
        </div>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'rounded-2xl border border-border/80 bg-card/95 text-card-foreground shadow-[0_20px_60px_-35px_rgba(15,23,42,0.7)] backdrop-blur-xl',
          duration: 3000,
        }}
      />
    </div>
  );
}
