export const USER_ROLE = {
  ADMIN: "admin",
};

export const ADMIN_SECTION = {
  DASHBOARD: "dashboard",
  ORDERS: "orders",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  CUSTOMERS: "customers",
  DELIVERY_USERS: "delivery_users",
  PAYMENTS: "payments",
  REPORTS: "reports",
  SETTINGS: "settings",
};

export const ADMIN_SECTIONS = [
  { key: ADMIN_SECTION.DASHBOARD, label: "Dashboard" },
  { key: ADMIN_SECTION.ORDERS, label: "Pedidos" },
  { key: ADMIN_SECTION.PRODUCTS, label: "Produtos" },
  { key: ADMIN_SECTION.CATEGORIES, label: "Categorias" },
  { key: ADMIN_SECTION.CUSTOMERS, label: "Clientes" },
  { key: ADMIN_SECTION.DELIVERY_USERS, label: "Motoboys" },
  { key: ADMIN_SECTION.PAYMENTS, label: "Pagamentos" },
  { key: ADMIN_SECTION.REPORTS, label: "Relatórios" },
  { key: ADMIN_SECTION.SETTINGS, label: "Configurações" },
];

export const PAYMENT_METHOD = {
  CASH: "dinheiro",
  CARD_ON_DELIVERY: "cartao_entrega",
  ONLINE: "pagamento_online",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  DELIVERY_PAYMENT: "delivery_payment",
  CANCELLED: "cancelled",
};

export const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  WAITING_COURIER: "waiting_courier",
  DELIVERY: "delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const STATUS_META = {
  [ORDER_STATUS.PENDING]: {
    value: ORDER_STATUS.PENDING,
    label: "Aguardando",
    filterLabel: "Aguardando",
    badgeClass: "statusBadgePending",
  },
  [ORDER_STATUS.PREPARING]: {
    value: ORDER_STATUS.PREPARING,
    label: "Em preparo",
    filterLabel: "Em preparo",
    badgeClass: "statusBadgePreparing",
  },
  [ORDER_STATUS.WAITING_COURIER]: {
    value: ORDER_STATUS.WAITING_COURIER,
    label: "Aguardando motoboy",
    filterLabel: "Aguardando motoboy",
    badgeClass: "statusBadgeWaitingCourier",
  },
  [ORDER_STATUS.DELIVERY]: {
    value: ORDER_STATUS.DELIVERY,
    label: "Saiu para entrega",
    filterLabel: "Saiu para entrega",
    badgeClass: "statusBadgeDelivery",
  },
  [ORDER_STATUS.DELIVERED]: {
    value: ORDER_STATUS.DELIVERED,
    label: "Entregue",
    filterLabel: "Entregues",
    badgeClass: "statusBadgeDelivered",
  },
  [ORDER_STATUS.CANCELLED]: {
    value: ORDER_STATUS.CANCELLED,
    label: "Cancelado",
    filterLabel: "Cancelados",
    badgeClass: "statusBadgeCanceled",
  },
};

export const ORDER_STATUS_OPTIONS = Object.values(STATUS_META);

export const FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  ...ORDER_STATUS_OPTIONS.map((status) => ({
    value: status.value,
    label: status.filterLabel,
  })),
];

export const PAYMENT_METHOD_META = {
  [PAYMENT_METHOD.CASH]: { label: "💵 Dinheiro" },
  [PAYMENT_METHOD.CARD_ON_DELIVERY]: { label: "💳 Cartão na entrega" },
  [PAYMENT_METHOD.ONLINE]: { label: "⚡ Pagamento online" },
};