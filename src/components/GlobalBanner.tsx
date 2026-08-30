import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';
import { isBannerCurrentlyActive } from '@/lib/platformSettings';

const LEVEL_STYLES: Record<string, string> = {
  info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
  aviso: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  urgente: 'bg-red-500/10 border-red-500/30 text-red-300',
};

const LEVEL_ICON: Record<string, typeof Info> = {
  info: Info,
  aviso: AlertTriangle,
  urgente: AlertCircle,
};

export default function GlobalBanner() {
  const { settings } = usePlatformSettings();
  if (!settings || !isBannerCurrentlyActive(settings)) return null;

  const Icon = LEVEL_ICON[settings.banner_nivel] || Info;

  return (
    <div className={`sticky top-0 z-40 px-4 py-2.5 border-b flex items-center gap-2 ${LEVEL_STYLES[settings.banner_nivel]}`}>
      <Icon size={15} className="shrink-0" />
      <p className="text-xs font-medium">{settings.banner_mensagem}</p>
    </div>
  );
}
