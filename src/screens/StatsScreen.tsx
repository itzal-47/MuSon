import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, Heart, MessageCircle, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchTracksByArtist } from '@/lib/tracks';
import type { TrackWithArtist } from '@/types/database';

interface TrackStat {
  track: TrackWithArtist;
  totalPlays: number;
  plays7d: number;
  likes: number;
  comments: number;
}

export default function StatsScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trackStats, setTrackStats] = useState<TrackStat[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [provinceBreakdown, setProvinceBreakdown] = useState<{ provincia: string; count: number }[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const myTracks = await fetchTracksByArtist(user.id);
    const trackIds = myTracks.map((t) => t.id);

    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);
    setFollowerCount(followers || 0);

    if (trackIds.length === 0) {
      setTrackStats([]);
      setLoading(false);
      return;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: allPlays } = await supabase
      .from('track_plays')
      .select('track_id, criado_em, user_id')
      .in('track_id', trackIds);

    const { data: allLikes } = await supabase
      .from('track_likes')
      .select('track_id')
      .in('track_id', trackIds);

    const { data: allComments } = await supabase
      .from('track_comments')
      .select('track_id')
      .in('track_id', trackIds);

    const stats: TrackStat[] = myTracks.map((track) => {
      const plays = (allPlays || []).filter((p) => p.track_id === track.id);
      const plays7d = plays.filter((p) => p.criado_em >= sevenDaysAgo).length;
      const likes = (allLikes || []).filter((l) => l.track_id === track.id).length;
      const comments = (allComments || []).filter((c) => c.track_id === track.id).length;
      return { track, totalPlays: plays.length, plays7d, likes, comments };
    });
    stats.sort((a, b) => b.totalPlays - a.totalPlays);
    setTrackStats(stats);

    // Distribuição por província: cruza plays com o perfil de quem ouviu
    const listenerIds = [...new Set((allPlays || []).map((p) => p.user_id).filter(Boolean))] as string[];
    if (listenerIds.length > 0) {
      const { data: listenerProfiles } = await supabase
        .from('profiles')
        .select('id, provincia')
        .in('id', listenerIds);
      const provinceCounts = new Map<string, number>();
      (listenerProfiles || []).forEach((p) => {
        if (!p.provincia) return;
        provinceCounts.set(p.provincia, (provinceCounts.get(p.provincia) || 0) + 1);
      });
      const breakdown = [...provinceCounts.entries()]
        .map(([provincia, count]) => ({ provincia, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setProvinceBreakdown(breakdown);
    } else {
      setProvinceBreakdown([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user || (profile?.tipo_perfil !== 'artista' && profile?.tipo_perfil !== 'produtor')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <p className="text-neutral-400 text-sm text-center">Estatísticas disponíveis apenas para artistas e produtores.</p>
      </div>
    );
  }

  const totalPlays = trackStats.reduce((sum, s) => sum + s.totalPlays, 0);
  const maxPlays7d = Math.max(1, ...trackStats.map((s) => s.plays7d));

  return (
    <div className="min-h-screen bg-black pb-32">
      <header className="px-6 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Estatísticas</h1>
        </div>

        <p className="text-neutral-500 text-sm">
          A base da transparência de receita do MuSon — números reais, sempre visíveis para ti.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {/* Cards agregados */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <BarChart3 size={16} />
                <span className="text-xs text-neutral-500">Total de plays</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalPlays}</p>
            </div>
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Users size={16} />
                <span className="text-xs text-neutral-500">Seguidores</span>
              </div>
              <p className="text-2xl font-bold text-white">{followerCount}</p>
            </div>
          </div>

          {/* Distribuição por província */}
          {provinceBreakdown.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Ouvintes por província</h2>
              <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
                {provinceBreakdown.map((p) => {
                  const max = provinceBreakdown[0].count;
                  const pct = Math.round((p.count / max) * 100);
                  return (
                    <div key={p.provincia}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300">{p.provincia}</span>
                        <span className="text-neutral-500">{p.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                        <div className="h-full accent-gradient" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Faixas */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-amber-500" />
              <h2 className="text-lg font-bold text-white">As tuas faixas</h2>
            </div>

            {trackStats.length === 0 ? (
              <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
                <p className="text-neutral-400 text-sm">Publica a tua primeira faixa para veres estatísticas aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trackStats.map((s) => (
                  <div key={s.track.id} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden shrink-0">
                        {s.track.capa_url && <img src={s.track.capa_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{s.track.titulo}</p>
                        <p className="text-neutral-500 text-xs">{s.totalPlays} plays no total</p>
                      </div>
                    </div>

                    <div className="h-8 flex items-end mb-2">
                      <div
                        className="w-full rounded accent-gradient transition-all"
                        style={{ height: `${Math.max(8, (s.plays7d / maxPlays7d) * 100)}%` }}
                      />
                    </div>
                    <p className="text-neutral-600 text-[11px] mb-3">{s.plays7d} plays nos últimos 7 dias</p>

                    <div className="flex items-center gap-4 text-neutral-400 text-xs">
                      <span className="flex items-center gap-1"><Heart size={12} /> {s.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} /> {s.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
