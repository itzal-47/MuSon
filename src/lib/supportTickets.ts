import { supabase } from './supabase';

export interface SupportTicket {
  id: string;
  user_id: string;
  assunto: string;
  mensagem: string;
  status: 'aberto' | 'respondido' | 'fechado';
  resposta_admin: string | null;
  criado_em: string;
  respondido_em: string | null;
  prioritario: boolean;
  user_username?: string | null;
  user_display_name?: string | null;
}

export async function submitTicket(userId: string, assunto: string, mensagem: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('support_tickets').insert({ user_id: userId, assunto, mensagem });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchMyTickets(userId: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false });
  if (error || !data) return [];
  return data as SupportTicket[];
}

export async function fetchOpenTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*, profile:profiles!support_tickets_user_id_fkey(username, display_name)')
    .neq('status', 'fechado')
    .order('prioritario', { ascending: false })
    .order('criado_em', { ascending: true });
  if (error || !data) return [];
  return data.map((row) => {
    const rawProfile = row.profile as unknown;
    const profile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as { username: string | null; display_name: string | null } | null;
    return {
      ...row,
      user_username: profile?.username,
      user_display_name: profile?.display_name,
    };
  }) as SupportTicket[];
}

export async function replyToTicket(
  ticketId: string,
  resposta: string,
  adminId: string,
  fechar: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('support_tickets')
    .update({
      resposta_admin: resposta,
      status: fechar ? 'fechado' : 'respondido',
      respondido_em: new Date().toISOString(),
      respondido_por: adminId,
    })
    .eq('id', ticketId);
  if (error) return { ok: false, error: error.message };

  await supabase.from('admin_logs').insert({
    admin_id: adminId,
    acao: 'responder_ticket',
    alvo_tipo: 'support_ticket',
    alvo_id: ticketId,
  });
  return { ok: true };
}
