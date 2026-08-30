import { supabase } from './supabase';

export interface DashboardStats {
  totalUsers: number;
  totalArtists: number;
  totalProducers: number;
  totalTracks: number;
  playsToday: number;
  playsWeek: number;
  newUsersWeek: number;
  pendingVerifications: number;
  unresolvedReports: number;
}

async function countRows(table: string, filters?: Record<string, string>): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
  }
  const { count } = await query;
  return count || 0;
}

async function countSince(table: string, column: string, isoDate: string): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .gte(column, isoDate);
  return count || 0;
}

export interface ProvinceBreakdownItem {
  provincia: string;
  count: number;
}

export interface GenreBreakdownItem {
  genero: string;
  count: number;
}

export interface SignupTrendPoint {
  date: string;
  count: number;
}

export async function fetchTopProvinces(limit = 6): Promise<ProvinceBreakdownItem[]> {
  const { data } = await supabase.from('profiles').select('provincia').not('provincia', 'is', null);
  if (!data) return [];
  const counts = new Map<string, number>();
  data.forEach((row) => {
    const p = row.provincia as string;
    counts.set(p, (counts.get(p) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([provincia, count]) => ({ provincia, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function fetchTopGenres(limit = 6): Promise<GenreBreakdownItem[]> {
  const { data } = await supabase.from('tracks').select('genero').eq('publicada', true).not('genero', 'is', null);
  if (!data) return [];
  const counts = new Map<string, number>();
  data.forEach((row) => {
    const g = row.genero as string;
    if (!g) return;
    counts.set(g, (counts.get(g) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([genero, count]) => ({ genero, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function fetchSignupTrend(days = 14): Promise<SignupTrendPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();
  const { data } = await supabase.from('profiles').select('criado_em').gte('criado_em', sinceIso);

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  (data || []).forEach((row) => {
    const key = (row.criado_em as string).slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  });

  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsers, totalArtists, totalProducers, totalTracks,
    playsToday, playsWeek, newUsersWeek, pendingVerifications, unresolvedReports,
  ] = await Promise.all([
    countRows('profiles'),
    countRows('profiles', { tipo_perfil: 'artista' }),
    countRows('profiles', { tipo_perfil: 'produtor' }),
    countRows('tracks', { publicada: 'true' }),
    countSince('track_plays', 'criado_em', startOfToday),
    countSince('track_plays', 'criado_em', sevenDaysAgo),
    countSince('profiles', 'criado_em', sevenDaysAgo),
    countRows('verification_requests', { status: 'pendente' }),
    countRows('reports', { resolvido: 'false' }),
  ]);

  return {
    totalUsers, totalArtists, totalProducers, totalTracks,
    playsToday, playsWeek, newUsersWeek, pendingVerifications, unresolvedReports,
  };
}
