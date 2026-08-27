import { supabase } from './supabase';

export interface VerificationRequest {
  id: string;
  profile_id: string;
  mensagem: string;
  links: string[];
  status: 'pendente' | 'aprovado' | 'rejeitado';
  motivo_rejeicao: string | null;
  criado_em: string;
  revisto_em: string | null;
  profile_username?: string | null;
  profile_display_name?: string | null;
  profile_avatar_url?: string | null;
  profile_tipo?: string | null;
}

export interface ReportItem {
  id: string;
  tipo: 'faixa' | 'comentario' | 'perfil';
  item_id: string;
  reporter_id: string;
  motivo: string;
  resolvido: boolean;
  criado_em: string;
  reporter_username?: string | null;
}

export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function fetchVerificationRequests(status?: 'pendente' | 'aprovado' | 'rejeitado'): Promise<VerificationRequest[]> {
  let query = supabase
    .from('verification_requests')
    .select('*, profile:profiles!verification_requests_profile_id_fkey(username, display_name, avatar_url, tipo_perfil)')
    .order('criado_em', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const rawProfile = row.profile as unknown;
    const profile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as
      | { username: string | null; display_name: string | null; avatar_url: string | null; tipo_perfil: string | null }
      | null;
    return {
      id: row.id,
      profile_id: row.profile_id,
      mensagem: row.mensagem,
      links: row.links || [],
      status: row.status,
      motivo_rejeicao: row.motivo_rejeicao,
      criado_em: row.criado_em,
      revisto_em: row.revisto_em,
      profile_username: profile?.username,
      profile_display_name: profile?.display_name,
      profile_avatar_url: profile?.avatar_url,
      profile_tipo: profile?.tipo_perfil,
    };
  });
}

export async function approveVerificationRequest(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('approve_verification_request', { req_id: id });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function rejectVerificationRequest(id: string, motivo: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('reject_verification_request', { req_id: id, motivo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchReports(onlyUnresolved = true): Promise<ReportItem[]> {
  let query = supabase
    .from('reports')
    .select('*, reporter:profiles!reports_reporter_id_fkey(username)')
    .order('criado_em', { ascending: false });

  if (onlyUnresolved) query = query.eq('resolvido', false);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const rawReporter = row.reporter as unknown;
    const reporter = (Array.isArray(rawReporter) ? rawReporter[0] : rawReporter) as { username: string | null } | null;
    return {
      id: row.id,
      tipo: row.tipo,
      item_id: row.item_id,
      reporter_id: row.reporter_id,
      motivo: row.motivo,
      resolvido: row.resolvido,
      criado_em: row.criado_em,
      reporter_username: reporter?.username,
    };
  });
}

export async function resolveReport(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('reports')
    .update({ resolvido: true, resolvido_em: new Date().toISOString() })
    .eq('id', id);
  return !error;
}
