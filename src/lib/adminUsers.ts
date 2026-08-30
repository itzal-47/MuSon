import { supabase } from './supabase';

export interface AdminUserResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  tipo_perfil: string | null;
  provincia: string | null;
  verificado: boolean;
  suspenso: boolean;
  suspenso_motivo: string | null;
  premium_until: string | null;
  email: string | null;
  criado_em: string;
}

export async function searchUsers(query: string): Promise<AdminUserResult[]> {
  const { data, error } = await supabase.rpc('admin_search_users', { search_query: query });
  if (error || !data) return [];
  return data as AdminUserResult[];
}

export { isPremiumActive } from './premium';

export async function grantPremium(targetId: string, dias: number, motivo: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('grant_premium', { target_id: targetId, dias, motivo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function revokePremium(targetId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('revoke_premium', { target_id: targetId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function suspendUser(targetId: string, motivo: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('suspend_user', { target_id: targetId, motivo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unsuspendUser(targetId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('unsuspend_user', { target_id: targetId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
