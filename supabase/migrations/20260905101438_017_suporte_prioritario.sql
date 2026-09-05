/*
# MuSon — Suporte prioritário para Premium

## Porquê
A página do Premium prometia "sem limites de utilização" — mas nunca
existiu nenhum limite para quem não é premium, por isso essa promessa não
significava nada de verdade. Esta migration substitui-a por um benefício
real: tickets de suporte de utilizadores Premium aparecem sempre no topo
da lista do painel de administração, para seres tu a decidir dar-lhes
prioridade real.

## Como funciona
`support_tickets` ganha uma coluna `prioritario`, calculada por um trigger
no momento da criação do ticket — nunca pelo cliente (para não poder ser
forjada). O trigger verifica se `profiles.premium_until` do autor ainda
está no futuro nesse preciso instante.
*/

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS prioritario boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION set_ticket_priority()
RETURNS TRIGGER AS $$
BEGIN
  NEW.prioritario := EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.user_id AND premium_until IS NOT NULL AND premium_until > now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_ticket_priority ON support_tickets;
CREATE TRIGGER trg_set_ticket_priority
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_priority();
