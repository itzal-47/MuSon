import { supabase } from './supabase';

const MAX_STACK_LENGTH = 4000;
const MAX_MESSAGE_LENGTH = 500;

export interface ErrorLogPayload {
  mensagem: string;
  stack: string | null;
  url: string;
  user_agent: string;
  contexto: Record<string, unknown> | null;
}

/**
 * Prepara os dados de um erro para envio — lógica pura, sem tocar na rede,
 * para ser fácil de testar. Corta mensagens/stacks longos (para não
 * encher a base de dados com ruído) e nunca deixa a mensagem vazia.
 */
export function buildErrorPayload(
  error: unknown,
  url: string,
  userAgent: string,
  contexto?: Record<string, unknown>
): ErrorLogPayload {
  const mensagem = extractMessage(error).slice(0, MAX_MESSAGE_LENGTH);
  const stack = extractStack(error);
  return {
    mensagem: mensagem || 'Erro desconhecido',
    stack: stack ? stack.slice(0, MAX_STACK_LENGTH) : null,
    url,
    user_agent: userAgent,
    contexto: contexto || null,
  };
}

export function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function extractStack(error: unknown): string | null {
  if (error instanceof Error && error.stack) return error.stack;
  return null;
}

/**
 * Envia o erro para a base de dados. Falha sempre em silêncio — um erro a
 * registar um erro nunca deve, por si só, criar mais barulho para o
 * utilizador.
 */
export async function logError(error: unknown, contexto?: Record<string, unknown>): Promise<void> {
  try {
    const payload = buildErrorPayload(
      error,
      typeof window !== 'undefined' ? window.location.href : '',
      typeof navigator !== 'undefined' ? navigator.userAgent : '',
      contexto
    );
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('error_logs').insert({ ...payload, user_id: userData.user?.id || null });
  } catch {
    // nunca deixar o registo de erros causar mais um erro
  }
}

export function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    logError(event.error || event.message, { tipo: 'window.onerror' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, { tipo: 'unhandledrejection' });
  });
}
