import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import styles from "./Admin.module.css";

const PAYMENT_METHOD = {
  CASH: "dinheiro",
  CARD_ON_DELIVERY: "cartao_entrega",
  ONLINE: "pagamento_online",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  DELIVERY_PAYMENT: "delivery_payment",
  CANCELLED: "cancelled",
};

const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  DELIVERY: "delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const STATUS_META = {
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

const ORDER_STATUS_OPTIONS = Object.values(STATUS_META);

const FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  ...ORDER_STATUS_OPTIONS.map((status) => ({
    value: status.value,
    label: status.filterLabel,
  })),
];

const PAYMENT_METHOD_META = {
  [PAYMENT_METHOD.CASH]: { label: "💵 Dinheiro" },
  [PAYMENT_METHOD.CARD_ON_DELIVERY]: { label: "💳 Cartão na entrega" },
  [PAYMENT_METHOD.ONLINE]: { label: "⚡ Pagamento online" },
};

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatPrice(value) {
  return priceFormatter.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Data não informada";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data inválida"
    : dateFormatter.format(date);
}

function getPaymentMethodLabel(method) {
  const normalized = String(method || "").toLowerCase();
  return PAYMENT_METHOD_META[normalized]?.label || "Não informado";
}

function getPaymentStatusLabel(order) {
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

function normalizeOrderStatus(order) {
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

function getOrderStatusLabel(status) {
  return STATUS_META[status]?.label || "Não definido";
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getDate() === dateB.getDate() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getFullYear() === dateB.getFullYear()
  );
}

function buildDeliveryAddress(order) {
  if (!order.delivery_address) return "Endereço não informado";

  const number = order.delivery_number || "s/n";
  const complement = order.delivery_complement
    ? `, ${order.delivery_complement}`
    : "";

  return `${order.delivery_address}, ${number}${complement}`;
}

function parseArrayLike(value) {
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

function normalizeRemovedIngredientsText(removedIngredients) {
  const items = parseArrayLike(removedIngredients);

  if (!items.length) return "";

  return items
    .map((item) => item.replace(/^sem\s+/i, "").trim())
    .filter(Boolean)
    .join(", ");
}

function buildItemGroupKey(item) {
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

function groupOrderItems(items) {
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

function canAdvanceOrder(order, nextStatus) {
  const paymentMethod = String(order.payment_method || "").trim().toLowerCase();
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();
  const currentStatus = String(order.normalized_status || "").trim().toLowerCase();

  const isOnlinePayment = paymentMethod === PAYMENT_METHOD.ONLINE;
  const isPaid = paymentStatus === PAYMENT_STATUS.PAID;

  if (currentStatus === ORDER_STATUS.CANCELLED) {
    return false;
  }

  if (currentStatus === ORDER_STATUS.DELIVERED && nextStatus !== ORDER_STATUS.DELIVERED) {
    return false;
  }

  if (nextStatus === ORDER_STATUS.CANCELLED) {
    return currentStatus !== ORDER_STATUS.DELIVERED;
  }

  if (
    isOnlinePayment &&
    !isPaid &&
    [ORDER_STATUS.PREPARING, ORDER_STATUS.DELIVERY, ORDER_STATUS.DELIVERED].includes(nextStatus)
  ) {
    return false;
  }

  const allowedTransitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PREPARING]: [ORDER_STATUS.DELIVERY, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.DELIVERY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

function isStatusButtonDisabled(order, optionValue, updatingOrderId) {
  const isActive = order.normalized_status === optionValue;
  const isUpdatingThisOrder = updatingOrderId === order.id;
  const isAllowed = canAdvanceOrder(order, optionValue);

  return isActive || isUpdatingThisOrder || !isAllowed;
}

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const safeOrders = ordersData ?? [];

      if (!safeOrders.length) {
        setOrders([]);
        setMessage("");
        return;
      }

      const orderIds = safeOrders.map((order) => order.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      const itemsByOrderId = (itemsData ?? []).reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }

        acc[item.order_id].push(item);
        return acc;
      }, {});

      const mergedOrders = safeOrders.map((order) => ({
        ...order,
        normalized_status: normalizeOrderStatus(order),
        order_items: itemsByOrderId[order.id] ?? [],
      }));

      setOrders(mergedOrders);
      setMessage("");
    } catch (error) {
      console.error("Erro ao carregar pedidos do admin:", error);
      setOrders([]);
      setMessage("Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("orders-admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        loadOrders
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  async function handleUpdateOrderStatus(orderId, nextStatus) {
    const currentOrder = orders.find((order) => order.id === orderId);

    if (!currentOrder) {
      setMessage("Pedido não encontrado.");
      return;
    }

    if (currentOrder.normalized_status === nextStatus) {
      return;
    }

    if (!canAdvanceOrder(currentOrder, nextStatus)) {
      setMessage("Esse pedido não pode avançar para essa etapa agora.");
      return;
    }

    setUpdatingOrderId(orderId);
    setMessage("");

    const previousOrders = orders;

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              order_status: nextStatus,
              normalized_status: nextStatus,
            }
          : order
      )
    );

    try {
      const updatePayload = {
        order_status: nextStatus,
      };

      if (nextStatus === ORDER_STATUS.CANCELLED) {
        updatePayload.payment_status =
          currentOrder.payment_method === PAYMENT_METHOD.ONLINE
            ? PAYMENT_STATUS.CANCELLED
            : currentOrder.payment_status;
      }

      const { error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId);

      if (error) throw error;

      setMessage("Status do pedido atualizado com sucesso.");
      await loadOrders();
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      setOrders(previousOrders);
      setMessage("Não foi possível atualizar o status do pedido.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.normalized_status === statusFilter);
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date();

    const sameDayOrders = orders.filter((order) => {
      if (!order.created_at) return false;

      const createdAt = new Date(order.created_at);
      if (Number.isNaN(createdAt.getTime())) return false;

      return isSameDay(createdAt, today);
    });

    return {
      totalToday: sameDayOrders.length,
      pending: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.PENDING
      ).length,
      preparing: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.PREPARING
      ).length,
      outForDelivery: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.DELIVERY
      ).length,
      delivered: orders.filter(
        (order) => order.normalized_status === ORDER_STATUS.DELIVERED
      ).length,
      revenueToday: sameDayOrders
        .filter((order) => order.normalized_status !== ORDER_STATUS.CANCELLED)
        .reduce((total, order) => total + Number(order.total || 0), 0),
    };
  }, [orders]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.kicker}>Painel administrativo</span>
          <h1 className={styles.title}>Gestão de pedidos</h1>
          <p className={styles.subtitle}>
            Acompanhe os pedidos da pizzaria, filtre por etapa e atualize o
            andamento em tempo real.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          {message ? (
            <p className={styles.pageMessage} role="status">
              {message}
            </p>
          ) : null}

          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <span>Pedidos hoje</span>
              <strong>{stats.totalToday}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Aguardando</span>
              <strong>{stats.pending}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Em preparo</span>
              <strong>{stats.preparing}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Saiu para entrega</span>
              <strong>{stats.outForDelivery}</strong>
            </article>

            <article className={styles.statCard}>
              <span>Entregues</span>
              <strong>{stats.delivered}</strong>
            </article>

            <article className={`${styles.statCard} ${styles.statCardWide}`}>
              <span>Faturamento do dia</span>
              <strong>{formatPrice(stats.revenueToday)}</strong>
            </article>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.filterGroup}>
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`${styles.filterButton} ${
                    statusFilter === filter.value ? styles.filterButtonActive : ""
                  }`}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <section className={styles.ordersSection}>
            {loading ? (
              <div className={styles.emptyState}>
                <p>Carregando pedidos...</p>
              </div>
            ) : !filteredOrders.length ? (
              <div className={styles.emptyState}>
                <p>Nenhum pedido encontrado para este filtro.</p>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {filteredOrders.map((order) => {
                  const groupedItems = groupOrderItems(order.order_items);
                  const statusClass =
                    styles[
                      STATUS_META[order.normalized_status]?.badgeClass ||
                        "statusBadgeDefault"
                    ];

                  const isPaid =
                    String(order.payment_status || "").toLowerCase() ===
                    PAYMENT_STATUS.PAID;

                  return (
                    <article key={order.id} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div>
                          <h2 className={styles.orderTitle}>
                            Pedido #{String(order.id).slice(0, 8)}
                          </h2>
                          <p className={styles.orderMeta}>
                            {formatDate(order.created_at)}
                          </p>
                        </div>

                        <div className={styles.orderBadges}>
                          <span className={styles.badge}>
                            {getPaymentMethodLabel(order.payment_method)}
                          </span>

                          <span className={`${styles.statusBadge} ${statusClass}`}>
                            {getOrderStatusLabel(order.normalized_status)}
                          </span>

                          <span className={styles.badgeStrong}>
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>

                      <div className={styles.orderGrid}>
                        <div className={styles.infoBlock}>
                          <span className={styles.infoLabel}>Cliente</span>
                          <strong>{order.customer_name || "Não informado"}</strong>
                        </div>

                        <div className={styles.infoBlock}>
                          <span className={styles.infoLabel}>Telefone</span>
                          <strong>{order.customer_phone || "Não informado"}</strong>
                        </div>

                        <div className={styles.infoBlock}>
                          <span className={styles.infoLabel}>Pagamento</span>
                          <span
                            className={`${styles.paymentBadge} ${
                              isPaid ? styles.paymentPaid : styles.paymentPending
                            }`}
                          >
                            {getPaymentStatusLabel(order)}
                          </span>
                        </div>

                        <div className={styles.infoBlock}>
                          <span className={styles.infoLabel}>Status do pedido</span>
                          <strong>{getOrderStatusLabel(order.normalized_status)}</strong>
                        </div>

                        <div className={`${styles.infoBlock} ${styles.infoBlockWide}`}>
                          <span className={styles.infoLabel}>Entrega</span>
                          <strong>{buildDeliveryAddress(order)}</strong>
                        </div>

                        <div className={`${styles.infoBlock} ${styles.infoBlockWide}`}>
                          <span className={styles.infoLabel}>Itens</span>

                          <div className={styles.itemsList}>
                            {groupedItems.length ? (
                              groupedItems.map((item) => (
                                <div key={item.id} className={styles.itemRow}>
                                  <div className={styles.itemInfo}>
                                    <span className={styles.itemName}>
                                      🍕 {item.name} x{item.quantity}
                                    </span>

                                    {item.removedIngredients ? (
                                      <span className={styles.itemDetails}>
                                        Remover: {item.removedIngredients}
                                      </span>
                                    ) : null}

                                    {item.notes ? (
                                      <span className={styles.itemDetails}>
                                        Obs.: {item.notes}
                                      </span>
                                    ) : null}
                                  </div>

                                  <strong>
                                    {formatPrice(item.unitPrice * item.quantity)}
                                  </strong>
                                </div>
                              ))
                            ) : (
                              <strong>Nenhum item encontrado</strong>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.actionsRow}>
                        {ORDER_STATUS_OPTIONS.map((option) => {
                          const isActive = order.normalized_status === option.value;
                          const isUpdatingThisOrder = updatingOrderId === order.id;
                          const isAllowed = canAdvanceOrder(order, option.value);
                          const isDisabled = isStatusButtonDisabled(
                            order,
                            option.value,
                            updatingOrderId
                          );

                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`${styles.actionButton} ${
                                isActive ? styles.actionButtonActive : ""
                              } ${
                                !isAllowed && !isActive
                                  ? styles.actionButtonBlocked
                                  : ""
                              }`}
                              onClick={() => handleUpdateOrderStatus(order.id, option.value)}
                              disabled={isDisabled}
                              aria-pressed={isActive}
                              title={
                                !isAllowed
                                  ? "Esse pedido não pode ir para essa etapa agora."
                                  : option.label
                              }
                            >
                              {isUpdatingThisOrder && !isActive
                                ? "Atualizando..."
                                : option.label}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}