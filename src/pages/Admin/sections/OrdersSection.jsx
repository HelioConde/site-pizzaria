import AdminContentHeader from "../components/AdminContentHeader";
import AdminFilters from "../components/AdminFilters";
import AdminOrderCard from "../components/AdminOrderCard";
import { FILTER_OPTIONS } from "../admin.constants";
import styles from "../Admin.module.css";

export default function OrdersSection({
  message,
  stats,
  loading,
  filteredOrders,
  statusFilter,
  setStatusFilter,
  updatingOrderId,
  handleUpdateOrderStatus,
}) {
  return (
    <>
      <AdminContentHeader
        kicker="Painel administrativo"
        title="Gestão de pedidos"
        subtitle="Acompanhe os pedidos da pizzaria, filtre por etapa e atualize o andamento em tempo real."
      />

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
              <span>Aguardando motoboy</span>
              <strong>{stats.waitingCourier}</strong>
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
              <strong>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.revenueToday)}
              </strong>
            </article>
          </div>

          <div className={styles.toolbar}>
            <AdminFilters
              filters={FILTER_OPTIONS}
              statusFilter={statusFilter}
              onChangeFilter={setStatusFilter}
            />
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
                {filteredOrders.map((order) => (
                  <AdminOrderCard
                    key={order.id}
                    order={order}
                    updatingOrderId={updatingOrderId}
                    onUpdateStatus={handleUpdateOrderStatus}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </>
  );
}