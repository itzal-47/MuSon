import { supabase } from './supabase';
import type { Track, TrackWithArtist } from '@/types/database';

export async function fetchRecentTracks(limit = 20): Promise<TrackWithArtist[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(display_name, username, avatar_url, verificado)
    `)
    .eq('publicada', true)
    .order('criado_em', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map((t) => {
    const artist = t.artist as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
    return {
      ...t,
      artist_name: artist?.display_name || artist?.username || 'Artista',
      artist_avatar: artist?.avatar_url || null,
      artist_verificado: artist?.verificado || false,
    } as TrackWithArtist;
  });
}

export async function fetchTrendingTracks(limit = 20): Promise<TrackWithArtist[]> {
  // Get tracks ordered by play count in the last 30 days
  const { data: plays, error: playErr } = await supabase
    .from('track_plays')
    .select('track_id')
    .gte('criado_em', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500);
  if (playErr) return fetchRecentTracks(limit);

  const counts = new Map<string, number>();
  (plays || []).forEach((p: { track_id: string }) => {
    counts.set(p.track_id, (counts.get(p.track_id) || 0) + 1);
  });

  const sortedIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  if (sortedIds.length === 0) return fetchRecentTracks(limit);

  const { data: tracks, error: trackErr } = await supabase
    .from('tracks')
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(display_name, username, avatar_url, verificado)
    `)
    .in('id', sortedIds)
    .eq('publicada', true);

  if (trackErr || !tracks) return fetchRecentTracks(limit);

  // Sort by play count order
  const indexed = tracks.map((t) => {
    const artist = t.artist as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
    return {
      ...t,
      artist_name: artist?.display_name || artist?.username || 'Artista',
      artist_avatar: artist?.avatar_url || null,
      artist_verificado: artist?.verificado || false,
      play_count: counts.get(t.id) || 0,
    } as TrackWithArtist;
  });
  indexed.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
  return indexed;
}

export async function fetchTracksByArtist(artistId: string): Promise<TrackWithArtist[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(display_name, username, avatar_url, verificado)
    `)
    .eq('artist_id', artistId)
    .eq('publicada', true)
    .order('criado_em', { ascending: false });
  if (error) return [];
  return (data || []).map((t) => {
    const artist = t.artist as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
    return {
      ...t,
      artist_name: artist?.display_name || artist?.username || 'Artista',
      artist_avatar: artist?.avatar_url || null,
      artist_verificado: artist?.verificado || false,
    } as TrackWithArtist;
  });
}

export async function fetchTracksByGenre(genero: string): Promise<TrackWithArtist[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(display_name, username, avatar_url, verificado)
    `)
    .eq('publicada', true)
    .eq('genero', genero)
    .order('criado_em', { ascending: false });
  if (error) return [];
  return (data || []).map((t) => {
    const artist = t.artist as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
    return {
      ...t,
      artist_name: artist?.display_name || artist?.username || 'Artista',
      artist_avatar: artist?.avatar_url || null,
      artist_verificado: artist?.verificado || false,
    } as TrackWithArtist;
  });
}

export async function searchTracks(query: string): Promise<TrackWithArtist[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(display_name, username, avatar_url, verificado)
    `)
    .eq('publicada', true)
    .ilike('titulo', `%${query}%`)
    .order('criado_em', { ascending: false })
    .limit(30);
  if (error) return [];
  return (data || []).map((t) => {
    const artist = t.artist as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
    return {
      ...t,
      artist_name: artist?.display_name || artist?.username || 'Artista',
      artist_avatar: artist?.avatar_url || null,
      artist_verificado: artist?.verificado || false,
    } as TrackWithArtist;
  });
}

export async function searchProfiles(
  query: string,
  tipo?: 'artista' | 'produtor' | null,
  provincia?: string | null
): Promise<{ id: string; username: string | null; display_name: string | null; avatar_url: string | null; tipo_perfil: string | null; provincia: string | null; verificado: boolean }[]> {
  let q = supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, tipo_perfil, provincia, verificado');

  if (tipo) q = q.eq('tipo_perfil', tipo);
  if (provincia) q = q.eq('provincia', provincia);
  if (query) {
    q = q.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
  }

  const { data, error } = await q.order('verificado', { ascending: false }).limit(30);
  if (error) return [];
  return data || [];
}

export async function fetchProfilesByProvincia(
  provincia: string,
  tipo?: 'artista' | 'produtor' | null
): Promise<{ id: string; username: string | null; display_name: string | null; avatar_url: string | null; tipo_perfil: string | null; provincia: string | null; verificado: boolean }[]> {
  let q = supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, tipo_perfil, provincia, verificado')
    .eq('provincia', provincia);
  if (tipo) q = q.eq('tipo_perfil', tipo);
  const { data, error } = await q.order('verificado', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchTracksByIds(ids: string[]): Promise<TrackWithArtist[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      *,
      artist:profiles!tracks_artist_id_fkey(display_name, username, avatar_url, verificado)
    `)
    .in('id', ids)
    .eq('publicada', true);
  if (error || !data) return [];
  const indexed = data.map((t) => {
    const artist = t.artist as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
    return {
      ...t,
      artist_name: artist?.display_name || artist?.username || 'Artista',
      artist_avatar: artist?.avatar_url || null,
      artist_verificado: artist?.verificado || false,
    } as TrackWithArtist;
  });
  // Preserve the order of the input ids
  indexed.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return indexed;
}

export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(Math.round(audio.duration) || 0);
    };
    audio.onerror = () => resolve(0);
    audio.src = URL.createObjectURL(file);
  });
}

export type { Track, TrackWithArtist };
