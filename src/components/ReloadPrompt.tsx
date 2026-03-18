import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { t, type Language } from '@/lib/i18n';

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // Check for updates every hour

interface ReloadPromptProps {
  language: Language;
}

export function ReloadPrompt({ language }: ReloadPromptProps) {
  const intervalRef = useRef<number | null>(null);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(async () => {
        try {
          if (registration.installing || !navigator.onLine) return;

          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: { 'cache-control': 'no-cache' },
          });

          if (resp.status === 200) {
            await registration.update();
          }
        } catch {
          // Ignore transient network failures while polling for updates.
        }
      }, UPDATE_INTERVAL_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (offlineReady) {
      toast.success(t('common.offlineReady', language));
      setOfflineReady(false);
    }
  }, [language, offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast(t('common.updateAvailable', language), {
        duration: Infinity,
        action: {
          label: t('common.update', language),
          onClick: () => updateServiceWorker(true),
        },
        onDismiss: () => setNeedRefresh(false),
      });
    }
  }, [language, needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
