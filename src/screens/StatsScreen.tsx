import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, Heart, MessageCircle, Users, TrendingUp, BadgeCheck, Clock3 } from 'lucide-react';
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
  retentionPct: number | null;
}

interface FollowerTrendPoint {
  date: string;
  count: number;
}

export default function StatsScreen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trackStats, setTrackStats] = useState<TrackStat[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [provinceBreakdown, setProvinceBreakdown] = useState<{ provincia: string; count: number }[]>([]);
  const [hourHistogram, setHourHistogram] = useState<number[]>([]);
  const [followerTrend, setFollowerTrend] = useState<FollowerTrendPoint[]>([]);

  const isVerified = !!profile?.verificado;

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
      .select('track_id, criado_em, user_id, duracao_ouvida_segundos')
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

      let retentionPct: number | null = null;
      if (track.duracao_segundos && track.duracao_segundos > 0) {
        const withDuration = plays.filter((p) => p.duracao_ouvida_segundos != null);
        if (withDuration.length > 0) {
          const avgListened = withDuration.reduce((sum, p) => sum + (p.duracao_ouvida_segundos || 0), 0) / withDuration.length;
          retentionPct = Math.min(100, Math.round((avgListened / track.duracao_segundos) * 100));
        }
      }

      return { track, totalPlays: plays.length, plays7d, likes, comments, retentionPct };
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

    // Métricas avançadas — só para artistas/produtores verificados
    if (profile?.verificado) {
      const histogram = new Array(24).fill(0);
      (allPlays || []).forEach((p) => {
        const hour = new Date(p.criado_em).getHours();
        histogram[hour] += 1;
      });
      setHourHistogram(histogram);

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const { data: recentFollows } = await supabase
        .from('follows')
        .select('criado_em')
        .eq('following_id', user.id)
        .gte('criado_em', fourteenDaysAgo.toISOString());

      const buckets = new Map<string, number>();
      for (let i = 0; i < 14; i++) {
        const d = new Date(fourteenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      (recentFollows || []).forEach((f) => {
        const key = (f.criado_em as string).slice(0, 10);
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
      });
      setFollowerTrend([...buckets.entries()].map(([date, count]) => ({ date, count })));
    }

    setLoading(false);
  }, [user, profile]);

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

        {!isVerified && (
          <button
            onClick={() => navigate('/verificacao')}
            className="mt-4 w-full flex items-center gap-3 p-3 rounded-xl bg-amber-600/10 border border-amber-600/30 text-left"
          >
            <BadgeCheck size={18} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Desbloqueia estatísticas avançadas</p>
              <p className="text-neutral-400 text-xs">Pede o selo verificado para veres retenção, horário de pico e crescimento de seguidores.</p>
            </div>
          </button>
        )}
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

          {/* Métricas avançadas — exclusivo para verificados */}
          {isVerified && hourHistogram.some((h) => h > 0) && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Clock3 size={18} className="text-amber-500" /> Horário de pico
              </h2>
              <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                <div className="flex items-end gap-0.5 h-20">
                  {hourHistogram.map((count, hour) => {
                    const max = Math.max(1, ...hourHistogram);
                    const pct = Math.max(4, (count / max) * 100);
                    return (
                      <div key={hour} className="flex-1 rounded-t accent-gradient" style={{ height: `${pct}%` }} title={`${hour}h: ${count} plays`} />
                    );
                  })}
                </div>
                <div className="flex justify-between text-neutral-600 text-[10px] mt-2">
                  <span>0h</span>
                  <span>12h</span>
                  <span>23h</span>
                </div>
              </div>
            </section>
          )}

          {isVerified && followerTrend.some((t) => t.count > 0) && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Users size={18} className="text-amber-500" /> Crescimento de seguidores — 14 dias
              </h2>
              <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
                <div className="flex items-end gap-1 h-16">
                  {followerTrend.map((t) => {
                    const max = Math.max(1, ...followerTrend.map((x) => x.count));
                    const pct = Math.max(6, (t.count / max) * 100);
                    return <div key={t.date} className="flex-1 rounded-t accent-gradient" style={{ height: `${pct}%` }} title={`${t.date}: +${t.count}`} />;
                  })}
                </div>
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

                    {isVerified && s.retentionPct !== null && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                          <div className="h-full accent-gradient" style={{ width: `${s.retentionPct}%` }} />
                        </div>
                        <span className="text-neutral-500 text-[11px] shrink-0">{s.retentionPct}% ouvido em média</span>
                      </div>
                    )}

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
