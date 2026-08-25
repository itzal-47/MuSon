const STORAGE_KEY = 'muson:queue-state';

export interface StoredQueueState {
  trackIds: string[];
  queueIndex: number;
  currentTime: number;
  shuffle: boolean;
  repeat: 'none' | 'track' | 'queue';
}

export function saveQueueState(state: StoredQueueState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponível (modo privado, quota excedida, etc.) — falha em silêncio
  }
}

export function loadQueueState(): StoredQueueState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredQueueState;
    if (!Array.isArray(parsed.trackIds) || parsed.trackIds.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearQueueState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorar
  }
}
