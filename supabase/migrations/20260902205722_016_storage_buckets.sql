/*
# MuSon — Buckets de Storage declarados por migration

## Porquê
Os 4 buckets usados pela plataforma (`avatars`, `capas`, `audio-tracks`,
`track-covers`) foram criados manualmente no painel do Supabase, nunca
numa migration — por isso, se um dia precisares de recriar o projeto do
zero (novo ambiente, ou um projeto de testes separado), estes buckets não
apareciam sozinhos ao correr as migrations. Esta migration corrige isso,
com `ON CONFLICT DO NOTHING`, por isso é segura de correr mesmo já
existindo os buckets manuais — não duplica nem apaga nada.

## Buckets e regras
- `avatars` — fotos de perfil. Público, só o dono pode escrever no seu
  próprio caminho (pasta com o seu user id).
- `capas` — capas de perfil de artista/produtor. Mesma regra.
- `audio-tracks` — ficheiros de áudio das faixas. Público (necessário para
  o `<audio>` tocar), só o próprio artista pode escrever no seu caminho.
- `track-covers` — capas de faixas/álbuns. Mesma regra.

## Nota sobre a estrutura de pastas
As políticas assumem que cada ficheiro é guardado num caminho que começa
pelo user id de quem o publica (ex: `<user_id>/foto.jpg`) — é o padrão que
o `storageService.ts` já usa. Se algum dia mudares essa estrutura, estas
políticas têm de ser revistas.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('capas', 'capas', true),
  ('audio-tracks', 'audio-tracks', true),
  ('track-covers', 'track-covers', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Leitura pública em todos os 4 buckets
-- ============================================================

DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "public_read_capas" ON storage.objects;
CREATE POLICY "public_read_capas" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'capas');

DROP POLICY IF EXISTS "public_read_audio_tracks" ON storage.objects;
CREATE POLICY "public_read_audio_tracks" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'audio-tracks');

DROP POLICY IF EXISTS "public_read_track_covers" ON storage.objects;
CREATE POLICY "public_read_track_covers" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'track-covers');

-- ============================================================
-- Escrita só no próprio caminho (pasta = user id)
-- ============================================================

DROP POLICY IF EXISTS "own_write_avatars" ON storage.objects;
CREATE POLICY "own_write_avatars" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_update_avatars" ON storage.objects;
CREATE POLICY "own_update_avatars" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_delete_avatars" ON storage.objects;
CREATE POLICY "own_delete_avatars" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_write_capas" ON storage.objects;
CREATE POLICY "own_write_capas" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'capas' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_update_capas" ON storage.objects;
CREATE POLICY "own_update_capas" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'capas' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_delete_capas" ON storage.objects;
CREATE POLICY "own_delete_capas" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'capas' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_write_audio_tracks" ON storage.objects;
CREATE POLICY "own_write_audio_tracks" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'audio-tracks' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_update_audio_tracks" ON storage.objects;
CREATE POLICY "own_update_audio_tracks" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'audio-tracks' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_delete_audio_tracks" ON storage.objects;
CREATE POLICY "own_delete_audio_tracks" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'audio-tracks' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_write_track_covers" ON storage.objects;
CREATE POLICY "own_write_track_covers" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'track-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_update_track_covers" ON storage.objects;
CREATE POLICY "own_update_track_covers" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'track-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_delete_track_covers" ON storage.objects;
CREATE POLICY "own_delete_track_covers" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'track-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
