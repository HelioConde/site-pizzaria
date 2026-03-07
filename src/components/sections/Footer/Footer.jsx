import styles from "./Footer.module.css";
import { Instagram, Github, Linkedin, MessageCircle } from "lucide-react";

export default function Footer({ store, footer }) {
  if (!store || !footer) return null;

  const year = new Date().getFullYear();

  function getIcon(name) {
    switch (name.toLowerCase()) {
      case "instagram":
        return <Instagram size={18} />;
      case "github":
        return <Github size={18} />;
      case "linkedin":
        return <Linkedin size={18} />;
      case "whatsapp":
        return <MessageCircle size={18} />;
      default:
        return null;
    }
  }
  return (
    <footer className={styles.wrap} aria-label="Rodapé">
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
            <h5 className={styles.colTitle}>Redes</h5>
            <ul className={styles.links}>
              <div className={styles.socials}>
                {(store.socials ?? []).map((s) => (
                  <a
                    key={s.url}
                    className={styles.social}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.name}
                    title={s.name}
                  >
                    {getIcon(s.name)}
                  </a>
                ))}
              </div>
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