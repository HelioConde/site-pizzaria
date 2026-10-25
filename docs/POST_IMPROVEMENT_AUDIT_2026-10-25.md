# Auditoria após melhorias — 25/10/2026

## Base da análise
Revisão estática de `src/App.jsx`, `src/pages/Menu/Menu.jsx`, componentes do carrinho, `src/pages/Checkout/hooks/useCheckout.js`, `checkout.utils.js`, `CheckoutSummary.jsx`, `playwright.config.js` e workflow CI. Não houve execução de transações com uma base Supabase real nem pagamentos de produção.

## Melhorias nesta rodada
- Normalização única do carrinho em `src/lib/cart.js` (itens inválidos descartados, quantidade por item limitada, preço finito e não negativo, tamanho do armazenamento limitado).
- Cardápio e checkout usam as mesmas regras para itens persistidos. Esses limites são somente de robustez da interface e **não** garantem preços legítimos.
- Validação do campo de troco exige valor numérico finito.
- Páginas cliente, checkout, autenticação, administração e motoboy são carregadas por `React.lazy` conforme a rota, reduzindo o código necessário na entrada inicial.
- Ajuste do ciclo de vida dos callbacks de fechamento de modais para evitar escrita em refs durante renderização.
- Testes unitários e Playwright dedicados a integridade do carrinho.

## Nova avaliação, por prioridade

### P0 — Segurança comercial: preços recebidos do cliente
Em `useCheckout.js`, o total do pedido é calculado a partir de itens carregados do `localStorage`. Para pagamento na entrega, `createOrderInSupabase` envia diretamente `subtotal`, `delivery_fee`, `total` e `unit_price` para as tabelas `orders` e `order_items`. Para pagamento online, repassa esses valores ao endpoint `create-checkout-session`. **O frontend não é fonte confiável para preços**, mesmo após sanitizar NaN/negativos.

**Necessário no servidor:** buscar preços atuais por `product_id` em tabela protegida, validar ativo/estoque, calcular frete/total no servidor, bloquear escrita não autorizada nessas colunas com políticas RLS ou via RPC/Edge Function e verificar o pagamento por webhook idempotente. Como a configuração efetiva de RLS e a implementação da Edge Function não foram auditadas, este é um risco a verificar e não prova de exploração.

### P1 — Atomicidade de pedidos
O checkout cria `orders` e depois `order_items` em operações distintas, com exclusão compensatória em falha. Se a segunda gravação ou o rollback falhar, podem existir registros incompletos. Preferir transação Postgres dentro de função RPC protegida.

### P1 — Política comercial de pedidos de convidados
Os pedidos em modo convidado recebem `is_test_order: true` e o e-mail fixo `compra@sem.cadastro.com`. Confirmar se o sistema é apenas demonstração de portfólio ou aceita pedidos reais; não alterar essa regra sem definição de produto.

### P1 — Homologação do checkout e de papéis
Ainda faltam testes integrados em ambiente de teste para endereço, taxas de entrega, autorização Admin/Motoboy, alterações de preço, pagamentos recusados e webhooks. Os smoke tests existentes usam credenciais fictícias e não validam as tabelas de produção.

### P2 — Performance
O bundle inicial incluía telas do painel, checkout e mapa. A nova divisão por rota deve melhorar o download inicial; medir métricas Lighthouse/Web Vitals e tamanho de cada chunk depois de build. O aviso de chunk >500KB anteriormente observado é um dado anterior, não prova de que permaneceu após a melhoria.

### P2 — Garantia de qualidade
A suíte Playwright e os novos testes unitários verificam regressões específicas. Executar auditoria de contraste WCAG, teste de leitor de tela, rastreamento de erros em produção e lint completo antes de declarar homologação.

## Conclusão
A integridade dos dados exibidos pelo frontend e o carregamento inicial foram fortalecidos. **Não declarar checkout seguro para produção até validação de preço, RLS, atomicidade e pagamento no servidor.**
