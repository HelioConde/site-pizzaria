import { Link } from "react-router-dom";
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader({
  badge,
  title,
  userName,
  userEmail,
  accountLabel = "Minha área",
  accountRoute = "/",
  onLogout,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link to="/" className={styles.brand}>
            <span className={styles.logo}>🍕</span>
            <span className={styles.brandText}>Base Studio Pizzas</span>
          </Link>

          <div className={styles.context}>
            {badge ? <span className={styles.badge}>{badge}</span> : null}
            <h2 className={styles.title}>{title}</h2>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.userBox}>
            <strong className={styles.userName}>{userName || "Usuário"}</strong>
            {userEmail ? (
              <span className={styles.userEmail}>{userEmail}</span>
            ) : null}
          </div>

          <Link to={accountRoute} className={styles.secondaryBtn}>
            {accountLabel}
          </Link>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onLogout}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}