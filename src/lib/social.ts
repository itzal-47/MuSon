import { supabase } from './supabase';

export interface FollowedProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  tipo_perfil: 'ouvinte' | 'artista' | 'produtor';
  verificado: boolean;
  provincia: string | null;
}

export async function fetchFollowing(userId: string): Promise<FollowedProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url, tipo_perfil, verificado, provincia)')
    .eq('follower_id', userId);
  if (error || !data) return [];
  return data
    .map((row) => {
      const raw = row.following as unknown;
      return Array.isArray(raw) ? raw[0] : raw;
    })
    .filter((p): p is FollowedProfile => !!p);
}
