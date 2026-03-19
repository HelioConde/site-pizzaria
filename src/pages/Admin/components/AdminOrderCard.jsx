import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import styles from "../Admin.module.css";
import DeliveryRouteMap from "../../../components/maps/DeliveryRouteMap";
import {
  ORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS,
} from "../admin.constants";
import {
  buildDeliveryAddress,
  canAdvanceOrder,
  formatDate,
  formatPrice,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  groupOrderItems,
  isStatusButtonDisabled,
} from "../admin.utils";

function buildItemsSummary(items) {
  if (!Array.isArray(items) || !items.length) return "Nenhum item";

  const totalQuantity = items.reduce(
    (acc, item) => acc + Math.max(1, Number(item.quantity || 1)),
    0
  );

  return `${totalQuantity} ${totalQuantity === 1 ? "item" : "itens"}`;
}

function normalizeItemDetails(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return String(value || "").trim();
}

export default function AdminOrderCard({
  order,
  updatingOrderId,
  onUpdateStatus,
  onOpenChat,
  unreadCount = 0,
  isHighlighted = false,
  registerOrderRef,
  focusRequestToken = 0,
}) {
  const groupedItems = useMemo(
    () => groupOrderItems(order.order_items || []),
    [order.order_items]
  );

  const [courierLocation, setCourierLocation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const isPaid =
    String(order.payment_status || "").toLowerCase() === PAYMENT_STATUS.PAID;

  const mapsUrl = useMemo(() => {
    if (!courierLocation?.latitude || !courierLocation?.longitude) return null;

    return `https://www.google.com/maps?q=${courierLocation.latitude},${courierLocation.longitude}`;
  }, [courierLocation]);

  const hasCustomerCoordinates =
    order.delivery_lat != null &&
    order.delivery_lng != null &&
    !Number.isNaN(Number(order.delivery_lat)) &&
    !Number.isNaN(Number(order.delivery_lng));

  const itemsSummary = useMemo(
    () => buildItemsSummary(groupedItems),
    [groupedItems]
  );

  useEffect(() => {
    let active = true;

    async function loadLastLocation() {
      const { data, error } = await supabase
        .from("order_delivery_tracking")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && active) {
        setCourierLocation(data ?? null);
      }
    }

    loadLastLocation();

    const channel = supabase
      .channel(`tracking-${order.id}`)
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
          setCourierLocation(payload.new ?? null);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  useEffect(() => {
    if (focusRequestToken) {
      setShowDetails(true);
    }
  }, [focusRequestToken]);

  return (
    <article
      ref={(node) => registerOrderRef?.(order.id, node)}
      className={`${styles.orderCard} ${
        isHighlighted ? styles.orderCardHighlighted : ""
      }`}
    >
      <div className={styles.orderHeader}>
        <div className={styles.orderHeaderMain}>
          <h2 className={styles.orderTitle}>
            Pedido #{String(order.id).slice(0, 8)}
          </h2>

          <div className={styles.orderMetaRow}>
            <p className={styles.orderMeta}>{formatDate(order.created_at)}</p>
            <span className={styles.orderMetaDot}>•</span>
            <p className={styles.orderMeta}>{itemsSummary}</p>
          </div>
        </div>

        <div className={styles.orderBadges}>
          <span className={styles.badge}>
            {getPaymentMethodLabel(order.payment_method)}
          </span>

          <span
            className={`${styles.paymentBadge} ${
              isPaid ? styles.paymentPaid : styles.paymentPending
            }`}
          >
            {getPaymentStatusLabel(order)}
          </span>

          <button
            type="button"
            className={`${styles.chatOpenButton} ${
              unreadCount > 0 ? styles.chatOpenButtonUnread : ""
            }`}
            onClick={() => onOpenChat?.(order)}
            title="Abrir chat flutuante"
          >
            <span>💬 Chat</span>

            {unreadCount > 0 ? (
              <span className={styles.chatOpenUnreadBadge}>{unreadCount}</span>
            ) : null}
          </button>

          <div className={styles.priceToggleWrap}>
            <span className={styles.badgeStrong}>
              {formatPrice(order.total)}
            </span>

            <button
              type="button"
              className={styles.priceArrowButton}
              onClick={() => setShowDetails((prev) => !prev)}
              aria-expanded={showDetails}
              aria-label={
                showDetails
                  ? "Ocultar detalhes da entrega"
                  : "Mostrar detalhes da entrega"
              }
              title={
                showDetails
                  ? "Ocultar detalhes da entrega"
                  : "Mostrar detalhes da entrega"
              }
            >
              <span className={styles.priceToggleArrow}>
                {showDetails ? "▴" : "▾"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.orderGrid}>
        {showDetails ? (
          <>
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
              <div className={styles.chatInlineHint}>
                <div className={styles.chatInlineHintText}>
                  <span className={styles.infoLabel}>Atendimento</span>
                  <strong>O chat deste pedido abre em janela flutuante.</strong>
                </div>

                <button
                  type="button"
                  className={styles.chatInlineHintButton}
                  onClick={() => onOpenChat?.(order)}
                >
                  Abrir chat
                  {unreadCount > 0 ? (
                    <span className={styles.chatOpenUnreadBadge}>
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </>
        ) : null}

        <div className={`${styles.infoBlock} ${styles.infoBlockWide}`}>
          <div className={styles.sectionHeaderStatic}>
            <div className={styles.sectionHeaderInline}>
              <span className={styles.infoLabel}>Itens</span>
              <span className={styles.sectionSummary}>{itemsSummary}</span>
            </div>
          </div>

          {groupedItems.length ? (
            <div className={styles.itemsGrid}>
              {groupedItems.map((item, index) => {
                const removedIngredientsText = normalizeItemDetails(
                  item.removedIngredients
                );
                const notesText = normalizeItemDetails(item.notes);

                return (
                  <div
                    key={item.id || `${item.name}-${index}`}
                    className={styles.itemCardCompact}
                  >
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>
                        🍕 {item.name} x{item.quantity}
                      </span>

                      {removedIngredientsText ? (
                        <span className={styles.itemDetails}>
                          Remover: {removedIngredientsText}
                        </span>
                      ) : null}

                      {notesText ? (
                        <span className={styles.itemDetails}>
                          Obs.: {notesText}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <strong>Nenhum item encontrado</strong>
          )}
        </div>
      </div>

      <div className={styles.actionsRow}>
        {ORDER_STATUS_OPTIONS.map((option) => {
          const isActive = order.normalized_status === option.value;
          const isDisabled = isStatusButtonDisabled(
            order,
            option.value,
            updatingOrderId
          );
          const isAllowed = canAdvanceOrder(order, option.value);
          const isUpdatingThisOrder = updatingOrderId === order.id;

          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.actionButton} ${
                isActive ? styles.actionButtonActive : ""
              } ${!isAllowed && !isActive ? styles.actionButtonBlocked : ""}`}
              onClick={() => onUpdateStatus(order.id, option.value)}
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

      <div className={styles.orderDetailsPanel}>
        {order.normalized_status === ORDER_STATUS.DELIVERY ? (
          <div className={styles.deliveryDetailsCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderText}>
                <span className={styles.infoLabel}>Motoboy em rota</span>

                {courierLocation ? (
                  <span className={styles.sectionSummary}>
                    Atualizado em {formatDate(courierLocation.created_at)}
                  </span>
                ) : (
                  <span className={styles.sectionSummary}>
                    Sem localização disponível ainda
                  </span>
                )}
              </div>

              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setShowMap((prev) => !prev)}
                disabled={!courierLocation}
              >
                {showMap ? "Ocultar rota" : "Ver rota"}
              </button>
            </div>

            {showMap ? (
              courierLocation ? (
                <div className={styles.courierLocationBox}>
                  <strong>
                    {Number(courierLocation.latitude).toFixed(6)},{" "}
                    {Number(courierLocation.longitude).toFixed(6)}
                  </strong>

                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.secondaryInlineLink}
                    >
                      Ver no mapa
                    </a>
                  ) : null}

                  {hasCustomerCoordinates ? (
                    <DeliveryRouteMap
                      courierLatitude={courierLocation.latitude}
                      courierLongitude={courierLocation.longitude}
                      customerLatitude={order.delivery_lat}
                      customerLongitude={order.delivery_lng}
                      courierLabel="Motoboy"
                      customerLabel={order.customer_name || "Cliente"}
                      height={320}
                      className={styles.deliveryMapWrap}
                      metaClassName={styles.deliveryMapMeta}
                      metaBadgeClassName={styles.mapMetaBadge}
                      errorClassName={styles.mapError}
                      zoom={15}
                      scrollWheelZoom
                      preferCanvas={true}
                      style={{
                        width: "100%",
                        height: "320px",
                        borderRadius: "18px",
                      }}
                    />
                  ) : (
                    <strong>Pedido sem coordenadas de entrega válidas.</strong>
                  )}
                </div>
              ) : (
                <strong>Sem localização disponível ainda.</strong>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}