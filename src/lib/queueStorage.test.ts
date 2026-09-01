import { describe, it, expect, beforeEach } from 'vitest';
import { saveQueueState, loadQueueState, clearQueueState, type StoredQueueState } from './queueStorage';

const exemploEstado: StoredQueueState = {
  trackIds: ['faixa-1', 'faixa-2', 'faixa-3'],
  queueIndex: 1,
  currentTime: 42.5,
  shuffle: false,
  repeat: 'queue',
};

describe('queueStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('devolve null quando não há nada guardado', () => {
    expect(loadQueueState()).toBeNull();
  });

  it('guarda e recupera o estado da fila corretamente', () => {
    saveQueueState(exemploEstado);
    expect(loadQueueState()).toEqual(exemploEstado);
  });

  it('limpa o estado guardado', () => {
    saveQueueState(exemploEstado);
    clearQueueState();
    expect(loadQueueState()).toBeNull();
  });

  it('ignora dados corrompidos em vez de rebentar', () => {
    localStorage.setItem('muson:queue-state', '{ isto não é json válido');
    expect(loadQueueState()).toBeNull();
  });

  it('ignora uma fila vazia guardada por engano', () => {
    localStorage.setItem('muson:queue-state', JSON.stringify({ ...exemploEstado, trackIds: [] }));
    expect(loadQueueState()).toBeNull();
  });

  it('substitui o estado anterior ao guardar de novo', () => {
    saveQueueState(exemploEstado);
    const novoEstado: StoredQueueState = { ...exemploEstado, queueIndex: 2, currentTime: 100 };
    saveQueueState(novoEstado);
    expect(loadQueueState()).toEqual(novoEstado);
  });
});
