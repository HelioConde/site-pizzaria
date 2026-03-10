import { Link } from "react-router-dom";
import styles from "../Account.module.css";
import Button from "../../../components/ui/Button/Button";

export default function OrdersEmptyState() {
  return (
    <article className={`${styles.card} ${styles.cardWide}`}>
      <div className={styles.cardHeader}>
        <h2>Pedidos recentes</h2>
      </div>

      <div className={styles.emptyOrders}>
        <div className={styles.emptyIcon}>🍕</div>

        <p>Nenhum pedido encontrado</p>

        <span>
          Quando você fizer um pedido logado, ele aparecerá aqui.
        </span>

        <Button as={Link} to="/menu" variant="primary">
          Fazer primeiro pedido
        </Button>
      </div>
    </article>
  );
}