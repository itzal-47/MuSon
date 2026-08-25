import { supabase } from './supabase';
import type { Playlist, PlaylistCollaborator, TrackWithArtist } from '@/types/database';

interface OwnerJoin {
  display_name: string | null;
  username: string | null;
}

function mapPlaylist(p: Record<string, unknown>): Playlist {
  const owner = p.owner as OwnerJoin | null;
  const countRel = p.playlist_tracks as { count: number }[] | undefined;
  return {
    id: p.id as string,
    owner_id: p.owner_id as string,
    nome: p.nome as string,
    descricao: (p.descricao as string | null) ?? null,
    capa_url: (p.capa_url as string | null) ?? null,
    publica: p.publica as boolean,
    colaborativa: p.colaborativa as boolean,
    criado_em: p.criado_em as string,
    owner_name: owner?.display_name || owner?.username || 'Utilizador',
    track_count: countRel?.[0]?.count ?? 0,
  };
}

export async function fetchMyPlaylists(userId: string): Promise<Playlist[]> {
  // Playlists owned by the user
  const { data: owned, error: ownedErr } = await supabase
    .from('playlists')
    .select('*, owner:profiles!playlists_owner_id_fkey(display_name, username), playlist_tracks(count)')
    .eq('owner_id', userId)
    .order('criado_em', { ascending: false });

  // Playlists the user collaborates on (but doesn't own)
  const { data: collabRows } = await supabase
    .from('playlist_collaborators')
    .select('playlist_id')
    .eq('user_id', userId);

  const collabIds = (collabRows || []).map((c) => c.playlist_id as string);
  let collabPlaylists: Playlist[] = [];
  if (collabIds.length > 0) {
    const { data: collabData } = await supabase
      .from('playlists')
      .select('*, owner:profiles!playlists_owner_id_fkey(display_name, username), playlist_tracks(count)')
      .in('id', collabIds);
    collabPlaylists = (collabData || []).map(mapPlaylist);
  }

  if (ownedErr) return collabPlaylists;
  const ownedPlaylists = (owned || []).map(mapPlaylist);
  return [...ownedPlaylists, ...collabPlaylists];
}

export async function fetchPlaylist(id: string): Promise<Playlist | null> {
  const { data, error } = await supabase
    .from('playlists')
    .select('*, owner:profiles!playlists_owner_id_fkey(display_name, username), playlist_tracks(count)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapPlaylist(data);
}

export async function fetchPlaylistTracks(playlistId: string): Promise<TrackWithArtist[]> {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select(`
      posicao,
      track:tracks(*, artist:profiles!tracks_artist_id_fkey(display_name, username, avatar_url, verificado))
    `)
    .eq('playlist_id', playlistId)
    .order('posicao', { ascending: true });
  if (error || !data) return [];
  return data
    .filter((row) => row.track)
    .map((row) => {
      const rawTrack = row.track as unknown;
      const t = (Array.isArray(rawTrack) ? rawTrack[0] : rawTrack) as Record<string, unknown>;
      const artist = t.artist as { display_name: string | null; username: string | null; avatar_url: string | null; verificado: boolean } | null;
      return {
        ...t,
        artist_name: artist?.display_name || artist?.username || 'Artista',
        artist_avatar: artist?.avatar_url || null,
        artist_verificado: artist?.verificado || false,
      } as TrackWithArtist;
    });
}

export async function createPlaylist(
  ownerId: string,
  nome: string,
  opts?: { descricao?: string; publica?: boolean; colaborativa?: boolean }
): Promise<Playlist | null> {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      owner_id: ownerId,
      nome,
      descricao: opts?.descricao || null,
      publica: opts?.publica ?? true,
      colaborativa: opts?.colaborativa ?? false,
    })
    .select()
    .single();
  if (error || !data) return null;
  return mapPlaylist({ ...data, owner: null, playlist_tracks: [{ count: 0 }] });
}

export async function updatePlaylist(
  id: string,
  fields: Partial<Pick<Playlist, 'nome' | 'descricao' | 'capa_url' | 'publica' | 'colaborativa'>>
): Promise<boolean> {
  const { error } = await supabase.from('playlists').update(fields).eq('id', id);
  return !error;
}

export async function deletePlaylist(id: string): Promise<boolean> {
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  return !error;
}

export async function addTrackToPlaylist(playlistId: string, trackId: string, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('playlist_tracks')
    .select('*', { count: 'exact', head: true })
    .eq('playlist_id', playlistId);
  const { error } = await supabase.from('playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackId,
    adicionado_por: userId,
    posicao: count || 0,
  });
  return !error;
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);
  return !error;
}

export async function isTrackInPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  const { data } = await supabase
    .from('playlist_tracks')
    .select('id')
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)
    .maybeSingle();
  return !!data;
}

export async function reorderPlaylistTracks(playlistId: string, orderedTrackIds: string[]): Promise<boolean> {
  const updates = orderedTrackIds.map((trackId, index) =>
    supabase
      .from('playlist_tracks')
      .update({ posicao: index })
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId)
  );
  const results = await Promise.all(updates);
  return results.every((r) => !r.error);
}

export async function fetchCollaborators(playlistId: string): Promise<PlaylistCollaborator[]> {
  const { data, error } = await supabase
    .from('playlist_collaborators')
    .select('*, profile:profiles!playlist_collaborators_user_id_fkey(username, display_name, avatar_url)')
    .eq('playlist_id', playlistId);
  if (error || !data) return [];
  return data.map((row) => {
    const profile = row.profile as { username: string | null; display_name: string | null; avatar_url: string | null } | null;
    return {
      playlist_id: row.playlist_id,
      user_id: row.user_id,
      criado_em: row.criado_em,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

export async function addCollaboratorByUsername(playlistId: string, username: string): Promise<{ ok: boolean; error?: string }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .maybeSingle();
  if (!profile) return { ok: false, error: 'Nenhum utilizador encontrado com esse username.' };

  const { error } = await supabase
    .from('playlist_collaborators')
    .insert({ playlist_id: playlistId, user_id: profile.id });
  if (error) {
    if (error.message.includes('duplicate')) return { ok: false, error: 'Este utilizador já é colaborador.' };
    return { ok: false, error: 'Não foi possível adicionar o colaborador.' };
  }
  return { ok: true };
}

export async function removeCollaborator(playlistId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('playlist_collaborators')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('user_id', userId);
  return !error;
}
