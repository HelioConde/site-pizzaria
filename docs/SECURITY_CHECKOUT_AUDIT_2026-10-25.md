# Auditoria do pagamento e RLS — 25/10/2026

## Escopo e origem
Inspeção **somente leitura** das definições RLS, grants, índices e funções ativas do Supabase conectado `pizzaria-db`, além de inspeção do código do repositório. Nenhuma política, tabela, função ativa ou dado de produção foi alterado nesta análise. Este banco atende a outros projetos: **não executar mudanças globais de permissões sem revisão de impacto.**

Documentação oficial: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [segurança de views](https://supabase.com/docs/guides/database/views) e [segurança de funções](https://supabase.com/docs/guides/database/functions).

## Achados confirmados

| Prioridade | Área | Evidência verificada | Risco |
| --- | --- | --- | --- |
| P0 | `public.orders` | `anon` tem grants SELECT, INSERT e UPDATE; políticas `select_own_or_guest_orders` e `update_own_orders` admitem linhas `user_id IS NULL` | Pedidos de visitantes podem ficar acessíveis e alteráveis sem vínculo com um cliente específico |
| P0 | `public.order_items` | `anon` tem SELECT e INSERT; `select_order_items_policy` alcança pedidos com `user_id IS NULL` | Leitura de itens vinculados a pedidos de visitantes |
| P0 | `public.orders` | Políticas UPDATE para proprietários e entregadores não restringem colunas como `payment_status`, `total`, `delivery_fee` | Possibilidade de atualização indevida de campos de pagamento e valor, sujeita a demais condições RLS |
| P0 | Edge Function ativa `create-checkout-session` | Constrói `Stripe.price_data.unit_amount` a partir de `item.price` enviado pelo navegador; avisos de total divergente não abortam | O navegador pode determinar o preço cobrado pela Stripe |
| P0 | Edge Function ativa `confirm-checkout-session` | Monta `order_items.unit_price` a partir de `checkoutPayload.cartItems`, embora consulte a sessão Stripe paga | Confirmação de itens/valores não corresponde necessariamente ao que foi liquidado |
| P1 | Idempotência | Não foi encontrado índice UNIQUE sobre `orders.stripe_session_id` | Chamadas concorrentes podem criar duplicatas se ambas ocorrerem antes da consulta de existência |
| P1 | Atomicidade | `orders` e `order_items` são gravados em duas requisições distintas | Possibilidade de pedido pago parcialmente persistido |
| P2 | View `public.product_sales_summary` | Supabase Security Advisor acusou `security_definer_view` | View consulta dados com privilégios do dono em vez do invocador |

Estas verificações derivam de metadados, políticas e arquivos de funções; não foram executadas tentativas de acesso a dados reais de clientes ou cobranças.

## Melhorias preparadas no PR de segurança

- `_shared/checkoutPricing.mjs` computa subtotais, frete e total em centavos, limitando quantidades e itens e rejeitando divergência com os valores do cliente.
- `create-checkout-session/index.ts` candidato busca preços atuais e disponibilidade na tabela `products` com credencial de serviço **somente na função**, busca frete em `store_settings`, valida URLs de retorno, e cria itens Stripe com valores do servidor.
- `confirm-checkout-session/index.ts` candidato consulta os itens originais da sessão Stripe paga com `expand` e não usa `checkoutPayload` do navegador como autoridade de valores.
- Testes unitários puros com Node cobrem tentativas de alterar preço e frete, item inativo, entradas inválidas e limites.
- Mensagem de interface `Checkout seguro` foi removida até o fluxo efetivamente estar homologado.

**Estes dois arquivos de função são candidatos de revisão no repositório, não deployments.** O checkout ativo no Supabase continua com os problemas encontrados até ser implantada e testada uma solução conjunta.

## Plano obrigatório antes de produção

1. Criar ambiente Stripe **test mode** e Supabase isolado. Executar testes de criação, pagamento, recusa, retomada, atualizações de preço e invocações concorrentes sem valores reais.
2. Rever e implementar snapshot imutável de cada checkout no servidor (com sessão, cliente, itens, frete e status), em transação, associado ao ID Stripe e com índice UNIQUE de `stripe_session_id`. O candidato atual usa metadados Stripe como snapshot parcial; validar seus limites de tamanho e esquema.
3. Criar pedido e itens numa transação Postgres/RPC protegida, com verificação de duplicidade; implementar reconciliação caso um pedido já pago não seja gravado completamente.
4. Restringir grants UPDATE das tabelas públicas e substituir políticas permissivas de visitantes por acesso individual com token não previsível/consultas autorizadas por função. **Planejar nova forma de convidado recuperar seu pedido antes de revogar SELECT público.**
5. Restringir alteração de `payment_status`, `total`, `subtotal`, `delivery_fee` e `unit_price` à lógica server-side. Conferir autorização de admin/entregador em cada transição.
6. Validar `create-checkout-session`, `confirm-checkout-session` e `stripe-webhook` juntos e garantir assinatura de webhook, idempotência e autenticação adequada para acesso a pedidos.
7. Verificar `product_sales_summary` e migrar para `security_invoker` **somente após testar** as consultas públicas da home; alternativamente publicar resumo agregado deliberadamente público por função segura.
8. Rodar advisors de segurança, testes RLS que validem ambos allow/deny para `anon`/`authenticated`, lint, build, testes Playwright e monitoramento após deploy.

**Ponto de parada:** não implantar o candidato sem testes de integração e revisão das políticas; mudanças parciais podem provocar inconsistência de valores ou impedir convidados de finalizar pedidos.

## Recomendações adicionais

- Não usar credenciais `service_role` em Vite/React, nem salvar tokens secretos em código versionado.
- Manter credenciais Supabase dos clientes estritamente publishable/anon e aplicar RLS, sem presumir que a chave pública restringe acessos sozinha.
- Considerar mecanismos antiabuso e limitação de requisições para sessões Stripe de convidados.
