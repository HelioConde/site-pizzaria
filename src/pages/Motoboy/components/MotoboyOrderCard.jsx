import styles from "../Motoboy.module.css";
import {
  buildDeliveryAddress,
  formatDate,
  formatPrice,
  getGoogleMapsRouteUrl,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPhoneCallUrl,
  getWhatsAppUrl,
  groupOrderItems,
} from "../motoboy.utils";

export default function MotoboyOrderCard({
  order,
  updatingOrderId,
  onMarkDelivered,
}) {
  const groupedItems = groupOrderItems(order.order_items);
  const isUpdating = updatingOrderId === order.id;

  const whatsappUrl = getWhatsAppUrl(order.customer_phone);
  const callUrl = getPhoneCallUrl(order.customer_phone);
  const mapsUrl = getGoogleMapsRouteUrl(order);

  return (
    <article className={styles.orderCard}>
      <div className={styles.orderHeader}>
        <div>
          <h2 className={styles.orderTitle}>
            Pedido #{String(order.id).slice(0, 8)}
          </h2>
          <p className={styles.orderMeta}>{formatDate(order.created_at)}</p>
        </div>

        <div className={styles.orderBadges}>
          <span className={styles.badge}>
            {getPaymentMethodLabel(order.payment_method)}
          </span>
          <span className={styles.badgeStrong}>{formatPrice(order.total)}</span>
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
          <strong>{getPaymentStatusLabel(order)}</strong>
        </div>

        <div className={`${styles.infoBlock} ${styles.infoBlockWide}`}>
          <span className={styles.infoLabel}>Entrega</span>
          <strong>{buildDeliveryAddress(order)}</strong>
        </div>

        {order.delivery_reference ? (
          <div className={`${styles.infoBlock} ${styles.infoBlockWide}`}>
            <span className={styles.infoLabel}>Referência</span>
            <strong>{order.delivery_reference}</strong>
          </div>
        ) : null}

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

                  <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
                </div>
              ))
            ) : (
              <strong>Nenhum item encontrado</strong>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={() => onMarkDelivered(order.id)}
          disabled={isUpdating}
        >
          {isUpdating ? "Atualizando..." : "Marcar como entregue"}
        </button>

        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.secondaryAction}
          >
            Abrir rota
          </a>
        ) : null}

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.secondaryAction}
          >
            WhatsApp
          </a>
        ) : null}

        {callUrl ? (
          <a href={callUrl} className={styles.secondaryAction}>
            Ligar
          </a>
        ) : null}
      </div>
    </article>
  );
}