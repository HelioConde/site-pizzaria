import styles from "./HowItWorks.module.css";

const iconMap = {
  cart: "🛒",
  slice: "🍕",
  bike: "🛵",
};

function getSafeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export default function HowItWorks({ data }) {
  if (!data || typeof data !== "object") return null;

  const title = getSafeText(data.title, "Como funciona");
  const subtitle = getSafeText(data.subtitle);
  const steps = Array.isArray(data.steps) ? data.steps.filter(Boolean) : [];

  if (steps.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label={title}>
      <div className={styles.container}>
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>

        <div className={styles.grid}>
          {steps.map((step, index) => {
            const safeTitle = getSafeText(step.title, `Passo ${index + 1}`);
            const safeDescription = getSafeText(
              step.description,
              "Descrição indisponível no momento."
            );
            const safeIcon = iconMap[step.icon] ?? "✨";

            return (
              <article
                key={step.id ?? `how-it-works-step-${index}`}
                className={styles.card}
              >
                <div className={styles.icon} aria-hidden="true">
                  {safeIcon}
                </div>

                <h3 className={styles.cardTitle}>{safeTitle}</h3>
                <p className={styles.cardDesc}>{safeDescription}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}