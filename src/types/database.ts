export type TipoPerfil = 'ouvinte' | 'artista' | 'produtor';

export type Provincia =
  | 'Bengo' | 'Benguela' | 'Bié' | 'Cabinda' | 'Cuando Cubango'
  | 'Cuanza Norte' | 'Cuanza Sul' | 'Cunene' | 'Huambo' | 'Huíla'
  | 'Luanda' | 'Lunda Norte' | 'Lunda Sul' | 'Malanje' | 'Moxico'
  | 'Namibe' | 'Uíge' | 'Zaire';

export type AlbumTipo = 'single' | 'ep' | 'album';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  tipo_perfil: TipoPerfil | null;
  provincia: Provincia | null;
  bio: string | null;
  verificado: boolean;
  criado_em: string;
  premium_until?: string | null;
  suspenso?: boolean;
  suspenso_motivo?: string | null;
  suspenso_em?: string | null;
}

export interface ArtistProfile {
  profile_id: string;
  generos: string[];
  redes_sociais: Record<string, string>;
  capa_url: string | null;
  criado_em: string;
}

export interface ProducerProfile {
  profile_id: string;
  especialidades: string[];
  capa_url: string | null;
  criado_em: string;
}

export interface Album {
  id: string;
  artist_id: string;
  titulo: string;
  capa_url: string | null;
  tipo: AlbumTipo;
  criado_em: string;
}

export interface Track {
  id: string;
  artist_id: string;
  titulo: string;
  capa_url: string | null;
  audio_url: string | null;
  duracao_segundos: number | null;
  genero: string | null;
  explicita: boolean;
  permite_download: boolean;
  album_id: string | null;
  numero_faixa: number | null;
  publicada: boolean;
  publicar_em?: string | null;
  criado_em: string;
}

export interface TrackWithArtist extends Track {
  artist_name?: string;
  artist_avatar?: string | null;
  artist_verificado?: boolean;
  play_count?: number;
}

export const PROVINCIAS: Provincia[] = [
  'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
  'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla',
  'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
  'Namibe', 'Uíge', 'Zaire',
];

export const TIPOS_PERFIL: { value: TipoPerfil; label: string; desc: string }[] = [
  { value: 'ouvinte', label: 'Ouvinte', desc: 'Descobrir e ouvir música de artistas angolanos.' },
  { value: 'artista', label: 'Artista', desc: 'Publicar as tuas faixas e alcançar fãs.' },
  { value: 'produtor', label: 'Produtor', desc: 'Produzir beats e colaborar com artistas.' },
];

export const GENEROS: string[] = [
  'Kuduro', 'Semba', 'Kizomba', 'Afro-house', 'Tarraxo',
  'Afrobeats', 'Hip-hop', 'Gospel', 'Outro',
];

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  criado_em: string;
}

export interface TrackLike {
  id: string;
  track_id: string;
  user_id: string;
  criado_em: string;
}

export interface TrackComment {
  id: string;
  track_id: string;
  user_id: string;
  texto: string;
  criado_em: string;
  author_name?: string;
  author_avatar?: string | null;
  author_verificado?: boolean;
}

export type ReportTipo = 'faixa' | 'comentario' | 'perfil';

export interface Report {
  id: string;
  tipo: ReportTipo;
  item_id: string;
  reporter_id: string;
  motivo: string;
  criado_em: string;
}

export type NotificationTipo = 'novo_seguidor' | 'nova_faixa' | 'gosto' | 'comentario';

export interface AppNotification {
  id: string;
  user_id: string;
  tipo: NotificationTipo;
  referencia_id: string | null;
  referencia_texto: string | null;
  lida: boolean;
  criado_em: string;
}

export interface Playlist {
  id: string;
  owner_id: string;
  nome: string;
  descricao: string | null;
  capa_url: string | null;
  publica: boolean;
  colaborativa: boolean;
  criado_em: string;
  owner_name?: string;
  track_count?: number;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  adicionado_por: string;
  posicao: number;
  criado_em: string;
}

export interface PlaylistCollaborator {
  playlist_id: string;
  user_id: string;
  criado_em: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface PlaybackState {
  user_id: string;
  track_id: string | null;
  posicao_segundos: number;
  atualizado_em: string;
}

export const GENERO_COLORS: Record<string, string> = {
  'Kuduro': 'from-red-600 to-orange-600',
  'Semba': 'from-amber-500 to-yellow-600',
  'Kizomba': 'from-rose-600 to-pink-700',
  'Afro-house': 'from-emerald-600 to-teal-700',
  'Tarraxo': 'from-purple-600 to-fuchsia-700',
  'Afrobeats': 'from-orange-500 to-red-600',
  'Hip-hop': 'from-blue-600 to-indigo-700',
  'Gospel': 'from-yellow-500 to-amber-600',
  'Outro': 'from-neutral-600 to-neutral-700',
};
