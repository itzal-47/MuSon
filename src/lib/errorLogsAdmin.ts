import { supabase } from './supabase';

export interface ErrorLogEntry {
  id: string;
  mensagem: string;
  stack: string | null;
  url: string | null;
  criado_em: string;
  resolvido: boolean;
}

export async function fetchRecentErrors(onlyUnresolved = true, limit = 20): Promise<ErrorLogEntry[]> {
  let query = supabase
    .from('error_logs')
    .select('id, mensagem, stack, url, criado_em, resolvido')
    .order('criado_em', { ascending: false })
    .limit(limit);
  if (onlyUnresolved) query = query.eq('resolvido', false);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as ErrorLogEntry[];
}

export async function markErrorResolved(id: string): Promise<boolean> {
  const { error } = await supabase.from('error_logs').update({ resolvido: true }).eq('id', id);
  return !error;
}

export async function countUnresolvedErrors(): Promise<number> {
  const { count } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .eq('resolvido', false);
  return count || 0;
}
