# 🍕 Base Studio Pizzas  
### Fullstack Delivery Platform

Plataforma completa de delivery para pizzarias modernas, com painel de **Cliente, Administrador e Motoboy**, incluindo rastreamento em tempo real via GPS.

Projeto desenvolvido como simulação de produto real de mercado, com foco em **arquitetura escalável, controle de permissões e experiência do usuário (UX)**.

---

## 🚀 Visão Geral

O Base Studio Pizzas simula um sistema completo de delivery, permitindo:

- 📱 Clientes realizarem pedidos e acompanharem o status
- 🛠️ Administradores gerenciarem pedidos e pagamentos
- 🛵 Motoboys visualizarem entregas e compartilharem localização em tempo real
- 📍 Rastreamento GPS ativo durante a entrega

Este projeto faz parte do ecossistema **Base Studio Digital**, demonstrando capacidade de desenvolvimento fullstack com arquitetura modular.

---

# 🧠 Funcionalidades

## 👤 Cliente

- Cadastro e Login
- Visualização do Cardápio
- Carrinho de Compras
- Finalização de Pedido
- Acompanhamento de Status
- Rastreamento da entrega em tempo real
- Confirmação de recebimento

---

## 🛠️ Administrador

- Login administrativo
- Visualização global de pedidos
- Alteração de status:
  - Aguardando pagamento
  - Pago
  - Em preparo
  - Saiu para entrega
  - Entregue
- Atribuição de motoboy
- Correção manual de status

---

## 🛵 Motoboy

- Login exclusivo
- Visualização de entregas atribuídas
- Acesso ao endereço e contato do cliente
- Botões:
  - "Saiu para entrega"
  - "Entregue"
- Compartilhamento de localização via GPS

---

# 📍 Rastreamento em Tempo Real

Implementado utilizando:

- Geolocation API
- Atualização periódica de coordenadas
- Leaflet + OpenStreetMap para exibição em mapa

🔐 O GPS é ativado apenas no status **"Saiu para entrega"**  
🛑 Desativado automaticamente ao marcar **"Entregue"**

---

# 🔐 Controle de Permissões (RBAC)

| Função                | Cliente | Admin | Motoboy |
|-----------------------|---------|--------|----------|
| Criar pedido          | ✅      | ❌     | ❌       |
| Alterar status        | ❌      | ✅     | Parcial  |
| Atribuir motoboy      | ❌      | ✅     | ❌       |
| Marcar entregue       | ❌      | ✅     | ✅       |
| Confirmar recebimento | ✅      | ❌     | ❌       |

---

# 🗂️ Arquitetura do Projeto

## 🎨 Frontend

- React
- Vite
- CSS Modules / TailwindCSS
- React Router
- Leaflet (Mapas)
- Arquitetura modular por componentes

## ⚙️ Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT Authentication

---

# 🗄️ Modelagem de Dados

## User

- id
- name
- email
- passwordHash
- role (client | admin | delivery)

## Product

- id
- name
- description
- basePrice
- sizes
- active

## Order

- id
- clientId
- items
- address
- paymentMethod
- paymentStatus
- status
- deliveryUserId
- timestamps

---

# 🏗️ Fluxo de Status do Pedido

1. Criado  
2. Aguardando pagamento  
3. Pago  
4. Em preparo  
5. Saiu para entrega  
6. Entregue  
7. Confirmado pelo cliente  

---

# 🎯 Diferenciais Técnicos

- Sistema com múltiplos níveis de acesso (RBAC)
- Rastreamento GPS em tempo real
- Separação clara Frontend / Backend
- Arquitetura preparada para escalar
- Simulação de fluxo real de delivery
- Estrutura de produto SaaS

---

# 📦 Roadmap (Melhorias Futuras)

- Integração com pagamento real (Stripe / Mercado Pago)
- WebSocket para atualização instantânea
- Notificações push
- Histórico de localização
- Sistema de avaliações
- Dashboard com métricas de venda

---

# 🧪 Objetivo Profissional

Este projeto demonstra:

- Organização de código
- Arquitetura fullstack
- Pensamento de produto
- Controle de permissões
- Modelagem de dados
- UX aplicada a sistema real

---

# 👨‍💻 Autor

**Hélio Conde**  
Desenvolvedor Front-End focado em aplicações interativas e sistemas reais.  
Base Studio Digital