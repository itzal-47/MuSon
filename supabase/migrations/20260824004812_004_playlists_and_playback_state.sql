/*
# MuSon — Playlists, colaboradores e estado de reprodução

## Resumo
Cria o suporte para playlists (próprias e colaborativas) e para "continuar a
ouvir" entre sessões/dispositivos. O histórico de reprodução reaproveita a
tabela `track_plays` já existente (Prompt 3+4), não precisa de tabela nova.

## Tabelas criadas
1. `playlists` — playlists criadas por utilizadores, públicas/privadas,
   simples ou colaborativas.
2. `playlist_collaborators` — utilizadores convidados a editar uma playlist
   colaborativa (além do dono).
3. `playlist_tracks` — faixas dentro de uma playlist, com posição e quem
   adicionou (relevante para playlists colaborativas).
4. `playback_state` — última posição de reprodução por utilizador, para
   "continuar de onde parei" entre sessões/dispositivos.

## Ordem de criação (importante)
Todas as tabelas são criadas primeiro (sem políticas), porque as políticas
de `playlists` e `playlist_tracks` fazem referência a `playlist_collaborators`
dentro de subqueries EXISTS — se a política fosse criada antes de essa
tabela existir, o Postgres falha com "relation does not exist". Por isso
este ficheiro separa claramente: 1) CREATE TABLE de todas, depois 2) RLS de
todas.

## RLS
- playlists: leitura pública se `publica = true`, ou se o utilizador é dono
  ou colaborador; escrita/eliminação apenas pelo dono.
- playlist_collaborators: leitura pública (para saber quem colabora); apenas
  o dono da playlist pode convidar/remover colaboradores.
- playlist_tracks: leitura segue a visibilidade da playlist; escrita (inserir
  /remover/reordenar) permitida ao dono e, quando `colaborativa = true`, aos
  colaboradores também.
- playback_state: leitura e escrita apenas pelo próprio utilizador
  (user_id = auth.uid()).

## Notas
- playlist_tracks.posicao é inteiro simples (0-indexed); reordenar é feito
  em aplicação, recalculando posições.
- playback_state usa user_id como chave primária (uma linha por utilizador,
  sempre a mais recente).
- Tabelas e políticas são idempotentes (IF NOT EXISTS / DROP POLICY IF EXISTS).
*/

-- ============================================================
-- 1) CRIAÇÃO DE TODAS AS TABELAS (sem políticas ainda)
-- ============================================================

CREATE TABLE IF NOT EXISTS playlists (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  descricao     text,
  capa_url      text,
  publica       boolean DEFAULT true,
  colaborativa  boolean DEFAULT false,
  criado_em     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playlist_collaborators (
  playlist_id  uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  criado_em    timestamptz DEFAULT now(),
  PRIMARY KEY (playlist_id, user_id)
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id    uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id       uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  adicionado_por uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  posicao        integer NOT NULL DEFAULT 0,
  criado_em      timestamptz DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

CREATE TABLE IF NOT EXISTS playback_state (
  user_id           uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  track_id          uuid REFERENCES tracks(id) ON DELETE SET NULL,
  posicao_segundos  numeric DEFAULT 0,
  atualizado_em     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playlists_owner ON playlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);

-- ============================================================
-- 2) ROW LEVEL SECURITY — agora que todas as tabelas existem
-- ============================================================

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_state ENABLE ROW LEVEL SECURITY;

-- --- playlists ---

DROP POLICY IF EXISTS "read_playlists" ON playlists;
CREATE POLICY "read_playlists" ON playlists FOR SELECT
  TO anon, authenticated USING (
    publica = true
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM playlist_collaborators pc
      WHERE pc.playlist_id = playlists.id AND pc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_playlist" ON playlists;
CREATE POLICY "insert_own_playlist" ON playlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_playlist" ON playlists;
CREATE POLICY "update_own_playlist" ON playlists FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_playlist" ON playlists;
CREATE POLICY "delete_own_playlist" ON playlists FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- --- playlist_collaborators ---

DROP POLICY IF EXISTS "read_collaborators" ON playlist_collaborators;
CREATE POLICY "read_collaborators" ON playlist_collaborators FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_manage_collaborators" ON playlist_collaborators;
CREATE POLICY "owner_manage_collaborators" ON playlist_collaborators FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_remove_collaborators" ON playlist_collaborators;
CREATE POLICY "owner_remove_collaborators" ON playlist_collaborators FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM playlists p WHERE p.id = playlist_id AND p.owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- --- playlist_tracks ---

DROP POLICY IF EXISTS "read_playlist_tracks" ON playlist_tracks;
CREATE POLICY "read_playlist_tracks" ON playlist_tracks FOR SELECT
  TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND (
        p.publica = true
        OR p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "insert_playlist_tracks" ON playlist_tracks;
CREATE POLICY "insert_playlist_tracks" ON playlist_tracks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND (
        p.owner_id = auth.uid()
        OR (p.colaborativa = true AND EXISTS (
          SELECT 1 FROM playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid()
        ))
      )
    )
  );

DROP POLICY IF EXISTS "update_playlist_tracks" ON playlist_tracks;
CREATE POLICY "update_playlist_tracks" ON playlist_tracks FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND (
        p.owner_id = auth.uid()
        OR (p.colaborativa = true AND EXISTS (
          SELECT 1 FROM playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid()
        ))
      )
    )
  );

DROP POLICY IF EXISTS "delete_playlist_tracks" ON playlist_tracks;
CREATE POLICY "delete_playlist_tracks" ON playlist_tracks FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND (
        p.owner_id = auth.uid()
        OR (p.colaborativa = true AND EXISTS (
          SELECT 1 FROM playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid()
        ))
      )
    )
  );

-- --- playback_state ---

DROP POLICY IF EXISTS "read_own_playback_state" ON playback_state;
CREATE POLICY "read_own_playback_state" ON playback_state FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_playback_state" ON playback_state;
CREATE POLICY "insert_own_playback_state" ON playback_state FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_playback_state" ON playback_state;
CREATE POLICY "update_own_playback_state" ON playback_state FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_playback_state" ON playback_state;
CREATE POLICY "delete_own_playback_state" ON playback_state FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
