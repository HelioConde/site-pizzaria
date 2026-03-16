import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS,
  STATUS_META,
} from "./admin.constants";

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatPrice(value) {
  return priceFormatter.format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "Data não informada";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data inválida"
    : dateFormatter.format(date);
}

export function getPaymentMethodLabel(method) {
  const normalized = String(method || "").toLowerCase();
  return PAYMENT_METHOD_META[normalized]?.label || "Não informado";
}

export function getPaymentStatusLabel(order) {
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();

  if (paymentStatus === PAYMENT_STATUS.PAID) {
    return "Pago";
  }

  if (paymentStatus === PAYMENT_STATUS.DELIVERY_PAYMENT) {
    return "Pagamento na entrega";
  }

  if (paymentStatus === PAYMENT_STATUS.CANCELLED) {
    return "Cancelado";
  }

  return "Pendente";
}

export function normalizeOrderStatus(order) {
  const raw = String(order.order_status || "").trim().toLowerCase();

  if (
    [
      "pending",
      "new",
      "novo",
      "confirmed",
      "confirmado",
      "awaiting",
      "aguardando",
    ].includes(raw)
  ) {
    return ORDER_STATUS.PENDING;
  }

  if (["preparing", "em_preparo", "preparo"].includes(raw)) {
    return ORDER_STATUS.PREPARING;
  }

  if (
    [
      "waiting_courier",
      "awaiting_courier",
      "aguardando_motoboy",
      "aguardando motoboy",
      "waiting_delivery",
    ].includes(raw)
  ) {
    return ORDER_STATUS.WAITING_COURIER;
  }

  if (["delivery", "out_for_delivery", "saiu_para_entrega"].includes(raw)) {
    return ORDER_STATUS.DELIVERY;
  }

  if (["delivered", "entregue"].includes(raw)) {
    return ORDER_STATUS.DELIVERED;
  }

  if (["cancelled", "canceled", "cancelado"].includes(raw)) {
    return ORDER_STATUS.CANCELLED;
  }

  return ORDER_STATUS.PENDING;
}

export function getOrderStatusLabel(status) {
  return STATUS_META[status]?.label || "Não definido";
}

export function isSameDay(dateA, dateB) {
  return (
    dateA.getDate() === dateB.getDate() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getFullYear() === dateB.getFullYear()
  );
}

export function buildDeliveryAddress(order) {
  if (!order.delivery_address) return "Endereço não informado";

  const number = order.delivery_number || "s/n";
  const complement = order.delivery_complement
    ? `, ${order.delivery_complement}`
    : "";

  return `${order.delivery_address}, ${number}${complement}`;
}

export function parseArrayLike(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .filter(Boolean)
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeRemovedIngredientsText(removedIngredients) {
  const items = parseArrayLike(removedIngredients);

  if (!items.length) return "";

  return items
    .map((item) => item.replace(/^sem\s+/i, "").trim())
    .filter(Boolean)
    .join(", ");
}

export function buildItemGroupKey(item) {
  const removedIngredients = normalizeRemovedIngredientsText(
    item.removed_ingredients
  );
  const notes = String(item.notes || "").trim();

  return [
    item.name || "",
    Number(item.unit_price || 0),
    removedIngredients,
    notes,
  ].join("|");
}

export function groupOrderItems(items) {
  if (!Array.isArray(items) || !items.length) return [];

  const grouped = items.reduce((acc, item) => {
    const key = buildItemGroupKey(item);
    const removedIngredients = normalizeRemovedIngredientsText(
      item.removed_ingredients
    );
    const notes = String(item.notes || "").trim();

    if (!acc[key]) {
      acc[key] = {
        id: key,
        name: item.name || "Item sem nome",
        quantity: 0,
        unitPrice: Number(item.unit_price || 0),
        removedIngredients,
        notes,
      };
    }

    acc[key].quantity += Number(item.quantity || 0);
    return acc;
  }, {});

  return Object.values(grouped);
}

export function canAdvanceOrder(order, nextStatus) {
  const paymentMethod = String(order.payment_method || "").trim().toLowerCase();
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();
  const currentStatus = String(order.normalized_status || "").trim().toLowerCase();

  const isOnlinePayment = paymentMethod === PAYMENT_METHOD.ONLINE;
  const isPaid = paymentStatus === PAYMENT_STATUS.PAID;

  if (currentStatus === ORDER_STATUS.CANCELLED) {
    return false;
  }

  if (
    currentStatus === ORDER_STATUS.DELIVERED &&
    nextStatus !== ORDER_STATUS.DELIVERED
  ) {
    return false;
  }

  if (nextStatus === ORDER_STATUS.CANCELLED) {
    return currentStatus !== ORDER_STATUS.DELIVERED;
  }

  if (
    isOnlinePayment &&
    !isPaid &&
    [
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.WAITING_COURIER,
      ORDER_STATUS.DELIVERY,
      ORDER_STATUS.DELIVERED,
    ].includes(nextStatus)
  ) {
    return false;
  }

  const allowedTransitions = {
    [ORDER_STATUS.PENDING]: [
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.PREPARING]: [
      ORDER_STATUS.WAITING_COURIER,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.WAITING_COURIER]: [
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.DELIVERY]: [
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CANCELLED,
    ],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export function isStatusButtonDisabled(order, optionValue, updatingOrderId) {
  const isActive = order.normalized_status === optionValue;
  const isUpdatingThisOrder = updatingOrderId === order.id;
  const isAllowed = canAdvanceOrder(order, optionValue);

  return isActive || isUpdatingThisOrder || !isAllowed;
}