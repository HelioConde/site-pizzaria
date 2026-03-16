import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import styles from "../Account.module.css";
import Button from "../../../components/ui/Button/Button";
import DeliveryRouteMap from "../../../components/maps/DeliveryRouteMap";

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
  WAITING_COURIER: "waiting_courier",
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
    order.order_status || order.display_status || order.status || ""
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

  if (
    [
      "waiting_courier",
      "awaiting_courier",
      "aguardando_motoboy",
    ].includes(rawStatus)
  ) {
    return ORDER_STATUS.WAITING_COURIER;
  }

  if (
    ["delivery", "out_for_delivery", "saiu_para_entrega"].includes(rawStatus)
  ) {
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
        key: "waiting_courier",
        label: "Aguardando motoboy",
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
      active: [
        ORDER_STATUS.PREPARING,
        ORDER_STATUS.WAITING_COURIER,
        ORDER_STATUS.DELIVERY,
        ORDER_STATUS.DELIVERED,
      ].includes(orderStage),
      current: orderStage === ORDER_STATUS.PREPARING,
    },
    {
      key: "waiting_courier",
      label: "Aguardando motoboy",
      active: [
        ORDER_STATUS.WAITING_COURIER,
        ORDER_STATUS.DELIVERY,
        ORDER_STATUS.DELIVERED,
      ].includes(orderStage),
      current: orderStage === ORDER_STATUS.WAITING_COURIER,
    },
    {
      key: "delivery",
      label: "Saiu para entrega",
      active: [ORDER_STATUS.DELIVERY, ORDER_STATUS.DELIVERED].includes(
        orderStage
      ),
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

function hasValidCoordinates(lat, lng) {
  return (
    lat != null &&
    lng != null &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng))
  );
}

export default function OrdersRecentList({ orders = [], loading = false }) {
  const [trackingByOrderId, setTrackingByOrderId] = useState({});

  const deliveryOrders = useMemo(() => {
    return orders.filter((order) => normalizeOrderStage(order) === ORDER_STATUS.DELIVERY);
  }, [orders]);

  useEffect(() => {
    let active = true;
    const channels = [];

    async function loadTracking() {
      const nextTracking = {};

      await Promise.all(
        deliveryOrders.map(async (order) => {
          const { data, error } = await supabase
            .from("order_delivery_tracking")
            .select("*")
            .eq("order_id", order.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data && active) {
            nextTracking[order.id] = data;
          }
        })
      );

      if (active) {
        setTrackingByOrderId((prev) => ({
          ...prev,
          ...nextTracking,
        }));
      }
    }

    loadTracking();

    deliveryOrders.forEach((order) => {
      const channel = supabase
        .channel(`account-order-tracking-${order.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "order_delivery_tracking",
            filter: `order_id=eq.${order.id}`,
          },
          (payload) => {
            if (!active) return;

            setTrackingByOrderId((prev) => ({
              ...prev,
              [order.id]: payload.new,
            }));
          }
        )
        .subscribe();

      channels.push(channel);
    });

    return () => {
      active = false;
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [deliveryOrders]);

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
            const orderStage = normalizeOrderStage(order);
            const firstItem = order.order_items?.[0];
            const hasMoreItems = (order.order_items?.length ?? 0) > 1;

            const latestTracking = trackingByOrderId[order.id] || null;

            const courierLatitude =
              latestTracking?.latitude ?? order.courier_lat ?? null;
            const courierLongitude =
              latestTracking?.longitude ?? order.courier_lng ?? null;

            const hasCourierCoordinates = hasValidCoordinates(
              courierLatitude,
              courierLongitude
            );

            const hasCustomerCoordinates = hasValidCoordinates(
              order.delivery_lat,
              order.delivery_lng
            );

            const shouldShowTrackingMap =
              orderStage === ORDER_STATUS.DELIVERY &&
              hasCourierCoordinates &&
              hasCustomerCoordinates;

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
                          className={`${styles.timelineInlineDot} ${step.active ? styles.timelineInlineDotActive : ""
                            } ${step.current ? styles.timelineInlineDotCurrent : ""
                            }`}
                        >
                          {step.active ? "✓" : ""}
                        </div>

                        <div className={styles.timelineInlineText}>
                          <strong
                            className={`${styles.timelineInlineLabel} ${step.active
                                ? styles.timelineInlineLabelActive
                                : ""
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
                      <span className={styles.orderInfoMiniLabel}>
                        Pagamento
                      </span>
                      <strong className={styles.orderInfoMiniValue}>
                        {getPaymentStatusLabel(order)}
                      </strong>
                    </div>

                    <div className={styles.orderInfoMini}>
                      <span className={styles.orderInfoMiniLabel}>Entrega</span>
                      <strong className={styles.orderInfoMiniValue}>
                        {order.delivery_address
                          ? `${order.delivery_address}, ${order.delivery_number || "s/n"
                          }`
                          : "Endereço não informado"}
                      </strong>
                    </div>

                    <div className={styles.orderItemsMini}>
                      <span className={styles.orderInfoMiniLabel}>
                        Itens do pedido
                      </span>

                      {firstItem ? (
                        <>
                          <div className={styles.orderItemMiniTop}>
                            <span>
                              {firstItem.quantity}x {firstItem.name}
                            </span>

                            <strong>
                              {formatPrice(
                                Number(firstItem.unit_price) *
                                firstItem.quantity
                              )}
                            </strong>
                          </div>

                          {parseRemovedIngredients(
                            firstItem.removed_ingredients
                          ).length > 0 ? (
                            <p className={styles.orderItemMiniNote}>
                              {getRemovedIngredientsLabel(
                                firstItem.removed_ingredients
                              )}
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

                {shouldShowTrackingMap ? (
                  <div className={styles.orderTrackingMapSection}>
                    <div className={styles.orderTrackingMapHeader}>
                      <strong>Acompanhe seu pedido</strong>
                      <span>
                        O motoboy está a caminho do seu endereço.
                      </span>
                    </div>

                    <DeliveryRouteMap
                      courierLatitude={courierLatitude}
                      courierLongitude={courierLongitude}
                      customerLatitude={order.delivery_lat}
                      customerLongitude={order.delivery_lng}
                      courierLabel="Seu entregador"
                      customerLabel="Seu endereço"
                      height={280}
                      className={styles.deliveryMapWrap}
                      metaClassName={styles.deliveryMapMeta}
                      metaBadgeClassName={styles.mapMetaBadge}
                      errorClassName={styles.mapError}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}