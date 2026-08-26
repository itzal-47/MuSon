/*
# MuSon — Streaks de audição

## Resumo
Cria a tabela `listening_streaks` para o sistema de "dias seguidos a ouvir
música", usado na funcionalidade de engagement (streaks).

## Tabela criada
`listening_streaks`:
- user_id (PK, referencia profiles)
- dias_seguidos: streak atual, incrementado quando o utilizador ouve música
  em dias consecutivos
- melhor_streak: recorde pessoal, nunca desce
- ultimo_dia: data (sem hora) do último dia em que o utilizador ouviu algo,
  usada para calcular se o streak continua, quebra, ou já foi contado hoje

## RLS
Leitura e escrita apenas pelo próprio utilizador (user_id = auth.uid()).

## Nota
A lógica de cálculo do streak (incrementar/quebrar/resetar) é feita em
aplicação (src/lib/streaks.ts), não em SQL — mantém consistência com o
resto do projeto, que já faz agregações no cliente.
*/

CREATE TABLE IF NOT EXISTS listening_streaks (
  user_id        uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dias_seguidos  integer NOT NULL DEFAULT 0,
  melhor_streak  integer NOT NULL DEFAULT 0,
  ultimo_dia     date,
  atualizado_em  timestamptz DEFAULT now()
);

ALTER TABLE listening_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_streak" ON listening_streaks;
CREATE POLICY "read_own_streak" ON listening_streaks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_streak" ON listening_streaks;
CREATE POLICY "insert_own_streak" ON listening_streaks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_streak" ON listening_streaks;
CREATE POLICY "update_own_streak" ON listening_streaks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
