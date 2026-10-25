<!-- README do projeto Base Studio Pizzas -->
<div align="center">

# 🍕 Base Studio Pizzas

### Plataforma full-stack de delivery para pizzarias

**Do cardápio à entrega:** uma experiência web com jornadas próprias para clientes, administradores e entregadores.

[![Projeto concluído](https://img.shields.io/badge/STATUS-PROJETO%20CONCLU%C3%8DDO-16803c?style=for-the-badge)](https://github.com/HelioConde/site-pizzaria)
[![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**[🌐 Acessar demonstração](https://helioconde.github.io/site-pizzaria/)** · **[💻 Explorar código](https://github.com/HelioConde/site-pizzaria)** · **[👤 Meu portfólio](https://helioconde.github.io/portfolio2.0/)**

</div>

---

## ✨ Sobre o projeto

O **Base Studio Pizzas** é um projeto de portfólio **concluído em sua versão 1.0**, desenvolvido para representar o funcionamento de uma plataforma de delivery: descoberta de produtos, criação de pedidos, acompanhamento operacional e gerenciamento de entregas.

Em vez de apenas uma página de pizzaria, o sistema organiza as jornadas de **três perfis distintos**, combinando interface responsiva, autenticação, banco de dados, eventos em tempo real e geolocalização.

> **Concluído para portfólio ≠ serviço comercial homologado.** A implementação e sua proposta de demonstração estão finalizadas; uma operação real depende de infraestrutura, políticas de acesso, contas de pagamento, testes ponta a ponta, privacidade e configuração da loja.

## 🖼️ Visão da experiência

![Apresentação visual do cardápio digital](public/images/hero/hero1.png)

*Imagem de apresentação incluída no próprio projeto. [Abrir a demonstração](https://helioconde.github.io/site-pizzaria/) para explorar as páginas.*

## 🧩 Principais funcionalidades

| Experiência | O que foi desenvolvido |
| :--- | :--- |
| **🛒 Cliente** | Cardápio por categorias, busca, detalhes dos produtos, carrinho, checkout, endereço e acompanhamento de pedidos |
| **👤 Conta** | Autenticação, histórico de pedidos e gerenciamento de endereços |
| **📊 Administração** | Painel de operação, pedidos, produtos, categorias, clientes, entregadores, pagamentos, relatórios e configurações |
| **🛵 Entregador** | Painel de entregas, aceitação de pedidos, atualização de status e envio de localização mediante permissão |
| **🗺️ Rastreamento** | Visualização de mapa e rota com Leaflet/OpenStreetMap; atualizações de entrega integradas ao Supabase |
| **💳 Pagamentos** | Fluxos de checkout e páginas de retorno/validação de pagamento online; integração Stripe condicionada ao serviço seguro de checkout |

### Fluxo de um pedido

```text
Cliente escolhe produtos
         ↓
Carrinho e checkout
         ↓
Pedido registrado no Supabase
         ↓
Administração recebe e acompanha
         ↓
Preparação → atribuição/aceite do entregador
         ↓
Saída para entrega → rastreamento
         ↓
Entrega concluída e acompanhamento pelo cliente
```

As telas e os recursos específicos disponíveis dependem do **perfil autenticado**, dos dados e das permissões configurados no Supabase.

## 🧱 Tecnologias

| Camada | Stack |
| --- | --- |
| **Frontend** | React 19, JavaScript, Vite e React Router |
| **Estilização** | CSS Modules e Lucide React |
| **Backend** | Supabase Auth, PostgreSQL e Realtime |
| **Mapa e localização** | Leaflet, React Leaflet, OpenStreetMap e Geolocation API |
| **Rotas** | Edge Function de rotas com openrouteservice (requer configuração) |
| **Pagamento online** | Stripe e integração por função de backend (requer configuração) |
| **Qualidade** | ESLint e workflow GitHub Actions para Playwright |
| **Publicação web** | GitHub Pages |

## 🚀 Como executar localmente

**Pré-requisitos:** Node.js moderno (recomendado 22+) e npm; um projeto Supabase configurado com o esquema e as políticas necessárias.

```bash
git clone https://github.com/HelioConde/site-pizzaria.git
cd site-pizzaria
npm ci
```

Crie um arquivo `.env.local` na raiz:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Em seguida:

```bash
npm run dev
```

Abra o endereço informado pelo Vite no terminal (geralmente `http://localhost:5173`).

**Importante:** a aplicação exige as variáveis Supabase para inicializar. Além delas, recursos como pedidos, autenticação e Realtime precisam de tabelas, políticas RLS e dados previamente configurados. A integração de pagamento utiliza a função `create-checkout-session`; a função de rotas `get-delivery-route` utiliza `ORS_API_KEY` no ambiente servidor. Essas integrações não funcionam apenas com a instalação de dependências do frontend.

## 🧪 Verificações e build

```bash
npm run lint
npm run build
npm run preview
```

Há também um workflow em `.github/workflows/playwright.yml` para testes de navegador. **A presença do workflow não significa que a execução atual esteja aprovada**; confira os resultados em [Actions](https://github.com/HelioConde/site-pizzaria/actions).

O `vite.config.js` configura o prefixo `/site-pizzaria/` para o build de produção publicado no GitHub Pages. O comando `npm run deploy` envia o diretório `dist/` via `gh-pages`, exigindo autenticação apropriada.

## 📁 Organização

```text
src/
  pages/
    Menu/                 Cardápio e carrinho
    Checkout/             Finalização dos pedidos
    Auth/                 Login e autenticação
    Account/              Dados, endereços e histórico
    Admin/                Gestão da operação
    Motoboy/              Entregas e localização
    PaymentOnlineCheck/   Retorno do pagamento online
    PaymentSuccess/       Confirmação visual
  components/             Componentes e mapas reutilizáveis
  hooks/                  Estado da sessão e perfil
  lib/supabase.js         Cliente e configuração Supabase
public/images/            Recursos gráficos
supabase/functions/       Função de cálculo de rotas incluída
.github/workflows/        Testes automatizados
```

## 🔐 Privacidade e segurança

- Permissões de cliente, administração e entregador devem ser reforçadas **no banco e nas funções do servidor**, não apenas pelas rotas de interface.
- A chave `VITE_SUPABASE_ANON_KEY` é pública por natureza; **nunca** publique `service_role`, segredos Stripe ou `ORS_API_KEY` no frontend.
- A geolocalização requer permissão do usuário e deve ser tratada como dado sensível no contexto da operação.
- Perfis e pedidos da demonstração podem compartilhar um ambiente de testes. Evite usar informações pessoais reais.
- Integrações com pagamentos reais exigem configuração segura, confirmações no backend e validação antes de produção.

## ✅ Estado do projeto

**Versão 1.0 — projeto finalizado como entrega de portfólio.**

O escopo principal foi organizado em jornadas de cliente, administração e entregador. Extensões como notificações push, novos relatórios ou recursos comerciais adicionais são **evoluções opcionais**, não pendências para declarar a entrega original concluída.

A publicação e o funcionamento de serviços externos podem exigir manutenção ou configuração independente do fechamento do projeto.

---

<div align="center">

**Desenvolvido por [Hélio Conde](https://github.com/HelioConde)**

[Portfólio](https://helioconde.github.io/portfolio2.0/) · [LinkedIn](https://www.linkedin.com/in/helioconde/) · [Demonstração](https://helioconde.github.io/site-pizzaria/)

</div>
