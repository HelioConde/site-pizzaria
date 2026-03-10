import { Link } from "react-router-dom";
import styles from "../Account.module.css";
import Button from "../../../components/ui/Button/Button";

export default function QuickActions({ onLogout }) {
  return (
    <article className={`${styles.card} ${styles.cardWide}`}>
      <div className={styles.cardHeader}>
        <h2>Ações rápidas</h2>
      </div>

      <div className={styles.actionsRow}>
        <Button as={Link} to="/menu" variant="primary">
          Ir para o cardápio
        </Button>

        <Button as={Link} to="/checkout" variant="ghost">
          Finalizar pedido
        </Button>

        <Button variant="ghost" onClick={onLogout}>
          Sair da conta
        </Button>
      </div>
    </article>
  );
}