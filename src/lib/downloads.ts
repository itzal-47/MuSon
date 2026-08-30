export type DownloadResult = 'downloaded' | 'failed';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'faixa';
}

/**
 * Descarrega o ficheiro de áudio de uma faixa para o dispositivo.
 * Quem chama esta função já deve ter confirmado que o utilizador é premium
 * E que o artista permitiu download nesta faixa — esta função não repete
 * essas verificações, só executa o download em si.
 */
export async function downloadTrackAudio(track: { titulo: string; artist_name?: string; audio_url: string | null }): Promise<DownloadResult> {
  if (!track.audio_url) return 'failed';
  try {
    const response = await fetch(track.audio_url);
    if (!response.ok) return 'failed';
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const filename = `${slugify(track.artist_name || 'muson')}-${slugify(track.titulo)}.mp3`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
