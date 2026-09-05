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

## Notificações de administração
Novos tipos no enum: `admin_denuncia`, `admin_verificacao`, `admin_pagamento`,
`admin_suporte`. Sempre que surge uma denúncia nova, um pedido de
verificação, um pedido de pagamento pendente, ou um ticket de suporte,
TODOS os administradores recebem uma notificação (reaproveita a mesma
tabela e o mesmo tempo real que já existem — sem infraestrutura nova).

## Nota técnica importante
Os triggers que efetivamente criam as notificações ficam na migration
SEGUINTE (015) — o Postgres não deixa usar um valor de enum recém-criado
na MESMA transação em que foi adicionado.
*/

ALTER TYPE notification_tipo_enum ADD VALUE IF NOT EXISTS 'admin_denuncia';
ALTER TYPE notification_tipo_enum ADD VALUE IF NOT EXISTS 'admin_verificacao';
ALTER TYPE notification_tipo_enum ADD VALUE IF NOT EXISTS 'admin_pagamento';
ALTER TYPE notification_tipo_enum ADD VALUE IF NOT EXISTS 'admin_suporte';
