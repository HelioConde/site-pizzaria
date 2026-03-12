import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import useAuthRole from "../../hooks/useAuthRole";

import styles from "./Navbar.module.css";
import Button from "../ui/Button/Button";

const links = [
  { label: "Início", section: "inicio" },
  { label: "Destaques", section: "destaques" },
  { label: "Como funciona", section: "como-funciona" },
  { label: "Avaliações", section: "depoimentos" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const accountRef = useRef(null);
  const { isAuthenticated, userRole } = useAuthRole();

  function getAccountRoute() {
    if (!isAuthenticated) return "/auth";
    if (userRole === "admin") return "/admin";
    if (userRole === "delivery") return "/motoboy";
    return "/account";
  }

  function getAccountLabel() {
    if (!isAuthenticated) return "Entrar";
    if (userRole === "admin") return "Painel Admin";
    if (userRole === "delivery") return "Painel Motoboy";
    return "Minha Conta";
  }

  const accountRoute = getAccountRoute();
  const accountLabel = getAccountLabel();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAccountOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setAccountOpen(false);
    setOpen(false);
    navigate("/", { replace: true });
  }

  function getNavTo(section) {
    if (section === "inicio") {
      return { pathname: "/", hash: "" };
    }

    return {
      pathname: "/",
      hash: `#${section}`,
    };
  }

  function handleNavClick() {
    setOpen(false);
    setAccountOpen(false);
  }

  const userName =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Cliente";

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <Link className={styles.brand} to="/" onClick={handleNavClick}>
          <span className={styles.logo}>🍕</span>
          <span className={styles.brandText}>
            Base Studio <span className="accent">Pizzas</span>
          </span>
        </Link>

        <nav className={styles.links} aria-label="Navegação principal">
          {links.map((item) => (
            <Link
              key={item.section}
              className={styles.link}
              to={getNavTo(item.section)}
              onClick={handleNavClick}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          {user ? (
            <div className={styles.accountMenu} ref={accountRef}>
              <button
                type="button"
                className={styles.accountTrigger}
                onClick={() => setAccountOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                {accountLabel}
                <span
                  className={`${styles.accountChevron} ${
                    accountOpen ? styles.accountChevronOpen : ""
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {accountOpen && (
                <div className={styles.accountDropdown} role="menu">
                  <div className={styles.accountHeader}>
                    <strong className={styles.accountName}>{userName}</strong>
                    <span className={styles.accountEmail}>{user?.email}</span>
                  </div>

                  <Link
                    to={accountRoute}
                    className={styles.accountDropdownLink}
                    onClick={() => setAccountOpen(false)}
                    role="menuitem"
                  >
                    {accountLabel}
                  </Link>

                  <button
                    type="button"
                    className={styles.accountDropdownItem}
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              as={Link}
              to="/auth"
              variant="ghost"
              size="sm"
              className={styles.accountButton}
            >
              Entrar
            </Button>
          )}

          <Button
            as={Link}
            to="/menu"
            variant="primary"
            size="sm"
            className={styles.cta}
          >
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
          {links.map((item) => (
            <Link
              key={item.section}
              className={styles.mobileLink}
              to={getNavTo(item.section)}
              onClick={handleNavClick}
            >
              {item.label}
            </Link>
          ))}

          {user ? (
            <div className={styles.mobileAccountBox}>
              <div className={styles.mobileUserTitle}>{accountLabel}</div>

              <div className={styles.mobileUserName}>{userName}</div>

              <div className={styles.mobileUserEmail}>{user?.email}</div>

              <Link
                to={accountRoute}
                className={styles.mobileAccountLink}
                onClick={() => setOpen(false)}
              >
                {accountLabel}
              </Link>

              <button
                type="button"
                className={styles.mobileLogout}
                onClick={handleLogout}
              >
                Sair da conta
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className={styles.mobileAccount}
              onClick={() => setOpen(false)}
            >
              Entrar
            </Link>
          )}

          <Button
            as={Link}
            to="/menu"
            variant="primary"
            className={styles.mobileCta}
            onClick={() => setOpen(false)}
          >
            Fazer pedido →
          </Button>
        </div>

        <button
          className={styles.backdrop}
          aria-label="Fechar menu"
          type="button"
          onClick={() => setOpen(false)}
        />
      </div>
    </header>
  );
}