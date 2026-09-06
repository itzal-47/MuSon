import { Wrench, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';

export default function MaintenanceScreen() {
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center mb-5">
        <Wrench size={28} className="text-amber-500" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">MuSon</h1>
      <p className="text-neutral-400 text-sm max-w-xs mb-8">
        {settings?.manutencao_mensagem || 'O MuSon está em manutenção. Voltamos já.'}
      </p>
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-400 text-xs transition-colors"
      >
        <LogIn size={13} /> Sou administrador — Entrar
      </button>
    </div>
  );
}
