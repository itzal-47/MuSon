import { supabase } from './supabase';
import type { TrackWithArtist } from '@/types/database';
import { fetchTracksByIds } from './tracks';

/**
 * Devolve as faixas ouvidas recentemente por um utilizador, sem repetir a
 * mesma faixa consecutivamente, mais recentes primeiro.
 */
export async function fetchRecentlyPlayed(userId: string, limit = 20): Promise<TrackWithArtist[]> {
  const { data, error } = await supabase
    .from('track_plays')
    .select('track_id, criado_em')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false })
    .limit(200);
  if (error || !data) return [];

  const orderedIds: string[] = [];
  for (const row of data) {
    if (orderedIds[orderedIds.length - 1] !== row.track_id) {
      orderedIds.push(row.track_id);
    }
    if (orderedIds.length >= limit) break;
  }
  if (orderedIds.length === 0) return [];

  const tracks = await fetchTracksByIds(orderedIds);
  const byId = new Map(tracks.map((t) => [t.id, t]));
  return orderedIds.map((id) => byId.get(id)).filter((t): t is TrackWithArtist => !!t);
}
