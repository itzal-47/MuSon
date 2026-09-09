import { describe, it, expect } from 'vitest';
import { formatAcao } from './adminLogs';

describe('formatAcao', () => {
  it('traduz ações conhecidas para texto legível', () => {
    expect(formatAcao('conceder_premium')).toBe('Concedeu Premium');
    expect(formatAcao('suspender_conta')).toBe('Suspendeu conta');
    expect(formatAcao('remover_faixa')).toBe('Removeu faixa');
    expect(formatAcao('responder_ticket')).toBe('Respondeu a ticket');
  });

  it('devolve o próprio código quando a ação não é reconhecida (nunca esconde informação)', () => {
    expect(formatAcao('acao_futura_desconhecida')).toBe('acao_futura_desconhecida');
  });
});
