import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, User, Bell, Palette, Shield, ChevronRight,
  AlertCircle, LogOut, Trash2,
} from 'lucide-react';

type Section = 'conta' | 'notificacoes' | 'aparicao' | 'privacidade';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<Section | null>(null);
  const [notifToggles, setNotifToggles] = useState({
    novidades: true,
    artistas: true,
    mensagens: false,
    marketing: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setError(null);
    if (!user) return;
    try {
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
      navigate('/');
    } catch {
      setError('Não foi possível eliminar a conta. Tenta novamente.');
    }
  };

  const sections: { id: Section; label: string; icon: typeof User; desc: string }[] = [
    { id: 'conta', label: 'Conta', icon: User, desc: 'Editar dados, eliminar conta' },
    { id: 'notificacoes', label: 'Notificações', icon: Bell, desc: 'Gerir alertas' },
    { id: 'aparicao', label: 'Aparência', icon: Palette, desc: 'Tema e visual' },
    { id: 'privacidade', label: 'Privacidade', icon: Shield, desc: 'Visibilidade e dados' },
  ];

  if (section === 'conta') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <Header title="Conta" onBack={() => setSection(null)} />
        <div className="px-6 space-y-4 max-w-sm mx-auto">
          <button
            onClick={() => navigate('/perfil/editar')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <User size={18} className="text-amber-500" />
            <span className="flex-1 text-left text-white">Editar dados do perfil</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>

          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={() => { signOut(); navigate('/'); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
            >
              <LogOut size={18} className="text-amber-500" />
              <span className="flex-1 text-left text-white">Terminar sessão</span>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
            >
              <Trash2 size={18} className="text-red-400" />
              <span className="flex-1 text-left text-red-400">Eliminar conta</span>
            </button>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm mt-2 px-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'notificacoes') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <Header title="Notificações" onBack={() => setSection(null)} />
        <div className="px-6 space-y-3 max-w-sm mx-auto">
          {Object.entries({
            novidades: 'Novidades e lançamentos',
            artistas: 'Novidades de artistas que segues',
            mensagens: 'Mensagens e comentários',
            marketing: 'Promoções e marketing',
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800">
              <span className="text-white text-sm">{label}</span>
              <button
                onClick={() => setNotifToggles((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                className={`w-12 h-7 rounded-full transition-colors relative ${notifToggles[key as keyof typeof notifToggles] ? 'bg-amber-600' : 'bg-neutral-700'}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${notifToggles[key as keyof typeof notifToggles] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
          <p className="text-neutral-600 text-xs text-center pt-4">As notificações serão ativadas em breve.</p>
        </div>
      </div>
    );
  }

  if (section === 'aparicao') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <Header title="Aparência" onBack={() => setSection(null)} />
        <div className="px-6 max-w-sm mx-auto">
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
            <Palette size={32} className="text-amber-500 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Modo escuro</p>
            <p className="text-neutral-400 text-sm">O MuSon está sempre em modo escuro para uma experiência premium.</p>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'privacidade') {
    return (
      <div className="min-h-screen bg-black pb-32">
        <Header title="Privacidade" onBack={() => setSection(null)} />
        <div className="px-6 space-y-3 max-w-sm mx-auto">
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
            <p className="text-white font-medium text-sm mb-1">Perfil público</p>
            <p className="text-neutral-400 text-xs">O teu perfil é visível para todos os utilizadores.</p>
          </div>
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
            <p className="text-white font-medium text-sm mb-1">Dados de utilização</p>
            <p className="text-neutral-400 text-xs">Não partilhamos os teus dados com terceiros.</p>
          </div>
          <button
            onClick={() => navigate('/sobre')}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
          >
            <Shield size={18} className="text-amber-500" />
            <span className="flex-1 text-left text-white text-sm">Política de privacidade</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Definições</h1>
      </header>

      <div className="px-6 space-y-2 max-w-sm mx-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
              <s.icon size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">{s.label}</p>
              <p className="text-neutral-500 text-xs">{s.desc}</p>
            </div>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="px-6 pt-14 pb-6 flex items-center gap-4">
      <button onClick={onBack} className="text-neutral-400 hover:text-white transition-colors">
        <ArrowLeft size={22} />
      </button>
      <h1 className="text-xl font-bold text-white">{title}</h1>
    </header>
  );
}
