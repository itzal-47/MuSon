/*
# MuSon — Esquema inicial da base de dados

## Resumo
Cria o esquema completo da plataforma de streaming MuSon: perfis de utilizador,
perfis de artista, perfis de produtor, faixas e álbuns. Configura Row Level
Security em todas as tabelas com leitura pública e escrita restrita ao dono.

## Tabelas criadas
1. `profiles` — estende auth.users com username, display_name, avatar, tipo de
   perfil, província, bio, verificação e data de criação.
2. `artist_profiles` — dados extra para utilizadores com tipo_perfil = artista
   (géneros, redes sociais, capa).
3. `producer_profiles` — dados extra para utilizadores com tipo_perfil = produtor
   (especialidades, capa).
4. `albums` — álbuns/singles/EPs criados por artistas.
5. `tracks` — faixas publicadas por artistas, com referência opcional a álbum.

## Enums criados
- `tipo_perfil_enum`: ouvinte, artista, produtor
- `provincia_enum`: 18 províncias de Angola
- `album_tipo_enum`: single, ep, album

## Segurança (RLS)
- Leitura pública (anon + authenticated) em: profiles, artist_profiles,
  producer_profiles, tracks publicadas, albums.
- Escrita/update/delete apenas pelo dono (auth.uid() = id/artist_id/profile_id).
- INSERT em profiles apenas pelo próprio utilizador (auth.uid() = id).
- INSERT em tracks/albums apenas pelo artista (auth.uid() = artist_id).

## Notas
- As colunas de dono usam DEFAULT auth.uid() onde aplicável.
- tracks.artist_id referencia profiles.id; albums.artist_id referencia profiles.id.
- Políticas são idempotentes (DROP IF EXISTS antes de CREATE).
*/

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE tipo_perfil_enum AS ENUM ('ouvinte', 'artista', 'produtor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE provincia_enum AS ENUM (
    'Bengo','Benguela','Bié','Cabinda','Cuando Cubango','Cuanza Norte',
    'Cuanza Sul','Cunene','Huambo','Huíla','Luanda','Lunda Norte',
    'Lunda Sul','Malanje','Moxico','Namibe','Uíge','Zaire'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE album_tipo_enum AS ENUM ('single','ep','album');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text UNIQUE,
  display_name text,
  avatar_url  text,
  tipo_perfil tipo_perfil_enum DEFAULT 'ouvinte',
  provincia   provincia_enum,
  bio         text,
  verificado  boolean DEFAULT false,
  criado_em   timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============================================================
-- ARTIST_PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS artist_profiles (
  profile_id    uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  generos       text[] DEFAULT '{}',
  redes_sociais jsonb DEFAULT '{}',
  capa_url      text,
  criado_em     timestamptz DEFAULT now()
);

ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_artist_profiles" ON artist_profiles;
CREATE POLICY "public_read_artist_profiles" ON artist_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_artist_profile" ON artist_profiles;
CREATE POLICY "insert_own_artist_profile" ON artist_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "update_own_artist_profile" ON artist_profiles;
CREATE POLICY "update_own_artist_profile" ON artist_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "delete_own_artist_profile" ON artist_profiles;
CREATE POLICY "delete_own_artist_profile" ON artist_profiles FOR DELETE
  TO authenticated USING (auth.uid() = profile_id);

-- ============================================================
-- PRODUCER_PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS producer_profiles (
  profile_id     uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  especialidades text[] DEFAULT '{}',
  capa_url        text,
  criado_em       timestamptz DEFAULT now()
);

ALTER TABLE producer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_producer_profiles" ON producer_profiles;
CREATE POLICY "public_read_producer_profiles" ON producer_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_producer_profile" ON producer_profiles;
CREATE POLICY "insert_own_producer_profile" ON producer_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "update_own_producer_profile" ON producer_profiles;
CREATE POLICY "update_own_producer_profile" ON producer_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "delete_own_producer_profile" ON producer_profiles;
CREATE POLICY "delete_own_producer_profile" ON producer_profiles FOR DELETE
  TO authenticated USING (auth.uid() = profile_id);

-- ============================================================
-- ALBUMS
-- ============================================================

CREATE TABLE IF NOT EXISTS albums (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo    text NOT NULL,
  capa_url  text,
  tipo      album_tipo_enum DEFAULT 'single',
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_albums" ON albums;
CREATE POLICY "public_read_albums" ON albums FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_album" ON albums;
CREATE POLICY "insert_own_album" ON albums FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = artist_id);

DROP POLICY IF EXISTS "update_own_album" ON albums;
CREATE POLICY "update_own_album" ON albums FOR UPDATE
  TO authenticated USING (auth.uid() = artist_id) WITH CHECK (auth.uid() = artist_id);

DROP POLICY IF EXISTS "delete_own_album" ON albums;
CREATE POLICY "delete_own_album" ON albums FOR DELETE
  TO authenticated USING (auth.uid() = artist_id);

-- ============================================================
-- TRACKS
-- ============================================================

CREATE TABLE IF NOT EXISTS tracks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  capa_url        text,
  audio_url      text,
  duracao_segundos integer,
  genero          text,
  explicita       boolean DEFAULT false,
  permite_download boolean DEFAULT false,
  album_id        uuid REFERENCES albums(id) ON DELETE SET NULL,
  numero_faixa    integer,
  publicada       boolean DEFAULT true,
  criado_em       timestamptz DEFAULT now()
);

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_tracks" ON tracks;
CREATE POLICY "public_read_tracks" ON tracks FOR SELECT
  TO anon, authenticated USING (publicada = true);

DROP POLICY IF EXISTS "insert_own_track" ON tracks;
CREATE POLICY "insert_own_track" ON tracks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = artist_id);

DROP POLICY IF EXISTS "update_own_track" ON tracks;
CREATE POLICY "update_own_track" ON tracks FOR UPDATE
  TO authenticated USING (auth.uid() = artist_id) WITH CHECK (auth.uid() = artist_id);

DROP POLICY IF EXISTS "delete_own_track" ON tracks;
CREATE POLICY "delete_own_track" ON tracks FOR DELETE
  TO authenticated USING (auth.uid() = artist_id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
