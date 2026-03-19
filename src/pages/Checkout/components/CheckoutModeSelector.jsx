import { Link } from "react-router-dom";
import styles from "../Checkout.module.css";

export default function CheckoutModeSelector({ onContinueAsGuest }) {
  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Como deseja continuar?</h2>
      <p className={styles.sectionDesc}>
        Escolha como deseja finalizar o pedido.
      </p>

      <div className={styles.choiceGrid}>
        <Link to="/auth" className={styles.choiceCard}>
          <span className={styles.choiceIcon}>👤</span>
          <strong>Entrar na conta</strong>
          <span>Use sua conta para salvar dados e acompanhar pedidos.</span>
        </Link>

        <button
          type="button"
          className={styles.choiceCard}
          onClick={onContinueAsGuest}
        >
          <span className={styles.choiceIcon}>🛍️</span>
          <strong>Continuar como convidado</strong>
          <span>Finalize o pedido sem criar conta.</span>
        </button>
      </div>
    </section>
  );
}