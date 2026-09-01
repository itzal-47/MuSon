import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Heart, Users, History, Plus, Music, BadgeCheck, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TrackCard from '@/components/TrackCard';
import type { Playlist, TrackWithArtist } from '@/types/database';
import { fetchMyPlaylists, createPlaylist } from '@/lib/playlists';
import { fetchRecentlyPlayed } from '@/lib/history';
import { fetchFollowing, type FollowedProfile } from '@/lib/social';
import { fetchTracksByIds } from '@/lib/tracks';
import { supabase } from '@/lib/supabase';
import { useLoginModal } from '@/context/LoginModalContext';

type Tab = 'playlists' | 'gostei' | 'seguindo' | 'historico';

const TABS: { id: Tab; label: string; icon: typeof ListMusic }[] = [
  { id: 'playlists', label: 'Playlists', icon: ListMusic },
  { id: 'gostei', label: 'Gostei', icon: Heart },
  { id: 'seguindo', label: 'A seguir', icon: Users },
  { id: 'historico', label: 'Histórico', icon: History },
];

export default function LibraryScreen() {
  const { user } = useAuth();
  const { requireLogin } = useLoginModal();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('playlists');

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<TrackWithArtist[]>([]);
  const [following, setFollowing] = useState<FollowedProfile[]>([]);
  const [history, setHistory] = useState<TrackWithArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [pl, hist, follows] = await Promise.all([
      fetchMyPlaylists(user.id),
      fetchRecentlyPlayed(user.id),
      fetchFollowing(user.id),
    ]);
    setPlaylists(pl);
    setHistory(hist);
    setFollowing(follows);

    const { data: likes } = await supabase
      .from('track_likes')
      .select('track_id')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false });

    if (likes && likes.length > 0) {
      const trackIds = likes.map((l) => l.track_id as string);
      const tracks = await fetchTracksByIds(trackIds);
      const byId = new Map(tracks.map((t) => [t.id, t]));
      setLikedTracks(trackIds.map((id) => byId.get(id)).filter((t): t is TrackWithArtist => !!t));
    } else {
      setLikedTracks([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;
    setCreating(true);
    const playlist = await createPlaylist(user.id, newPlaylistName.trim());
    setCreating(false);
    if (playlist) {
      setShowCreateModal(false);
      setNewPlaylistName('');
      navigate(`/playlist/${playlist.id}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black pb-32 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
          <ListMusic size={26} className="text-neutral-600" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">A tua biblioteca</h1>
        <p className="text-neutral-500 text-sm mb-6 max-w-xs">
          Cria conta ou inicia sessão para guardares playlists, faixas favoritas e o teu histórico.
        </p>
        <button
          onClick={() => requireLogin('Inicia sessão para veres a tua biblioteca.')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl accent-gradient text-black font-bold glow-accent-sm"
        >
          <LogIn size={18} /> Entrar ou registar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-white mb-5">Biblioteca</h1>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  active ? 'accent-gradient text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-6">
          {tab === 'playlists' && (
            <div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-neutral-900 border border-dashed border-neutral-800 hover:border-amber-600/50 transition-colors mb-3"
              >
                <div className="w-10 h-10 rounded-lg accent-gradient flex items-center justify-center">
                  <Plus size={18} className="text-black" />
                </div>
                <span className="text-white font-medium text-sm">Criar nova playlist</span>
              </button>

              {playlists.length === 0 ? (
                <EmptyState icon={ListMusic} text="Ainda não tens playlists." />
              ) : (
                <div className="space-y-2">
                  {playlists.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/playlist/${p.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-600/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.capa_url ? (
                          <img src={p.capa_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ListMusic size={18} className="text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-white font-medium text-sm truncate">{p.nome}</p>
                        <p className="text-neutral-500 text-xs">
                          {p.owner_id === user.id ? 'Tua playlist' : `De ${p.owner_name}`} • {p.track_count ?? 0} faixas
                          {p.colaborativa ? ' • Colaborativa' : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'gostei' && (
            likedTracks.length === 0 ? (
              <EmptyState icon={Heart} text="Ainda não gostaste de nenhuma faixa." />
            ) : (
              <div className="space-y-2">
                {likedTracks.map((t) => <TrackCard key={t.id} track={t} queue={likedTracks} />)}
              </div>
            )
          )}

          {tab === 'seguindo' && (
            following.length === 0 ? (
              <EmptyState icon={Users} text="Ainda não segues nenhum artista ou produtor." />
            ) : (
              <div className="space-y-2">
                {following.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/artista/${p.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-600/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music size={16} className="text-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1">
                        <p className="text-white font-medium text-sm truncate">{p.display_name || p.username}</p>
                        {p.verificado && <BadgeCheck size={13} className="text-white fill-blue-500 shrink-0" />}
                      </div>
                      <p className="text-neutral-500 text-xs capitalize">{p.tipo_perfil}{p.provincia ? ` • ${p.provincia}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'historico' && (
            history.length === 0 ? (
              <EmptyState icon={History} text="Ainda não ouviste nenhuma faixa." />
            ) : (
              <div className="space-y-2">
                {history.map((t) => <TrackCard key={t.id} track={t} queue={history} />)}
              </div>
            )
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-neutral-950 border border-neutral-800 p-5">
            <h2 className="text-lg font-bold text-white mb-4">Nova playlist</h2>
            <input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Nome da playlist"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || creating}
                className="flex-1 py-3 rounded-xl accent-gradient text-black font-bold text-sm disabled:opacity-40"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof ListMusic; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
        <Icon size={22} className="text-neutral-600" />
      </div>
      <p className="text-neutral-500 text-sm">{text}</p>
    </div>
  );
}
