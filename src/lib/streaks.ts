import { supabase } from './supabase';

export interface StreakInfo {
  dias_seguidos: number;
  melhor_streak: number;
}

interface ExistingStreak {
  dias_seguidos: number;
  melhor_streak: number;
  ultimo_dia: string | null;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Lógica pura de cálculo do streak — sem I/O, fácil de testar com datas
 * fixas em vez de depender do relógio do sistema.
 */
export function computeStreakUpdate(
  existing: ExistingStreak | null,
  today: string,
  yesterday: string
): { dias_seguidos: number; melhor_streak: number } | null {
  if (!existing) {
    return { dias_seguidos: 1, melhor_streak: 1 };
  }
  if (existing.ultimo_dia === today) {
    return null; // já contado hoje
  }
  const novoStreak = existing.ultimo_dia === yesterday ? existing.dias_seguidos + 1 : 1;
  const melhor = Math.max(existing.melhor_streak, novoStreak);
  return { dias_seguidos: novoStreak, melhor_streak: melhor };
}

/**
 * Um streak só continua "visível" como ativo se o último dia registado
 * foi hoje ou ontem.
 */
export function isStreakStillValid(ultimoDia: string | null, today: string, yesterday: string): boolean {
  return ultimoDia === today || ultimoDia === yesterday;
}

/**
 * Regista que o utilizador ouviu música hoje e atualiza o streak.
 * Seguro para chamar várias vezes no mesmo dia — só conta uma vez por dia.
 */
export async function registerListenForStreak(userId: string): Promise<void> {
  const today = todayStr();
  const yesterday = yesterdayStr();

  const { data: existing } = await supabase
    .from('listening_streaks')
    .select('dias_seguidos, melhor_streak, ultimo_dia')
    .eq('user_id', userId)
    .maybeSingle();

  const update = computeStreakUpdate(existing, today, yesterday);
  if (!update) return;

  if (!existing) {
    await supabase.from('listening_streaks').insert({
      user_id: userId,
      dias_seguidos: update.dias_seguidos,
      melhor_streak: update.melhor_streak,
      ultimo_dia: today,
    });
    return;
  }

  await supabase
    .from('listening_streaks')
    .update({ dias_seguidos: update.dias_seguidos, melhor_streak: update.melhor_streak, ultimo_dia: today, atualizado_em: new Date().toISOString() })
    .eq('user_id', userId);
}

export async function fetchStreak(userId: string): Promise<StreakInfo | null> {
  const { data } = await supabase
    .from('listening_streaks')
    .select('dias_seguidos, melhor_streak, ultimo_dia')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;

  const stillValid = isStreakStillValid(data.ultimo_dia, todayStr(), yesterdayStr());
  return {
    dias_seguidos: stillValid ? data.dias_seguidos : 0,
    melhor_streak: data.melhor_streak,
  };
}
