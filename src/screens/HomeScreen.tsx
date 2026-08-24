import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchRecentTracks, fetchTrendingTracks } from '@/lib/tracks';
import type { TrackWithArtist } from '@/types/database';
import TrackCard from '@/components/TrackCard';
import { Music, TrendingUp, Sparkles, ChevronRight, Disc3 } from 'lucide-react';

export default function HomeScreen() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [recent, setRecent] = useState<TrackWithArtist[]>([]);
  const [trending, setTrending] = useState<TrackWithArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [r, t] = await Promise.all([fetchRecentTracks(), fetchTrendingTracks()]);
      setRecent(r);
      setTrending(t);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-neutral-500 text-sm">Bem-vindo</p>
            <h1 className="text-2xl font-bold text-white">
              {profile?.display_name || profile?.username || 'MuSon'}
            </h1>
          </div>
          <div className="w-12 h-12 rounded-full accent-gradient flex items-center justify-center glow-accent-sm">
            <Music size={22} className="text-black" />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Novidades */}
          <section>
            <div className="flex items-center justify-between px-6 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <h2 className="text-lg font-bold text-white">Novidades</h2>
              </div>
              {recent.length > 0 && (
                <button className="text-neutral-500 text-xs flex items-center gap-1 hover:text-amber-500 transition-colors">
                  Ver tudo <ChevronRight size={14} />
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <EmptySection message="As faixas mais recentes vão aparecer aqui." />
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 pb-2">
                {recent.map((track) => (
                  <TrackCard key={track.id} track={track} queue={recent} variant="card" />
                ))}
              </div>
            )}
          </section>

          {/* Em alta */}
          <section>
            <div className="flex items-center justify-between px-6 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-amber-500" />
                <h2 className="text-lg font-bold text-white">Em alta</h2>
              </div>
              {trending.length > 0 && (
                <button className="text-neutral-500 text-xs flex items-center gap-1 hover:text-amber-500 transition-colors">
                  Ver tudo <ChevronRight size={14} />
                </button>
              )}
            </div>
            {trending.length === 0 ? (
              <EmptySection message="As faixas mais tocadas vão aparecer aqui." />
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 pb-2">
                {trending.map((track) => (
                  <TrackCard key={track.id} track={track} queue={trending} variant="card" />
                ))}
              </div>
            )}
          </section>

          {/* Géneros */}
          <section>
            <div className="flex items-center gap-2 px-6 mb-4">
              <Disc3 size={18} className="text-amber-500" />
              <h2 className="text-lg font-bold text-white">Explora por género</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-2">
              {['Kuduro', 'Semba', 'Kizomba', 'Afro-house', 'Tarraxo', 'Afrobeats', 'Hip-hop', 'Gospel'].map((g) => (
                <button
                  key={g}
                  onClick={() => navigate(`/genero/${encodeURIComponent(g)}`)}
                  className="shrink-0 px-4 py-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm font-medium hover:border-amber-600/50 hover:text-white transition-all card-elevate"
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          {/* Províncias */}
          <section>
            <div className="flex items-center gap-2 px-6 mb-4">
              <Music size={18} className="text-amber-500" />
              <h2 className="text-lg font-bold text-white">Descobre por província</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-2">
              {['Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Namibe'].map((p) => (
                <button
                  key={p}
                  onClick={() => navigate(`/provincia/${encodeURIComponent(p)}`)}
                  className="shrink-0 px-4 py-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm font-medium hover:border-amber-600/50 hover:text-white transition-all card-elevate"
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="px-6">
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-800 mx-auto mb-3 flex items-center justify-center">
          <Music size={24} className="text-neutral-600" />
        </div>
        <p className="text-neutral-400 text-sm">{message}</p>
      </div>
    </div>
  );
}
