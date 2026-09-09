import { describe, it, expect } from 'vitest';
import { isBannerCurrentlyActive, type PlatformSettings } from './platformSettings';

function fakeSettings(overrides: Partial<PlatformSettings>): PlatformSettings {
  return {
    manutencao_ativa: false,
    manutencao_mensagem: null,
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
    generos: [],
    premium_ativado: false,
    pagamento_instrucoes: null,
    atualizado_em: null,
    ...overrides,
  };
}

describe('isBannerCurrentlyActive', () => {
  it('não está ativo se banner_ativo for false', () => {
    expect(isBannerCurrentlyActive(fakeSettings({ banner_ativo: false, banner_mensagem: 'Olá' }))).toBe(false);
  });

  it('não está ativo se não houver mensagem', () => {
    expect(isBannerCurrentlyActive(fakeSettings({ banner_ativo: true, banner_mensagem: null }))).toBe(false);
  });

  it('está ativo com banner ligado, mensagem, e sem expiração', () => {
    expect(isBannerCurrentlyActive(fakeSettings({ banner_ativo: true, banner_mensagem: 'Manutenção às 22h' }))).toBe(true);
  });

  it('está ativo se a expiração ainda não passou', () => {
    const futuro = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(isBannerCurrentlyActive(fakeSettings({ banner_ativo: true, banner_mensagem: 'Aviso', banner_expira_em: futuro }))).toBe(true);
  });

  it('não está ativo se a expiração já passou', () => {
    const passado = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isBannerCurrentlyActive(fakeSettings({ banner_ativo: true, banner_mensagem: 'Aviso', banner_expira_em: passado }))).toBe(false);
  });
});
