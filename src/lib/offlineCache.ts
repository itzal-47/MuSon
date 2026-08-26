const CACHE_NAME = 'muson-audio-cache-v1';
const MANIFEST_KEY = 'muson:offline-manifest';
const MAX_CACHED_TRACKS = 12;
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 dias — cache temporário, não é download permanente

interface ManifestEntry {
  trackId: string;
  url: string;
  cachedAt: number;
}

function loadManifest(): ManifestEntry[] {
  try {
    const raw = localStorage.getItem(MANIFEST_KEY);
    return raw ? (JSON.parse(raw) as ManifestEntry[]) : [];
  } catch {
    return [];
  }
}

function saveManifest(entries: ManifestEntry[]): void {
  try {
    localStorage.setItem(MANIFEST_KEY, JSON.stringify(entries));
  } catch {
    // ignorar — cache offline é um bónus, nunca deve bloquear a app
  }
}

export function isOfflineCacheSupported(): boolean {
  return typeof caches !== 'undefined';
}

async function pruneCache(): Promise<void> {
  if (!isOfflineCacheSupported()) return;
  const manifest = loadManifest();
  const now = Date.now();
  const cache = await caches.open(CACHE_NAME);

  const valid: ManifestEntry[] = [];
  for (const entry of manifest) {
    if (now - entry.cachedAt > MAX_AGE_MS) {
      await cache.delete(entry.url);
      continue;
    }
    valid.push(entry);
  }

  valid.sort((a, b) => b.cachedAt - a.cachedAt);
  while (valid.length > MAX_CACHED_TRACKS) {
    const oldest = valid.pop();
    if (oldest) await cache.delete(oldest.url);
  }

  saveManifest(valid);
}

/**
 * Guarda o áudio de uma faixa em cache local temporário (não é o mesmo que
 * "download" premium — expira sozinho e tem limite de faixas guardadas).
 * Falha sempre em silêncio: cache offline é um extra, nunca crítico.
 */
export async function cacheTrackForOffline(track: { id: string; audio_url: string | null }): Promise<void> {
  if (!track.audio_url || !isOfflineCacheSupported()) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const already = await cache.match(track.audio_url);
    if (!already) {
      const response = await fetch(track.audio_url);
      if (!response.ok) return;
      await cache.put(track.audio_url, response.clone());
    }
    const manifest = loadManifest().filter((e) => e.trackId !== track.id);
    manifest.unshift({ trackId: track.id, url: track.audio_url, cachedAt: Date.now() });
    saveManifest(manifest);
    await pruneCache();
  } catch {
    // sem internet, quota excedida, etc. — ignorar
  }
}

export async function getCachedAudioBlobUrl(track: { audio_url: string | null }): Promise<string | null> {
  if (!track.audio_url || !isOfflineCacheSupported()) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(track.audio_url);
    if (!match) return null;
    const blob = await match.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function isTrackCached(track: { audio_url: string | null }): Promise<boolean> {
  if (!track.audio_url || !isOfflineCacheSupported()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(track.audio_url);
    return !!match;
  } catch {
    return false;
  }
}

export function getOfflineCacheInfo(): { count: number } {
  return { count: loadManifest().length };
}

export async function clearOfflineCache(): Promise<void> {
  try {
    if (isOfflineCacheSupported()) await caches.delete(CACHE_NAME);
    localStorage.removeItem(MANIFEST_KEY);
  } catch {
    // ignorar
  }
}

// --- Modo de poupança de dados (preferência local, sem servidor) ---

const DATA_SAVER_KEY = 'muson:data-saver';

export function getDataSaverEnabled(): boolean {
  try {
    return localStorage.getItem(DATA_SAVER_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDataSaverEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(DATA_SAVER_KEY, enabled ? '1' : '0');
  } catch {
    // ignorar
  }
}
