/*
# MuSon — Triggers de criação de notificações

## Importante — porque está separado da migration 014
Os novos valores do enum (`admin_denuncia`, etc.) foram criados na
migration anterior. O Postgres não deixa usar um valor de enum recém-criado
na MESMA transação em que foi adicionado — por isso os triggers que os
usam ficam aqui, numa migration à parte, a correr depois de os valores já
estarem confirmados.

## O que este ficheiro cria
Um trigger por tabela relevante (follows, track_likes, track_comments,
tracks, reports, verification_requests, payment_orders, support_tickets),
cada um a inserir a notificação certa assim que a linha correspondente é
criada. Tudo com SECURITY DEFINER, porque quem despoleta a ação (ex: quem
segue alguém) não tem, nem deve ter, permissão para escrever notificações
para OUTRA pessoa diretamente — só o trigger, de forma controlada, o faz.
*/

-- ============================================================
-- Notificações sociais
-- ============================================================

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, tipo, referencia_id)
  VALUES (NEW.following_id, 'novo_seguidor', NEW.follower_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON follows;
CREATE TRIGGER trg_notify_new_follower
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

CREATE OR REPLACE FUNCTION notify_new_like()
RETURNS TRIGGER AS $$
DECLARE
  v_artist_id uuid;
BEGIN
  SELECT artist_id INTO v_artist_id FROM tracks WHERE id = NEW.track_id;
  IF v_artist_id IS NOT NULL AND v_artist_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, tipo, referencia_id)
    VALUES (v_artist_id, 'gosto', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_like ON track_likes;
CREATE TRIGGER trg_notify_new_like
  AFTER INSERT ON track_likes
  FOR EACH ROW EXECUTE FUNCTION notify_new_like();

CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_artist_id uuid;
BEGIN
  SELECT artist_id INTO v_artist_id FROM tracks WHERE id = NEW.track_id;
  IF v_artist_id IS NOT NULL AND v_artist_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, tipo, referencia_id, referencia_texto)
    VALUES (v_artist_id, 'comentario', NEW.user_id, LEFT(NEW.texto, 80));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_comment ON track_comments;
CREATE TRIGGER trg_notify_new_comment
  AFTER INSERT ON track_comments
  FOR EACH ROW EXECUTE FUNCTION notify_new_comment();

-- Publicação de faixa nova (só quando não é agendada — ver nota na migration anterior)
CREATE OR REPLACE FUNCTION notify_new_track()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.publicada = true AND NEW.publicar_em IS NULL THEN
    INSERT INTO notifications (user_id, tipo, referencia_id, referencia_texto)
    SELECT follower_id, 'nova_faixa', NEW.id, NEW.titulo
    FROM follows WHERE following_id = NEW.artist_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_track ON tracks;
CREATE TRIGGER trg_notify_new_track
  AFTER INSERT ON tracks
  FOR EACH ROW EXECUTE FUNCTION notify_new_track();

-- ============================================================
-- Notificações de administração
-- ============================================================

CREATE OR REPLACE FUNCTION notify_admins(p_tipo notification_tipo_enum, p_referencia_id uuid, p_referencia_texto text)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, tipo, referencia_id, referencia_texto)
  SELECT user_id, p_tipo, p_referencia_id, p_referencia_texto FROM admins;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_admins_new_report()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins('admin_denuncia', NEW.id, LEFT(NEW.motivo, 80));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_report ON reports;
CREATE TRIGGER trg_notify_admins_report
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION notify_admins_new_report();

CREATE OR REPLACE FUNCTION notify_admins_new_verification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins('admin_verificacao', NEW.id, LEFT(NEW.mensagem, 80));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_verification ON verification_requests;
CREATE TRIGGER trg_notify_admins_verification
  AFTER INSERT ON verification_requests
  FOR EACH ROW EXECUTE FUNCTION notify_admins_new_verification();

CREATE OR REPLACE FUNCTION notify_admins_new_payment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins('admin_pagamento', NEW.id, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_payment ON payment_orders;
CREATE TRIGGER trg_notify_admins_payment
  AFTER INSERT ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION notify_admins_new_payment();

CREATE OR REPLACE FUNCTION notify_admins_new_ticket()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins('admin_suporte', NEW.id, LEFT(NEW.assunto, 80));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_ticket ON support_tickets;
CREATE TRIGGER trg_notify_admins_ticket
  AFTER INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION notify_admins_new_ticket();
