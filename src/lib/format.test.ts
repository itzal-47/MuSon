import { describe, it, expect } from 'vitest';
import { slugify, formatKz, timeAgo } from './format';

describe('slugify', () => {
  it('remove acentos e põe em minúsculas', () => {
    expect(slugify('Estrelas Mais Velhas')).toBe('estrelas-mais-velhas');
    expect(slugify('Kizomba é Vida')).toBe('kizomba-e-vida');
  });

  it('substitui caracteres especiais por hífen', () => {
    expect(slugify('Faixa #1 (Remix)!')).toBe('faixa-1-remix');
  });

  it('remove hífens no início e no fim', () => {
    expect(slugify('---olá---')).toBe('ola');
  });

  it('respeita o limite de tamanho', () => {
    const textoLongo = 'a'.repeat(100);
    expect(slugify(textoLongo, 10).length).toBeLessThanOrEqual(10);
  });

  it('devolve "faixa" quando o resultado fica vazio', () => {
    expect(slugify('!!!???')).toBe('faixa');
    expect(slugify('')).toBe('faixa');
  });
});

describe('formatKz', () => {
  it('formata milhares com separador', () => {
    expect(formatKz(1500)).toBe('1.500 Kz');
    expect(formatKz(14000)).toBe('14.000 Kz');
  });

  it('não mostra casas decimais', () => {
    expect(formatKz(1500.75)).toBe('1.501 Kz');
  });

  it('formata zero corretamente', () => {
    expect(formatKz(0)).toBe('0 Kz');
  });
});

describe('timeAgo', () => {
  it('mostra "agora mesmo" para instantes muito recentes', () => {
    expect(timeAgo(new Date().toISOString())).toBe('agora mesmo');
  });

  it('mostra minutos para menos de uma hora', () => {
    const cincoMinAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(cincoMinAtras)).toBe('há 5 min');
  });

  it('mostra horas para menos de um dia', () => {
    const tresHorasAtras = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(tresHorasAtras)).toBe('há 3h');
  });

  it('mostra dias para menos de um mês', () => {
    const doisDiasAtras = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(doisDiasAtras)).toBe('há 2d');
  });

  it('mostra meses para mais de 30 dias', () => {
    const doisMesesAtras = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(doisMesesAtras)).toBe('há 2 meses');
  });
});
