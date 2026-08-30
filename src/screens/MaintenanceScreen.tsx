import { Wrench } from 'lucide-react';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';

export default function MaintenanceScreen() {
  const { settings } = usePlatformSettings();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center mb-5">
        <Wrench size={28} className="text-amber-500" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">MuSon</h1>
      <p className="text-neutral-400 text-sm max-w-xs">
        {settings?.manutencao_mensagem || 'O MuSon está em manutenção. Voltamos já.'}
      </p>
    </div>
  );
}
