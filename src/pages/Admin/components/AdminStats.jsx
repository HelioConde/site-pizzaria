import styles from "../Admin.module.css";
import { formatPrice } from "../admin.utils";

export default function AdminStats({ stats }) {
  return (
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
  );
}