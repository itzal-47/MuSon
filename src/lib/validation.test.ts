import { describe, it, expect } from 'vitest';
import { validateSignupPassword, validateAudioFile, validateImageFile } from './validation';

describe('validateSignupPassword', () => {
  it('aceita uma senha válida com confirmação igual', () => {
    const resultado = validateSignupPassword('senha1234', 'senha1234');
    expect(resultado.valid).toBe(true);
    expect(resultado.error).toBeNull();
  });

  it('rejeita senhas com menos de 8 caracteres', () => {
    const resultado = validateSignupPassword('abc123', 'abc123');
    expect(resultado.valid).toBe(false);
    expect(resultado.error).toBe('A senha deve ter pelo menos 8 caracteres.');
  });

  it('rejeita quando as senhas não coincidem', () => {
    const resultado = validateSignupPassword('senha1234', 'outraSenha');
    expect(resultado.valid).toBe(false);
    expect(resultado.error).toBe('As senhas não coincidem.');
  });

  it('aceita exatamente 8 caracteres (limite)', () => {
    expect(validateSignupPassword('12345678', '12345678').valid).toBe(true);
  });

  it('prioriza o erro de tamanho sobre o de confirmação', () => {
    const resultado = validateSignupPassword('curta', 'outra');
    expect(resultado.error).toBe('A senha deve ter pelo menos 8 caracteres.');
  });
});

describe('validateAudioFile', () => {
  it('aceita um MP3 válido', () => {
    const resultado = validateAudioFile({ type: 'audio/mpeg', size: 1024, name: 'faixa.mp3' });
    expect(resultado.valid).toBe(true);
  });

  it('aceita pela extensão quando o type MIME vem vazio (comum em alguns telemóveis)', () => {
    const resultado = validateAudioFile({ type: '', size: 1024, name: 'faixa.wav' });
    expect(resultado.valid).toBe(true);
  });

  it('rejeita formatos não suportados', () => {
    const resultado = validateAudioFile({ type: 'video/mp4', size: 1024, name: 'video.mp4' });
    expect(resultado.valid).toBe(false);
    expect(resultado.error).toBe('Formato não suportado. Usa MP3, WAV ou M4A.');
  });

  it('rejeita ficheiros maiores que 20MB', () => {
    const resultado = validateAudioFile({ type: 'audio/mpeg', size: 21 * 1024 * 1024, name: 'faixa.mp3' });
    expect(resultado.valid).toBe(false);
    expect(resultado.error).toBe('O ficheiro é demasiado grande. Máximo 20MB.');
  });

  it('aceita exatamente 20MB (limite)', () => {
    const resultado = validateAudioFile({ type: 'audio/mpeg', size: 20 * 1024 * 1024, name: 'faixa.mp3' });
    expect(resultado.valid).toBe(true);
  });
});

describe('validateImageFile', () => {
  it('aceita qualquer tipo image/*', () => {
    expect(validateImageFile({ type: 'image/png' }).valid).toBe(true);
    expect(validateImageFile({ type: 'image/jpeg' }).valid).toBe(true);
  });

  it('rejeita ficheiros que não são imagens', () => {
    const resultado = validateImageFile({ type: 'application/pdf' });
    expect(resultado.valid).toBe(false);
    expect(resultado.error).toBe('A capa deve ser uma imagem.');
  });
});
