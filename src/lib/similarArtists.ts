import { supabase } from './supabase';

export interface SimilarArtist {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  verificado: boolean;
  provincia: string | null;
  matchedGeneros: string[];
}

interface ProfileJoin {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  verificado: boolean;
  provincia: string | null;
  tipo_perfil: string | null;
}

/**
 * Artistas semelhantes: pontuação simples baseada em géneros partilhados
 * (peso maior) e mesma província (peso menor). Sem tabela nova — calculado
 * no cliente a partir de artist_profiles + profiles, o que é suficiente
 * para a escala atual da plataforma.
 */
export async function fetchSimilarArtists(
  currentArtistId: string,
  currentGeneros: string[],
  currentProvincia: string | null,
  limit = 6
): Promise<SimilarArtist[]> {
  const { data, error } = await supabase
    .from('artist_profiles')
    .select('profile_id, generos, profile:profiles!artist_profiles_profile_id_fkey(id, username, display_name, avatar_url, verificado, provincia, tipo_perfil)')
    .neq('profile_id', currentArtistId)
    .limit(200);

  if (error || !data) return [];

  const scored = data
    .map((row) => {
      const rawProfile = row.profile as unknown;
      const profile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as ProfileJoin | null;
      if (!profile || profile.tipo_perfil !== 'artista') return null;

      const generos = (row.generos as string[] | null) || [];
      const matchedGeneros = generos.filter((g) => currentGeneros.includes(g));
      const provinciaMatch = !!currentProvincia && profile.provincia === currentProvincia;
      const score = matchedGeneros.length * 2 + (provinciaMatch ? 1 : 0);

      if (score === 0) return null;

      return {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        verificado: profile.verificado,
        provincia: profile.provincia,
        matchedGeneros,
        score,
      };
    })
    .filter((x): x is SimilarArtist & { score: number } => !!x);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
