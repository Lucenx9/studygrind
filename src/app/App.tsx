import { lazy, Suspense, useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import type { Page } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="w-full max-w-md border-border/70 bg-card/88">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
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

export default function App() {
  const [page, setPage] = useState<Page>('review');
  const { settings, updateSettings } = useSettings();
  const [dueCount, setDueCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    document.title = 'StudyGrind';

    // Show onboarding if no topics and not dismissed before
    const topics = getTopics();
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
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
      toast.error('Storage full — data may not be saved. Export your data as backup.');
    };
    window.addEventListener('studygrind:storage-error', storageErrorHandler);

    return () => {
      window.removeEventListener('studygrind:data-changed', updateDue);
      window.removeEventListener('studygrind:storage-error', storageErrorHandler);
      clearInterval(interval);
    };
  }, []);

  const navigate = (p: Page) => setPage(p);

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  return (
    <Layout currentPage={page} onNavigate={setPage} dueCount={dueCount} language={settings.language}>
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
      <ReloadPrompt />
    </Layout>
  );
}
