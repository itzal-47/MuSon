export type ShareLinkResult = 'shared' | 'copied' | 'failed';

/**
 * Partilha um link via Web Share API nativa (mostra o menu de partilha do
 * telemóvel); se não for suportado, copia o link para a área de
 * transferência como alternativa.
 */
export async function shareOrCopyLink(opts: { title: string; text?: string; url: string }): Promise<ShareLinkResult> {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

  if (nav.share) {
    try {
      await nav.share({ title: opts.title, text: opts.text, url: opts.url });
      return 'shared';
    } catch {
      // utilizador cancelou — não cai para cópia automática, evita comportamento surpreendente
      return 'failed';
    }
  }

  try {
    await navigator.clipboard.writeText(opts.url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
