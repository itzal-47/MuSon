import type { NotificationTipo } from '@/types/database';

const ADMIN_TIPOS: NotificationTipo[] = ['admin_denuncia', 'admin_verificacao', 'admin_pagamento', 'admin_suporte'];

/**
 * Distingue notificações do painel de administração das notificações
 * normais (sociais) — usado para dividir o ecrã em duas abas.
 */
export function isAdminNotificationType(tipo: NotificationTipo): boolean {
  return ADMIN_TIPOS.includes(tipo);
}
