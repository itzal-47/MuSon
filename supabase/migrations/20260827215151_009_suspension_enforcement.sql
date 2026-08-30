/*
# MuSon — Reforço da suspensão (bloqueio a nível de base de dados)

## Resumo
A suspensão introduzida na Fase A só impedia o uso normal pela interface
(a app deteta e termina a sessão). Isto acrescenta uma trava a mais: mesmo
que alguém suspenso tente contornar a app e chamar a API diretamente,
fica bloqueado de publicar faixas, comentar, gostar, seguir, ou criar
playlists — tudo o que representa "usar/interagir" na plataforma.

Deliberadamente NÃO bloqueia leitura/audição (ouvir música não prejudica
ninguém) nem denúncias (uma conta suspensa continuar a poder denunciar
abuso genuíno não é um problema).

## Como funciona
Um único trigger reutilizável, aplicado às tabelas de escrita relevantes.
Corre ANTES do INSERT e rejeita a operação se o autor estiver suspenso.
*/

CREATE OR REPLACE FUNCTION check_not_suspended()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND suspenso = true) THEN
    RAISE EXCEPTION 'A tua conta está suspensa. Não podes realizar esta ação.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_not_suspended_tracks ON tracks;
CREATE TRIGGER trg_not_suspended_tracks
  BEFORE INSERT ON tracks
  FOR EACH ROW EXECUTE FUNCTION check_not_suspended();

DROP TRIGGER IF EXISTS trg_not_suspended_comments ON track_comments;
CREATE TRIGGER trg_not_suspended_comments
  BEFORE INSERT ON track_comments
  FOR EACH ROW EXECUTE FUNCTION check_not_suspended();

DROP TRIGGER IF EXISTS trg_not_suspended_likes ON track_likes;
CREATE TRIGGER trg_not_suspended_likes
  BEFORE INSERT ON track_likes
  FOR EACH ROW EXECUTE FUNCTION check_not_suspended();

DROP TRIGGER IF EXISTS trg_not_suspended_follows ON follows;
CREATE TRIGGER trg_not_suspended_follows
  BEFORE INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION check_not_suspended();

DROP TRIGGER IF EXISTS trg_not_suspended_playlists ON playlists;
CREATE TRIGGER trg_not_suspended_playlists
  BEFORE INSERT ON playlists
  FOR EACH ROW EXECUTE FUNCTION check_not_suspended();

DROP TRIGGER IF EXISTS trg_not_suspended_playlist_tracks ON playlist_tracks;
CREATE TRIGGER trg_not_suspended_playlist_tracks
  BEFORE INSERT ON playlist_tracks
  FOR EACH ROW EXECUTE FUNCTION check_not_suspended();
