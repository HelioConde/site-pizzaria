import { Link } from "react-router-dom";
import styles from "../Account.module.css";
import Button from "../../../components/ui/Button/Button";

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

function formatPrice(value) {
  if (value == null) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPaymentLabel(method) {
  switch (method) {
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

function normalizeOrderStage(order) {
  const rawStatus = String(
    order.display_status || order.order_status || order.status || ""
  )
    .trim()
    .toLowerCase();

  if (
    [
      "pending",
      "new",
      "novo",
      "confirmed",
      "confirmado",
      "awaiting",
      "aguardando",
    ].includes(rawStatus)
  ) {
    return ORDER_STATUS.PENDING;
  }

  if (["preparing", "em_preparo", "preparo"].includes(rawStatus)) {
    return ORDER_STATUS.PREPARING;
  }

  if (["delivery", "out_for_delivery", "saiu_para_entrega"].includes(rawStatus)) {
    return ORDER_STATUS.DELIVERY;
  }

  if (["delivered", "entregue"].includes(rawStatus)) {
    return ORDER_STATUS.DELIVERED;
  }

  if (["cancelled", "canceled", "cancelado"].includes(rawStatus)) {
    return ORDER_STATUS.CANCELLED;
  }

  return ORDER_STATUS.PENDING;
}

function getTimeline(order) {
  const orderStage = normalizeOrderStage(order);
  const paymentMethod = String(order.payment_method || "").trim().toLowerCase();
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();

  const isOnlinePayment = paymentMethod === PAYMENT_METHOD.ONLINE;
  const isPaid = paymentStatus === PAYMENT_STATUS.PAID;
  const isCancelled = orderStage === ORDER_STATUS.CANCELLED;

  if (isCancelled) {
    return [
      {
        key: "cancelled",
        label: "Cancelado",
        active: true,
        current: true,
      },
    ];
  }

  if (isOnlinePayment && !isPaid && orderStage === ORDER_STATUS.PENDING) {
    return [
      {
        key: "payment_pending",
        label: "Pagamento aguardando confirmação",
        active: true,
        current: true,
      },
      {
        key: "preparing",
        label: "Em preparo",
        active: false,
        current: false,
      },
      {
        key: "delivery",
        label: "Saiu para entrega",
        active: false,
        current: false,
      },
      {
        key: "delivered",
        label: "Entregue",
        active: false,
        current: false,
      },
    ];
  }

  return [
    {
      key: "pending",
      label: "Aguardando",
      active: true,
      current: orderStage === ORDER_STATUS.PENDING,
    },
    {
      key: "preparing",
      label: "Em preparo",
      active: [ORDER_STATUS.PREPARING, ORDER_STATUS.DELIVERY, ORDER_STATUS.DELIVERED].includes(orderStage),
      current: orderStage === ORDER_STATUS.PREPARING,
    },
    {
      key: "delivery",
      label: "Saiu para entrega",
      active: [ORDER_STATUS.DELIVERY, ORDER_STATUS.DELIVERED].includes(orderStage),
      current: orderStage === ORDER_STATUS.DELIVERY,
    },
    {
      key: "delivered",
      label: "Entregue",
      active: orderStage === ORDER_STATUS.DELIVERED,
      current: orderStage === ORDER_STATUS.DELIVERED,
    },
  ];
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

function parseRemovedIngredients(removedIngredients) {
  if (!removedIngredients) return [];

  if (Array.isArray(removedIngredients)) {
    return removedIngredients
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof removedIngredients === "string") {
    try {
      const parsed = JSON.parse(removedIngredients);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item || "").trim())
          .filter(Boolean);
      }
    } catch {
      return removedIngredients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getRemovedIngredientsLabel(removedIngredients) {
  const items = parseRemovedIngredients(removedIngredients);

  if (!items.length) return null;

  return items
    .map((item) => {
      const text = String(item || "").trim();
      return /^sem\s+/i.test(text) ? text : `Sem ${text}`;
    })
    .join(" • ");
}

export default function OrdersRecentList({ orders = [], loading = false }) {
  return (
    <article className={`${styles.card} ${styles.cardWide}`}>
      <div className={styles.cardHeader}>
        <h2>Pedidos recentes</h2>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <p>Carregando pedidos...</p>
        </div>
      ) : !orders.length ? (
        <div className={styles.emptyOrders}>
          <div className={styles.emptyIcon}>🍕</div>
          <p>Nenhum pedido encontrado</p>
          <span>Quando você fizer um pedido logado, ele aparecerá aqui.</span>
          <Button as={Link} to="/menu" variant="primary">
            Fazer primeiro pedido
          </Button>
        </div>
      ) : (
        <div className={styles.ordersCompactList}>
          {orders.map((order) => {
            const timeline = getTimeline(order);
            const firstItem = order.order_items?.[0];
            const hasMoreItems = (order.order_items?.length ?? 0) > 1;

            return (
              <div key={order.id} className={styles.orderRowCard}>
                <div className={styles.orderRowMain}>
                  <div className={styles.orderIdentity}>
                    <strong className={styles.orderRowNumber}>
                      Pedido #{String(order.id).slice(0, 8)}
                    </strong>

                    <span className={styles.orderRowDate}>
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  <div className={styles.orderTimelineInline}>
                    {timeline.map((step) => (
                      <div key={step.key} className={styles.timelineInlineStep}>
                        <div
                          className={`${styles.timelineInlineDot} ${
                            step.active ? styles.timelineInlineDotActive : ""
                          } ${step.current ? styles.timelineInlineDotCurrent : ""}`}
                        >
                          {step.active ? "✓" : ""}
                        </div>

                        <div className={styles.timelineInlineText}>
                          <strong
                            className={`${styles.timelineInlineLabel} ${
                              step.active ? styles.timelineInlineLabelActive : ""
                            }`}
                          >
                            {step.label}
                          </strong>

                          {step.current ? (
                            <span className={styles.timelineInlineCurrent}>
                              Etapa atual do seu pedido
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.orderSummaryColumn}>
                    <div className={styles.orderInfoMini}>
                      <span className={styles.orderInfoMiniLabel}>Pagamento</span>
                      <strong className={styles.orderInfoMiniValue}>
                        {getPaymentStatusLabel(order)}
                      </strong>
                    </div>

                    <div className={styles.orderInfoMini}>
                      <span className={styles.orderInfoMiniLabel}>Entrega</span>
                      <strong className={styles.orderInfoMiniValue}>
                        {order.delivery_address
                          ? `${order.delivery_address}, ${order.delivery_number || "s/n"}`
                          : "Endereço não informado"}
                      </strong>
                    </div>

                    <div className={styles.orderItemsMini}>
                      <span className={styles.orderInfoMiniLabel}>Itens do pedido</span>

                      {firstItem ? (
                        <>
                          <div className={styles.orderItemMiniTop}>
                            <span>
                              {firstItem.quantity}x {firstItem.name}
                            </span>

                            <strong>
                              {formatPrice(
                                Number(firstItem.unit_price) * firstItem.quantity
                              )}
                            </strong>
                          </div>

                          {parseRemovedIngredients(firstItem.removed_ingredients).length > 0 ? (
                            <p className={styles.orderItemMiniNote}>
                              {getRemovedIngredientsLabel(firstItem.removed_ingredients)}
                            </p>
                          ) : null}

                          {hasMoreItems ? (
                            <span className={styles.orderItemMiniMore}>
                              +{order.order_items.length - 1} item(ns)
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <strong className={styles.orderInfoMiniValue}>
                          Nenhum item
                        </strong>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.orderRowSide}>
                  <span className={styles.orderMethodPill}>
                    {getPaymentLabel(order.payment_method)}
                  </span>

                  <strong className={styles.orderRowTotal}>
                    {formatPrice(order.total)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}