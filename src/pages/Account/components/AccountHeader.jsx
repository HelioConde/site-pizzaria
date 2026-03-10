import styles from "../Account.module.css";

export default function AccountHeader({ firstName }) {
  const initial = firstName?.[0]?.toUpperCase() || "C";

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <span className={styles.kicker}>Minha conta</span>

        <div className={styles.heroUser}>
          <div className={styles.avatar}>{initial}</div>

          <div>
            <h1 className={styles.title}>Olá, {firstName}</h1>

            <p className={styles.subtitle}>
              Gerencie seus dados, endereços e acompanhe suas informações de compra.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}