import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { fetchPlatformSettings, type PlatformSettings } from '@/lib/platformSettings';

interface PlatformSettingsState {
  settings: PlatformSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PlatformSettingsContext = createContext<PlatformSettingsState | undefined>(undefined);

export function PlatformSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await fetchPlatformSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    fetchPlatformSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  return (
    <PlatformSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlatformSettings() {
  const ctx = useContext(PlatformSettingsContext);
  if (!ctx) throw new Error('usePlatformSettings deve ser usado dentro de PlatformSettingsProvider');
  return ctx;
}
