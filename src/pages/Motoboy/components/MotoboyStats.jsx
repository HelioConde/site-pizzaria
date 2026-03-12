import styles from "../Motoboy.module.css";

export default function MotoboyStats({ totalRoutes, deliveredToday }) {
  return (
    <div className={styles.statsGrid}>
      <article className={styles.statCard}>
        <span>Em rota</span>
        <strong>{totalRoutes}</strong>
      </article>

      <article className={styles.statCard}>
        <span>Entregues hoje</span>
        <strong>{deliveredToday}</strong>
      </article>
    </div>
  );
}