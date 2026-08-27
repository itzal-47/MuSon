/*
# MuSon — Administradores, verificação e moderação de denúncias

## Resumo
Base para o painel de administração: quem é administrador, como um
artista/produtor pede o selo verificado, e como as denúncias já existentes
passam a poder ser vistas e resolvidas.

## Tabelas criadas
1. `admins` — lista de utilizadores com acesso ao painel de administração.
   Não tem política de escrita via RLS para ninguém (nem para o próprio) —
   só é editável diretamente no SQL Editor do Supabase. Isto é intencional:
   é a forma mais simples e segura de garantir que ninguém se autopromove a
   administrador através da aplicação. Para te tornares administrador,
   corre manualmente:
   INSERT INTO admins (user_id) VALUES ('<o-teu-user-id>');

2. `verification_requests` — pedidos de selo verificado. Um artista ou
   produtor descreve quem é e junta links de prova (redes sociais, outras
   plataformas). Fica "pendente" até um administrador aprovar ou rejeitar.

## Alterações a tabelas existentes
- `reports` ganha `resolvido` e `resolvido_em`, e agora tem política de
  leitura (antes não tinha nenhuma — nem o próprio autor da denúncia
  conseguia vê-la) e de atualização para administradores.

## Funções
- `is_admin(uid)` — verifica se um utilizador é administrador. Usada nas
  políticas RLS de várias tabelas.
- `approve_verification_request(req_id)` — só administradores podem chamar;
  marca o pedido como aprovado E atualiza profiles.verificado = true na
  mesma operação.
- `reject_verification_request(req_id, motivo)` — só administradores podem
  chamar; marca o pedido como rejeitado com um motivo.

Estas funções correm com SECURITY DEFINER (privilégios elevados), mas cada
uma valida internamente que quem chama é administrador antes de fazer
qualquer alteração — por isso é seguro expô-las a todos os utilizadores
autenticados.
*/

-- ============================================================
-- ADMINS
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  user_id    uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  criado_em  timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Cada utilizador só pode ver se ELE PRÓPRIO é administrador (para a app
-- saber se mostra o link do painel) — não há política de escrita nenhuma:
-- só é gerido manualmente no SQL Editor.
DROP POLICY IF EXISTS "read_own_admin_status" ON admins;
CREATE POLICY "read_own_admin_status" ON admins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = check_user_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated, anon;

-- ============================================================
-- VERIFICATION_REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS verification_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mensagem         text NOT NULL,
  links            text[] DEFAULT '{}',
  status           text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  motivo_rejeicao  text,
  criado_em        timestamptz DEFAULT now(),
  revisto_em       timestamptz,
  revisto_por      uuid REFERENCES profiles(id)
);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_or_admin_verification_requests" ON verification_requests;
CREATE POLICY "read_own_or_admin_verification_requests" ON verification_requests FOR SELECT
  TO authenticated USING (profile_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "insert_own_verification_request" ON verification_requests;
CREATE POLICY "insert_own_verification_request" ON verification_requests FOR INSERT
  TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_verification_requests_profile ON verification_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- Impede pedidos duplicados: só pode haver um pedido "pendente" por perfil de cada vez
CREATE OR REPLACE FUNCTION check_pending_verification_request()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM verification_requests
    WHERE profile_id = NEW.profile_id AND status = 'pendente'
  ) THEN
    RAISE EXCEPTION 'Já tens um pedido de verificação pendente.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_pending_verification ON verification_requests;
CREATE TRIGGER trg_check_pending_verification
  BEFORE INSERT ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_pending_verification_request();

-- Aprovar/rejeitar: só administradores, validado dentro da própria função
CREATE OR REPLACE FUNCTION approve_verification_request(req_id uuid)
RETURNS void AS $$
DECLARE
  target_profile uuid;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar pedidos.';
  END IF;

  SELECT profile_id INTO target_profile
  FROM verification_requests
  WHERE id = req_id AND status = 'pendente';

  IF target_profile IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já foi revisto.';
  END IF;

  UPDATE verification_requests
    SET status = 'aprovado', revisto_em = now(), revisto_por = auth.uid()
    WHERE id = req_id;

  UPDATE profiles SET verificado = true WHERE id = target_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_verification_request(req_id uuid, motivo text)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar pedidos.';
  END IF;

  UPDATE verification_requests
    SET status = 'rejeitado', revisto_em = now(), revisto_por = auth.uid(), motivo_rejeicao = motivo
    WHERE id = req_id AND status = 'pendente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já foi revisto.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_verification_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_verification_request(uuid, text) TO authenticated;

-- ============================================================
-- REPORTS — adicionar leitura, resolução, e colunas de estado
-- ============================================================

ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolvido boolean DEFAULT false;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolvido_em timestamptz;

DROP POLICY IF EXISTS "read_own_or_admin_reports" ON reports;
CREATE POLICY "read_own_or_admin_reports" ON reports FOR SELECT
  TO authenticated USING (reporter_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_update_reports" ON reports;
CREATE POLICY "admin_update_reports" ON reports FOR UPDATE
  TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reports_resolvido ON reports(resolvido);
