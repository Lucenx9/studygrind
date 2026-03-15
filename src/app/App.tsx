import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import type { Page } from '@/components/layout/Sidebar';
import { ReviewPage } from '@/pages/ReviewPage';
import { StudyPage } from '@/pages/StudyPage';
import { UploadPage } from '@/pages/UploadPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useSettings } from '@/hooks/useSettings';
import { getDueQuestions } from '@/lib/fsrs';
import { getQuestions } from '@/lib/storage';

export default function App() {
  const [page, setPage] = useState<Page>('review');
  const { settings, updateSettings } = useSettings();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    document.title = 'StudyGrind';

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

  return (
    <Layout currentPage={page} onNavigate={setPage} dueCount={dueCount} language={settings.language}>
      {page === 'review' && <ReviewPage onNavigate={navigate} settings={settings} />}
      {page === 'study' && <StudyPage settings={settings} />}
      {page === 'upload' && <UploadPage settings={settings} />}
      {page === 'dashboard' && <DashboardPage language={settings.language} />}
      {page === 'settings' && <SettingsPage settings={settings} onUpdate={updateSettings} />}
    </Layout>
  );
}
