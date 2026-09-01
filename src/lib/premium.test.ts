import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPremiumActive } from './premium';

describe('isPremiumActive', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('devolve false quando não há data (null)', () => {
    expect(isPremiumActive(null)).toBe(false);
  });

  it('devolve false quando é undefined', () => {
    expect(isPremiumActive(undefined)).toBe(false);
  });

  it('devolve true quando a data é no futuro', () => {
    const futuro = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(isPremiumActive(futuro)).toBe(true);
  });

  it('devolve false quando a data já passou', () => {
    const passado = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isPremiumActive(passado)).toBe(false);
  });

  it('devolve false exatamente no instante de expirar', () => {
    vi.useFakeTimers();
    const agora = new Date('2026-01-15T12:00:00.000Z');
    vi.setSystemTime(agora);
    expect(isPremiumActive(agora.toISOString())).toBe(false);
  });
});
