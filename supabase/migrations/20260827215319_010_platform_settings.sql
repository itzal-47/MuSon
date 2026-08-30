/*
# MuSon — Configurações da Plataforma sem Código (Fase B)

## Resumo
Uma única tabela `platform_settings`, com garantia de ter sempre EXATAMENTE
UMA linha (truque do Postgres: chave primária boolean com CHECK id = true).
É aqui que passam a viver: modo de manutenção, banner global, interruptores
de funcionalidades, limites de spam ajustáveis, Termos de Uso, Política de
Privacidade, e a lista de géneros musicais.

## Porque interessa
Antes desta migration, tudo isto estava escrito diretamente no código
(AboutScreen.tsx, GENEROS no database.ts, os números 10 e 20 nos triggers
do Grupo 1). Agora fica editável pelo painel de administração, sem
precisares de mim nem de um deploy novo — só muda a base de dados.

## RLS
- Leitura: pública (anon + authenticated) — o modo de manutenção e o
  banner têm de ser lidos mesmo por quem não tem conta.
- Escrita: apenas administradores.

## Efeitos noutras tabelas
Os triggers de limite de taxa criados no Grupo 1 (migration 006) são
substituídos por versões que leem o limite de `platform_settings` em vez
de teres o número fixo no código SQL.
*/

-- ============================================================
-- TABELA (linha única garantida)
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id                                boolean PRIMARY KEY DEFAULT true CHECK (id),

  manutencao_ativa                  boolean NOT NULL DEFAULT false,
  manutencao_mensagem               text DEFAULT 'O MuSon está em manutenção. Voltamos já.',

  banner_ativo                      boolean NOT NULL DEFAULT false,
  banner_mensagem                   text,
  banner_nivel                      text NOT NULL DEFAULT 'info' CHECK (banner_nivel IN ('info', 'aviso', 'urgente')),
  banner_expira_em                  timestamptz,

  uploads_ativados                  boolean NOT NULL DEFAULT true,
  comentarios_ativados              boolean NOT NULL DEFAULT true,
  registos_ativados                 boolean NOT NULL DEFAULT true,
  playlists_colaborativas_ativadas  boolean NOT NULL DEFAULT true,

  rate_limit_faixas_por_hora        integer NOT NULL DEFAULT 10,
  rate_limit_denuncias_por_dia      integer NOT NULL DEFAULT 20,

  termos_uso                        text,
  politica_privacidade              text,

  generos                           text[] NOT NULL DEFAULT ARRAY['Kuduro','Semba','Kizomba','Afro-house','Tarraxo','Afrobeats','Hip-hop','Gospel','Outro'],

  atualizado_em                     timestamptz DEFAULT now(),
  atualizado_por                    uuid REFERENCES profiles(id)
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_platform_settings" ON platform_settings;
CREATE POLICY "public_read_platform_settings" ON platform_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_platform_settings" ON platform_settings;
CREATE POLICY "admin_update_platform_settings" ON platform_settings FOR UPDATE
  TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ============================================================
-- SEED — garante que a linha única existe, com os textos atuais
-- (os mesmos que já estavam escritos no código, para não haver
-- nenhuma regressão de conteúdo ao mudar a fonte)
-- ============================================================

INSERT INTO platform_settings (id, termos_uso, politica_privacidade)
VALUES (
  true,
  $tou$**1. Aceitação dos termos**
Ao criar uma conta ou utilizar o MuSon, aceitas estes Termos de Uso na totalidade. Se não concordares, não deves utilizar a plataforma.

**2. Descrição do serviço**
O MuSon é uma plataforma de streaming de música focada em artistas e produtores angolanos e lusófonos. Permite ouvir, descobrir, publicar e partilhar música, criar playlists, seguir artistas e interagir com outros utilizadores.

**3. Contas de utilizador**
Precisas de fornecer um email válido e escolher uma senha para criar conta. És responsável por manter a tua senha em segurança e por toda a atividade realizada na tua conta. Deves ter pelo menos 13 anos para criar conta no MuSon. Podes escolher entre perfil de Ouvinte, Artista ou Produtor — o tipo de perfil pode ser alterado ou revisto no futuro.

**4. Conteúdo publicado por artistas e produtores**
Se publicares faixas, capas, videoclipes ou outro conteúdo, declaras que és o titular dos direitos desse conteúdo (ou tens autorização para o publicar). É proibido publicar música que uses instrumentais, amostras ("samples") ou gravações de terceiros sem autorização. O MuSon pode remover conteúdo que viole direitos de autor ou estas regras, mediante denúncia ou verificação interna, sem aviso prévio quando a situação o justificar.

**5. Selo de verificação**
Artistas e produtores podem pedir um selo de verificação, submetendo informação e provas de identidade (ex: redes sociais, outras plataformas). A atribuição do selo é uma decisão da equipa do MuSon e não constitui garantia legal de identidade — serve apenas como indicador de confiança para os ouvintes.

**6. Regras de conduta**
É proibido: assediar ou ameaçar outros utilizadores; publicar conteúdo ilegal, discriminatório ou que incite ao ódio ou à violência; criar contas falsas ou fazer-se passar por outra pessoa; usar bots, scripts ou automação para manipular reproduções, gostos ou seguidores; tentar contornar os limites técnicos da plataforma (ex: publicação em massa, denúncias em massa).

**7. Denúncias e moderação**
Podes denunciar conteúdo ou comportamento que viole estas regras. As denúncias são revistas pela equipa de administração do MuSon, que pode remover conteúdo, suspender ou encerrar contas em caso de violação repetida ou grave.

**8. Propriedade intelectual da plataforma**
O nome "MuSon", o logótipo e o design da plataforma são propriedade do MuSon. O conteúdo publicado por artistas e produtores continua a pertencer a quem o publicou — o MuSon não reivindica propriedade sobre a tua música.

**9. Disponibilidade do serviço**
O MuSon está em desenvolvimento ativo e pode ser interrompido, alterado ou descontinuado, no todo ou em parte, a qualquer momento. Fazemos o possível para avisar com antecedência sempre que praticável.

**10. Limitação de responsabilidade**
O MuSon é disponibilizado "tal como está". Na máxima medida permitida por lei, não nos responsabilizamos por perdas resultantes da utilização ou impossibilidade de utilização da plataforma, incluindo perda de conteúdo, dados ou receita.

**11. Encerramento de conta**
Podes encerrar a tua conta a qualquer momento nas Definições. Podemos suspender ou encerrar contas que violem estes termos, com aviso sempre que a situação o permitir.

**12. Lei aplicável**
Estes termos são regidos pela lei angolana, sem prejuízo de direitos de proteção ao consumidor aplicáveis no país de residência do utilizador.

**13. Alterações a estes termos**
Podemos atualizar estes Termos de Uso à medida que a plataforma evolui. Alterações significativas serão comunicadas dentro da aplicação.$tou$,
  $priv$**1. Quem trata os teus dados**
O MuSon é responsável pelo tratamento dos dados recolhidos através da plataforma. Usamos o Supabase como infraestrutura de base de dados e autenticação — os teus dados ficam armazenados nos servidores do Supabase, sujeitos às medidas de segurança dessa infraestrutura.

**2. Dados que recolhemos**
Dados de conta: email, senha (encriptada, nunca visível a nós), username, nome apresentado.
Dados de perfil (opcionais): foto, bio, província, géneros musicais, redes sociais.
Dados de utilização: faixas ouvidas e histórico, gostos, playlists, seguidores, comentários, streak de audição.
Dados técnicos guardados no teu dispositivo: fila de reprodução, preferência de poupança de dados, e cache temporário de áudio para audição offline (até 3 dias, apagado automaticamente).

**3. Como usamos os dados**
Para: criar e gerir a tua conta; guardar as tuas playlists, gostos e histórico; mostrar-te recomendações e conteúdo relevante (ex: rádio por província, artistas semelhantes); calcular estatísticas para artistas e produtores sobre as suas próprias faixas; moderar conteúdo e responder a denúncias.

**4. Partilha de dados**
Não vendemos os teus dados pessoais. Alguns dados do teu perfil público (nome, foto, bio, faixas publicadas, número de seguidores) são visíveis a qualquer pessoa que use o MuSon, por serem essenciais ao funcionamento de uma plataforma de música. Dados de estatísticas (ex: província de quem ouve) só são mostrados de forma agregada ao artista dono da faixa, nunca identificando ouvintes individuais.

**5. Segurança**
Usamos controlo de acesso ao nível da base de dados (Row Level Security) para garantir que cada utilizador só acede aos dados que lhe pertencem ou que são públicos. As senhas nunca são guardadas em texto simples.

**6. Os teus direitos**
Podes aceder, corrigir ou eliminar os teus dados a qualquer momento a partir das Definições da tua conta. Ao eliminar a conta, os teus dados pessoais são removidos, com exceção de informação que sejamos legalmente obrigados a reter.

**7. Retenção de dados**
Mantemos os teus dados enquanto a conta estiver ativa. O cache de áudio offline no teu dispositivo expira automaticamente ao fim de 3 dias, independentemente da tua conta.

**8. Menores de idade**
O MuSon não é destinado a crianças com menos de 13 anos. Não recolhemos intencionalmente dados de crianças abaixo dessa idade.

**9. Alterações a esta política**
Podemos atualizar esta política à medida que a plataforma evolui, especialmente ao introduzir funcionalidades de pagamento. Alterações significativas serão comunicadas dentro da aplicação.

**10. Contacto**
Para questões sobre os teus dados, contacta-nos através da secção "Contacto e suporte".$priv$
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LIMITES DE TAXA — passam a ler de platform_settings
-- ============================================================

CREATE OR REPLACE FUNCTION check_track_upload_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count integer;
  max_permitido integer;
BEGIN
  SELECT rate_limit_faixas_por_hora INTO max_permitido FROM platform_settings WHERE id = true;
  IF max_permitido IS NULL THEN max_permitido := 10; END IF;

  SELECT COUNT(*) INTO recent_count
  FROM tracks
  WHERE artist_id = NEW.artist_id
    AND criado_em > now() - interval '1 hour';

  IF recent_count >= max_permitido THEN
    RAISE EXCEPTION 'Limite de publicações atingido. Podes publicar até % faixas por hora — tenta novamente daqui a pouco.', max_permitido;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_report_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count integer;
  max_permitido integer;
BEGIN
  SELECT rate_limit_denuncias_por_dia INTO max_permitido FROM platform_settings WHERE id = true;
  IF max_permitido IS NULL THEN max_permitido := 20; END IF;

  SELECT COUNT(*) INTO recent_count
  FROM reports
  WHERE reporter_id = NEW.reporter_id
    AND criado_em > now() - interval '24 hours';

  IF recent_count >= max_permitido THEN
    RAISE EXCEPTION 'Limite de denúncias atingido por hoje. Tenta novamente amanhã.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Impedir registos quando desativados (verificado no signUp)
-- ============================================================

CREATE OR REPLACE FUNCTION check_registrations_enabled()
RETURNS TRIGGER AS $$
DECLARE
  ativos boolean;
BEGIN
  SELECT registos_ativados INTO ativos FROM platform_settings WHERE id = true;
  IF ativos IS FALSE THEN
    RAISE EXCEPTION 'Os registos estão temporariamente desativados. Tenta novamente mais tarde.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_registrations_enabled ON profiles;
CREATE TRIGGER trg_registrations_enabled
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_registrations_enabled();

-- ============================================================
-- Impedir uploads/comentários quando o interruptor está desligado
-- ============================================================

CREATE OR REPLACE FUNCTION check_uploads_enabled()
RETURNS TRIGGER AS $$
DECLARE
  ativos boolean;
BEGIN
  SELECT uploads_ativados INTO ativos FROM platform_settings WHERE id = true;
  IF ativos IS FALSE THEN
    RAISE EXCEPTION 'A publicação de faixas está temporariamente desativada.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_uploads_enabled ON tracks;
CREATE TRIGGER trg_uploads_enabled
  BEFORE INSERT ON tracks
  FOR EACH ROW
  EXECUTE FUNCTION check_uploads_enabled();

CREATE OR REPLACE FUNCTION check_comments_enabled()
RETURNS TRIGGER AS $$
DECLARE
  ativos boolean;
BEGIN
  SELECT comentarios_ativados INTO ativos FROM platform_settings WHERE id = true;
  IF ativos IS FALSE THEN
    RAISE EXCEPTION 'Os comentários estão temporariamente desativados.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_comments_enabled ON track_comments;
CREATE TRIGGER trg_comments_enabled
  BEFORE INSERT ON track_comments
  FOR EACH ROW
  EXECUTE FUNCTION check_comments_enabled();
