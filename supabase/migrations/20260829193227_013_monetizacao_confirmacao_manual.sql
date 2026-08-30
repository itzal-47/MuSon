/*
# MuSon — Monetização, Fase 1 (confirmação manual)

## Resumo
Sistema de subscrição Premium funcional desde já, sem depender de nenhum
gateway de pagamento automático (Multicaixa Express/AppyPay/IZI Pay virá
depois, quando o Itzal estiver aprovado por um intermediário). Por agora:
o utilizador escolhe um plano, o pedido fica "pendente", paga por
transferência/Multicaixa Express fora da app (seguindo as instruções que o
Itzal escrever no painel), e o Itzal confirma manualmente no painel quando
vir o dinheiro entrar — a confirmação liberta o Premium automaticamente.

## Tabelas novas
1. `subscription_plans` — os planos disponíveis (nome, preço em Kwanza,
   duração em dias). Editável no painel, tal como géneros/definições.
2. `payment_orders` — cada pedido de subscrição: quem, qual plano, estado
   (pendente/pago/cancelado), e uma referência opcional que o utilizador
   pode deixar (ex: últimos dígitos da transferência) para facilitar a
   tua confirmação.

## Configuração nova em platform_settings
- `premium_ativado` — interruptor geral: só quando ligado é que a opção de
  subscrever aparece na app. Fica desligado por default até estares pronto.
- `pagamento_instrucoes` — o texto que explica como pagar (referência
  Multicaixa Express, IBAN, o que quiseres) — editável sem código.

## Função
`confirm_payment_order(order_id)` — só administradores podem chamar; marca
o pedido como pago E estende profiles.premium_until na mesma operação
(reaproveitando a mesma lógica de soma de dias do grant_premium), tudo
registado em premium_grants e admin_logs para auditoria.
*/

-- ============================================================
-- SUBSCRIPTION_PLANS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           text NOT NULL,
  preco_kz       numeric NOT NULL,
  duracao_dias   integer NOT NULL,
  ativo          boolean NOT NULL DEFAULT true,
  posicao        integer NOT NULL DEFAULT 0,
  criado_em      timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_plans" ON subscription_plans;
CREATE POLICY "public_read_active_plans" ON subscription_plans FOR SELECT
  TO anon, authenticated USING (ativo = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_insert_plans" ON subscription_plans;
CREATE POLICY "admin_insert_plans" ON subscription_plans FOR INSERT
  TO authenticated WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_update_plans" ON subscription_plans;
CREATE POLICY "admin_update_plans" ON subscription_plans FOR UPDATE
  TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_delete_plans" ON subscription_plans;
CREATE POLICY "admin_delete_plans" ON subscription_plans FOR DELETE
  TO authenticated USING (is_admin(auth.uid()));

-- Planos iniciais sugeridos (o Itzal pode editar/apagar/adicionar no painel)
INSERT INTO subscription_plans (nome, preco_kz, duracao_dias, posicao)
SELECT * FROM (VALUES
  ('1 mês', 1500::numeric, 30, 0),
  ('3 meses', 4000::numeric, 90, 1),
  ('1 ano', 14000::numeric, 365, 2)
) AS v(nome, preco_kz, duracao_dias, posicao)
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans);

-- ============================================================
-- PAYMENT_ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plano_id           uuid NOT NULL REFERENCES subscription_plans(id),
  valor_kz           numeric NOT NULL,
  estado             text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'pago', 'cancelado')),
  referencia_utilizador text,
  criado_em          timestamptz DEFAULT now(),
  pago_em            timestamptz,
  confirmado_por     uuid REFERENCES profiles(id)
);

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_or_admin_orders" ON payment_orders;
CREATE POLICY "read_own_or_admin_orders" ON payment_orders FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "insert_own_order" ON payment_orders;
CREATE POLICY "insert_own_order" ON payment_orders FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_orders_estado ON payment_orders(estado);
CREATE INDEX IF NOT EXISTS idx_orders_user ON payment_orders(user_id);

-- ============================================================
-- CONFIGURAÇÕES NOVAS
-- ============================================================

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS premium_ativado boolean NOT NULL DEFAULT false;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS pagamento_instrucoes text DEFAULT 'Transfere o valor do plano para Multicaixa Express [o teu número aqui], depois volta aqui e confirma o pedido. Vamos validar e ativar o teu Premium em breve.';

-- ============================================================
-- CONFIRMAÇÃO DE PAGAMENTO (admin)
-- ============================================================

CREATE OR REPLACE FUNCTION confirm_payment_order(order_id uuid)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_dias integer;
  v_plano_nome text;
  novo_fim timestamptz;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem confirmar pagamentos.';
  END IF;

  SELECT po.user_id, sp.duracao_dias, sp.nome
    INTO v_user_id, v_dias, v_plano_nome
  FROM payment_orders po
  JOIN subscription_plans sp ON sp.id = po.plano_id
  WHERE po.id = order_id AND po.estado = 'pendente';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já foi processado.';
  END IF;

  UPDATE payment_orders
    SET estado = 'pago', pago_em = now(), confirmado_por = auth.uid()
    WHERE id = order_id;

  SELECT GREATEST(COALESCE(premium_until, now()), now()) + (v_dias || ' days')::interval
    INTO novo_fim FROM profiles WHERE id = v_user_id;

  UPDATE profiles SET premium_until = novo_fim WHERE id = v_user_id;

  INSERT INTO premium_grants (profile_id, granted_by, dias, motivo)
    VALUES (v_user_id, auth.uid(), v_dias, 'Pagamento confirmado — plano ' || v_plano_nome);

  INSERT INTO admin_logs (admin_id, acao, alvo_tipo, alvo_id, detalhes)
    VALUES (auth.uid(), 'confirmar_pagamento', 'payment_order', order_id, jsonb_build_object('plano', v_plano_nome, 'dias', v_dias));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_payment_order(order_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem cancelar pedidos.';
  END IF;
  UPDATE payment_orders SET estado = 'cancelado' WHERE id = order_id AND estado = 'pendente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION confirm_payment_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_payment_order(uuid) TO authenticated;
