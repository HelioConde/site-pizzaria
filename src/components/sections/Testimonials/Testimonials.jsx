import styles from "./Testimonials.module.css";

function Stars({ value = 5 }) {
  const stars = Array.from({ length: 5 }, (_, i) => (i < value ? "★" : "☆"));
  return <div className={styles.stars} aria-label={`${value} de 5`}>{stars.join(" ")}</div>;
}

export default function Testimonials({ data }) {
  if (!data) return null;

  return (
    <section className={styles.wrap} aria-label={data.title}>
      <div className={styles.container}>
        <header className={styles.head}>
          <h2 className={styles.title}>{data.title}</h2>
          <p className={styles.subtitle}>{data.subtitle}</p>
        </header>

        <div className={styles.grid}>
          {(data.items ?? []).map((t) => (
            <article key={t.id} className={styles.card}>
              <div className={styles.top}>
                <div className={styles.avatar} aria-hidden="true">
                  {t.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className={styles.meta}>
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.city}>{t.city}</div>
                </div>
                <Stars value={t.rating} />
              </div>

              <p className={styles.text}>"{t.text}"</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}