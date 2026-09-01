/**
 * Funções puras de formatação, reutilizadas em vários sítios da app.
 * Ficam num ficheiro à parte precisamente para serem fáceis de testar
 * sem precisar de mocks do Supabase, DOM, etc.
 */

/**
 * Converte texto em slug seguro para nomes de ficheiro (sem acentos,
 * espaços ou caracteres especiais). Usado em downloads e cartões de
 * partilha.
 */
export function slugify(text: string, maxLength = 60): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, maxLength);
  return slug || 'faixa';
}

/**
 * Formata um valor numérico em Kwanzas, ex: 1500 -> "1.500 Kz".
 * Feito manualmente (sem Intl.NumberFormat) de propósito: o separador de
 * milhares que o Intl devolve para 'pt-AO' depende dos dados de locale
 * (ICU) instalados no ambiente — variam entre Node e diferentes browsers,
 * podendo mostrar espaço em vez de ponto. Para um valor de dinheiro, é
 * melhor controlar o formato exato em vez de confiar nisso.
 */
export function formatKz(value: number): string {
  const inteiro = Math.round(value);
  const comSeparadores = inteiro.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${comSeparadores} Kz`;
}

/**
 * Texto relativo de "há quanto tempo", ex: "há 5 min", "há 3d".
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  return `há ${months} meses`;
}
