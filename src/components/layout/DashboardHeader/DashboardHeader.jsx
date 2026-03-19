import { Link } from "react-router-dom";
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader({
  badge,
  title = "Painel",
  userName,
  userEmail,
  accountLabel = "Minha área",
  accountRoute = "/",
  onLogout,
  isLoggingOut = false,
  homeRoute = "/",
}) {
  const safeUserName =
    typeof userName === "string" && userName.trim()
      ? userName.trim()
      : "Usuário";

  const safeUserEmail =
    typeof userEmail === "string" && userEmail.trim()
      ? userEmail.trim()
      : "";

  const safeTitle =
    typeof title === "string" && title.trim() ? title.trim() : "Painel";

  const safeBadge =
    typeof badge === "string" && badge.trim() ? badge.trim() : "";

  const safeAccountLabel =
    typeof accountLabel === "string" && accountLabel.trim()
      ? accountLabel.trim()
      : "Minha área";

  const safeAccountRoute =
    typeof accountRoute === "string" && accountRoute.trim()
      ? accountRoute.trim()
      : "/";

  const safeHomeRoute =
    typeof homeRoute === "string" && homeRoute.trim()
      ? homeRoute.trim()
      : "/";

  const canLogout = typeof onLogout === "function" && !isLoggingOut;

  function handleLogoutClick() {
    if (!canLogout) return;
    onLogout();
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link
            to={safeHomeRoute}
            className={styles.brand}
            aria-label="Voltar para a página inicial"
          >
            <span className={styles.logo} aria-hidden="true">
              🍕
            </span>
            <span className={styles.brandText}>Base Studio Pizzas</span>
          </Link>

          <div className={styles.context}>
            {safeBadge ? <span className={styles.badge}>{safeBadge}</span> : null}
            <h1 className={styles.title}>{safeTitle}</h1>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.userBox}>
            <strong className={styles.userName} title={safeUserName}>
              {safeUserName}
            </strong>

            {safeUserEmail ? (
              <span className={styles.userEmail} title={safeUserEmail}>
                {safeUserEmail}
              </span>
            ) : null}
          </div>

          <Link
            to={safeAccountRoute}
            className={styles.secondaryBtn}
            aria-label={safeAccountLabel}
            title={safeAccountLabel}
          >
            {safeAccountLabel}
          </Link>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleLogoutClick}
            disabled={!canLogout}
            aria-busy={isLoggingOut}
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    </header>
  );
}