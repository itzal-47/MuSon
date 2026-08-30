import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ListMusic, ChevronLeft, Play, MoreVertical, Users, Lock, Globe,
  Trash2, UserPlus, X, GripVertical, Pencil, Share2, Link2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { usePlatformSettings } from '@/context/PlatformSettingsContext';
import TrackCard from '@/components/TrackCard';
import type { Playlist, PlaylistCollaborator, TrackWithArtist } from '@/types/database';
import {
  fetchPlaylist, fetchPlaylistTracks, updatePlaylist, deletePlaylist,
  reorderPlaylistTracks, fetchCollaborators, addCollaboratorByUsername, removeCollaborator,
} from '@/lib/playlists';
import { shareOrCopyLink } from '@/lib/shareLink';

export default function PlaylistScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const { settings } = usePlatformSettings();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<TrackWithArtist[]>([]);
  const [collaborators, setCollaborators] = useState<PlaylistCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [newCollabUsername, setNewCollabUsername] = useState('');
  const [collabError, setCollabError] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const isOwner = !!user && playlist?.owner_id === user.id;
  const isCollaborator = !!user && collaborators.some((c) => c.user_id === user.id);
  const canEdit = isOwner || (playlist?.colaborativa && isCollaborator);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [p, t] = await Promise.all([fetchPlaylist(id), fetchPlaylistTracks(id)]);
    setPlaylist(p);
    setTracks(t);
    if (p) {
      const c = await fetchCollaborators(id);
      setCollaborators(c);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    playTrack(tracks[0], tracks);
  };

  const handleTogglePrivacy = async () => {
    if (!playlist) return;
    const publica = !playlist.publica;
    await updatePlaylist(playlist.id, { publica });
    setPlaylist({ ...playlist, publica });
  };

  const handleToggleCollaborative = async () => {
    if (!playlist) return;
    if (!playlist.colaborativa && settings && !settings.playlists_colaborativas_ativadas) return;
    const colaborativa = !playlist.colaborativa;
    await updatePlaylist(playlist.id, { colaborativa });
    setPlaylist({ ...playlist, colaborativa });
  };

  const handleDelete = async () => {
    if (!playlist) return;
    if (!confirm('Eliminar esta playlist? Esta ação não pode ser desfeita.')) return;
    await deletePlaylist(playlist.id);
    navigate('/biblioteca');
  };

  const handleSaveName = async () => {
    if (!playlist || !nameDraft.trim()) return;
    await updatePlaylist(playlist.id, { nome: nameDraft.trim() });
    setPlaylist({ ...playlist, nome: nameDraft.trim() });
    setEditingName(false);
  };

  const handleShare = async () => {
    if (!playlist) return;
    const result = await shareOrCopyLink({
      title: playlist.nome,
      text: `Ouve a playlist "${playlist.nome}" no MuSon`,
      url: window.location.href,
    });
    if (result === 'copied') {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  const handleAddCollaborator = async () => {
    if (!playlist || !newCollabUsername.trim()) return;
    setCollabError('');
    const result = await addCollaboratorByUsername(playlist.id, newCollabUsername.trim());
    if (!result.ok) {
      setCollabError(result.error || 'Erro ao adicionar.');
      return;
    }
    setNewCollabUsername('');
    const c = await fetchCollaborators(playlist.id);
    setCollaborators(c);
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!playlist) return;
    await removeCollaborator(playlist.id, userId);
    setCollaborators((c) => c.filter((x) => x.user_id !== userId));
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index || !playlist) return;
    const reordered = [...tracks];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setTracks(reordered);
    setDragIndex(null);
    await reorderPlaylistTracks(playlist.id, reordered.map((t) => t.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-black pb-32 flex flex-col items-center justify-center px-6">
        <ListMusic size={40} className="text-neutral-700 mb-4" />
        <p className="text-white font-medium mb-1">Playlist não encontrada</p>
        <p className="text-neutral-500 text-sm">Pode ter sido eliminada ou é privada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            {playlist.publica && (
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
              >
                {shareStatus === 'copied' ? <Link2 size={16} className="text-amber-500" /> : <Share2 size={16} />}
              </button>
            )}
            {isOwner && (
            <div className="relative">
              <button onClick={() => setShowMenu((s) => !s)} className="text-neutral-400 hover:text-white transition-colors">
                <MoreVertical size={22} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 w-56 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl overflow-hidden z-20">
                  <button
                    onClick={() => { setEditingName(true); setNameDraft(playlist.nome); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Pencil size={15} /> Renomear
                  </button>
                  <button
                    onClick={() => { handleTogglePrivacy(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-neutral-800 transition-colors"
                  >
                    {playlist.publica ? <Lock size={15} /> : <Globe size={15} />}
                    {playlist.publica ? 'Tornar privada' : 'Tornar pública'}
                  </button>
                  {!playlist.colaborativa && settings && !settings.playlists_colaborativas_ativadas ? null : (
                    <button
                      onClick={() => { handleToggleCollaborative(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-neutral-800 transition-colors"
                    >
                      <Users size={15} />
                      {playlist.colaborativa ? 'Desativar colaboração' : 'Ativar colaboração'}
                    </button>
                  )}
                  {playlist.colaborativa && (
                    <button
                      onClick={() => { setShowCollabModal(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-neutral-800 transition-colors"
                    >
                      <UserPlus size={15} /> Gerir colaboradores
                    </button>
                  )}
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-neutral-800 transition-colors"
                  >
                    <Trash2 size={15} /> Eliminar playlist
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        <div className="w-32 h-32 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 overflow-hidden">
          {playlist.capa_url ? (
            <img src={playlist.capa_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ListMusic size={40} className="text-neutral-700" />
          )}
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mb-1">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
              className="text-2xl font-bold bg-transparent border-b border-amber-600 text-white focus:outline-none flex-1"
            />
            <button onClick={handleSaveName} className="text-amber-500 text-sm font-semibold">Guardar</button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-white mb-1">{playlist.nome}</h1>
        )}

        <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
          <span>{playlist.owner_name}</span>
          <span>•</span>
          <span>{tracks.length} faixas</span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
            {playlist.publica ? <Globe size={11} /> : <Lock size={11} />}
            {playlist.publica ? 'Pública' : 'Privada'}
          </span>
          {playlist.colaborativa && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
              <Users size={11} /> Colaborativa
            </span>
          )}
        </div>

        {tracks.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="mt-5 flex items-center gap-2 px-6 py-3 rounded-xl accent-gradient hover:opacity-90 text-black font-bold transition-all glow-accent-sm"
          >
            <Play size={18} /> Reproduzir tudo
          </button>
        )}
      </header>

      <div className="px-6 space-y-2">
        {tracks.length === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
            <p className="text-white font-medium mb-1">Playlist vazia</p>
            <p className="text-neutral-400 text-sm">Adiciona faixas através do botão de playlist em qualquer música.</p>
          </div>
        ) : (
          tracks.map((track, index) => (
            <div
              key={track.id}
              draggable={canEdit}
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className="flex items-center gap-2"
            >
              {canEdit && <GripVertical size={16} className="text-neutral-700 shrink-0 cursor-grab" />}
              <div className="flex-1">
                <TrackCard track={track} queue={tracks} />
              </div>
            </div>
          ))
        )}
      </div>

      {showCollabModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-neutral-950 border border-neutral-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Colaboradores</h2>
              <button onClick={() => setShowCollabModal(false)} className="text-neutral-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                value={newCollabUsername}
                onChange={(e) => setNewCollabUsername(e.target.value)}
                placeholder="username do utilizador"
                className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-amber-600 focus:outline-none text-sm"
              />
              <button
                onClick={handleAddCollaborator}
                className="px-4 rounded-xl accent-gradient text-black font-bold flex items-center justify-center"
              >
                <UserPlus size={18} />
              </button>
            </div>
            {collabError && <p className="text-red-400 text-xs mb-3">{collabError}</p>}

            <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
              {collaborators.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-4">Sem colaboradores ainda.</p>
              ) : (
                collaborators.map((c) => (
                  <div key={c.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-900">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden shrink-0">
                      {c.avatar_url && <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="flex-1 text-sm text-white truncate">{c.display_name || c.username}</span>
                    <button onClick={() => handleRemoveCollaborator(c.user_id)} className="text-neutral-500 hover:text-red-400">
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
