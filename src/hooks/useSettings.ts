import { useState, useCallback, useEffect } from 'react';
import type { Settings, ProviderConfig } from '@/lib/types';
import { getSettings, saveSettings } from '@/lib/storage';

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(getSettings);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...partial };
      return saveSettings(next) ? next : prev;
    });
  }, []);

  const setProvider = useCallback((provider: ProviderConfig | null) => {
    updateSettings({ provider });
  }, [updateSettings]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const isConfigured = settings.provider !== null;

  return { settings, updateSettings, setProvider, isConfigured };
}
