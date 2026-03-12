import { PAYMENT_METHOD, PAYMENT_STATUS, ORDER_STATUS } from "./motoboy.constants";

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

export function getPaymentMethodLabel(method) {
  const normalized = String(method || "").trim().toLowerCase();

  switch (normalized) {
    case PAYMENT_METHOD.CASH:
      return "Dinheiro";
    case PAYMENT_METHOD.CARD_ON_DELIVERY:
      return "Cartão na entrega";
    case PAYMENT_METHOD.ONLINE:
      return "Pagamento online";
    default:
      return "Não informado";
  }
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

export function buildDeliveryAddress(order) {
  if (!order.delivery_address) return "Endereço não informado";

  const number = order.delivery_number || "s/n";
  const complement = order.delivery_complement
    ? `, ${order.delivery_complement}`
    : "";

  return `${order.delivery_address}, ${number}${complement}`;
}

export function buildFullDeliveryAddress(order) {
  const parts = [];

  if (order.delivery_address) {
    parts.push(order.delivery_address);
  }

  if (order.delivery_number) {
    parts.push(order.delivery_number);
  }

  if (order.delivery_district) {
    parts.push(order.delivery_district);
  }

  if (order.delivery_city) {
    parts.push(order.delivery_city);
  }

  if (order.delivery_state) {
    parts.push(order.delivery_state);
  }

  if (order.delivery_cep) {
    parts.push(order.delivery_cep);
  }

  return parts.filter(Boolean).join(", ");
}

export function normalizePhoneToDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function getWhatsAppUrl(phone) {
  const digits = normalizePhoneToDigits(phone);

  if (!digits) return null;

  const withCountryCode =
    digits.length >= 12 ? digits : `55${digits}`;

  return `https://wa.me/${withCountryCode}`;
}

export function getPhoneCallUrl(phone) {
  const digits = normalizePhoneToDigits(phone);

  if (!digits) return null;

  return `tel:${digits}`;
}

export function getGoogleMapsRouteUrl(order) {
  const fullAddress = buildFullDeliveryAddress(order);

  if (!fullAddress) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddress
  )}`;
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