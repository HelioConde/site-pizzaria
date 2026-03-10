import { Link } from "react-router-dom";
import styles from "../Account.module.css";
import Button from "../../../components/ui/Button/Button";

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
    case "dinheiro":
      return "Dinheiro";
    case "cartao_entrega":
      return "Cartão na entrega";
    case "pagamento_online":
      return "Pagamento online";
    default:
      return "Não informado";
  }
}

function getTimeline(orderStatus) {
  return [
    {
      key: "confirmed",
      label: "Pagamento aprovado",
      active:
        orderStatus === "confirmed" ||
        orderStatus === "preparing" ||
        orderStatus === "delivery" ||
        orderStatus === "delivered",
      current: orderStatus === "confirmed",
    },
    {
      key: "preparing",
      label: "Em preparo",
      active:
        orderStatus === "preparing" ||
        orderStatus === "delivery" ||
        orderStatus === "delivered",
      current: orderStatus === "preparing",
    },
    {
      key: "delivery",
      label: "Saiu para entrega",
      active:
        orderStatus === "delivery" ||
        orderStatus === "delivered",
      current: orderStatus === "delivery",
    },
    {
      key: "delivered",
      label: "Entregue",
      active: orderStatus === "delivered",
      current: orderStatus === "delivered",
    },
  ];
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
            const timeline = getTimeline(order.order_status);
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
                          } ${
                            step.current ? styles.timelineInlineDotCurrent : ""
                          }`}
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
                        {order.payment_status === "paid" ? "Pago" : "Pendente"}
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

                          {firstItem.removed_ingredients?.length > 0 ? (
                            <p className={styles.orderItemMiniNote}>
                              {firstItem.removed_ingredients.join(" • ")}
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