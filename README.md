## 🍕 Base Studio Pizzas  
### Plataforma Fullstack de Delivery

## 🚧 Projeto em Desenvolvimento

⚠️ Este projeto ainda está em desenvolvimento e novas funcionalidades estão sendo implementadas continuamente.

Algumas funcionalidades podem estar incompletas ou em fase de testes.  
O objetivo deste projeto é simular um **sistema real de delivery**, evoluindo gradualmente com melhorias de arquitetura, experiência do usuário e novas funcionalidades.

Sugestões e feedbacks são bem-vindos.

Plataforma completa de delivery para pizzarias modernas, com painel de **Cliente, Administrador e Motoboy**, incluindo **rastreamento em tempo real via GPS**.

Projeto desenvolvido como simulação de produto real de mercado, com foco em **arquitetura escalável, controle de permissões e experiência do usuário (UX)**.

---

## 🚀 Visão Geral

O **Base Studio Pizzas** simula um sistema completo de delivery, permitindo:

- 📱 Clientes realizarem pedidos online
- 📦 Acompanhamento do status do pedido
- 🛠️ Administradores gerenciarem pedidos
- 🛵 Motoboys aceitarem entregas
- 📍 Rastreamento da entrega em tempo real via GPS

Este projeto demonstra a construção de uma **aplicação real de mercado**, com diferentes perfis de usuários e fluxo completo de entrega.

---

## 🧰 Tecnologias Utilizadas

Frontend  
React • Vite • React Router

Backend (BaaS)  
Supabase • PostgreSQL

Mapas e Rastreamento  
Leaflet • OpenStreetMap

Pagamentos  
Stripe

Deploy  
GitHub Pages

---

## 🧠 Funcionalidades

### 👤 Cliente

- Cadastro e login
- Visualização do cardápio
- Carrinho de compras
- Finalização de pedido
- Acompanhamento do status do pedido
- Rastreamento da entrega em tempo real
- Confirmação de recebimento

---

### 🛠️ Administrador

- Login administrativo
- Visualização global de pedidos
- Alteração de status do pedido
- Atribuição de motoboy
- Correção manual de status
- Controle de fluxo da entrega

Status possíveis:

- Aguardando pagamento  
- Pago  
- Em preparo  
- Aguardando motoboy  
- Saiu para entrega  
- Entregue  

---

### 🛵 Motoboy

- Login exclusivo
- Visualização de pedidos disponíveis
- Aceitar entregas
- Acesso ao endereço do cliente
- Botões de ação:
  - **Aceitar entrega**
  - **Saiu para entrega**
  - **Entregue**
- Compartilhamento de localização em tempo real

---

## 📍 Rastreamento em Tempo Real

O sistema permite acompanhar o motoboy durante a entrega.

Tecnologias utilizadas:

- **Geolocation API**
- **Leaflet**
- **OpenStreetMap**
- **Supabase Realtime**

Regras de funcionamento:

- 📍 GPS ativado quando o motoboy marca **"Saiu para entrega"**
- 🛑 GPS desativado automaticamente quando o pedido é marcado **"Entregue"**

---

## 🔐 Controle de Permissões (RBAC)

| Ação | Cliente | Admin | Motoboy |
|-----|------|------|------|
Criar pedido | ✅ | ❌ | ❌ |
Alterar status | ❌ | ✅ | Parcial |
Atribuir motoboy | ❌ | ✅ | ❌ |
Aceitar entrega | ❌ | ❌ | ✅ |
Marcar entregue | ❌ | ✅ | ✅ |
Confirmar recebimento | ✅ | ❌ | ❌ |

---

## 🗂️ Arquitetura do Projeto

### 🎨 Frontend

- React
- Vite
- React Router
- CSS Modules
- Leaflet (Mapas)

Arquitetura baseada em **componentes reutilizáveis e separação de responsabilidades**.

---

### ⚙️ Backend (BaaS)

O projeto utiliza **Supabase** como backend.

Tecnologias:

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Realtime

Essa arquitetura permite:

- autenticação integrada
- banco de dados escalável
- atualizações em tempo real
- simplificação da infraestrutura backend

---

## 🗄️ Modelagem de Dados (Resumo)

### Users

- id
- email
- role (client | admin | delivery)

### Products

- id
- name
- price
- description
- active

### Orders

- id
- user_id
- items
- delivery_address
- payment_method
- payment_status
- order_status
- delivery_user_id
- created_at

---

## 🏗️ Fluxo de Status do Pedido

1️⃣ Criado  
2️⃣ Aguardando pagamento  
3️⃣ Pago  
4️⃣ Em preparo  
5️⃣ Aguardando entregador  
6️⃣ Saiu para entrega  
7️⃣ Entregue  
8️⃣ Confirmado pelo cliente  

---

## 🎯 Diferenciais Técnicos

- Sistema com **múltiplos níveis de acesso (RBAC)**
- **Rastreamento GPS em tempo real**
- Integração com **Supabase**
- Arquitetura modular
- Simulação de produto SaaS
- Fluxo completo de delivery

---

## 📦 Roadmap (Melhorias Futuras)

- Integração com pagamento real (**Stripe**)
- WebSockets para atualização instantânea
- Notificações push
- Histórico de localização
- Sistema de avaliações
- Dashboard administrativo com métricas

---

## 🧪 Objetivo Profissional

Este projeto demonstra:

- Arquitetura de aplicações modernas
- Integração frontend + backend
- Modelagem de dados
- Controle de permissões
- Rastreamento em tempo real
- Desenvolvimento de produto real

---

## 🌐 Demo Online

A aplicação está disponível online:

🔗 https://helioconde.github.io/site-pizzaria/

---

## 🔑 Usuários para Teste

Você pode testar os diferentes perfis do sistema utilizando os seguintes usuários.

### 👤 Cliente

Email: teste@teste.com  
Senha: 12345678  

---

### 🛠️ Administrador

Email: admin@admin.com  
Senha: 12345678  

---

### 🛵 Motoboy

Email: motoboy@motoboy.com  
Senha: 12345678  

---

⚠️ Observação

Este projeto é uma simulação de sistema real de delivery.  
Durante os testes, outros usuários podem alterar o status dos pedidos.

## 👨‍💻 Autor

**Hélio Conde**

Desenvolvedor Front-End focado em **aplicações modernas, interativas e sistemas reais**.

🔗 Linkedin  
https://www.linkedin.com/in/helioconde/