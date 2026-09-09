/*
# MuSon — Monitorização de erros (própria, sem serviço externo)

## Porquê desta abordagem
Em vez de integrar um serviço de terceiros (ex: Sentry), que exigiria mais
uma conta externa, guardamos os erros na própria base de dados que já
usas — consistente com a preferência já expressa de evitar contas extra
enquanto a plataforma ainda é pequena. Se um dia precisares de algo mais
avançado (alertas em tempo real, agrupamento automático de erros
parecidos), integrar um serviço a sério fica mais fácil de justificar
quando já tiveres utilizadores reais a gerar volume de erros.

## Tabela
`error_logs` — cada erro apanhado (no frontend, por um "apanhador" global)
fica registado com a mensagem, o stack trace, o URL onde aconteceu, e o
utilizador (se estiver autenticado). Um administrador pode marcar como
"resolvido" depois de tratar.

## RLS
- INSERT: aberto a todos (anon + authenticated) — erros podem acontecer
  mesmo antes de alguém iniciar sessão.
- SELECT/UPDATE: apenas administradores.
*/

CREATE TABLE IF NOT EXISTS error_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem    text NOT NULL,
  stack       text,
  contexto    jsonb,
  url         text,
  user_agent  text,
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolvido   boolean NOT NULL DEFAULT false,
  criado_em   timestamptz DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_error_logs" ON error_logs;
CREATE POLICY "public_insert_error_logs" ON error_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_error_logs" ON error_logs;
CREATE POLICY "admin_read_error_logs" ON error_logs FOR SELECT
  TO authenticated USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_update_error_logs" ON error_logs;
CREATE POLICY "admin_update_error_logs" ON error_logs FOR UPDATE
  TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_error_logs_resolvido ON error_logs(resolvido, criado_em DESC);
