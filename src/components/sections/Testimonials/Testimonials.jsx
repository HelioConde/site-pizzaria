import styles from "./Testimonials.module.css";

function normalizeRating(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return 5;
  if (numericValue < 0) return 0;
  if (numericValue > 5) return 5;

  return Math.round(numericValue);
}

function Stars({ value = 5 }) {
  const safeValue = normalizeRating(value);
  const stars = Array.from({ length: 5 }, (_, index) =>
    index < safeValue ? "★" : "☆"
  );

  return (
    <div
      className={styles.stars}
      aria-label={`${safeValue} de 5 estrelas`}
      title={`${safeValue} de 5 estrelas`}
    >
      {stars.join(" ")}
    </div>
  );
}

export default function Testimonials({ data }) {
  if (!data || typeof data !== "object") return null;

  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : "Avaliações";

  const subtitle =
    typeof data.subtitle === "string" && data.subtitle.trim()
      ? data.subtitle.trim()
      : "";

  const items = Array.isArray(data.items) ? data.items.filter(Boolean) : [];

  if (items.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label={title}>
      <div className={styles.container}>
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>

        <div className={styles.grid}>
          {items.map((item, index) => {
            const name =
              typeof item.name === "string" && item.name.trim()
                ? item.name.trim()
                : "Cliente";

            const city =
              typeof item.city === "string" && item.city.trim()
                ? item.city.trim()
                : "Cidade não informada";

            const text =
              typeof item.text === "string" && item.text.trim()
                ? item.text.trim()
                : "Avaliação indisponível no momento.";

            const avatarLetter = name.charAt(0).toUpperCase() || "?";

            return (
              <article
                key={item.id ?? `testimonial-${index}`}
                className={styles.card}
              >
                <div className={styles.top}>
                  <div className={styles.avatar} aria-hidden="true">
                    {avatarLetter}
                  </div>

                  <div className={styles.meta}>
                    <div className={styles.name} title={name}>
                      {name}
                    </div>
                    <div className={styles.city} title={city}>
                      {city}
                    </div>
                  </div>

                  <Stars value={item.rating} />
                </div>

                <p className={styles.text}>&ldquo;{text}&rdquo;</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}