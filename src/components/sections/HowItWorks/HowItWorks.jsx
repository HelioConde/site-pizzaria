import styles from "./HowItWorks.module.css";

const iconMap = {
  cart: "🛒",
  slice: "🍕",
  bike: "🛵",
};

export default function HowItWorks({ data }) {
  console.log(data)
  if (!data) return null;

  return (
    <section className={styles.wrap} aria-label={data.title}>
      <div className={styles.container}>
        <header className={styles.head}>
          <h2 className={styles.title}>{data.title}</h2>
          <p className={styles.subtitle}>{data.subtitle}</p>
        </header>

        <div className={styles.grid}>
          {(data.steps ?? []).map((s) => (
            <article key={s.id} className={styles.card}>
              <div className={styles.icon} aria-hidden="true">
                {iconMap[s.icon] ?? "✨"}
              </div>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.cardDesc}>{s.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}