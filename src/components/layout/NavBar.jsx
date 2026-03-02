import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

const links = [
  { label: "Início", href: "#inicio" },
  { label: "Cardápio", href: "#cardapio" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Depoimentos", href: "#depoimentos" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 880) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        <a
          className={styles.navBrand}
          href="#inicio"
          onClick={() => setMenuOpen(false)}
        >
          <span className={styles.navLogo} aria-hidden="true">
            🍕
          </span>
          <span className={styles.navBrandText}>Bella Massa</span>
        </a>

        <nav className={styles.navLinks} aria-label="Navegação principal">
          {links.map((l) => (
            <a key={l.href} className={styles.navLink} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className={styles.navActions}>
          <a
            className={`${styles.btn} ${styles.btnPrimary} ${styles.navCta}`}
            href="#fazer-pedido"
            onClick={() => setMenuOpen(false)}
          >
            Fazer pedido
          </a>

          <button
            className={styles.navBurger}
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={styles.navBurgerLine} />
            <span className={styles.navBurgerLine} />
            <span className={styles.navBurgerLine} />
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      <div className={`${styles.navMobile} ${menuOpen ? styles.isOpen : ""}`}>
        <div className={styles.navMobilePanel}>
          {links.map((l) => (
            <a
              key={l.href}
              className={styles.navMobileLink}
              href={l.href}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}

          <a
            className={`${styles.btn} ${styles.btnPrimary} ${styles.navMobileCta}`}
            href="#fazer-pedido"
            onClick={() => setMenuOpen(false)}
          >
            Fazer pedido
          </a>
        </div>

        <button
          className={styles.navBackdrop}
          aria-label="Fechar menu"
          type="button"
          onClick={() => setMenuOpen(false)}
        />
      </div>
    </header>
  );
}