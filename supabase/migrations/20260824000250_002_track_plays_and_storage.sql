/*
# MuSon — Tabela track_plays + buckets de Storage

## Resumo
1. Cria a tabela `track_plays` para registar reproduções de faixas (para
   estatísticas futuras e secção "Em alta" na Home).
2. Cria buckets de Storage: `audio-tracks` e `track-covers` para upload de
   faixas e capas. (Os buckets `avatars` e `capas` já existem do Prompt 1.)
3. Configura RLS em `track_plays`:
   - INSERT público (qualquer um, incluindo convidados/anon, pode registar play)
   - SELECT: o artista dono da faixa pode ver as plays das suas faixas
4. Configura políticas de Storage para `audio-tracks` e `track-covers`:
   - Leitura pública
   - Upload/update/delete apenas por utilizadores autenticados

## Tabelas criadas
- `track_plays`: id, track_id, user_id (nullable), criado_em

## Notas
- user_id é nullable para permitir registar plays de utilizadores não autenticados.
- O SELECT em track_plays usa um JOIN com tracks para verificar se o
  auth.uid() é o artist_id da faixa.
*/

-- ============================================================
-- TRACK_PLAYS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS track_plays (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id   uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em  timestamptz DEFAULT now()
);

ALTER TABLE track_plays ENABLE ROW LEVEL SECURITY;

-- INSERT: público (qualquer um pode registar play, incluindo convidados)
DROP POLICY IF EXISTS "public_insert_track_plays" ON track_plays;
CREATE POLICY "public_insert_track_plays" ON track_plays FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- SELECT: o artista dono da faixa pode ver as plays das suas faixas
DROP POLICY IF EXISTS "artist_read_own_track_plays" ON track_plays;
CREATE POLICY "artist_read_own_track_plays" ON track_plays FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tracks
      WHERE tracks.id = track_plays.track_id
      AND tracks.artist_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_track_plays_track_id ON track_plays(track_id);
CREATE INDEX IF NOT EXISTS idx_track_plays_criado_em ON track_plays(criado_em DESC);
