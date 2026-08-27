/**
 * Routing Middleware do Vercel — gera pré-visualizações bonitas (Open Graph)
 * quando um link do MuSon é partilhado no WhatsApp, Instagram, Telegram, etc.
 *
 * Como funciona: a app é uma SPA (React) e usa BrowserRouter, por isso as
 * rotas como /artista/:id só ganham conteúdo depois do JavaScript correr no
 * browser. Robôs de redes sociais não correm JavaScript — só leem o HTML
 * que o servidor devolve na primeira resposta. Este middleware deteta esses
 * robôs pelo User-Agent e devolve-lhes uma página HTML mínima com as tags
 * <meta property="og:..."> corretas (capa, título, descrição). Para
 * visitantes normais (browsers reais), o pedido passa em frente sem
 * alterações e a SPA carrega normalmente.
 *
 * IMPORTANTE PARA O ITZAL: isto usa a "Routing Middleware" do Vercel, uma
 * funcionalidade mais recente da plataforma. Antes de confiares que está a
 * funcionar em produção, testa localmente com `vercel dev` e depois verifica
 * o link partilhado com uma ferramenta de depuração de partilhas (ex:
 * pesquisa "Facebook Sharing Debugger" ou "Twitter Card Validator") — cola lá
 * o link de um artista ou playlist pública e confirma que a pré-visualização
 * aparece correta antes de anunciares a funcionalidade.
 */

export const config = {
  matcher: ['/artista/:id*', '/playlist/:id*'],
};

const BOT_USER_AGENT = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterest|redditbot|Googlebot|bingbot|SkypeUriPreview/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(opts: { title: string; description: string; image: string | null; url: string }): string {
  const { title, description, image, url } = opts;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const imageTag = image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<title>${safeTitle} — MuSon</title>
<meta name="description" content="${safeDesc}" />
<meta property="og:type" content="music.song" />
<meta property="og:title" content="${safeTitle} — MuSon" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:site_name" content="MuSon" />
${imageTag}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle} — MuSon" />
<meta name="twitter:description" content="${safeDesc}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
<meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
</head>
<body>
<p>${safeTitle} — MuSon. <a href="${escapeHtml(url)}">Abrir no MuSon</a></p>
</body>
</html>`;
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const userAgent = request.headers.get('user-agent') || '';
  if (!BOT_USER_AGENT.test(userAgent)) {
    return undefined; // visitante normal — deixa a SPA carregar normalmente
  }

  const url = new URL(request.url);
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return undefined;

  const artistMatch = url.pathname.match(/^\/artista\/([^/]+)/);
  const playlistMatch = url.pathname.match(/^\/playlist\/([^/]+)/);

  try {
    if (artistMatch) {
      const id = artistMatch[1];
      const res = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${id}&select=display_name,username,bio,avatar_url,provincia`,
        { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } }
      );
      const rows = (await res.json()) as Array<{ display_name: string | null; username: string | null; bio: string | null; avatar_url: string | null; provincia: string | null }>;
      const profile = rows[0];
      if (!profile) return undefined;

      const title = profile.display_name || profile.username || 'Artista';
      const description = profile.bio || `Ouve ${title} no MuSon${profile.provincia ? ` — ${profile.provincia}` : ''}.`;
      return new Response(buildHtml({ title, description, image: profile.avatar_url, url: url.toString() }), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    if (playlistMatch) {
      const id = playlistMatch[1];
      const res = await fetch(
        `${supabaseUrl}/rest/v1/playlists?id=eq.${id}&publica=eq.true&select=nome,descricao,capa_url`,
        { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } }
      );
      const rows = (await res.json()) as Array<{ nome: string; descricao: string | null; capa_url: string | null }>;
      const playlist = rows[0];
      if (!playlist) return undefined;

      const description = playlist.descricao || `Playlist "${playlist.nome}" no MuSon.`;
      return new Response(buildHtml({ title: playlist.nome, description, image: playlist.capa_url, url: url.toString() }), {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }
  } catch {
    return undefined; // se a busca falhar, deixa a SPA carregar normalmente
  }

  return undefined;
}
