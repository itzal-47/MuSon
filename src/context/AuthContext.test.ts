import { describe, it, expect } from 'vitest';
import { mapAuthError } from './AuthContext';

describe('mapAuthError', () => {
  it('reconhece email já registado', () => {
    expect(mapAuthError({ message: 'User already registered' })).toBe('Este email já tem conta. Tenta "Entrar".');
  });

  it('reconhece credenciais inválidas', () => {
    expect(mapAuthError({ message: 'Invalid login credentials' })).toBe('Email ou senha incorretos.');
  });

  it('reconhece email não confirmado', () => {
    expect(mapAuthError({ message: 'Email not confirmed' })).toBe('Ainda não confirmaste o teu email. Verifica o código que enviámos.');
  });

  it('reconhece conta não encontrada', () => {
    expect(mapAuthError({ message: 'User not found' })).toBe('Nenhuma conta encontrada com este email. Tenta "Registar".');
  });

  it('reconhece código expirado', () => {
    expect(mapAuthError({ message: 'Token has expired' })).toBe('O código expirou. Solicita um novo.');
  });

  it('reconhece código inválido (otp)', () => {
    expect(mapAuthError({ message: 'Invalid OTP' })).toBe('Código inválido. Verifica e tenta novamente.');
  });

  it('reconhece limite de tentativas', () => {
    expect(mapAuthError({ message: 'Too many requests' })).toBe('Demasiadas tentativas. Aguarda um momento e tenta novamente.');
  });

  it('reconhece senha fraca', () => {
    expect(mapAuthError({ message: 'Password is too weak' })).toBe('A senha é demasiado fraca. Usa pelo menos 8 caracteres.');
  });

  it('não é sensível a maiúsculas/minúsculas', () => {
    expect(mapAuthError({ message: 'INVALID LOGIN CREDENTIALS' })).toBe('Email ou senha incorretos.');
  });

  it('usa mensagem genérica para erros desconhecidos (nunca mostra o texto em inglês cru)', () => {
    // Isto é importante: já apanhámos um bug real em que uma mensagem de
    // erro do Supabase não reconhecida acabava por aparecer em inglês, sem
    // tradução, diretamente ao utilizador. Este teste garante que há sempre
    // uma mensagem em português, mesmo para erros que a função não conhece.
    const resultado = mapAuthError({ message: 'Something completely unexpected happened' });
    expect(resultado).toBe('Ocorreu um erro. Tenta novamente.');
  });
});
