import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { TIPOS_PERFIL, PROVINCIAS, type TipoPerfil, type Provincia } from '@/types/database';
import { Music, User, MapPin, AlertCircle, Check } from 'lucide-react';

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState<TipoPerfil | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [provincia, setProvincia] = useState<Provincia | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!user || !tipo || !username.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || username.trim(),
        tipo_perfil: tipo,
        provincia: provincia || null,
      });
      if (upsertError) throw upsertError;

      if (tipo === 'artista') {
        await supabase.from('artist_profiles').upsert({ profile_id: user.id });
      } else if (tipo === 'produtor') {
        await supabase.from('producer_profiles').upsert({ profile_id: user.id });
      }

      await refreshProfile();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const canNext = step === 0 ? !!tipo : step === 1 ? username.trim().length >= 3 : true;

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 pt-16 pb-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center">
          <Music size={20} className="text-amber-500" />
        </div>
        <span className="text-lg font-bold text-white">MuSon</span>
      </div>

      <div className="flex gap-2 mb-8">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-amber-600' : 'bg-neutral-800'}`}
      />
    ))}
  </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">O que queres fazer?</h1>
            <p className="text-neutral-400 text-sm mb-8">Escolhe o teu tipo de perfil.</p>
            <div className="space-y-3">
              {TIPOS_PERFIL.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTipo(t.value)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    tipo === t.value
                      ? 'border-amber-600 bg-amber-600/10'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{t.label}</p>
                      <p className="text-neutral-400 text-sm mt-0.5">{t.desc}</p>
                    </div>
                    {tipo === t.value && <Check size={20} className="text-amber-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Como te chamas?</h1>
            <p className="text-neutral-400 text-sm mb-8">Escolhe o teu nome de utilizador.</p>
            <div className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nome visível (opcional)"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  placeholder="nome_de_utilizador"
                  className="w-full pl-10 pr-4 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
                  maxLength={30}
                />
              </div>
              <p className="text-neutral-600 text-xs">Apenas letras, números e underscores. Mínimo 3 caracteres.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">De onde és?</h1>
            <p className="text-neutral-400 text-sm mb-8">Escolhe a tua província (opcional).</p>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-4 text-neutral-500" />
              <select
                value={provincia}
                onChange={(e) => setProvincia(e.target.value as Provincia | '')}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:border-amber-600 focus:outline-none transition-colors appearance-none"
              >
                <option value="">Não especificar</option>
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-red-400 text-sm mt-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="max-w-sm w-full mx-auto space-y-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full py-3.5 rounded-xl text-neutral-400 hover:text-white transition-colors"
          >
            Voltar
          </button>
        )}
        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Continuar
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold transition-colors"
          >
            {loading ? 'A guardar...' : 'Concluir'}
          </button>
        )}
      </div>
    </div>
  );
}
