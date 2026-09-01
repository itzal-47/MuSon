import { slugify } from './format';

interface ShareTrackInput {
  titulo: string;
  artist_name?: string;
  capa_url: string | null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

/**
 * Gera uma imagem quadrada (1080x1080) com a capa, título e artista da
 * faixa, pronta a partilhar no WhatsApp/Instagram. Se a capa não carregar
 * (ex: problema de CORS), cai num fundo em gradiente em vez de falhar.
 */
export async function generateTrackShareCard(track: ShareTrackInput): Promise<Blob | null> {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fundo preto profundo
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // Glow decorativo (acento dourado/laranja)
  const glow = ctx.createRadialGradient(size * 0.8, size * 0.1, 0, size * 0.8, size * 0.1, size * 0.7);
  glow.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const coverSize = 700;
  const coverX = (size - coverSize) / 2;
  const coverY = 130;

  let coverLoaded = false;
  if (track.capa_url) {
    try {
      const img = await loadImage(track.capa_url);
      ctx.save();
      roundRectPath(ctx, coverX, coverY, coverSize, coverSize, 28);
      ctx.clip();
      ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
      ctx.restore();
      coverLoaded = true;
    } catch {
      coverLoaded = false;
    }
  }

  if (!coverLoaded) {
    const fallback = ctx.createLinearGradient(coverX, coverY, coverX + coverSize, coverY + coverSize);
    fallback.addColorStop(0, '#F59E0B');
    fallback.addColorStop(1, '#EA580C');
    roundRectPath(ctx, coverX, coverY, coverSize, coverSize, 28);
    ctx.fillStyle = fallback;
    ctx.fill();
  }

  // Borda subtil na capa
  roundRectPath(ctx, coverX, coverY, coverSize, coverSize, 28);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Título
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 54px sans-serif';
  wrapText(ctx, track.titulo, size / 2, coverY + coverSize + 100, size - 160, 62);

  // Artista
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '400 36px sans-serif';
  ctx.fillText(track.artist_name || 'Artista', size / 2, coverY + coverSize + 175);

  // Marca MuSon
  ctx.fillStyle = '#F59E0B';
  ctx.font = '700 32px sans-serif';
  ctx.fillText('MUSON', size / 2, size - 60);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.95));
}




export type ShareResult = 'shared' | 'downloaded' | 'failed';

/**
 * Gera o cartão da faixa e tenta partilhar via Web Share API (WhatsApp,
 * Instagram, etc). Se não for suportado ou falhar, descarrega a imagem.
 */
export async function shareOrDownloadTrackCard(track: ShareTrackInput): Promise<ShareResult> {
  const blob = await generateTrackShareCard(track);
  if (!blob) return 'failed';

  const filename = `muson-${slugify(track.titulo)}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: track.titulo,
        text: `A ouvir "${track.titulo}"${track.artist_name ? ` de ${track.artist_name}` : ''} no MuSon 🎧`,
      });
      return 'shared';
    } catch {
      // utilizador cancelou, ou falhou — cai para download abaixo
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}
