import AdminContentHeader from "../components/AdminContentHeader";
import AdminStats from "../components/AdminStats";
import styles from "../Admin.module.css";

export default function DashboardSection({ stats }) {
  return (
    <>
      <AdminContentHeader
        kicker="Painel administrativo"
        title="Dashboard"
        subtitle="Acompanhe os principais indicadores da operação em tempo real."
      />

      <section className={styles.content}>
        <div className={styles.container}>
          <AdminStats stats={stats} />
        </div>
      </section>
    </>
  );
}