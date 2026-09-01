import { describe, it, expect } from 'vitest';
import { computeStreakUpdate, isStreakStillValid } from './streaks';

const HOJE = '2026-06-15';
const ONTEM = '2026-06-14';
const ANTEONTEM = '2026-06-13';

describe('computeStreakUpdate', () => {
  it('começa um streak novo de 1 dia quando não há registo anterior', () => {
    expect(computeStreakUpdate(null, HOJE, ONTEM)).toEqual({ dias_seguidos: 1, melhor_streak: 1 });
  });

  it('não faz nada se já foi contado hoje', () => {
    const existing = { dias_seguidos: 5, melhor_streak: 5, ultimo_dia: HOJE };
    expect(computeStreakUpdate(existing, HOJE, ONTEM)).toBeNull();
  });

  it('soma 1 ao streak quando o último dia foi ontem', () => {
    const existing = { dias_seguidos: 5, melhor_streak: 5, ultimo_dia: ONTEM };
    expect(computeStreakUpdate(existing, HOJE, ONTEM)).toEqual({ dias_seguidos: 6, melhor_streak: 6 });
  });

  it('quebra o streak (volta a 1) se o último dia foi antes de ontem', () => {
    const existing = { dias_seguidos: 10, melhor_streak: 10, ultimo_dia: ANTEONTEM };
    expect(computeStreakUpdate(existing, HOJE, ONTEM)).toEqual({ dias_seguidos: 1, melhor_streak: 10 });
  });

  it('mantém o recorde mesmo depois de o streak atual quebrar', () => {
    const existing = { dias_seguidos: 20, melhor_streak: 20, ultimo_dia: ANTEONTEM };
    const resultado = computeStreakUpdate(existing, HOJE, ONTEM);
    expect(resultado?.dias_seguidos).toBe(1);
    expect(resultado?.melhor_streak).toBe(20);
  });

  it('atualiza o recorde quando o streak atual o ultrapassa', () => {
    const existing = { dias_seguidos: 9, melhor_streak: 9, ultimo_dia: ONTEM };
    expect(computeStreakUpdate(existing, HOJE, ONTEM)).toEqual({ dias_seguidos: 10, melhor_streak: 10 });
  });
});

describe('isStreakStillValid', () => {
  it('é válido se o último dia foi hoje', () => {
    expect(isStreakStillValid(HOJE, HOJE, ONTEM)).toBe(true);
  });

  it('é válido se o último dia foi ontem', () => {
    expect(isStreakStillValid(ONTEM, HOJE, ONTEM)).toBe(true);
  });

  it('não é válido se o último dia foi antes de ontem', () => {
    expect(isStreakStillValid(ANTEONTEM, HOJE, ONTEM)).toBe(false);
  });

  it('não é válido se nunca houve registo', () => {
    expect(isStreakStillValid(null, HOJE, ONTEM)).toBe(false);
  });
});
