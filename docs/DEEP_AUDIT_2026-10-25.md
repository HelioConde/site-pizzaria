# Auditoria aprofundada — 25/10/2026

## Escopo e constatações verificadas
Inspeção de código: Menu, componentes de carrinho e personalização, Checkout, ProtectedRoute, Playwright e configuração de roteamento.

### Corrigido neste PR
1. Carrinho antes permanecia no DOM com `aria-hidden` quando fechado, incluindo elementos interativos. Agora é desmontado quando fechado.
2. Carrinho e modal de produto não gerenciavam ciclo de foco para teclado. Foi incluída navegação contida por Tab/Shift+Tab, fechamento com Escape e devolução do foco.
3. Atualizações de estado do carrinho não devem recriar o efeito de foco por mudança na identidade do callback.
4. Testes automatizados cobrem abertura/fechamento e navegação básica por teclado no carrinho.

### Riscos ainda a validar (não homologados)
- **P0 comercial:** pedidos e cobranças reais precisam de confirmação no backend e verificação de políticas RLS; testes de UI não certificam pagamentos ou regras de acesso.
- **P1:** checkout precisa de cenários ponta a ponta com ambiente Supabase de testes: endereço válido/inválido, geolocalização negada, taxa de entrega, estoque/preço alterado e pagamento recusado.
- **P1:** histórico e mudanças de pedidos por diferentes papéis precisam de testes de autorização no servidor.
- **P2:** o build Vite anteriormente exibiu aviso de chunk >500KB; investigar code splitting por rotas e carregamento de mapa.
- **P2:** dependência `@playwright/test` é instalada com `--no-save` no Actions, mas não faz parte do manifesto do projeto; fixar versão no lockfile em rodada dedicada.
- **P2:** avaliação com axe-core/WCAG e contraste cromático ainda não executada.
- **P2:** site publicado no GitHub Pages não foi inspecionado visualmente nesta auditoria.

## Recomendação de aceitação
Exigir GitHub Actions verde, teste manual mobile do drawer, e ambiente isolado para testes reais de pedido. Não interpretar smoke tests com URL Supabase fictícia como homologação de backend.
