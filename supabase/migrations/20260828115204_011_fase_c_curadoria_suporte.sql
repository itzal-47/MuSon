/*
# MuSon — Painel de Administração, Fase C

## Resumo
Curadoria de conteúdo (destaques na Home), suporte com tickets dentro da
plataforma (em vez de só um mailto:), e abertura do registo de auditoria
já usado desde a Fase A para escrita direta (não só via funções RPC).

## Tabelas novas
1. `featured_content` — itens marcados pela administração para aparecerem
   em destaque na Home (faixa, artista ou playlist), com posição de
   ordenação e um título/subtítulo opcional personalizado.
2. `support_tickets` — pedidos de suporte submetidos por utilizadores
   dentro da app, com resposta e estado geridos pela administração.

## Alteração a admin_logs
Até agora só as funções RPC da Fase A conseguiam escrever no registo de
auditoria (não havia política de INSERT para ninguém). Como a curadoria e
os tickets são geridos por escrita direta na tabela (mais simples, risco
baixo — não envolvem dinheiro nem suspensão), acrescenta-se uma política
que permite a um administrador registar as suas próprias ações.
*/

-- ============================================================
-- FEATURED_CONTENT
-- ============================================================

CREATE TABLE IF NOT EXISTS featured_content (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           text NOT NULL CHECK (tipo IN ('faixa', 'artista', 'playlist')),
  item_id        uuid NOT NULL,
  titulo_custom  text,
  subtitulo_custom text,
  posicao        integer NOT NULL DEFAULT 0,
  ativo          boolean NOT NULL DEFAULT true,
  criado_por     uuid REFERENCES profiles(id),
  criado_em      timestamptz DEFAULT now()
);

ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_featured" ON featured_content;
CREATE POLICY "public_read_active_featured" ON featured_content FOR SELECT
  TO anon, authenticated USING (ativo = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_write_featured" ON featured_content;
CREATE POLICY "admin_write_featured" ON featured_content FOR INSERT
  TO authenticated WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_update_featured" ON featured_content;
CREATE POLICY "admin_update_featured" ON featured_content FOR UPDATE
  TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_delete_featured" ON featured_content;
CREATE POLICY "admin_delete_featured" ON featured_content FOR DELETE
  TO authenticated USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_featured_ativo ON featured_content(ativo, posicao);

-- ============================================================
-- SUPPORT_TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assunto         text NOT NULL,
  mensagem        text NOT NULL,
  status          text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'respondido', 'fechado')),
  resposta_admin  text,
  criado_em       timestamptz DEFAULT now(),
  respondido_em   timestamptz,
  respondido_por  uuid REFERENCES profiles(id)
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_or_admin_tickets" ON support_tickets;
CREATE POLICY "read_own_or_admin_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "insert_own_ticket" ON support_tickets;
CREATE POLICY "insert_own_ticket" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_update_tickets" ON support_tickets;
CREATE POLICY "admin_update_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);

-- ============================================================
-- ADMIN_LOGS — permitir escrita direta por administradores
-- ============================================================

DROP POLICY IF EXISTS "admin_insert_logs" ON admin_logs;
CREATE POLICY "admin_insert_logs" ON admin_logs FOR INSERT
  TO authenticated WITH CHECK (is_admin(auth.uid()) AND admin_id = auth.uid());
