import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { storage } from '@/lib/storageService';
import type { Track } from '@/types/database';
import {
  ArrowLeft, Music, Plus, MoreVertical, Edit2, EyeOff, Eye, Trash2, X, AlertCircle,
} from 'lucide-react';

export default function MyTracksScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Track | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editGenero, setEditGenero] = useState('');
  const [editExplicita, setEditExplicita] = useState(false);
  const [editPermiteDownload, setEditPermiteDownload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Track | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_id', user.id)
        .order('criado_em', { ascending: false });
      if (!error && data) setTracks(data as Track[]);
      setLoading(false);
    })();
  }, [user, navigate]);

  if (!user) return null;

  const togglePublish = async (track: Track) => {
    const newVal = !track.publicada;
    await supabase.from('tracks').update({ publicada: newVal }).eq('id', track.id);
    setTracks((ts) => ts.map((t) => t.id === track.id ? { ...t, publicada: newVal } : t));
    setMenuOpen(null);
  };

  const openEdit = (track: Track) => {
    setEditing(track);
    setEditTitulo(track.titulo);
    setEditGenero(track.genero || '');
    setEditExplicita(track.explicita);
    setEditPermiteDownload(track.permite_download);
    setMenuOpen(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.from('tracks').update({
        titulo: editTitulo.trim(),
        genero: editGenero || null,
        explicita: editExplicita,
        permite_download: editPermiteDownload,
      }).eq('id', editing.id);
      if (error) throw error;
      setTracks((ts) => ts.map((t) => t.id === editing.id ? {
        ...t,
        titulo: editTitulo.trim(),
        genero: editGenero || null,
        explicita: editExplicita,
        permite_download: editPermiteDownload,
      } : t));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTrack = async (track: Track) => {
    try {
      // Delete storage files
      if (track.audio_url) {
        const path = track.audio_url.split('/audio-tracks/')[1];
        if (path) await storage.delete('audio-tracks', path).catch(() => {});
      }
      if (track.capa_url) {
        const path = track.capa_url.split('/track-covers/')[1];
        if (path) await storage.delete('track-covers', path).catch(() => {});
      }
      await supabase.from('tracks').delete().eq('id', track.id);
      setTracks((ts) => ts.filter((t) => t.id !== track.id));
      setConfirmDelete(null);
    } catch {
      setError('Erro ao eliminar a faixa.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">As minhas faixas</h1>
        </div>
        <button
          onClick={() => navigate('/publicar')}
          className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center text-black glow-accent-sm"
        >
          <Plus size={22} />
        </button>
      </header>

      <div className="px-6 max-w-sm mx-auto">
        {tracks.length === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <Music size={26} className="text-neutral-600" />
            </div>
            <p className="text-white font-medium mb-1">Ainda não publicaste faixas</p>
            <p className="text-neutral-500 text-sm mb-4">Publica a tua primeira faixa para chegar aos ouvintes.</p>
            <button
              onClick={() => navigate('/publicar')}
              className="px-6 py-3 rounded-xl accent-gradient text-black font-semibold glow-accent-sm"
            >
              Publicar faixa
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <div key={track.id} className="relative flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden shrink-0">
                  {track.capa_url ? (
                    <img src={track.capa_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={18} className="text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${track.publicada ? 'text-white' : 'text-neutral-500'}`}>
                    {track.titulo}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {track.genero && <span className="text-neutral-500 text-xs">{track.genero}</span>}
                    {!track.publicada && (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-xs">Não publicada</span>
                    )}
                    {track.publicada && track.publicar_em && new Date(track.publicar_em).getTime() > Date.now() && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-600/15 text-amber-400 text-xs">
                        Agendada: {new Date(track.publicar_em).toLocaleDateString('pt-PT')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(menuOpen === track.id ? null : track.id)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors shrink-0"
                >
                  <MoreVertical size={18} />
                </button>

                {menuOpen === track.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                    <div className="absolute right-2 top-14 z-50 w-44 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-1">
                      <button
                        onClick={() => openEdit(track)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-white text-sm hover:bg-neutral-800 transition-colors"
                      >
                        <Edit2 size={15} /> Editar
                      </button>
                      <button
                        onClick={() => togglePublish(track)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-white text-sm hover:bg-neutral-800 transition-colors"
                      >
                        {track.publicada ? <><EyeOff size={15} /> Despublicar</> : <><Eye size={15} /> Publicar</>}
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(track); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-400 text-sm hover:bg-neutral-800 transition-colors"
                      >
                        <Trash2 size={15} /> Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Editar faixa</h2>
              <button onClick={() => setEditing(null)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-neutral-400 text-sm mb-1.5 block">Título</label>
                <input
                  type="text"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-neutral-400 text-sm mb-1.5 block">Género</label>
                <input
                  type="text"
                  value={editGenero}
                  onChange={(e) => setEditGenero(e.target.value)}
                  placeholder="Género musical"
                  className="w-full px-4 py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800">
                <span className="text-white text-sm">Conteúdo explícito</span>
                <button
                  onClick={() => setEditExplicita((v) => !v)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${editExplicita ? 'accent-gradient' : 'bg-neutral-700'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${editExplicita ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-800">
                <span className="text-white text-sm">Permitir download</span>
                <button
                  onClick={() => setEditPermiteDownload((v) => !v)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${editPermiteDownload ? 'accent-gradient' : 'bg-neutral-700'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${editPermiteDownload ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <button
                onClick={saveEdit}
                disabled={saving}
                className="w-full py-3.5 rounded-xl accent-gradient hover:opacity-90 disabled:opacity-40 text-black font-bold transition-all"
              >
                {saving ? 'A guardar...' : 'Guardar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} className="text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white text-center mb-2">Eliminar faixa?</h2>
            <p className="text-neutral-400 text-sm text-center mb-6">
              Esta ação não pode ser desfeita. A faixa e os ficheiros associados serão removidos permanentemente.
            </p>
            <button
              onClick={() => deleteTrack(confirmDelete)}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors mb-2"
            >
              Eliminar definitivamente
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              className="w-full py-3.5 rounded-xl text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
