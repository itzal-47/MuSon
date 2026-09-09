import { describe, it, expect } from 'vitest';
import { isAdminNotificationType } from './notifications';

describe('isAdminNotificationType', () => {
  it('reconhece os 4 tipos de administração', () => {
    expect(isAdminNotificationType('admin_denuncia')).toBe(true);
    expect(isAdminNotificationType('admin_verificacao')).toBe(true);
    expect(isAdminNotificationType('admin_pagamento')).toBe(true);
    expect(isAdminNotificationType('admin_suporte')).toBe(true);
  });

  it('não confunde notificações sociais com as de administração', () => {
    expect(isAdminNotificationType('novo_seguidor')).toBe(false);
    expect(isAdminNotificationType('nova_faixa')).toBe(false);
    expect(isAdminNotificationType('gosto')).toBe(false);
    expect(isAdminNotificationType('comentario')).toBe(false);
  });
});
