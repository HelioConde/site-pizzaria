import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";
import Button from "../ui/Button/Button";
import { Link } from "react-router-dom";

const links = [
  { label: "Início", href: "/" },
  { label: "Destaques", href: "#destaques" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Avaliações", href: "#depoimentos" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => window.innerWidth >= 900 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <Link className={styles.brand} to="/" onClick={() => setOpen(false)}>
          <span className={styles.logo} aria-hidden="true">🍕</span>
          <span className={styles.brandText}>Base Studio <span className="accent">Pizzas</span></span>
        </Link>

        <nav className={styles.links} aria-label="Navegação">
          {links.map((l) => (
            <a key={l.href} className={styles.link} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <Button as={Link} to="/menu" variant="primary" size="sm" className={styles.cta}>
            Fazer pedido →
          </Button>

          <button
            className={styles.burger}
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.burgerLine} />
            <span className={styles.burgerLine} />
            <span className={styles.burgerLine} />
          </button>
        </div>
      </div>

      <div className={`${styles.mobile} ${open ? styles.open : ""}`}>
        <div className={styles.mobilePanel}>
          {links.map((l) => (
            <a key={l.href} className={styles.mobileLink} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}

          <Button as="a" href="#fazer-pedido" variant="primary" className={styles.mobileCta} onClick={() => setOpen(false)}>
            Fazer pedido →
          </Button>
        </div>

        <button className={styles.backdrop} aria-label="Fechar menu" type="button" onClick={() => setOpen(false)} />
      </div>
    </header>
  );
}