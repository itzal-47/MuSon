import { supabase } from './supabase';
import type { VerificationRequest } from './admin';

export async function fetchMyVerificationRequest(profileId: string): Promise<VerificationRequest | null> {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('profile_id', profileId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    profile_id: data.profile_id,
    mensagem: data.mensagem,
    links: data.links || [],
    status: data.status,
    motivo_rejeicao: data.motivo_rejeicao,
    criado_em: data.criado_em,
    revisto_em: data.revisto_em,
  };
}

export async function submitVerificationRequest(
  profileId: string,
  mensagem: string,
  links: string[]
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('verification_requests').insert({
    profile_id: profileId,
    mensagem,
    links: links.filter((l) => l.trim().length > 0),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
