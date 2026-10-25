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
