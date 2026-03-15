import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // Check for updates every hour

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      setInterval(async () => {
        if (registration.installing || !navigator) return;
        if ('connection' in navigator && !navigator.onLine) return;

        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: { 'cache-control': 'no-cache' },
        });

        if (resp?.status === 200) {
          await registration.update();
        }
      }, UPDATE_INTERVAL_MS);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success('App pronta per l\'uso offline');
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast('Nuova versione disponibile', {
        duration: Infinity,
        action: {
          label: 'Aggiorna',
          onClick: () => updateServiceWorker(true),
        },
        onDismiss: () => setNeedRefresh(false),
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
