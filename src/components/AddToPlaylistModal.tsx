import { useState, useEffect, useCallback } from 'react';
import { X, ListMusic, Plus, Check, Music } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Playlist } from '@/types/database';
import {
  fetchMyPlaylists,
  createPlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  isTrackInPlaylist,
} from '@/lib/playlists';

interface Props {
  trackId: string;
  onClose: () => void;
}

export default function AddToPlaylistModal({ trackId, onClose }: Props) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [membership, setMembership] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const mine = await fetchMyPlaylists(user.id);
    setPlaylists(mine);
    const checks = await Promise.all(mine.map((p) => isTrackInPlaylist(p.id, trackId)));
    const map: Record<string, boolean> = {};
    mine.forEach((p, i) => { map[p.id] = checks[i]; });
    setMembership(map);
    setLoading(false);
  }, [user, trackId]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (playlist: Playlist) => {
    if (!user) return;
    setBusyId(playlist.id);
    const inIt = membership[playlist.id];
    if (inIt) {
      await removeTrackFromPlaylist(playlist.id, trackId);
      setMembership((m) => ({ ...m, [playlist.id]: false }));
    } else {
      await addTrackToPlaylist(playlist.id, trackId, user.id);
      setMembership((m) => ({ ...m, [playlist.id]: true }));
    }
    setBusyId(null);
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const playlist = await createPlaylist(user.id, newName.trim());
    if (playlist) {
      await addTrackToPlaylist(playlist.id, trackId, user.id);
      setPlaylists((p) => [playlist, ...p]);
      setMembership((m) => ({ ...m, [playlist.id]: true }));
      setNewName('');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm max-h-[80vh] rounded-t-3xl sm:rounded-3xl bg-neutral-950 border border-neutral-800 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-neutral-900">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ListMusic size={18} className="text-amber-500" />
            Adicionar a playlist
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-neutral-900">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nova playlist..."
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none text-sm"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-4 rounded-xl accent-gradient disabled:opacity-40 text-black font-bold flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-neutral-900 mx-auto mb-3 flex items-center justify-center">
                <Music size={22} className="text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-sm">Ainda não tens playlists. Cria a primeira acima.</p>
            </div>
          ) : (
            playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => handleToggle(p)}
                disabled={busyId === p.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-900 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                  {p.capa_url ? (
                    <img src={p.capa_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic size={16} className="text-neutral-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white text-sm font-medium truncate">{p.nome}</p>
                  <p className="text-neutral-500 text-xs">{p.track_count ?? 0} faixas</p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${membership[p.id] ? 'accent-gradient' : 'border border-neutral-700'}`}>
                  {membership[p.id] && <Check size={14} className="text-black" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
