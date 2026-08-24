import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchTracksByIds } from '@/lib/tracks';
import type { TrackWithArtist } from '@/types/database';
import TrackCard from '@/components/TrackCard';
import { Library as LibraryIcon, Heart, ListMusic, Clock, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LibraryScreen() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [likedTracks, setLikedTracks] = useState<TrackWithArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: likes } = await supabase
        .from('track_likes')
        .select('track_id')
        .eq('user_id', user.id)
        .order('criado_em', { ascending: false });
      if (likes && likes.length > 0) {
        const ids = likes.map((l) => l.track_id);
        const tracks = await fetchTracksByIds(ids);
        setLikedTracks(tracks);
      }
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black pb-32 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mb-4 glow-accent-sm">
          <LibraryIcon size={28} className="text-black" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">A tua biblioteca</h1>
        <p className="text-neutral-400 text-sm text-center mb-6">
          Inicia sessão para guardar faixas, álbuns e criar playlists.
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

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">A tua biblioteca</h1>
        <p className="text-neutral-500 text-sm">{profile?.display_name || profile?.username}</p>
      </header>

      <div className="px-6 space-y-6">
        {/* Gostei section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} className="text-amber-500" />
            <h2 className="text-lg font-bold text-white">Gostei</h2>
            {likedTracks.length > 0 && (
              <span className="text-neutral-500 text-sm">{likedTracks.length}</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : likedTracks.length === 0 ? (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
                <Heart size={24} className="text-neutral-600" />
              </div>
              <p className="text-white font-medium mb-1">Sem faixas gostadas</p>
              <p className="text-neutral-400 text-sm">Toca no coração de uma faixa para a guardar aqui.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {likedTracks.map((track) => (
                <TrackCard key={track.id} track={track} queue={likedTracks} />
              ))}
            </div>
          )}
        </section>

        {/* Playlists placeholder */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ListMusic size={18} className="text-amber-500" />
            <h2 className="text-lg font-bold text-white">Playlists</h2>
          </div>
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <ListMusic size={24} className="text-neutral-600" />
            </div>
            <p className="text-white font-medium mb-1">Sem playlists</p>
            <p className="text-neutral-400 text-sm">Em breve vais poder criar as tuas playlists.</p>
          </div>
        </section>

        {/* Recent placeholder */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-amber-500" />
            <h2 className="text-lg font-bold text-white">Reproduzidas recentemente</h2>
          </div>
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <Music size={24} className="text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-sm">O teu histórico de reprodução vai aparecer aqui.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
