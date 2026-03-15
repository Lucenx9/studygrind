import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import type { Page } from '@/components/layout/Sidebar';
import { ReviewPage } from '@/pages/ReviewPage';
import { StudyPage } from '@/pages/StudyPage';
import { UploadPage } from '@/pages/UploadPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { WelcomeWizard } from '@/components/onboarding/WelcomeWizard';
import { useSettings } from '@/hooks/useSettings';
import { getDueQuestions } from '@/lib/fsrs';
import { getQuestions, getTopics } from '@/lib/storage';

const ONBOARDING_KEY = 'studygrind_onboarding_done';

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

    return () => {
      window.removeEventListener('studygrind:data-changed', updateDue);
      clearInterval(interval);
    };
  }, []);

  const navigate = (p: Page | 'upload' | 'study') => setPage(p as Page);

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  return (
    <Layout currentPage={page} onNavigate={setPage} dueCount={dueCount} language={settings.language}>
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
          {page === 'study' && <StudyPage settings={settings} />}
          {page === 'upload' && <UploadPage settings={settings} />}
          {page === 'dashboard' && <DashboardPage language={settings.language} onNavigate={navigate} />}
          {page === 'settings' && <SettingsPage settings={settings} onUpdate={updateSettings} />}
        </>
      )}
    </Layout>
  );
}
