import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp } from 'lucide-react';
import TrackCard from '@/components/TrackCard';
import { fetchWeeklyChart } from '@/lib/weeklyChart';
import { PROVINCIAS } from '@/types/database';
import type { TrackWithArtist } from '@/types/database';

export default function ChartsScreen() {
  const navigate = useNavigate();
  const [provincia, setProvincia] = useState<string>('');
  const [tracks, setTracks] = useState<TrackWithArtist[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    const data = await fetchWeeklyChart({ provincia: p || undefined, limit: 20 });
    setTracks(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(provincia); }, [provincia, load]);

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={22} className="text-amber-500" />
            Charts da semana
          </h1>
        </div>
        <p className="text-neutral-500 text-sm mb-4">As faixas mais tocadas nos últimos 7 dias.</p>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setProvincia('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              provincia === '' ? 'accent-gradient text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
            }`}
          >
            Todo o país
          </button>
          {PROVINCIAS.map((p) => (
            <button
              key={p}
              onClick={() => setProvincia(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                provincia === p ? 'accent-gradient text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 text-center">
            <p className="text-white font-medium mb-1">Sem dados suficientes</p>
            <p className="text-neutral-400 text-sm">
              {provincia ? `Ainda não há plays esta semana para artistas de ${provincia}.` : 'Ainda não há plays suficientes esta semana.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div key={track.id} className="flex items-center gap-3">
                <span className={`w-7 text-center font-black text-lg shrink-0 ${index < 3 ? 'text-amber-500' : 'text-neutral-600'}`}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <TrackCard track={track} queue={tracks} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
