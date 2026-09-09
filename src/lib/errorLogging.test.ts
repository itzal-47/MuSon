import { describe, it, expect } from 'vitest';
import { buildErrorPayload, extractMessage, extractStack } from './errorLogging';

describe('extractMessage', () => {
  it('extrai a mensagem de um Error normal', () => {
    expect(extractMessage(new Error('Algo correu mal'))).toBe('Algo correu mal');
  });

  it('devolve a própria string quando o erro já é texto', () => {
    expect(extractMessage('erro em texto simples')).toBe('erro em texto simples');
  });

  it('extrai .message de um objeto parecido com erro', () => {
    expect(extractMessage({ message: 'erro de objeto' })).toBe('erro de objeto');
  });

  it('serializa em JSON quando não há message reconhecível', () => {
    expect(extractMessage({ codigo: 42 })).toBe('{"codigo":42}');
  });

  it('nunca rebenta com valores estranhos (null, undefined, número)', () => {
    expect(() => extractMessage(null)).not.toThrow();
    expect(() => extractMessage(undefined)).not.toThrow();
    expect(() => extractMessage(123)).not.toThrow();
  });
});

describe('extractStack', () => {
  it('extrai o stack de um Error real', () => {
    const erro = new Error('teste');
    expect(extractStack(erro)).toBe(erro.stack);
  });

  it('devolve null quando não é um Error', () => {
    expect(extractStack('só texto')).toBeNull();
    expect(extractStack({ message: 'x' })).toBeNull();
  });
});

describe('buildErrorPayload', () => {
  it('monta o payload completo a partir de um Error', () => {
    const erro = new Error('falhou');
    const payload = buildErrorPayload(erro, 'https://muson.ao/perfil', 'Mozilla/5.0');
    expect(payload.mensagem).toBe('falhou');
    expect(payload.url).toBe('https://muson.ao/perfil');
    expect(payload.user_agent).toBe('Mozilla/5.0');
    expect(payload.contexto).toBeNull();
  });

  it('inclui o contexto quando fornecido', () => {
    const payload = buildErrorPayload('erro', 'https://x.pt', 'ua', { tipo: 'teste' });
    expect(payload.contexto).toEqual({ tipo: 'teste' });
  });

  it('nunca deixa a mensagem vazia', () => {
    const payload = buildErrorPayload('', 'https://x.pt', 'ua');
    expect(payload.mensagem).toBe('Erro desconhecido');
  });

  it('corta mensagens muito longas', () => {
    const mensagemGigante = 'x'.repeat(1000);
    const payload = buildErrorPayload(mensagemGigante, 'https://x.pt', 'ua');
    expect(payload.mensagem.length).toBeLessThanOrEqual(500);
  });

  it('corta stacks muito longos', () => {
    const erro = new Error('teste');
    erro.stack = 'y'.repeat(10000);
    const payload = buildErrorPayload(erro, 'https://x.pt', 'ua');
    expect(payload.stack?.length).toBeLessThanOrEqual(4000);
  });
});
