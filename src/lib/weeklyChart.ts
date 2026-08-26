import { supabase } from './supabase';
import type { TrackWithArtist } from '@/types/database';

interface ArtistJoin {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verificado: boolean;
}

function mapTrack(t: Record<string, unknown>, playCount: number): TrackWithArtist {
  const raw = t.artist as unknown;
  const artist = (Array.isArray(raw) ? raw[0] : raw) as ArtistJoin | null;
  return {
    ...t,
    artist_name: artist?.display_name || artist?.username || 'Artista',
    artist_avatar: artist?.avatar_url || null,
    artist_verificado: artist?.verificado || false,
    play_count: playCount,
  } as TrackWithArtist;
}

/**
 * Top faixas dos últimos 7 dias, opcionalmente filtrado por província do
 * artista. Diferente de fetchTrendingTracks (que usa janela de 30 dias) —
 * este é o "chart da semana", pensado para criar hábito de voltar toda a
 * semana a ver o que mudou.
 */
export async function fetchWeeklyChart(opts?: { provincia?: string; limit?: number }): Promise<TrackWithArtist[]> {
  const limit = opts?.limit ?? 10;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: plays, error: playErr } = await supabase
    .from('track_plays')
    .select('track_id')
    .gte('criado_em', sevenDaysAgo)
    .limit(1000);
  if (playErr || !plays || plays.length === 0) return [];

  const counts = new Map<string, number>();
  plays.forEach((p) => counts.set(p.track_id, (counts.get(p.track_id) || 0) + 1));

  const candidateIds = [...counts.keys()];
  if (candidateIds.length === 0) return [];

  let query = supabase
    .from('tracks')
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey${opts?.provincia ? '!inner' : ''}(display_name, username, avatar_url, verificado, provincia)
    `)
    .eq('publicada', true)
    .in('id', candidateIds);

  if (opts?.provincia) {
    query = query.eq('artist.provincia', opts.provincia);
  }

  const { data: tracks, error: trackErr } = await query;
  if (trackErr || !tracks) return [];

  const mapped = tracks.map((t) => mapTrack(t, counts.get(t.id as string) || 0));
  mapped.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
  return mapped.slice(0, limit);
}
