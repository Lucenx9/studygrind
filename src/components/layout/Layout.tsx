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
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} dueCount={dueCount} language={language} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="mx-auto max-w-4xl p-4 md:p-8">
          {children}
        </div>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'bg-card text-card-foreground border-border',
          duration: 3000,
        }}
      />
    </div>
  );
}
