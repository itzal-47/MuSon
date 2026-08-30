import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldAlert, Shield, ArrowLeft, SlidersHorizontal, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchIsAdmin } from '@/lib/admin';

type AdminTab = 'dashboard' | 'utilizadores' | 'moderacao' | 'configuracoes' | 'pagamentos';

const TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard; path: string }[] = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard, path: '/admin' },
  { id: 'utilizadores', label: 'Utilizadores', icon: Users, path: '/admin/utilizadores' },
  { id: 'pagamentos', label: 'Pagamentos', icon: Wallet, path: '/admin/pagamentos' },
  { id: 'moderacao', label: 'Moderação', icon: ShieldAlert, path: '/admin/moderacao' },
  { id: 'configuracoes', label: 'Config.', icon: SlidersHorizontal, path: '/admin/configuracoes' },
];

export default function AdminShell({ active, children }: { active: AdminTab; children: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    fetchIsAdmin(user.id).then((ok) => {
      setIsAdmin(ok);
      setChecking(false);
    });
  }, [user]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <Shield size={32} className="text-neutral-700 mb-3" />
        <p className="text-white font-medium mb-1">Acesso restrito</p>
        <p className="text-neutral-500 text-sm">Este painel é apenas para administradores.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pb-28">
      {/* Fundo holográfico — glows multi-cor, discretos e a mexer devagar */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-cyan-500/20 blur-[100px] animate-admin-drift-1" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/15 blur-[110px] animate-admin-drift-2" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-violet-500/15 blur-[100px] animate-admin-drift-3" />
      </div>

      {/* Marca d'água EIVORAK — subtil, nunca compete com o conteúdo */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none flex items-center justify-center select-none"
      >
        <span
          className="text-[18vw] font-black tracking-[0.15em] whitespace-nowrap"
          style={{
            transform: 'rotate(-8deg)',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.05), rgba(217,70,239,0.05))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(255,255,255,0.03)',
          }}
        >
          EIVORAK
        </span>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/perfil')} className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <p className="text-[10px] tracking-[0.3em] text-cyan-400/70 font-semibold uppercase">EiVORAK Systems</p>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                Painel de Controlo
              </span>
            </h1>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 px-6">{children}</main>

      {/* Navegação estilo "consola" */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4">
        <div className="max-w-md mx-auto rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(34,211,238,0.08)] flex items-center p-1.5 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-500/20 via-fuchsia-500/15 to-violet-500/20 border border-cyan-400/30 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
                    : ''
                }`}
              >
                <Icon size={18} className={isActive ? 'text-cyan-300' : 'text-neutral-500'} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-cyan-200' : 'text-neutral-600'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
