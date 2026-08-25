import { supabase } from './supabase';
import { fetchTracksByIds } from './tracks';
import type { TrackWithArtist } from '@/types/database';

export async function savePlaybackState(userId: string, trackId: string, positionSeconds: number): Promise<void> {
  await supabase
    .from('playback_state')
    .upsert(
      { user_id: userId, track_id: trackId, posicao_segundos: Math.floor(positionSeconds), atualizado_em: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
}

export async function fetchContinueListening(
  userId: string
): Promise<{ track: TrackWithArtist; positionSeconds: number } | null> {
  const { data, error } = await supabase
    .from('playback_state')
    .select('track_id, posicao_segundos')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data || !data.track_id) return null;

  const tracks = await fetchTracksByIds([data.track_id]);
  if (tracks.length === 0) return null;
  return { track: tracks[0], positionSeconds: data.posicao_segundos || 0 };
}
