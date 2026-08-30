/*
# MuSon — Download Premium, Publicação Agendada, Retenção

## Resumo
Três acréscimos independentes:

1. `tracks.publicar_em` — permite agendar uma faixa para publicação
   futura. A faixa fica invisível ao público até essa data/hora passar,
   mas o próprio artista continua a vê-la (ex: em "As minhas faixas").
   Não precisa de nenhum processo agendado (cron) — é só um filtro que a
   política de leitura já aplica sempre que alguém consulta a tabela.

2. `track_plays.duracao_ouvida_segundos` — quanto tempo, em segundos, a
   pessoa ouviu antes de mudar de faixa. Usado para calcular retenção
   (que percentagem da faixa as pessoas costumam ouvir) nas estatísticas
   avançadas para artistas verificados. Fica a null se nunca for
   atualizado (ex: plays antigas, antes desta migration).

## Alteração de política
`public_read_tracks` passa a exigir também que `publicar_em` já tenha
passado (ou seja nulo), EXCETO para o próprio dono da faixa, que continua
a ver tudo o que é seu, publicado ou agendado.
*/

ALTER TABLE tracks ADD COLUMN IF NOT EXISTS publicar_em timestamptz;
ALTER TABLE track_plays ADD COLUMN IF NOT EXISTS duracao_ouvida_segundos numeric;

DROP POLICY IF EXISTS "public_read_tracks" ON tracks;
CREATE POLICY "public_read_tracks" ON tracks FOR SELECT
  TO anon, authenticated USING (
    (publicada = true AND (publicar_em IS NULL OR publicar_em <= now()))
    OR artist_id = auth.uid()
  );
