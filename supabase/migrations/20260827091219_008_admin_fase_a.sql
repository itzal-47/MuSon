/*
# MuSon — Painel de Administração, Fase A

## Resumo
Base de dados para: visão geral (dashboard), gestão de utilizadores,
concessão manual de Premium por tempo limitado, suspensão de contas,
remoção direta de conteúdo pela administração, e um registo de auditoria
simples de tudo isto.

## ATENÇÃO — correção de segurança importante
Ao construir isto, reparei que a política de UPDATE da tabela `profiles`
(criada na primeira migration) permite que QUALQUER utilizador autenticado
altere QUALQUER coluna do seu PRÓPRIO perfil — incluindo `verificado`. Ou
seja, tecnicamente, alguém podia chamar a API diretamente e atribuir a si
próprio o selo verificado, sem passar pelo pedido/aprovação. As políticas
RLS do Postgres controlam quem pode mexer numa LINHA, não em colunas
específicas dentro dela — por isso isto passou despercebido até agora.

Esta migration corrige isso com um trigger que protege as colunas sensíveis
(`verificado`, `premium_until`, `suspenso`, `suspenso_motivo`, `suspenso_em`)
— só podem mudar através das funções de administração abaixo (que já
verificam se quem chama é administrador), nunca por edição direta do
próprio utilizador.

## Tabelas novas
- `premium_grants` — histórico de concessões de Premium (quem deu, a quem,
  quantos dias, porquê).
- `admin_logs` — registo de auditoria: toda ação de administração fica
  registada (quem, o quê, quando).

## Colunas novas em profiles
- `premium_until` — data até quando a conta é premium (null = não é).
- `suspenso`, `suspenso_motivo`, `suspenso_em` — estado de suspensão.

## Funções (todas verificam is_admin(auth.uid()) antes de fazer seja o
## que for, por isso são seguras para expor a qualquer utilizador autenticado)
- `grant_premium(target_id, dias, motivo)` — concede/estende Premium.
- `revoke_premium(target_id)` — remove Premium imediatamente.
- `suspend_user(target_id, motivo)` / `unsuspend_user(target_id)`.
- `admin_delete_track/comment/playlist(id)` — remoção direta de conteúdo.
- `admin_search_users(query)` — pesquisa utilizadores por username, nome
  ou EMAIL (o email vive em auth.users, não em profiles — esta função
  corre com privilégios elevados só para este efeito, nunca devolve a
  senha nem outros dados sensíveis).

## Nota importante sobre suspensão
A suspensão aqui é aplicada ao nível da aplicação (a app verifica
profiles.suspenso e impede o uso normal, terminando a sessão). NÃO bloqueia
ainda chamadas diretas à API feitas por alguém tecnicamente capaz de as
contornar — isso exigiria reescrever RLS em várias tabelas para verificar
sempre "NOT suspenso", o que fica para mais tarde se um dia for preciso.
Para a escala atual (moderação manual, sem equipa), isto é suficiente.
*/

-- ============================================================
-- COLUNAS NOVAS EM PROFILES
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspenso boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspenso_motivo text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspenso_em timestamptz;

-- ============================================================
-- PROTEÇÃO DE COLUNAS SENSÍVEIS (correção de segurança)
-- ============================================================

CREATE OR REPLACE FUNCTION protect_admin_only_profile_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    NEW.verificado := OLD.verificado;
    NEW.premium_until := OLD.premium_until;
    NEW.suspenso := OLD.suspenso;
    NEW.suspenso_motivo := OLD.suspenso_motivo;
    NEW.suspenso_em := OLD.suspenso_em;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_admin_columns ON profiles;
CREATE TRIGGER trg_protect_admin_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_only_profile_columns();

-- ============================================================
-- PREMIUM_GRANTS
-- ============================================================

CREATE TABLE IF NOT EXISTS premium_grants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by  uuid NOT NULL REFERENCES profiles(id),
  dias        integer NOT NULL,
  motivo      text,
  criado_em   timestamptz DEFAULT now()
);

ALTER TABLE premium_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_or_admin_premium_grants" ON premium_grants;
CREATE POLICY "read_own_or_admin_premium_grants" ON premium_grants FOR SELECT
  TO authenticated USING (profile_id = auth.uid() OR is_admin(auth.uid()));

-- ============================================================
-- ADMIN_LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid NOT NULL REFERENCES profiles(id),
  acao       text NOT NULL,
  alvo_tipo  text,
  alvo_id    uuid,
  detalhes   jsonb,
  criado_em  timestamptz DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_logs" ON admin_logs;
CREATE POLICY "admin_read_logs" ON admin_logs FOR SELECT
  TO authenticated USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_admin_logs_criado ON admin_logs(criado_em DESC);

-- ============================================================
-- FUNÇÕES DE ADMINISTRAÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION grant_premium(target_id uuid, dias integer, motivo text)
RETURNS void AS $$
DECLARE
  novo_fim timestamptz;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem conceder Premium.';
  END IF;
  IF dias IS NULL OR dias <= 0 THEN
    RAISE EXCEPTION 'O número de dias tem de ser positivo.';
  END IF;

  SELECT GREATEST(COALESCE(premium_until, now()), now()) + (dias || ' days')::interval
    INTO novo_fim FROM profiles WHERE id = target_id;

  IF novo_fim IS NULL THEN
    RAISE EXCEPTION 'Utilizador não encontrado.';
  END IF;

  UPDATE profiles SET premium_until = novo_fim WHERE id = target_id;

  INSERT INTO premium_grants (profile_id, granted_by, dias, motivo)
    VALUES (target_id, auth.uid(), dias, motivo);

  INSERT INTO admin_logs (admin_id, acao, alvo_tipo, alvo_id, detalhes)
    VALUES (auth.uid(), 'conceder_premium', 'profile', target_id, jsonb_build_object('dias', dias, 'motivo', motivo, 'novo_fim', novo_fim));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION revoke_premium(target_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem remover Premium.';
  END IF;
  UPDATE profiles SET premium_until = NULL WHERE id = target_id;
  INSERT INTO admin_logs (admin_id, acao, alvo_tipo, alvo_id)
    VALUES (auth.uid(), 'revogar_premium', 'profile', target_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION suspend_user(target_id uuid, motivo text)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem suspender contas.';
  END IF;
  UPDATE profiles SET suspenso = true, suspenso_motivo = motivo, suspenso_em = now() WHERE id = target_id;
  INSERT INTO admin_logs (admin_id, acao, alvo_tipo, alvo_id, detalhes)
    VALUES (auth.uid(), 'suspender_conta', 'profile', target_id, jsonb_build_object('motivo', motivo));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION unsuspend_user(target_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem reativar contas.';
  END IF;
  UPDATE profiles SET suspenso = false, suspenso_motivo = NULL, suspenso_em = NULL WHERE id = target_id;
  INSERT INTO admin_logs (admin_id, acao, alvo_tipo, alvo_id)
    VALUES (auth.uid(), 'reativar_conta', 'profile', target_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_track(target_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem remover faixas diretamente.';
  END IF;
  INSERT INTO admin_logs (admin_id, acao, alvo_tipo, alvo_id)
    VALUES (auth.uid(), 'remover_faixa', 'track', target_id);
  DELETE FROM tracks WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_comment(target_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem remover comentários diretamente.';
  END IF;
  INSERT INTO admin_logs (admin_id, acao, alvo_tipo, alvo_id)
    VALUES (auth.uid(), 'remover_comentario', 'comment', target_id);
  DELETE FROM track_comments WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_playlist(target_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem remover playlists diretamente.';
  END IF;
  INSERT INTO admin_logs (admin_id, acao, alvo_tipo, alvo_id)
    VALUES (auth.uid(), 'remover_playlist', 'playlist', target_id);
  DELETE FROM playlists WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pesquisa de utilizadores incluindo email (auth.users não é acessível
-- diretamente pelo cliente — esta função corre com privilégios elevados
-- só para este efeito, e nunca devolve a senha nem outros dados sensíveis).
CREATE OR REPLACE FUNCTION admin_search_users(search_query text)
RETURNS TABLE (
  id uuid, username text, display_name text, avatar_url text, tipo_perfil text,
  provincia text, verificado boolean, suspenso boolean, suspenso_motivo text,
  premium_until timestamptz, email text, criado_em timestamptz
) AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem pesquisar utilizadores.';
  END IF;

  RETURN QUERY
  SELECT p.id, p.username, p.display_name, p.avatar_url, p.tipo_perfil::text,
         p.provincia::text, p.verificado, p.suspenso, p.suspenso_motivo,
         p.premium_until, u.email::text, p.criado_em
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE search_query = ''
     OR p.username ILIKE '%' || search_query || '%'
     OR p.display_name ILIKE '%' || search_query || '%'
     OR u.email ILIKE '%' || search_query || '%'
  ORDER BY p.criado_em DESC
  LIMIT 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION grant_premium(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_premium(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION unsuspend_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_track(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_comment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_playlist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_search_users(text) TO authenticated;

-- ============================================================
-- Dashboard precisa de contar plays — a política atual só deixa o
-- artista dono ver as plays das SUAS faixas; adiciona leitura para admins
-- ============================================================

DROP POLICY IF EXISTS "artist_read_own_track_plays" ON track_plays;
DROP POLICY IF EXISTS "artist_or_admin_read_track_plays" ON track_plays;
CREATE POLICY "artist_or_admin_read_track_plays" ON track_plays FOR SELECT
  TO authenticated USING (
    is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM tracks t WHERE t.id = track_plays.track_id AND t.artist_id = auth.uid())
  );
