import { supabase } from './supabase';

export interface FeaturedItem {
  id: string;
  tipo: 'faixa' | 'artista' | 'playlist';
  item_id: string;
  titulo_custom: string | null;
  subtitulo_custom: string | null;
  posicao: number;
  ativo: boolean;
  criado_em: string;
}

export async function fetchActiveFeatured(): Promise<FeaturedItem[]> {
  const { data, error } = await supabase
    .from('featured_content')
    .select('*')
    .eq('ativo', true)
    .order('posicao', { ascending: true });
  if (error || !data) return [];
  return data as FeaturedItem[];
}

export async function fetchAllFeatured(): Promise<FeaturedItem[]> {
  const { data, error } = await supabase
    .from('featured_content')
    .select('*')
    .order('posicao', { ascending: true });
  if (error || !data) return [];
  return data as FeaturedItem[];
}

export interface ResolvedFeaturedItem {
  id: string;
  tipo: FeaturedItem['tipo'];
  itemId: string;
  titulo: string;
  subtitulo: string | null;
  imagem: string | null;
  track?: import('@/types/database').TrackWithArtist;
}

export async function fetchFeaturedResolved(): Promise<ResolvedFeaturedItem[]> {
  const items = await fetchActiveFeatured();
  if (items.length === 0) return [];

  const trackIds = items.filter((i) => i.tipo === 'faixa').map((i) => i.item_id);
  const profileIds = items.filter((i) => i.tipo === 'artista' || i.tipo === 'playlist').map((i) => i.item_id);

  const [{ fetchTracksByIds }] = await Promise.all([import('./tracks')]);
  const tracks = trackIds.length > 0 ? await fetchTracksByIds(trackIds) : [];
  const trackById = new Map(tracks.map((t) => [t.id, t]));

  let profileById = new Map<string, { display_name: string | null; username: string | null; avatar_url: string | null }>();
  if (profileIds.length > 0) {
    const { data } = await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', profileIds);
    profileById = new Map((data || []).map((p) => [p.id, p]));
  }

  return items
    .map((item): ResolvedFeaturedItem | null => {
      if (item.tipo === 'faixa') {
        const t = trackById.get(item.item_id);
        if (!t) return null;
        return {
          id: item.id, tipo: item.tipo, itemId: item.item_id,
          titulo: item.titulo_custom || t.titulo,
          subtitulo: item.subtitulo_custom || t.artist_name || null,
          imagem: t.capa_url,
          track: t,
        };
      }
      const p = profileById.get(item.item_id);
      if (!p) return null;
      return {
        id: item.id, tipo: item.tipo, itemId: item.item_id,
        titulo: item.titulo_custom || p.display_name || p.username || '',
        subtitulo: item.subtitulo_custom,
        imagem: p.avatar_url,
      };
    })
    .filter((x): x is ResolvedFeaturedItem => x !== null);
}

export async function addFeatured(
  tipo: FeaturedItem['tipo'],
  itemId: string,
  adminId: string,
  extras?: { titulo_custom?: string; subtitulo_custom?: string }
): Promise<{ ok: boolean; error?: string }> {
  const { count } = await supabase.from('featured_content').select('*', { count: 'exact', head: true });
  const { error } = await supabase.from('featured_content').insert({
    tipo,
    item_id: itemId,
    titulo_custom: extras?.titulo_custom || null,
    subtitulo_custom: extras?.subtitulo_custom || null,
    posicao: count || 0,
    criado_por: adminId,
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from('admin_logs').insert({
    admin_id: adminId,
    acao: 'adicionar_destaque',
    alvo_tipo: tipo,
    alvo_id: itemId,
  });
  return { ok: true };
}

export async function toggleFeatured(id: string, ativo: boolean): Promise<boolean> {
  const { error } = await supabase.from('featured_content').update({ ativo }).eq('id', id);
  return !error;
}

export async function removeFeatured(id: string): Promise<boolean> {
  const { error } = await supabase.from('featured_content').delete().eq('id', id);
  return !error;
}

export async function reorderFeatured(orderedIds: string[]): Promise<boolean> {
  const updates = orderedIds.map((id, index) =>
    supabase.from('featured_content').update({ posicao: index }).eq('id', id)
  );
  const results = await Promise.all(updates);
  return results.every((r) => !r.error);
}
