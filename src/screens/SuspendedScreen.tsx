import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldOff, Mail } from 'lucide-react';

export default function SuspendedScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
        <ShieldOff size={28} className="text-red-400" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Conta suspensa</h1>
      <p className="text-neutral-400 text-sm max-w-xs mb-1">
        A tua conta foi suspensa por violar as regras de utilização do MuSon.
      </p>
      {profile?.suspenso_motivo && (
        <p className="text-neutral-500 text-sm max-w-xs mb-6 italic">"{profile.suspenso_motivo}"</p>
      )}
      <a
        href="mailto:suporte@muson.ao"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-medium mb-3"
      >
        <Mail size={16} /> Contactar suporte
      </a>
      <button onClick={() => navigate('/login')} className="text-neutral-500 text-sm">
        Voltar ao login
      </button>
    </div>
  );
}
