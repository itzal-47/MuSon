/*
# MuSon — Tabelas sociais: follows, track_likes, track_comments, reports, notifications

## Resumo
Cria as tabelas para funcionalidades sociais: seguir artistas/produtores,
gostar de faixas, comentar em faixas, denúncias de moderação e notificações.

## Tabelas criadas

1. `follows` — relação de seguir entre utilizadores
   - follower_id (quem segue), following_id (quem é seguido)
   - Constraint única (follower_id, following_id)

2. `track_likes` — gostos de faixas
   - track_id, user_id
   - Constraint única (track_id, user_id)

3. `track_comments` — comentários em faixas
   - track_id, user_id, texto
   - Ordem por criado_em

4. `reports` — denúncias de moderação
   - tipo (faixa/comentario/perfil), item_id, reporter_id, motivo

5. `notifications` — notificações do utilizador
   - user_id (destinatário), tipo (novo_seguidor/nova_faixa/gosto/comentario)
   - referencia_id, lida (boolean default false)

## RLS
- follows: leitura pública, INSERT/DELETE apenas pelo próprio follower
- track_likes: leitura pública, INSERT/DELETE apenas pelo próprio user
- track_comments: leitura pública, INSERT apenas pelo próprio user, DELETE pelo dono do comentário
- reports: INSERT apenas por authenticated (reporter_id = auth.uid()), sem leitura pública
- notifications: leitura apenas pelo destinatário (user_id = auth.uid()),
  UPDATE apenas pelo destinatário (marcar como lida)

## Notas
- Todas as tabelas usam ON DELETE CASCADE apropriado
- Constraints únicas previnem duplicação de follows/likes
*/

-- ============================================================
-- FOLLOWS
-- ============================================================

CREATE TABLE IF NOT EXISTS follows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  criado_em    timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_follows" ON follows;
CREATE POLICY "public_read_follows" ON follows FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_follow" ON follows;
CREATE POLICY "insert_own_follow" ON follows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "delete_own_follow" ON follows;
CREATE POLICY "delete_own_follow" ON follows FOR DELETE
  TO authenticated USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ============================================================
-- TRACK_LIKES
-- ============================================================

CREATE TABLE IF NOT EXISTS track_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id   uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  criado_em  timestamptz DEFAULT now(),
  UNIQUE(track_id, user_id)
);

ALTER TABLE track_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_track_likes" ON track_likes;
CREATE POLICY "public_read_track_likes" ON track_likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_track_like" ON track_likes;
CREATE POLICY "insert_own_track_like" ON track_likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_track_like" ON track_likes;
CREATE POLICY "delete_own_track_like" ON track_likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_track_likes_track ON track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_user ON track_likes(user_id);

-- ============================================================
-- TRACK_COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS track_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id   uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  texto      text NOT NULL,
  criado_em  timestamptz DEFAULT now()
);

ALTER TABLE track_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_track_comments" ON track_comments;
CREATE POLICY "public_read_track_comments" ON track_comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_comment" ON track_comments;
CREATE POLICY "insert_own_comment" ON track_comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_comment" ON track_comments;
CREATE POLICY "delete_own_comment" ON track_comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_track_comments_track ON track_comments(track_id);

-- ============================================================
-- REPORTS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE report_tipo_enum AS ENUM ('faixa', 'comentario', 'perfil');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        report_tipo_enum NOT NULL,
  item_id     uuid NOT NULL,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  motivo      text NOT NULL,
  criado_em   timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_own_report" ON reports;
CREATE POLICY "insert_own_report" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- No SELECT policy — reports are private (admin only via service role)

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE notification_tipo_enum AS ENUM ('novo_seguidor', 'nova_faixa', 'gosto', 'comentario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo          notification_tipo_enum NOT NULL,
  referencia_id uuid,
  referencia_texto text,
  lida          boolean DEFAULT false,
  criado_em     timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_notifications" ON notifications;
CREATE POLICY "read_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE lida = false;
