export const CART_STORAGE_KEY = "base-studio-pizzas-cart";
export const GUEST_TEST_EMAIL = "compra@sem.cadastro.com";
export const DEFAULT_DELIVERY_FEE = 6.9;

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
  DELIVERY: "delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const initialDeliveryForm = {
  name: "",
  phone: "",
  cep: "",
  address: "",
  district: "",
  city: "",
  state: "",
  number: "",
  complement: "",
  reference: "",
  paymentMethod: "",
  needsChange: false,
  changeFor: "",
};