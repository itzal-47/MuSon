import { supabase } from './supabase';

export interface PlatformSettings {
  manutencao_ativa: boolean;
  manutencao_mensagem: string | null;
  banner_ativo: boolean;
  banner_mensagem: string | null;
  banner_nivel: 'info' | 'aviso' | 'urgente';
  banner_expira_em: string | null;
  uploads_ativados: boolean;
  comentarios_ativados: boolean;
  registos_ativados: boolean;
  playlists_colaborativas_ativadas: boolean;
  rate_limit_faixas_por_hora: number;
  rate_limit_denuncias_por_dia: number;
  termos_uso: string | null;
  politica_privacidade: string | null;
  generos: string[];
  premium_ativado: boolean;
  pagamento_instrucoes: string | null;
  atualizado_em: string | null;
}

const DEFAULTS: PlatformSettings = {
  manutencao_ativa: false,
  manutencao_mensagem: 'O MuSon está em manutenção. Voltamos já.',
  banner_ativo: false,
  banner_mensagem: null,
  banner_nivel: 'info',
  banner_expira_em: null,
  uploads_ativados: true,
  comentarios_ativados: true,
  registos_ativados: true,
  playlists_colaborativas_ativadas: true,
  rate_limit_faixas_por_hora: 10,
  rate_limit_denuncias_por_dia: 20,
  termos_uso: null,
  politica_privacidade: null,
  generos: ['Kuduro', 'Semba', 'Kizomba', 'Afro-house', 'Tarraxo', 'Afrobeats', 'Hip-hop', 'Gospel', 'Outro'],
  premium_ativado: false,
  pagamento_instrucoes: null,
  atualizado_em: null,
};

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle();
  if (error || !data) return DEFAULTS;
  return { ...DEFAULTS, ...data };
}

export function isBannerCurrentlyActive(settings: PlatformSettings): boolean {
  if (!settings.banner_ativo || !settings.banner_mensagem) return false;
  if (settings.banner_expira_em && new Date(settings.banner_expira_em).getTime() < Date.now()) return false;
  return true;
}

export async function updatePlatformSettings(
  patch: Partial<Omit<PlatformSettings, 'atualizado_em'>>,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('platform_settings')
    .update({ ...patch, atualizado_em: new Date().toISOString(), atualizado_por: adminId })
    .eq('id', true);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
