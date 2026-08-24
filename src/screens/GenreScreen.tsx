import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTracksByGenre } from '@/lib/tracks';
import type { TrackWithArtist } from '@/types/database';
import TrackCard from '@/components/TrackCard';
import { ArrowLeft, Music } from 'lucide-react';
import { GENERO_COLORS } from '@/types/database';

export default function GenreScreen() {
  const { genero } = useParams<{ genero: string }>();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<TrackWithArtist[]>([]);
  const [loading, setLoading] = useState(true);

  const decodedGenero = genero ? decodeURIComponent(genero) : '';
  const gradient = GENERO_COLORS[decodedGenero] || 'from-neutral-600 to-neutral-700';

  useEffect(() => {
    if (!decodedGenero) return;
    setLoading(true);
    fetchTracksByGenre(decodedGenero).then((t) => {
      setTracks(t);
      setLoading(false);
    });
  }, [decodedGenero]);

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header with gradient */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-14 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white z-10"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute bottom-4 left-6">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Género</p>
          <h1 className="text-3xl font-black text-white">{decodedGenero}</h1>
        </div>
      </div>

      <div className="px-6 pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
              <Music size={26} className="text-neutral-600" />
            </div>
            <p className="text-white font-medium mb-1">Sem faixas neste género</p>
            <p className="text-neutral-400 text-sm">Ainda não há faixas de {decodedGenero} publicadas. Volta mais tarde.</p>
          </div>
        ) : (
          <>
            <p className="text-neutral-500 text-sm mb-4">{tracks.length} {tracks.length === 1 ? 'faixa' : 'faixas'}</p>
            <div className="space-y-2">
              {tracks.map((track) => (
                <TrackCard key={track.id} track={track} queue={tracks} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
