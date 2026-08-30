import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: string;
  nome: string;
  preco_kz: number;
  duracao_dias: number;
  ativo: boolean;
  posicao: number;
}

export interface PaymentOrder {
  id: string;
  user_id: string;
  plano_id: string;
  valor_kz: number;
  estado: 'pendente' | 'pago' | 'cancelado';
  referencia_utilizador: string | null;
  criado_em: string;
  pago_em: string | null;
  plano_nome?: string;
  user_username?: string | null;
  user_display_name?: string | null;
}

export async function fetchActivePlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('ativo', true)
    .order('posicao', { ascending: true });
  if (error || !data) return [];
  return data as SubscriptionPlan[];
}

export async function fetchAllPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('posicao', { ascending: true });
  if (error || !data) return [];
  return data as SubscriptionPlan[];
}

export async function createPlan(nome: string, precoKz: number, duracaoDias: number): Promise<{ ok: boolean; error?: string }> {
  const { count } = await supabase.from('subscription_plans').select('*', { count: 'exact', head: true });
  const { error } = await supabase.from('subscription_plans').insert({
    nome, preco_kz: precoKz, duracao_dias: duracaoDias, posicao: count || 0,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updatePlan(id: string, patch: Partial<Pick<SubscriptionPlan, 'nome' | 'preco_kz' | 'duracao_dias' | 'ativo'>>): Promise<boolean> {
  const { error } = await supabase.from('subscription_plans').update(patch).eq('id', id);
  return !error;
}

export async function deletePlan(id: string): Promise<boolean> {
  const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
  return !error;
}

export async function createPaymentOrder(
  userId: string,
  plan: SubscriptionPlan,
  referencia: string
): Promise<{ ok: boolean; error?: string; orderId?: string }> {
  const { data, error } = await supabase
    .from('payment_orders')
    .insert({ user_id: userId, plano_id: plan.id, valor_kz: plan.preco_kz, referencia_utilizador: referencia || null })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message };
  return { ok: true, orderId: data.id };
}

export async function fetchMyOrders(userId: string): Promise<PaymentOrder[]> {
  const { data, error } = await supabase
    .from('payment_orders')
    .select('*, plano:subscription_plans(nome)')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false });
  if (error || !data) return [];
  return data.map((row) => {
    const rawPlano = row.plano as unknown;
    const plano = (Array.isArray(rawPlano) ? rawPlano[0] : rawPlano) as { nome: string } | null;
    return { ...row, plano_nome: plano?.nome };
  }) as PaymentOrder[];
}

export async function fetchMyPendingOrder(userId: string): Promise<PaymentOrder | null> {
  const { data, error } = await supabase
    .from('payment_orders')
    .select('*, plano:subscription_plans(nome)')
    .eq('user_id', userId)
    .eq('estado', 'pendente')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const rawPlano = data.plano as unknown;
  const plano = (Array.isArray(rawPlano) ? rawPlano[0] : rawPlano) as { nome: string } | null;
  return { ...data, plano_nome: plano?.nome } as PaymentOrder;
}

export async function fetchPendingOrders(): Promise<PaymentOrder[]> {
  const { data, error } = await supabase
    .from('payment_orders')
    .select('*, plano:subscription_plans(nome), user:profiles!payment_orders_user_id_fkey(username, display_name)')
    .eq('estado', 'pendente')
    .order('criado_em', { ascending: true });
  if (error || !data) return [];
  return data.map((row) => {
    const rawPlano = row.plano as unknown;
    const plano = (Array.isArray(rawPlano) ? rawPlano[0] : rawPlano) as { nome: string } | null;
    const rawUser = row.user as unknown;
    const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as { username: string | null; display_name: string | null } | null;
    return { ...row, plano_nome: plano?.nome, user_username: user?.username, user_display_name: user?.display_name };
  }) as PaymentOrder[];
}

export async function confirmPaymentOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('confirm_payment_order', { order_id: orderId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cancelPaymentOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('cancel_payment_order', { order_id: orderId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
