import { supabase } from './supabase';

export interface AdminLogEntry {
  id: string;
  admin_id: string;
  acao: string;
  alvo_tipo: string | null;
  alvo_id: string | null;
  detalhes: Record<string, unknown> | null;
  criado_em: string;
  admin_username?: string | null;
}

const ACAO_LABEL: Record<string, string> = {
  conceder_premium: 'Concedeu Premium',
  revogar_premium: 'Revogou Premium',
  suspender_conta: 'Suspendeu conta',
  reativar_conta: 'Reativou conta',
  remover_faixa: 'Removeu faixa',
  remover_comentario: 'Removeu comentário',
  remover_playlist: 'Removeu playlist',
  adicionar_destaque: 'Adicionou destaque',
  responder_ticket: 'Respondeu a ticket',
};

export function formatAcao(acao: string): string {
  return ACAO_LABEL[acao] || acao;
}

export async function fetchAdminLogs(limit = 50): Promise<AdminLogEntry[]> {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*, admin:profiles!admin_logs_admin_id_fkey(username)')
    .order('criado_em', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => {
    const rawAdmin = row.admin as unknown;
    const admin = (Array.isArray(rawAdmin) ? rawAdmin[0] : rawAdmin) as { username: string | null } | null;
    return { ...row, admin_username: admin?.username };
  }) as AdminLogEntry[];
}
