import { lazy, Suspense, useState, useEffect, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Layout } from '@/components/layout/Layout';
import type { Page } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { getDueQuestions } from '@/lib/fsrs';
import { t, type Language } from '@/lib/i18n';
import { getQuestions, getTopics } from '@/lib/storage';
import { toast } from 'sonner';
import { ReloadPrompt } from '@/components/ReloadPrompt';

const ONBOARDING_KEY = 'studygrind_onboarding_done';
const ReviewPage = lazy(async () => ({ default: (await import('@/pages/ReviewPage')).ReviewPage }));
const StudyPage = lazy(async () => ({ default: (await import('@/pages/StudyPage')).StudyPage }));
const UploadPage = lazy(async () => ({ default: (await import('@/pages/UploadPage')).UploadPage }));
const DashboardPage = lazy(async () => ({ default: (await import('@/pages/DashboardPage')).DashboardPage }));
const SettingsPage = lazy(async () => ({ default: (await import('@/pages/SettingsPage')).SettingsPage }));
const WelcomeWizard = lazy(async () => ({ default: (await import('@/components/onboarding/WelcomeWizard')).WelcomeWizard }));

function PageFallback({ language }: { language: Language }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.1)]">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('common.loadingWorkspace', language)}</p>
            <p className="text-xs text-muted-foreground">{t('common.preparingStudyFlow', language)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorFallback({ language }: { language: Language }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-[rgba(248,113,113,0.25)]">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('common.unexpectedError', language)}</p>
            <p className="text-xs text-muted-foreground">{t('common.reloadApp', language)}</p>
          </div>
          <Button type="button" onClick={() => window.location.reload()}>
            {t('common.reloadApp', language)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

class AppErrorBoundary extends Component<
  { children: ReactNode; language: Language },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('StudyGrind render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback language={this.props.language} />;
    }

    return this.props.children;
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('review');
  const { settings, updateSettings } = useSettings();
  const [dueCount, setDueCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sync <html lang> attribute when language changes (WCAG, screen readers)
  useEffect(() => {
    document.documentElement.lang = settings.language === 'en' ? 'en' : 'it';
  }, [settings.language]);

  useEffect(() => {
    document.title = 'StudyGrind';

    // Show onboarding if no topics and not dismissed before
    const topics = getTopics();
    let dismissed: string | null = null;
    try {
      dismissed = localStorage.getItem(ONBOARDING_KEY);
    } catch {
      dismissed = '1';
    }
    if (topics.length === 0 && !dismissed) {
      setShowOnboarding(true);
    }

    const updateDue = () => {
      const due = getDueQuestions(getQuestions());
      setDueCount(due.length);
    };

    updateDue();

    window.addEventListener('studygrind:data-changed', updateDue);
    const interval = setInterval(updateDue, 60000);

    // Show toast when localStorage writes fail (quota exceeded etc.)
    const storageErrorHandler = () => {
      toast.error(t('common.storageFull', settings.language));
    };
    window.addEventListener('studygrind:storage-error', storageErrorHandler);

    return () => {
      window.removeEventListener('studygrind:data-changed', updateDue);
      window.removeEventListener('studygrind:storage-error', storageErrorHandler);
      clearInterval(interval);
    };
  }, [settings.language]);

  const navigate = (p: Page) => setPage(p);

  const dismissOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      toast.error(t('common.storageFull', settings.language));
    }
    setShowOnboarding(false);
  };

  return (
    <Layout currentPage={page} onNavigate={setPage} dueCount={dueCount} language={settings.language}>
      <AppErrorBoundary language={settings.language}>
        <Suspense fallback={<PageFallback language={settings.language} />}>
          {showOnboarding ? (
            <WelcomeWizard
              language={settings.language}
              hasProvider={settings.provider !== null}
              onGoToSettings={() => setPage('settings')}
              onGoToUpload={() => setPage('upload')}
              onDismiss={dismissOnboarding}
            />
          ) : (
            <>
              {page === 'review' && <ReviewPage onNavigate={navigate} settings={settings} />}
              {page === 'study' && <StudyPage settings={settings} onNavigate={navigate} />}
              {page === 'upload' && <UploadPage settings={settings} />}
              {page === 'dashboard' && <DashboardPage language={settings.language} onNavigate={navigate} />}
              {page === 'settings' && <SettingsPage settings={settings} onUpdate={updateSettings} />}
            </>
          )}
        </Suspense>
        <ReloadPrompt language={settings.language} />
      </AppErrorBoundary>
    </Layout>
  );
}
