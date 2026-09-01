import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchStreak, type StreakInfo } from '@/lib/streaks';
import { fetchIsAdmin } from '@/lib/admin';
import { Music, Settings, LogOut, ChevronRight, BadgeCheck, MapPin, Disc3, Upload, BarChart3, Flame, Shield, Crown } from 'lucide-react';
import { isPremiumActive } from '@/lib/premium';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchStreak(user.id).then(setStreak);
    fetchIsAdmin(user.id).then(setIsAdmin);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black pb-32 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mb-4 glow-accent-sm">
          <Music size={28} className="text-black" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">O teu perfil</h1>
        <p className="text-neutral-400 text-sm text-center mb-6">
          Inicia sessão para gerir o teu perfil, seguir artistas e guardar faixas.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3.5 rounded-xl accent-gradient hover:opacity-90 text-black font-bold transition-all glow-accent-sm"
        >
          Entrar ou registar
        </button>
      </div>
    );
  }

  const isArtist = profile?.tipo_perfil === 'artista';
  const isProducer = profile?.tipo_perfil === 'produtor';
  const canUpload = isArtist || isProducer;

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <button
            onClick={() => navigate('/definicoes')}
            className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-amber-500 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden ring-2 ring-amber-600/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={28} className="text-neutral-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white truncate">
                {profile?.display_name || profile?.username || 'Utilizador'}
              </h2>
              {profile?.verificado && <BadgeCheck size={18} className="text-white fill-blue-500 shrink-0" />}
              {isPremiumActive(profile?.premium_until) && <Crown size={16} className="text-amber-400 shrink-0" />}
            </div>
            {profile?.username && (
              <p className="text-neutral-500 text-sm truncate">@{profile.username}</p>
            )}
            {profile?.provincia && (
              <div className="flex items-center gap-1 text-neutral-400 text-sm mt-1">
                <MapPin size={12} className="text-amber-500" />
                <span>{profile.provincia}</span>
              </div>
            )}
          </div>
        </div>

        {profile?.bio && (
          <p className="text-neutral-300 text-sm mt-4">{profile.bio}</p>
        )}

        {streak && streak.dias_seguidos > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center shrink-0 glow-accent-sm">
              <Flame size={18} className="text-black" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{streak.dias_seguidos} {streak.dias_seguidos === 1 ? 'dia seguido' : 'dias seguidos'} a ouvir</p>
              {streak.melhor_streak > streak.dias_seguidos && (
                <p className="text-neutral-500 text-xs">O teu recorde é {streak.melhor_streak} dias</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate('/perfil/editar')}
            className="flex-1 py-3 rounded-xl accent-gradient hover:opacity-90 text-black font-bold transition-all glow-accent-sm"
          >
            Editar perfil
          </button>
          {(isArtist || isProducer) && (
            <button
              onClick={() => navigate(`/artista/${user.id}`)}
              className="flex-1 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-semibold hover:bg-neutral-800 transition-colors"
            >
              Ver perfil público
            </button>
          )}
        </div>
      </header>

      <div className="px-6 space-y-1">
        {canUpload && (
          <>
            <button
              onClick={() => navigate('/publicar')}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                <Upload size={18} className="text-amber-500" />
              </div>
              <span className="flex-1 text-left text-white font-medium">Publicar faixa</span>
              <ChevronRight size={18} className="text-neutral-600" />
            </button>

            <button
              onClick={() => navigate('/minhas-faixas')}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                <Disc3 size={18} className="text-amber-500" />
              </div>
              <span className="flex-1 text-left text-white font-medium">As minhas faixas</span>
              <ChevronRight size={18} className="text-neutral-600" />
            </button>

            <button
              onClick={() => navigate('/estatisticas')}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                <BarChart3 size={18} className="text-amber-500" />
              </div>
              <span className="flex-1 text-left text-white font-medium">Estatísticas</span>
              <ChevronRight size={18} className="text-neutral-600" />
            </button>

            {!profile?.verificado && (
              <button
                onClick={() => navigate('/verificacao')}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                  <BadgeCheck size={18} className="text-amber-500" />
                </div>
                <span className="flex-1 text-left text-white font-medium">Pedir selo verificado</span>
                <ChevronRight size={18} className="text-neutral-600" />
              </button>
            )}
          </>
        )}

        <button
          onClick={() => navigate('/premium')}
          className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center">
            <Crown size={18} className="text-amber-500" />
          </div>
          <span className="flex-1 text-left text-white font-medium">
            {isPremiumActive(profile?.premium_until) ? 'MuSon Premium' : 'Torna-te Premium'}
          </span>
          <ChevronRight size={18} className="text-neutral-600" />
        </button>

        <button
          onClick={() => navigate('/definicoes')}
          className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
            <Settings size={18} className="text-amber-500" />
          </div>
          <span className="flex-1 text-left text-white font-medium">Definições</span>
          <ChevronRight size={18} className="text-neutral-600" />
        </button>

        <button
          onClick={() => navigate('/sobre')}
          className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
            <Music size={18} className="text-amber-500" />
          </div>
          <span className="flex-1 text-left text-white font-medium">Sobre e Ajuda</span>
          <ChevronRight size={18} className="text-neutral-600" />
        </button>

        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
              <Shield size={18} className="text-amber-500" />
            </div>
            <span className="flex-1 text-left text-white font-medium">Administração</span>
            <ChevronRight size={18} className="text-neutral-600" />
          </button>
        )}

        <button
          onClick={() => {
            signOut();
            navigate('/');
          }}
          className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-900 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
            <LogOut size={18} className="text-red-400" />
          </div>
          <span className="flex-1 text-left text-white font-medium">Terminar sessão</span>
          <ChevronRight size={18} className="text-neutral-600" />
        </button>
      </div>
    </div>
  );
}
