import { useEffect, useState } from "react";

const links = [
  { label: "Início", href: "#inicio" },
  { label: "Cardápio", href: "#cardapio" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Depoimentos", href: "#depoimentos" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha o menu mobile ao redimensionar para desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 880) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Bloqueia scroll quando menu mobile estiver aberto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="nav">
      <div className="nav__inner">
        <a className="nav__brand" href="#inicio" onClick={() => setMenuOpen(false)}>
          <span className="nav__logo" aria-hidden="true">🍕</span>
          <span className="nav__brandText">Bella Massa</span>
        </a>

        <nav className="nav__links" aria-label="Navegação principal">
          {links.map((l) => (
            <a key={l.href} className="nav__link" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          <a className="btn btn--primary nav__cta" href="#fazer-pedido">
            Fazer pedido
          </a>

          <button
            className="nav__burger"
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="nav__burgerLine" />
            <span className="nav__burgerLine" />
            <span className="nav__burgerLine" />
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      <div className={`nav__mobile ${menuOpen ? "is-open" : ""}`}>
        <div className="nav__mobilePanel">
          {links.map((l) => (
            <a
              key={l.href}
              className="nav__mobileLink"
              href={l.href}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a className="btn btn--primary nav__mobileCta" href="#fazer-pedido" onClick={() => setMenuOpen(false)}>
            Fazer pedido
          </a>
        </div>

        <button
          className="nav__backdrop"
          aria-label="Fechar menu"
          type="button"
          onClick={() => setMenuOpen(false)}
        />
      </div>
    </header>
  );
}