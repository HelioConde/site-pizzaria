import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);
  const mobileMenuId = useId();
  const accountMenuId = useId();

  const { isAuthenticated, userRole } = useAuthRole();

  function getAccountRoute() {
    if (!isAuthenticated) return "/auth";
    if (userRole === "admin") return "/admin/dashboard";
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
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    let isMounted = true;

    async function getSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) return;
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Erro ao obter sessão no Navbar:", error);

        if (!isMounted) return;
        setUser(null);
      }
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setAccountOpen(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!accountRef.current) return;

      if (!accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.hash]);

  async function handleLogout() {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setAccountOpen(false);
      setOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    } finally {
      setIsLoggingOut(false);
    }
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
    user?.user_metadata?.name?.trim() ||
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
                aria-controls={accountOpen ? accountMenuId : undefined}
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
                <div
                  id={accountMenuId}
                  className={styles.accountDropdown}
                  role="menu"
                >
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
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Saindo..." : "Sair da conta"}
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
            aria-controls={mobileMenuId}
            onClick={() => setOpen((prev) => !prev)}
          >
            <span className={styles.burgerLine} />
            <span className={styles.burgerLine} />
            <span className={styles.burgerLine} />
          </button>
        </div>
      </div>

      <div
        id={mobileMenuId}
        className={`${styles.mobile} ${open ? styles.open : ""}`}
        aria-hidden={!open}
      >
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
                onClick={() => {
                  setOpen(false);
                  setAccountOpen(false);
                }}
              >
                {accountLabel}
              </Link>

              <button
                type="button"
                className={styles.mobileLogout}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Saindo..." : "Sair da conta"}
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