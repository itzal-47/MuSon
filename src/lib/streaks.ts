import { supabase } from './supabase';

export interface StreakInfo {
  dias_seguidos: number;
  melhor_streak: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Regista que o utilizador ouviu música hoje e atualiza o streak.
 * Seguro para chamar várias vezes no mesmo dia — só conta uma vez por dia.
 */
export async function registerListenForStreak(userId: string): Promise<void> {
  const today = todayStr();

  const { data: existing } = await supabase
    .from('listening_streaks')
    .select('dias_seguidos, melhor_streak, ultimo_dia')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('listening_streaks').insert({
      user_id: userId,
      dias_seguidos: 1,
      melhor_streak: 1,
      ultimo_dia: today,
    });
    return;
  }

  if (existing.ultimo_dia === today) return; // já contado hoje

  const novoStreak = existing.ultimo_dia === yesterdayStr() ? existing.dias_seguidos + 1 : 1;
  const melhor = Math.max(existing.melhor_streak, novoStreak);

  await supabase
    .from('listening_streaks')
    .update({ dias_seguidos: novoStreak, melhor_streak: melhor, ultimo_dia: today, atualizado_em: new Date().toISOString() })
    .eq('user_id', userId);
}

export async function fetchStreak(userId: string): Promise<StreakInfo | null> {
  const { data } = await supabase
    .from('listening_streaks')
    .select('dias_seguidos, melhor_streak, ultimo_dia')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;

  // Se o último dia não foi hoje nem ontem, o streak já quebrou visualmente
  // (mesmo que ainda não tenha sido escrito na base de dados)
  const stillValid = data.ultimo_dia === todayStr() || data.ultimo_dia === yesterdayStr();
  return {
    dias_seguidos: stillValid ? data.dias_seguidos : 0,
    melhor_streak: data.melhor_streak,
  };
}
