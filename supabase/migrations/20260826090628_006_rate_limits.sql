/*
# MuSon — Proteção contra spam (limites de taxa)

## Resumo
Adiciona limites de taxa diretamente na base de dados (triggers), para que
não seja possível contornar a proteção só porque alguém edita o código do
frontend ou chama a API diretamente. Cobre os dois pontos mais óbvios de
abuso identificados: publicar faixas em massa, e denunciar em massa.

## Limites aplicados
- `tracks`: máximo de 10 faixas publicadas por artista/produtor, por hora.
- `reports`: máximo de 20 denúncias por utilizador, por dia (24h).

## Como funciona
Cada trigger corre ANTES do INSERT, conta quantas linhas o mesmo utilizador
criou na janela de tempo relevante, e rejeita a inserção com uma mensagem
clara se o limite for ultrapassado. As mensagens de erro em português
aparecem tal como estão nesta migration quando propagadas pelo Supabase —
o frontend deve tratá-las e mostrá-las de forma amigável.

## Nota
Estes limites são deliberadamente generosos (não devem incomodar uso normal
genuíno) — o objetivo é travar automação/abuso óbvio, não microgerir
utilizadores legítimos. Podem ser ajustados aqui no futuro sem tocar no
frontend.
*/

-- ============================================================
-- Limite de publicação de faixas (10 por hora, por artista/produtor)
-- ============================================================

CREATE OR REPLACE FUNCTION check_track_upload_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM tracks
  WHERE artist_id = NEW.artist_id
    AND criado_em > now() - interval '1 hour';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Limite de publicações atingido. Podes publicar até 10 faixas por hora — tenta novamente daqui a pouco.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_track_upload_rate_limit ON tracks;
CREATE TRIGGER trg_track_upload_rate_limit
  BEFORE INSERT ON tracks
  FOR EACH ROW
  EXECUTE FUNCTION check_track_upload_rate_limit();

-- ============================================================
-- Limite de denúncias (20 por dia, por utilizador)
-- ============================================================

CREATE OR REPLACE FUNCTION check_report_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM reports
  WHERE reporter_id = NEW.reporter_id
    AND criado_em > now() - interval '24 hours';

  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Limite de denúncias atingido por hoje. Tenta novamente amanhã.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_report_rate_limit ON reports;
CREATE TRIGGER trg_report_rate_limit
  BEFORE INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_report_rate_limit();
