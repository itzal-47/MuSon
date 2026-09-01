/*
# MuSon — Notificações reais + notificações de administração

## O bug encontrado
A tabela `notifications` e o ecrã que a lê (com subscrição em tempo real)
já existiam desde o Prompt 5, mas **nada em lado nenhum do código alguma
vez inseria uma linha nessa tabela** — nem ao seguir alguém, nem ao gostar,
nem ao comentar, nem ao publicar uma faixa nova. A interface estava pronta,
mas não havia produtor de notificações nenhum. Esta migration corrige isso
com triggers (mais robusto do que espalhar chamadas pelo código da app —
garante que funciona sempre, mesmo que uma ação seja feita fora da UI).

## Notificações sociais criadas
- Seguir alguém → notifica quem foi seguido
- Gostar de uma faixa → notifica o dono da faixa (exceto se gostar da própria)
- Comentar numa faixa → notifica o dono da faixa (exceto comentário próprio)
- Publicar faixa nova (sem agendamento) → notifica todos os seguidores do artista

Nota: faixas agendadas (`publicar_em` no futuro) não geram notificação no
momento da publicação — só quando ficarem realmente visíveis, o que exigiria
um processo agendado que ainda não existe. Fica como limitação conhecida.

## Notificações de administração
Novos tipos no enum: `admin_denuncia`, `admin_verificacao`, `admin_pagamento`,
`admin_suporte`. Sempre que surge uma denúncia nova, um pedido de
verificação, um pedido de pagamento pendente, ou um ticket de suporte,
TODOS os administradores recebem uma notificação (reaproveita a mesma
tabela e o mesmo tempo real que já existem — sem infraestrutura nova).
*/

ALTER TYPE notification_tipo_enum ADD VALUE IF NOT EXISTS 'admin_denuncia';
ALTER TYPE notification_tipo_enum ADD VALUE IF NOT EXISTS 'admin_verificacao';
ALTER TYPE notification_tipo_enum ADD VALUE IF NOT EXISTS 'admin_pagamento';
ALTER TYPE notification_tipo_enum ADD VALUE IF NOT EXISTS 'admin_suporte';
