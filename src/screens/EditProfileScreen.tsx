import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/storageService';
import { PROVINCIAS, TIPOS_PERFIL, type Provincia, type TipoPerfil } from '@/types/database';
import { ArrowLeft, Camera, AlertCircle, Check } from 'lucide-react';

export default function EditProfileScreen() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [tipo, setTipo] = useState<TipoPerfil>(profile?.tipo_perfil || 'ouvinte');
  const [provincia, setProvincia] = useState<Provincia | ''>(profile?.provincia || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const result = await uploadImage('avatars', user.id, file, 'avatar');
      setAvatarUrl(result.url);
    } catch {
      setError('Erro ao carregar a imagem.');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        bio: bio.trim(),
        tipo_perfil: tipo,
        provincia: provincia || null,
        avatar_url: avatarUrl,
      });
      if (upsertError) throw upsertError;

      if (tipo === 'artista') {
        await supabase.from('artist_profiles').upsert({ profile_id: user.id });
      } else if (tipo === 'produtor') {
        await supabase.from('producer_profiles').upsert({ profile_id: user.id });
      }

      await refreshProfile();
      navigate('/perfil');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Editar perfil</h1>
      </header>

      <div className="px-6 space-y-6 max-w-sm mx-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-28 h-28 rounded-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden group"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={28} className="text-neutral-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          <p className="text-neutral-500 text-xs mt-2">Toca para alterar a foto</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-neutral-400 text-sm mb-1.5 block">Nome visível</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="O teu nome"
              className="w-full px-4 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-neutral-400 text-sm mb-1.5 block">Nome de utilizador</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                placeholder="nome_de_utilizador"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
                maxLength={30}
              />
            </div>
          </div>

          <div>
            <label className="text-neutral-400 text-sm mb-1.5 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fala sobre ti..."
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors resize-none"
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-neutral-400 text-sm mb-1.5 block">Tipo de perfil</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_PERFIL.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTipo(t.value)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    tipo === t.value
                      ? 'border-amber-600 bg-amber-600/10 text-white'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-neutral-400 text-sm mb-1.5 block">Província</label>
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value as Provincia | '')}
              className="w-full px-4 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:border-amber-600 focus:outline-none transition-colors appearance-none"
            >
              <option value="">Não especificar</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? 'A guardar...' : 'Guardar alterações'}
            {!loading && <Check size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
