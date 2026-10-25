# Base Studio Pizzas — Design System

## Princípios
- **Clareza antes de decoração:** título, benefício e ação principal devem ter prioridade.
- **Consistência:** utilizar tokens globais, CSS Modules para componentes e estados semânticos.
- **Acessibilidade:** teclado, contraste, labels, áreas de toque e preferência por movimento reduzido.
- **Responsividade:** projetar primeiro para 320–390 px, verificar 768 px e 1280 px.

## Foundations
Os tokens vivem em `src/styles/global.css`:
- Cores: `--bg`, `--surface`, `--text`, `--muted`, `--primary`, `--primary2`, `--line`.
- Espaçamento: `--space-1` (4 px), `--space-2` (8 px), `--space-3` (12 px), `--space-4` (16 px), `--space-6` (24 px), `--space-8` (32 px), `--space-12` (48 px).
- Container: `--content-max` (1120 px); bordas: `--radius`.
- Foco: `--focus-ring`; preservar o indicador de foco do navegador.

## Padrões
1. Cabeçalhos: um único H1 por tela; sequência lógica de H2 e H3.
2. Ação primária: uma por seção; secundária visualmente discreta.
3. Formulários: label visível, orientação de formato, erro descritivo e feedback após envio.
4. Estados: loading, vazio, erro, sucesso, disabled e foco devem ser tratados.
5. Imagens: alt significativo quando informativo; decorativas usam alt vazio.
6. Acesso por teclado: menus e diálogos devem fechar com Escape e devolver o foco ao gatilho.
7. Preferência `prefers-reduced-motion`: animações não essenciais devem parar.
8. Nunca publicar depoimentos fictícios como avaliações reais.

## Revisão de UI
Validar 320, 375, 768, 1024 e 1440 px; testar zoom 200%, tabulação, contraste e formulários. Registrar screenshots via Playwright e revisar mudanças visuais antes do merge.

## Limites
Estas diretrizes não substituem avaliação formal WCAG, nem homologação dos fluxos de pagamento, banco ou entrega.

## Catálogo — aplicação prática
- Grade fluida: desktop com colunas automáticas, mobile em 1–2 colunas conforme largura disponível.
- Imagens: container com proporção estável e `object-fit: contain`, sem cortes de ingredientes.
- Preços: hierarquia alta e vermelho de marca com contraste mais forte (`#b91c1c`).
- Carrinho flutuante: no mobile fica na área inferior e respeita `safe-area-inset-bottom`.
- Modais e drawers: altura máxima baseada em `dvh`, permitindo rolagem interna.
- A revisão visual é feita no CSS Modules existente, sem recriar componentes ou alterar integrações.

## Testes de regressão
O arquivo `tests/e2e/responsive.spec.js` verifica dimensões compactas, ausência de rolagem horizontal, focabilidade dos controles e capturas visuais.


## Página inicial — direção visual e implementação

Na rodada `improve/home-visual-accessibility-20261025`, a homepage recebeu um desenho editorial mais consistente, construído sobre os componentes existentes:

- **Hero:** imagem de referência do próprio projeto, quadro com gradiente quente, borda sutil, tipografia responsiva e hierarquia clara entre título, descrição e ações.
- **Como funciona:** sequência de três cartões com numeração visível, ícones, títulos objetivos e uma grade de três colunas no desktop que vira uma coluna a partir de 760 px.
- **Chamada final:** fundo bordô/vermelho profundo com texto de alto contraste e uma ação principal destacada.
- **Destaques:** uma promoção só recebe o rótulo quando o preço anterior é estritamente maior que o preço atual; não apresentar pseudo-desconto.
- **Carrossel:** controles anteriores/próximos, seleção direta de slides e botão permanente de pausa/retomada, todos acionáveis por teclado. Com `prefers-reduced-motion: reduce`, a rotação inicia pausada; o visitante pode retomá-la explicitamente.
- **Âncoras:** `#como-funciona` referencia conteúdo real e `#inicio` deve ser único no DOM.

### Critérios para Image to Code
Usar as imagens e capturas do próprio repositório como referência e implementá-las com elementos React e CSS Modules reais, sem imagens de interfaces falsas substituindo botões ou informações interativas. Evitar exagero de escala/corte que esconda os elementos importantes das capturas.

### Testes
Manter os testes de comportamento em `tests/e2e/smoke.spec.js` e capturas visuais responsivas da homepage em `tests/e2e/home-design.spec.js`. Conferir também área clicável e texto em 320, 375, 768 e 1440 px.

### Atenção comercial
A aparência e os testes visuais não homologam o fluxo financeiro. As alterações críticas de pagamento e RLS seguem isoladas no PR de segurança.


## Rodada de UI: navegação e destaque de produtos (25/10/2026)

### Tokens e consistência
- `--brand-deep`, `--surface-warm`, `--line-warm` e `--shadow-card`: referência para os cartões e o cabeçalho com tons quentes.
- Nenhuma transformação de `button:hover` deve ser aplicada globalmente: cada componente define seu próprio estado interativo.
- Evitar `will-change` permanente em planos de fundo fixos, que pode aumentar o uso de memória gráfica.

### Cabeçalho mobile
- Menu abre como painel acessível e move o foco para a primeira opção.
- `Tab` e `Shift+Tab` permanecem dentro do menu enquanto aberto; `Escape` fecha e devolve foco ao botão.
- O painel possui altura máxima baseada em `dvh` e rolagem interna; alvos interativos têm, no mínimo, 44 px.
- Cabeçalho e botão hambúrguer continuam disponíveis no desktop/mobile sem quebrar a largura da tela.

### Cards de destaque
- Estrutura React existente mantida, mas CSS Modules reescrito com proporções consistentes, imagens sem recorte, preço visível e rótulos claros.
- Um link visível para o cardápio completo aparece no cabeçalho.
- Produtos vendidos são ordenados primeiro por `totalSold`, com `sortOrder` como desempate; descontos aparecem apenas quando o preço anterior é maior que o atual.
- Estados de foco e `prefers-reduced-motion` previstos na estilização.

### QA
- `tests/e2e/nav-highlights.spec.js` contém casos para o menu mobile em 320/375/768 px e para a exibição de produtos simulados no destaque.
- Esses testes não substituem revisão visual humana das screenshots nem homologação das regras de negócio no Supabase.
