import styles from "./Footer.module.css";
import Button from "../../ui/Button/Button";

export default function Footer({ store, footer }) {
  if (!store || !footer) return null;

  const year = new Date().getFullYear();

  return (
    <footer className={styles.wrap} aria-label="Rodapé">
      {/* Conteúdo */}
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <h4 className={styles.brand}>{store.name}</h4>
            <p className={styles.desc}>{store.tagline}</p>

            <ul className={styles.contact}>
              <li>📞 {store.phone}</li>
              <li>✉️ {store.email}</li>
              <li>📍 {store.city}</li>
            </ul>
          </div>

          <div>
            <h5 className={styles.colTitle}>Links</h5>
            <ul className={styles.links}>
              {(footer.links ?? []).map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className={styles.colTitle}>Horários</h5>
            <ul className={styles.hours}>
              {(store.hours ?? []).map((h) => (
                <li key={h.label}>
                  <span className={styles.hourLabel}>{h.label}</span>
                  <span className={styles.hourValue}>{h.value}</span>
                </li>
              ))}
            </ul>

            <a className={styles.social} href={store.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </div>
        </div>

        <div className={styles.map}>
          <iframe
            title="Mapa"
            src={store.maps?.embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className={styles.copy}>
          © {year} {store.name} — Desenvolvido por {footer.credits?.author || "Hélio Conde"} ·{" "}
          <span className={styles.copyMuted}>{footer.credits?.note}</span>
        </div>
      </div>
    </footer>
  );
}