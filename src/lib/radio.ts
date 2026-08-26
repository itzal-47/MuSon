import { supabase } from './supabase';
import type { TrackWithArtist } from '@/types/database';

interface ArtistJoin {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verificado: boolean;
  provincia: string | null;
}

function mapTrack(t: Record<string, unknown>): TrackWithArtist {
  const raw = t.artist as unknown;
  const artist = (Array.isArray(raw) ? raw[0] : raw) as ArtistJoin | null;
  return {
    ...t,
    artist_name: artist?.display_name || artist?.username || 'Artista',
    artist_avatar: artist?.avatar_url || null,
    artist_verificado: artist?.verificado || false,
  } as TrackWithArtist;
}

/**
 * Baralhamento ponderado: faixas com mais plays têm mais probabilidade de
 * aparecer cedo na fila, mas todas as faixas (incluindo as novas, com 0
 * plays) têm sempre hipótese — usa peso mínimo de 1.
 */
function weightedShuffle(tracks: TrackWithArtist[], weights: Map<string, number>): TrackWithArtist[] {
  const scored = tracks.map((t) => {
    const weight = (weights.get(t.id) || 0) + 1;
    // Efraimidis-Spirakis weighted random sampling key
    const key = Math.pow(Math.random(), 1 / weight);
    return { track: t, key };
  });
  scored.sort((a, b) => b.key - a.key);
  return scored.map((s) => s.track);
}

/**
 * Gera uma fila de "rádio" para uma província: faixas de artistas dessa
 * província, em ordem semi-aleatória ponderada pela popularidade (plays),
 * sem excluir faixas novas. Não é infinita — gera uma fila grande (até
 * `size` faixas) de uma vez, suficiente para uma sessão de audição longa.
 */
export async function fetchProvinceRadioQueue(provincia: string, size = 40): Promise<TrackWithArtist[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey!inner(display_name, username, avatar_url, verificado, provincia)
    `)
    .eq('publicada', true)
    .eq('artist.provincia', provincia)
    .limit(300);

  if (error || !data || data.length === 0) return [];

  const tracks = data.map(mapTrack);
  const trackIds = tracks.map((t) => t.id);

  const { data: plays } = await supabase
    .from('track_plays')
    .select('track_id')
    .in('track_id', trackIds)
    .limit(2000);

  const weights = new Map<string, number>();
  (plays || []).forEach((p) => {
    weights.set(p.track_id, (weights.get(p.track_id) || 0) + 1);
  });

  const shuffled = weightedShuffle(tracks, weights);
  return shuffled.slice(0, size);
}
